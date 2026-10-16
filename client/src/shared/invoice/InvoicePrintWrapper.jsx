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

    /* Compact inner table styling for print to fit on single page */
    .page-wrapper table.border {
      margin-top: 2px !important;
      margin-bottom: 2px !important;
    }

    .page-wrapper table.border th,
    .page-wrapper table.border td {
      padding: 2.5px 5px !important;
      font-size: 11px !important;
      line-height: 1.25 !important;
    }

    .page-wrapper section {
      margin-top: 3px !important;
      margin-bottom: 3px !important;
    }

    /* terms-bank-section: keep bank details and totals together on same page */
    .terms-bank-section {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      page-break-after: auto !important;
      break-after: auto !important;
      margin-top: 2px !important;
      padding-top: 2px !important;
      padding-bottom: 2px !important;
    }

    /* Bank Details div */
    .bank-details-section {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      page-break-after: auto !important;
      break-after: auto !important;
      margin-bottom: 0 !important;
      font-size: 10.5px !important;
    }

    .bank-details-section ul {
      margin-top: 1px !important;
      margin-bottom: 1px !important;
    }

    .bank-details-section ul li,
    .bank-details-section p,
    .bank-details-section span {
      font-size: 10.5px !important;
      line-height: 1.25 !important;
    }

    .bank-details-section .flex.justify-between {
      padding-top: 1.5px !important;
      padding-bottom: 1.5px !important;
      padding-left: 6px !important;
      padding-right: 6px !important;
      font-size: 10.5px !important;
      line-height: 1.25 !important;
    }

    .bank-details-section img {
      height: 22px !important;
      max-height: 22px !important;
      width: auto !important;
    }

    /* Client info compact */
    .invoice-client-card {
      margin-bottom: 2px !important;
    }

    .invoice-client-card p {
      font-size: 10.5px !important;
      line-height: 1.25 !important;
      margin: 0.5px 0 !important;
    }

    .invoice-client-card .border {
      padding: 3px 6px !important;
    }

    /* Amount in words orphan fix for browser print */
    .amount-in-words-section {
      page-break-before: avoid !important;
      break-before: avoid !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      margin-top: 1px !important;
      margin-bottom: 2px !important;
    }

    /* Terms & Conditions / Notes: natural flow to next page if needed */
    .terms-conditions-section,
    .notes-section,
    .payment-history-section {
      page-break-before: auto !important;
      break-before: auto !important;
      page-break-inside: auto !important;
      break-inside: auto !important;
      margin-top: 3px !important;
      padding-top: 3px !important;
    }

    .terms-conditions-section ul,
    .notes-section ul {
      margin-top: 1px !important;
      margin-bottom: 1px !important;
    }

    .terms-conditions-section ul li,
    .notes-section ul li {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      font-size: 10.5px !important;
      line-height: 1.25 !important;
      margin-top: 1px !important;
      margin-bottom: 1px !important;
    }
  }
`;

export default InvoicePrintWrapper;
