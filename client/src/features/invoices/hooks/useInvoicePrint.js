import { useCallback } from "react";

export function useInvoicePrint({
  clientData = {},
  isProforma = false,
  isBalanceProforma = false,
  contentId = "invoice-content",
}) {
  const clientOrganization = clientData?.client_organization;
  const clientName = clientData?.client_name;

  const handlePrintPage = useCallback(() => {
    const docName = isBalanceProforma
      ? "Balance Proforma Invoice"
      : isProforma
      ? "Proforma Invoice"
      : "Invoice";
    document.title = clientOrganization
      ? `${clientOrganization} ${docName}`
      : `${clientName || "Client"} ${docName}`;
    window.print();
  }, [isBalanceProforma, isProforma, clientOrganization, clientName]);

  const handleDownload = useCallback(async () => {
    try {
      const invoiceElement = document.getElementById(contentId);

      if (!invoiceElement) {
        alert("Invoice element not found!");
        return;
      }

      // 1. Clone element so active screen is not disturbed
      const invoiceClone = invoiceElement.cloneNode(true);
      const originalImages = invoiceElement.getElementsByTagName("img");
      const clonedImages = invoiceClone.getElementsByTagName("img");

      // 2. Convert images to Base64 data URL
      for (let i = 0; i < originalImages.length; i++) {
        const altText = (originalImages[i].getAttribute("alt") || "").toLowerCase();

        if (
          altText.includes("signature") ||
          altText.includes("authorized") ||
          altText.includes("footer") ||
          altText.includes("header")
        ) {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = originalImages[i].naturalWidth || originalImages[i].width;
            canvas.height = originalImages[i].naturalHeight || originalImages[i].height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(originalImages[i], 0, 0);

            // Assign base64 direct source to cloned image
            clonedImages[i].src = canvas.toDataURL("image/png");
          } catch (imgErr) {
            console.error("Image base64 conversion failed, fallback to relative:", imgErr);
          }
        }
      }

      const origin = window.location.origin;
      const fullHtmlCode = `
      <html>
         <head>
          <base href="${origin}/">
          <meta charset="utf-8">
          <title>Invoice Layout</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background-color: white; }

            .print\\:hidden { display: none !important; }

            @media print {
              @page {
                size: A4;
                margin: 0mm;
              }
              body, html { margin: 0 !important; padding: 0 !important; height: auto !important; overflow: visible !important; }
              
              /* ✅ Remove forced heights that cause spillover to next page */
              .page-wrapper {
                min-height: auto !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                page-break-after: avoid !important;
              }

              /* ✅ Keep footer div fixed at bottom on print */
              .print-fixed-footer {
                position: fixed !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100% !important;
                height: 25mm !important;
                display: flex !important;
                pointer-events: none !important;
                z-index: 9999 !important;
              }

              .print-fixed-footer img {
                width: 100% !important;
                height: 100% !important;
                object-fit: fill !important;
              }

              table { page-break-inside: auto; }
              tr    { page-break-inside: avoid; page-break-after: auto; }
              thead { display: table-header-group !important; }
              tfoot { display: table-footer-group !important; }
            }
          </style>
        </head>
        <body class="bg-white p-0 m-0">
          ${invoiceClone.outerHTML}
        </body>
      </html>
    `;

      // 4. Filename selection
      const dynamicFileName = clientOrganization
        ? `${clientOrganization.replace(/\s+/g, "_")}_Invoice`
        : `${(clientName || "Client").replace(/\s+/g, "_")}_Invoice`;

      // Assign dynamic filename to window title so default PDF save name matches
      const originalTitle = document.title;
      document.title = dynamicFileName;

      // Print directly in new window
      const printWindow = window.open("", "_blank");
      printWindow.document.open();
      printWindow.document.write(fullHtmlCode);
      printWindow.document.title = dynamicFileName;
      printWindow.document.close();

      printWindow.onload = () => {
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          // Restore original title
          document.title = originalTitle;
        }, 500);
      };
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please check console logs.");
    }
  }, [clientData, contentId]);

  return {
    handlePrintPage,
    handleDownload,
  };
}
