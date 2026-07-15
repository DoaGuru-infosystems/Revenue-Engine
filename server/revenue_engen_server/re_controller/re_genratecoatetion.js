const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { PDFDocument } = require("pdf-lib");
const puppeteer = require("puppeteer");
const ILovePDF = require("@ilovepdf/ilovepdf-nodejs");
const ILovePDFFile = require("@ilovepdf/ilovepdf-nodejs/ILovePDFFile");

// --- Constants & Configuration ---
const TEMP_DIR = path.join(__dirname, "../re_temp");
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const MIN_VALID_PDF_SIZE = 1024; // 1 KB se chota PDF invalid maana jayega
const CONVERSION_RETRY_LIMIT = 2; // Failure par max 2 baar retry

const {
  ASSETS_DIR,
  HEADER_HEIGHT,
  FOOTER_HEIGHT,
  CONTENT_TOP_PADDING,
  embedImageToPdf,
  drawHeader,
  drawFooter,
  drawWatermark,
} = require("./re_pdfHelpers");

const ILOVEPDF_PUBLIC_KEY =
  process.env.project_public ||
  "project_public_a55966fcdfec25073a95066771aa35cc_bbI9lec07446be083e96d29b5a159c023abb7";
const ILOVEPDF_SECRET_KEY =
  process.env.secret_key ||
  "secret_key_fdf796fa807f5b7cd68e8b827d37656f_8fDSm52c73dc1dd229576b86ccaf8ac6a39d8";

// --- System Initialization ---
try {
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
} catch (error) {
  console.error("[INIT] Temp folder create nahi ho saka:", error.message);
}

// --- Multer Configuration ---
const upload = multer({
  dest: TEMP_DIR,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const isValidExtension = /\.(docx|doc)$/i.test(file.originalname);
    const validMimeTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (isValidExtension || validMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Sirf .doc ya .docx file allow hai."));
    }
  },
}).single("file");

const processUpload = (req, res) =>
  new Promise((resolve, reject) => {
    upload(req, res, (err) => (err ? reject(err) : resolve()));
  });

// --- Utility Functions ---

function deleteFile(filePath) {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (error) {
    console.warn("[CLEANUP] Delete fail:", filePath, error.message);
  }
}

/**
 * Convert hue PDF ki basic integrity check karna:
 * - File exist karti hai
 * - File ka size minimum threshold se zyada hai
 * - PDF header ("%PDF-") se shuru hoti hai
 */
function validatePdfFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error("PDF file convert hone ke baad bhi exist nahi karti.");
  }

  const stats = fs.statSync(filePath);
  if (stats.size < MIN_VALID_PDF_SIZE) {
    throw new Error(
      `PDF bahut chota hai (${stats.size} bytes) — conversion shayad fail hua.`,
    );
  }

  // PDF magic bytes check — sahi PDF "%PDF-" se shuru hoti hai
  const buffer = Buffer.alloc(5);
  const fd = fs.openSync(filePath, "r");
  fs.readSync(fd, buffer, 0, 5, 0);
  fs.closeSync(fd);

  if (buffer.toString("ascii") !== "%PDF-") {
    throw new Error(
      "File PDF format mein nahi hai — conversion se galat output aaya.",
    );
  }

  console.log(
    `[VALIDATE] PDF valid hai — Size: ${(stats.size / 1024).toFixed(1)} KB`,
  );
}

// Shared Drawing Functions are imported from pdfHelpers.js

// --- Core API Integration ---

async function convertDocxToPdf(inputFilePath, outputFilePath, attempt = 1) {
  console.log(
    `[ILOVEPDF] Conversion attempt ${attempt}/${CONVERSION_RETRY_LIMIT}...`,
  );

  try {
    const instance = new ILovePDF(ILOVEPDF_PUBLIC_KEY, ILOVEPDF_SECRET_KEY);
    const task = instance.newTask("officepdf");
    await task.start();

    const renamedInputPath = `${inputFilePath}_upload.docx`;
    fs.copyFileSync(inputFilePath, renamedInputPath);

    try {
      const file = new ILovePDFFile(renamedInputPath);
      await task.addFile(file);
      console.log("[ILOVEPDF] File API pe upload ho gayi");

      await task.process({
        pdfa: false,
        tagged_pdf: false,
        password: "",
      });

      const pdfBuffer = await task.download();

      if (!pdfBuffer || pdfBuffer.length < MIN_VALID_PDF_SIZE) {
        throw new Error(
          `iLovePDF ne bahut chota output diya (${pdfBuffer?.length ?? 0} bytes)`,
        );
      }

      fs.writeFileSync(outputFilePath, pdfBuffer);
      console.log(
        `[ILOVEPDF] PDF ready — Size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`,
      );

      validatePdfFile(outputFilePath);
    } finally {
      deleteFile(renamedInputPath);
    }
  } catch (error) {
    const detail =
      error?.response?.data?.message || error?.response?.data || error.message;

    console.error(
      `[ILOVEPDF] Attempt ${attempt} fail — ${JSON.stringify(detail)}`,
    );

    if (attempt < CONVERSION_RETRY_LIMIT) {
      console.log(`[ILOVEPDF] Retry kar raha hai... (${attempt + 1})`);
      await new Promise((r) => setTimeout(r, attempt * 1500));
      return convertDocxToPdf(inputFilePath, outputFilePath, attempt + 1);
    }

    throw new Error(
      `PDF conversion fail hua (${CONVERSION_RETRY_LIMIT} attempts ke baad): ${detail}`,
    );
  }
}

