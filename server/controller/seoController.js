// const axios = require("axios");
// const puppeteer = require("puppeteer");
// const cheerio = require("cheerio");

// const PSI_KEY = "AIzaSyBRbkDm5XiDXbZ4p2NpjHnsyAV6MlDZCi8";
// if (!PSI_KEY) console.warn("GOOGLE_PSI_KEY not set; PSI calls will fail.");

// const IN_MEMORY_PDF_CACHE = new Map();

// /* ------------ Helper: Fetch PageSpeed ------------ */
// async function fetchPSI(targetUrl, strategy = "desktop") {
//   const psiUrl = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
//   const resp = await axios.get(psiUrl, {
//     params: {
//       url: targetUrl,
//       key: PSI_KEY,
//       strategy: strategy,
//     },
//     timeout: 120000,
//   });
//   return resp.data;
// }

// /* ------------ Helper: Basic SEO scrape ------------ */
// async function scrapeSEOData(targetUrl) {
//   const { data } = await axios.get(targetUrl, { timeout: 30000 });
//   const $ = cheerio.load(data);

//   return {
//     title: $("title").text() || null,
//     description: $('meta[name="description"]').attr("content") || null,
//     canonical: $('link[rel="canonical"]').attr("href") || null,
//     h1: $("h1").first().text() || null,
//     keywords: $('meta[name="keywords"]').attr("content") || null,
//   };
// }

// /* ------------ Build Combined HTML ------------ */
// function buildReportHtml(psidata, seoData, targetUrl, strategy) {
//   //   const lh = psidata.lighthouseResult || {};
//   //   const perfScore = lh.categories?.performance
//   //     ? Math.round(lh.categories.performance.score * 100)
//   //     : "N/A";
//   //   const seoScore = lh.categories?.seo
//   //     ? Math.round(lh.categories.seo.score * 100)
//   //     : "N/A";

//   const lh = psidata.lighthouseResult || {};
//   const perfScore = lh.categories?.performance?.score
//     ? Math.round(lh.categories.performance.score * 100)
//     : "N/A";

//   let seoScore = "N/A";
//   if (lh.categories?.seo && typeof lh.categories.seo.score === "number") {
//     seoScore = Math.round(lh.categories.seo.score * 100);
//   } else {
//     console.warn("SEO category missing in PSI response:", psidata);
//   }

//   return `
//   <!doctype html>
//   <html>
//   <head>
//     <meta charset="utf-8" />
//     <title>SEO Report — ${targetUrl}</title>
//     <style>
//       body { font-family: Arial, sans-serif; margin: 20px; color: #222; }
//       h1 { font-size: 22px; margin-bottom: 10px; }
//       h2 { font-size: 18px; margin-top: 20px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
//       .score { font-size: 28px; font-weight: bold; color: green; }
//       .section { margin-bottom: 20px; }
//       table { width: 100%; border-collapse: collapse; margin-top: 10px; }
//       th, td { border: 1px solid #ccc; padding: 6px 10px; font-size: 14px; text-align: left; }
//       th { background: #f7f7f7; }
//     </style>
//   </head>
//   <body>
//     <h1>SEO Audit Report</h1>
//     <p><strong>URL:</strong> ${targetUrl}</p>
//     <p><strong>Strategy:</strong> ${strategy}</p>

//     <div class="section">
//       <h2>Scores</h2>
//       <p>Performance Score: <span class="score">${perfScore}</span></p>
//       <p>SEO Score: <span class="score">${seoScore}</span></p>
//     </div>

//     <div class="section">
//       <h2>On-Page SEO</h2>
//       <table>
//         <tr><th>Title</th><td>${seoData.title || "—"}</td></tr>
//         <tr><th>Description</th><td>${seoData.description || "—"}</td></tr>
//         <tr><th>Canonical</th><td>${seoData.canonical || "—"}</td></tr>
//         <tr><th>H1</th><td>${seoData.h1 || "—"}</td></tr>
//         <tr><th>Meta Keywords</th><td>${seoData.keywords || "—"}</td></tr>
//       </table>
//     </div>

