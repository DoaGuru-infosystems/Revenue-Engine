/**
 * Shared PDF Helper Functions
 * 
 * Extracted from genratecoatetion.js so both quotation PDF and proposal PDF
 * can reuse the same header/footer/watermark drawing utilities.
 */

const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

// --- Constants ---
const ASSETS_DIR = path.join(__dirname, "../assets");
const HEADER_HEIGHT = 80;
const FOOTER_HEIGHT = 50;
const CONTENT_TOP_PADDING = 20;

// --- Image Embedding ---
async function embedImageToPdf(pdfDoc, imageFileName) {
  const filePath = path.join(ASSETS_DIR, imageFileName);

  if (!fs.existsSync(filePath)) {
    console.warn(`[PDF-HELPER] Image not found: ${imageFileName} — skipped`);
    return null;
  }

  try {
    const imageBytes = fs.readFileSync(filePath);
    const isPng = imageFileName.toLowerCase().endsWith(".png");
    return isPng
      ? await pdfDoc.embedPng(imageBytes)
      : await pdfDoc.embedJpg(imageBytes);
  } catch (error) {
    console.error(`[PDF-HELPER] Image embed error (${imageFileName}):`, error.message);
    return null;
  }
}

// --- Drawing Functions ---

function drawHeader(page, img, pageWidth, pageHeight, options = {}) {
  if (!img) return;
  try {
    const scale = options.fitWidth ? (pageWidth / img.width) : Math.min(1, HEADER_HEIGHT / img.height);
    page.drawImage(img, {
      x: 0,
      y: pageHeight - img.height * scale,
      width: pageWidth,
      height: img.height * scale,
    });
  } catch (error) {
    console.error("[PDF-HELPER] Header draw error:", error.message);
  }
}

function drawFooter(page, img, pageWidth, options = {}) {
  if (!img) return;
  try {
    const scale = options.fitWidth ? (pageWidth / img.width) : Math.min(1, FOOTER_HEIGHT / img.height);
    page.drawImage(img, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: img.height * scale,
    });
  } catch (error) {
    console.error("[PDF-HELPER] Footer draw error:", error.message);
  }
}

function drawWatermark(page, img, pageWidth, pageHeight) {
  if (!img) return;
  try {
    const dims = img.scaleToFit(pageWidth * 0.7, pageHeight * 0.7);
    page.drawImage(img, {
      x: (pageWidth - dims.width) / 2,
      y: (pageHeight - dims.height) / 2,
      width: dims.width,
      height: dims.height,
      opacity: 0.45,
    });
  } catch (error) {
    console.error("[PDF-HELPER] Watermark draw error:", error.message);
  }
}

/**
 * Load all three brand images (header, footer, watermark) into a pdfDoc.
 * Returns { headerImg, footerImg, watermarkImg }
 */
async function loadBrandImages(pdfDoc) {
  const [headerImg, footerImg, watermarkImg] = await Promise.all([
    embedImageToPdf(pdfDoc, "Header.png"),
    embedImageToPdf(pdfDoc, "DG_Footer.jpg"),
    embedImageToPdf(pdfDoc, "DG Watermark.jpg"),
  ]);
  return { headerImg, footerImg, watermarkImg };
}

/**
 * Add a branded page to the document with header, footer, and watermark.
 * Returns { page, contentY, contentWidth, contentHeight }
 * where contentY is the starting Y position (below header) for writing content.
 */
function addBrandedPage(pdfDoc, brandImages, width = 595.28, height = 841.89) {
  const page = pdfDoc.addPage([width, height]);
  
  // Draw watermark first (behind everything)
  drawWatermark(page, brandImages.watermarkImg, width, height);
  
  // Draw header and footer
  drawHeader(page, brandImages.headerImg, width, height);
  drawFooter(page, brandImages.footerImg, width);
  
  const contentY = height - HEADER_HEIGHT - CONTENT_TOP_PADDING;
  const contentHeight = height - HEADER_HEIGHT - FOOTER_HEIGHT - CONTENT_TOP_PADDING;
  const contentWidth = width - 80; // 40px margin on each side
  
  return { page, contentY, contentWidth, contentHeight, pageWidth: width, pageHeight: height };
}

module.exports = {
  ASSETS_DIR,
  HEADER_HEIGHT,
  FOOTER_HEIGHT,
  CONTENT_TOP_PADDING,
  embedImageToPdf,
  drawHeader,
  drawFooter,
  drawWatermark,
  loadBrandImages,
  addBrandedPage,
};