// ============================================================================
// ✅ NEW FUNCTION — v3 Main Change
// Kya karta hai:
//   1. iLovePDF wali original PDF load karta hai
//   2. Ek naya blank PDF banata hai (same page size)
//   3. Har original page ko SHRINK karke draw karta hai:
//      - Upar HEADER_HEIGHT ki jagah chhodi
//      - Neeche FOOTER_HEIGHT ki jagah chhodi
//   4. Phir uss khali jagah mein header/footer draw karta hai
//   Isse content aur header/footer kabhi overlap nahi karenge
// ============================================================================
async function applyHeaderFooterWithMargins(
  inputPdfPath,
  outputPdfPath,
  options = {},
) {
  console.log(
    `[MARGINS] Processing start... (Is GST Invoice: ${!!options.isGst})`,
  );

  const isGst = !!options.isGst;

  // Aapke AdminInvoice.jsx ke logic ke mutabik exact backend image files pick karein
  const headerFile = isGst ? "Dg 1copy.png" : "dghead.jpeg";
  const footerFile = "Dg 2copy.png"; // Dono ke liye same footer hai
  const watermarkFile = "DG Watermark.jpg";

  const existingPdfBytes = fs.readFileSync(inputPdfPath);
  const existingPdfDoc = await PDFDocument.load(existingPdfBytes);
  const newPdfDoc = await PDFDocument.create();

  const [headerImg, footerImg, watermarkImg] = await Promise.all([
    embedImageToPdf(newPdfDoc, headerFile),
    embedImageToPdf(newPdfDoc, footerFile),
    embedImageToPdf(newPdfDoc, watermarkFile),
  ]);

  const originalPages = existingPdfDoc.getPages();

  for (let i = 0; i < originalPages.length; i++) {
    const originalPage = originalPages[i];
    const { width, height } = originalPage.getSize();

    const newPage = newPdfDoc.addPage([width, height]);

    let xOffset = 0,
      yOffset = 0,
      scaledW = width,
      scaledH = height;

    if (!options.isInvoice) {
      const contentAreaHeight = height - HEADER_HEIGHT - FOOTER_HEIGHT;
      const contentAreaWidth = width;

      const scaleByHeight = contentAreaHeight / height;
      const scaleByWidth = contentAreaWidth / width;
      const scale = Math.min(scaleByHeight, scaleByWidth) * 0.97; // Breathing space layout

      scaledW = width * scale;
      scaledH = height * scale;

      xOffset = (width - scaledW) / 2;
      yOffset = FOOTER_HEIGHT + (contentAreaHeight - scaledH) / 2;
    }

    // Layer 1: Watermark background
    drawWatermark(newPage, watermarkImg, width, height);

    // Layer 2: Main Content Page (from Puppeteer)
    const embeddedPage = await newPdfDoc.embedPage(originalPage);
    newPage.drawPage(embeddedPage, {
      x: xOffset,
      y: yOffset,
      width: scaledW,
      height: scaledH,
    });

    // Layer 3: High-quality sharp Header & Footer overlay
    drawHeader(newPage, headerImg, width, height, {
      fitWidth: options.isInvoice,
    });
    drawFooter(newPage, footerImg, width, { fitWidth: options.isInvoice });
  }

  const finalBytes = await newPdfDoc.save();
  fs.writeFileSync(outputPdfPath, finalBytes);
  console.log(`[MARGINS] ✔ PDF Restructuring successfully completed.`);
}

