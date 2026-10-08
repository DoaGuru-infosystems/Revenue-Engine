import styled from "styled-components";

export const InvoicePrintWrapper = styled.div`
  @media print {
    @page {
      size: A4;
      margin: 0 0 20mm 0;
    }

    @page :first {
      margin-top: 0 !important;
    }

    html, body {
      width: 210mm;
      height: auto;
      margin: 0 !important;
      padding: 0 !important;
    }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .page-wrapper {
      width: 210mm;
      height: auto !important;
      min-height: auto !important;
      break-after: auto;
      page-break-after: auto;
      display: block;
      margin: 0 !important;
      padding: 0 !important;
      padding-top: 0 !important;
      margin-top: 0 !important;
    }

    .print-fixed-footer {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 20mm;
      align-items: flex-end;
      justify-content: center;
      pointer-events: none;
      z-index: 9999;
    }

    .print-fixed-footer img {
      width: 210mm;
      height: 20mm;
      object-fit: fill;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin: 0 !important;
      padding: 0 !important;
      margin-top: 0 !important;
      border-spacing: 0;
    }

    thead {
      display: table-header-group;
    }

    thead tr {
      margin: 0 !important;
      padding: 0 !important;
    }

    thead tr td {
      padding: 0 !important;
      margin: 0 !important;
      line-height: 0;
    }

    thead tr td > div {
      margin: 0 !important;
      padding: 0 !important;
      line-height: 0;
    }

    thead tr td img {
      display: block;
      margin: 0 !important;
      padding: 0 !important;
    }

    tfoot {
      display: table-footer-group;
    }

    tfoot tr td {
      padding: 0 !important;
      margin: 0 !important;
    }

    tbody {
      display: table-row-group;
    }

    tbody tr:first-child td {
      padding-top: 0 !important;
    }

    tr {
      page-break-inside: auto;
    }

    td {
      vertical-align: top;
    }

    /* Outer section: pure natural flow */
    section {
      page-break-inside: auto;
      break-inside: auto;
      page-break-before: auto;
      break-before: auto;
      page-break-after: auto;
      break-after: auto;
    }

    /* terms-bank-section: natural flow */
    .terms-bank-section {
      page-break-inside: auto !important;
      break-inside: auto !important;
    }

    /* Bank Details div */
    .bank-details-section {
      page-break-inside: auto;
      break-inside: auto;
      page-break-after: avoid;
      break-after: avoid;
    }

    /* Amount in words orphan fix for browser print */
    .amount-in-words-section {
      page-break-before: avoid !important;
      break-before: avoid !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    /* Terms & Conditions: natural flow */
    .terms-conditions-section {
      page-break-inside: auto;
      break-inside: auto;
    }
  }
`;

export default InvoicePrintWrapper;