//     <div class="section">
//       <h2>Lighthouse Categories</h2>
//       ${
//         lh.categories
//           ? Object.values(lh.categories)
//               .map(
//                 (c) =>
//                   `<p><strong>${c.title}</strong>: ${
//                     c.score ? Math.round(c.score * 100) : "—"
//                   }</p>`
//               )
//               .join("")
//           : "<p>No data</p>"
//       }
//     </div>

//     <footer style="margin-top:30px; font-size:12px; color:#666;">
//       Generated on ${new Date().toLocaleString()}
//     </footer>
//   </body>
//   </html>
//   `;
// }

// /* ------------ Main Controller ------------ */
// exports.fullSEOReport = async (req, res) => {
//   try {
//     const targetUrl = req.query.url;
//     const strategy = (req.query.strategy || "desktop").toLowerCase();

//     if (!targetUrl) {
//       return res
//         .status(400)
//         .json({ status: "Failure", message: "Missing url query param" });
//     }

//     const cacheKey = `${targetUrl}|${strategy}`;
//     const cached = IN_MEMORY_PDF_CACHE.get(cacheKey);
//     if (cached && Date.now() - cached.ts < 1000 * 60 * 60) {
//       res.set({
//         "Content-Type": "application/pdf",
//         "Content-Disposition": 'inline; filename="seo-report.pdf"',
//       });
//       return res.send(cached.buffer);
//     }

//     const psidata = await fetchPSI(targetUrl, strategy);

//     const seoData = await scrapeSEOData(targetUrl);

//     const html = buildReportHtml(psidata, seoData, targetUrl, strategy);

//     const browser = await puppeteer.launch({
//       args: ["--no-sandbox", "--disable-setuid-sandbox"],
//     });
//     const page = await browser.newPage();
//     await page.setContent(html, { waitUntil: "networkidle0", timeout: 60000 });

//     const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
//     await browser.close();

//     IN_MEMORY_PDF_CACHE.set(cacheKey, { buffer: pdfBuffer, ts: Date.now() });

//     res.set({
//       "Content-Type": "application/pdf",
//       "Content-Disposition": 'inline; filename="seo-report.pdf"',
//     });
//     return res.send(pdfBuffer);
//   } catch (err) {
//     console.error("Full SEO report error:", err.message || err);
//     return res.status(500).json({
//       status: "Failure",
//       message: "Failed to generate SEO report",
//       error: err.message,
//     });
//   }
// };

const axios = require("axios");
const puppeteer = require("puppeteer");

const PSI_KEY = "AIzaSyBRbkDm5XiDXbZ4p2NpjHnsyAV6MlDZCi8";
if (!PSI_KEY) console.warn("GOOGLE_PSI_KEY not set; PSI calls will fail.");

const IN_MEMORY_PDF_CACHE = new Map();

async function fetchPSI(
  targetUrl,
  strategy = "desktop",
  retries = 2,
  timeoutMs = 120000
) {
  const psiUrl = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await axios.get(psiUrl, {
        params: {
          url: targetUrl,
          key: PSI_KEY,
          strategy: strategy === "mobile" ? "mobile" : "desktop",
        },
        timeout: timeoutMs,
      });
      return resp.data;
    } catch (err) {
      lastErr = err;
      console.warn(
        `PSI fetch attempt ${attempt + 1} failed for ${targetUrl}: ${
          err.message
        }`
      );
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  // after retries
  throw lastErr;
}