// ============================================================================
// Main Controller Function
// ============================================================================
exports.uploadAndConvert = async (req, res) => {
  // --- Step 1: File upload ---
  try {
    await processUpload(req, res);
  } catch (error) {
    const isSizeError =
      error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE";
    const message = isSizeError
      ? "File 20MB se badi hai."
      : `Upload Error: ${error.message}`;
    console.error("[UPLOAD]", message);
    return res.status(400).json({ status: "Failure", message });
  }

  if (!req.file) {
    return res.status(400).json({
      status: "Failure",
      message: "Koi Word file nahi bheji gayi.",
    });
  }

  const inputDocxPath = req.file.path;
  const rawPdfPath = `${inputDocxPath}_raw.pdf`; // iLovePDF wali PDF (bina header/footer)
  const outputPdfPath = `${inputDocxPath}_final.pdf`; // Final PDF (header/footer ke saath)
  const originalFileName = path.basename(
    req.file.originalname,
    path.extname(req.file.originalname),
  );

  console.log(`\n[START] ────────────────────────────────────────────────`);
  console.log(
    `[START] File: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`,
  );

  try {
    // --- Step 2: DOCX → PDF conversion (iLovePDF) ---
    await convertDocxToPdf(inputDocxPath, rawPdfPath);
    console.log("[STEP 2] ✔ DOCX to PDF conversion successful");

    // --- Step 3: Content ko margins ke saath shift karo + Header/Footer/Watermark lagao ---
    // v2 mein yahan seedha original PDF pe draw karte the (overlap hota tha)
    // v3 mein naya PDF banate hain jisme content shrink hota hai — overlap nahi hoga
    await applyHeaderFooterWithMargins(rawPdfPath, outputPdfPath);
    console.log(
      "[STEP 3] ✔ Header/Footer/Watermark margins ke saath laga diya",
    );

    // --- Step 4: Final PDF response mein bhejo ---
    const finalPdfBytes = fs.readFileSync(outputPdfPath);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${originalFileName}.pdf"`,
    );
    res.send(finalPdfBytes);

    console.log(`[DONE] ✔ ${originalFileName}.pdf user ko bhej di gayi`);
    console.log(`[DONE] ────────────────────────────────────────────────\n`);
  } catch (error) {
    console.error("[ERROR] ────────────────────────────────────────────────");
    console.error("[ERROR] Message:", error.message);
    console.error("[ERROR] Detail:", error?.response?.data || error.stack);
    console.error("[ERROR] ────────────────────────────────────────────────");

    if (!res.headersSent) {
      res.status(500).json({
        status: "Failure",
        message:
          error.message ||
          "PDF generate nahi ho saki. Kripya baad mein try karein.",
      });
    }
  } finally {
    // --- Step 5: Cleanup — sabhi temp files delete karo ---
    deleteFile(inputDocxPath); // Original DOCX
    deleteFile(rawPdfPath); // iLovePDF wali raw PDF
    deleteFile(outputPdfPath); // Final PDF (bhej di, ab delete karo)
    console.log("[CLEANUP] Temp files delete ho gayi");
  }
};

exports.generateInvoicePdf = async (req, res) => {
  // Unique id taaki simultaneous downloads par file crash ya overwrite na ho
  const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const rawPdfPath = path.join(TEMP_DIR, `puppeteer_raw_${uniqueId}.pdf`);
  const outputPdfPath = path.join(TEMP_DIR, `puppeteer_final_${uniqueId}.pdf`);

  try {
    const { htmlContent, invoiceName, isGst } = req.body;

    if (!htmlContent) {
      return res
        .status(400)
        .json({ status: "Failure", message: "HTML content missing" });
    }

    console.log(
      `\n[START PUPPETEER FLOW] ─────────────────────────────────────`,
    );
    console.log(
      `[PUPPETEER] re_invoice Name: ${invoiceName}, Is GST Flag: ${isGst}`,
    );

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Raw content layout (zero margins, background enable)
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0px", bottom: "0px", left: "0px", right: "0px" },
    });

    await browser.close();

    // Canvas process skip for re_invoice because frontend HTML already has repeating Header/Footer natively
    // using <thead> and <tfoot>, and we allowed Puppeteer to print it natively.

    const fileName = invoiceName ? `${invoiceName}.pdf` : "re_invoice.pdf";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);

    console.log(`[DONE] ✔ Perfect structural re_invoice delivered.`);
  } catch (error) {
    console.error("[PUPPETEER ERROR]", error);
    if (!res.headersSent) {
      res.status(500).json({
        status: "Failure",
        message: "Server failed to process high-res PDF layout.",
      });
    }
  } finally {
    // Hard Cleanup
    if (fs.existsSync(rawPdfPath)) fs.unlinkSync(rawPdfPath);
    if (fs.existsSync(outputPdfPath)) fs.unlinkSync(outputPdfPath);
  }
};