function buildReportHtml(psidata, targetUrl, strategy = "desktop") {
  const lh = psidata.lighthouseResult || {};
  const perfCategory =
    (lh.categories &&
      lh.categories.performance &&
      Math.round((lh.categories.performance.score || 0) * 100)) ||
    (psidata.loadingExperience && psidata.loadingExperience.overall_category
      ? psidata.loadingExperience.overall_category
      : "N/A");
  const a = lh.audits || {};
  const metrics = {
    firstContentfulPaint:
      a["first-contentful-paint"]?.displayValue ||
      (a["first-contentful-paint"]?.numericValue
        ? `${(a["first-contentful-paint"].numericValue / 1000).toFixed(2)} s`
        : null),
    largestContentfulPaint:
      a["largest-contentful-paint"]?.displayValue ||
      (a["largest-contentful-paint"]?.numericValue
        ? `${(a["largest-contentful-paint"].numericValue / 1000).toFixed(2)} s`
        : null),
    totalBlockingTime:
      a["total-blocking-time"]?.displayValue ||
      (a["total-blocking-time"]?.numericValue
        ? `${Math.round(a["total-blocking-time"].numericValue)} ms`
        : null),
    speedIndex:
      a["speed-index"]?.displayValue ||
      (a["speed-index"]?.numericValue
        ? `${(a["speed-index"].numericValue / 1000).toFixed(2)} s`
        : null),
    cumulativeLayoutShift:
      a["cumulative-layout-shift"]?.displayValue ||
      (a["cumulative-layout-shift"]?.numericValue
        ? `${a["cumulative-layout-shift"].numericValue.toFixed(3)}`
        : null),
  };

  // try to get final screenshot (base64) if present
  const finalScreenshot =
    lh?.audits?.["final-screenshot"]?.details?.data || null;

  const opportunities = Object.values(a)
    .filter(
      (x) =>
        x &&
        x.details &&
        x.scoreDisplayMode === "numeric" &&
        x.details.type === "opportunity"
    )
    .slice(0, 6)
    .map((op) => ({
      title: op.title,
      savings:
        op.details && op.details.overallSavingsMs
          ? `${Math.round(op.details.overallSavingsMs)} ms`
          : "",
      description: op.description || "",
    }));

  return `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>PageSpeed Report — ${targetUrl}</title>
    <style>
      body{font-family:Arial,Helvetica,sans-serif;color:#222;margin:18px}
      .header{display:flex;justify-content:space-between;align-items:center}
      .score{width:120px;height:120px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:30px;color:#c00;border:8px solid rgba(255,0,0,0.08)}
      .grid{display:grid;grid-template-columns:1fr 360px;gap:18px;margin-top:18px}
      .card{background:#fff;padding:14px;border-radius:6px;border:1px solid #eee}
      .metric{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f1f1}
      .screenshot{width:100%;height:200px;border:1px solid #eee;background:#fafafa;display:flex;align-items:center;justify-content:center}
      h2{margin:6px 0 10px;font-size:16px}
      .opps li{margin-bottom:8px}
      .footer{font-size:12px;color:#666;margin-top:12px}
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <h1>PageSpeed Report</h1>
        <div>URL: <strong>${targetUrl}</strong></div>
        <div style="color:#666;font-size:13px">Strategy: ${strategy}</div>
      </div>
      <div style="text-align:right">
        <div class="score">${perfCategory}</div>
        <div style="color:#666;font-size:12px;margin-top:8px">Generated: ${new Date(
          psidata.analysisUTCTimestamp || lh.fetchTime || Date.now()
        ).toLocaleString()}</div>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <h2>Metrics</h2>
        <div class="metric"><div>First Contentful Paint</div><div><strong>${
          metrics.firstContentfulPaint || "—"
        }</strong></div></div>
        <div class="metric"><div>Largest Contentful Paint</div><div><strong>${
          metrics.largestContentfulPaint || "—"
        }</strong></div></div>
        <div class="metric"><div>Total Blocking Time</div><div><strong>${
          metrics.totalBlockingTime || "—"
        }</strong></div></div>
        <div class="metric"><div>Speed Index</div><div><strong>${
          metrics.speedIndex || "—"
        }</strong></div></div>
        <div class="metric"><div>Cumulative Layout Shift</div><div><strong>${
          metrics.cumulativeLayoutShift || "—"
        }</strong></div></div>

        <h2 style="margin-top:14px">Top Opportunities</h2>
        <ul class="opps">
          ${
            opportunities.length
              ? opportunities
                  .map(
                    (o) =>
                      `<li><strong>${o.title}</strong>${
                        o.savings ? ` — ${o.savings}` : ""
                      }<div style="color:#666">${o.description}</div></li>`
                  )
                  .join("")
              : "<li>No major opportunities found</li>"
          }
        </ul>
      </div>

      <div class="card">
        <h2>Snapshot</h2>
        <div class="screenshot">
          ${
            finalScreenshot
              ? `<img src="${finalScreenshot}" style="max-width:100%;max-height:100%"/>`
              : "Screenshot unavailable"
          }
        </div>

        <h2 style="margin-top:12px">Lighthouse summary</h2>
        <div>
          ${
            lh.categories
              ? Object.values(lh.categories)
                  .map(
                    (cat) =>
                      `<div style="margin-bottom:6px"><strong>${
                        cat.title
                      }</strong>: ${
                        cat.score ? Math.round(cat.score * 100) : "—"
                      }</div>`
                  )
                  .join("")
              : "<div>Not available</div>"
          }
        </div>

        <div class="footer">Lighthouse version: ${
          lh.lighthouseVersion || "—"
        }</div>
      </div>
    </div>
  </body>
  </html>
  `;
}

// GET /auth/api/calculator/pagespeed-report-pdf?url=...&strategy=desktop
exports.pagespeedReportpdf = async (req, res) => {
  try {
    const targetUrl = req.query.url;
    const strategy = (req.query.strategy || "desktop").toLowerCase();
    if (!targetUrl)
      return res
        .status(400)
        .json({ status: "Failure", message: "Missing url query param" });

    const cacheKey = `${targetUrl}|${strategy}`;
    const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour caching (adjust)
    const cached = IN_MEMORY_PDF_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      res.set({
        "Content-Type": "application/pdf",
        "Content-Length": cached.buffer.length,
        "Content-Disposition": `inline; filename="pagespeed-report.pdf"`,
        "Cache-Control": "public, max-age=3600",
      });
      return res.send(cached.buffer);
    }

    // 1) Fetch PSI with larger timeout & retries
    const psidata = await fetchPSI(targetUrl, strategy, 2, 120000);

    // 2) build HTML
    const html = buildReportHtml(psidata, targetUrl, strategy);

    // 3) Launch puppeteer with enough resources & timeouts
    const browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
      // increase default launch timeout by passing env if needed
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 900 });

    // setContent with 30s timeout (increase if needed)
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 60000 });

    // allow some idle time for fonts/images if required
    await page.evaluate(() => new Promise((r) => setTimeout(r, 800)));

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" },
    });

    await browser.close();

    // cache (memory) — consider persistent cache for production
    IN_MEMORY_PDF_CACHE.set(cacheKey, { buffer: pdfBuffer, ts: Date.now() });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length,
      "Content-Disposition": `inline; filename="pagespeed-report.pdf"`,
      "Cache-Control": "public, max-age=3600",
    });
    return res.send(pdfBuffer);
  } catch (err) {
    console.error(
      "Pagespeed PDF error:",
      err && err.response ? err.response.data : err.message || err
    );
    // if axios timed out specifically, give clearer message
    const isTimeout =
      err &&
      (err.code === "ECONNABORTED" ||
        err.message?.toLowerCase().includes("timeout"));
    return res.status(500).json({
      status: "Failure",
      message: "Failed to generate report",
      error: isTimeout
        ? "PSI request timed out or Puppeteer took too long. Try again or increase timeouts."
        : err.message || String(err),
    });
  }
};
