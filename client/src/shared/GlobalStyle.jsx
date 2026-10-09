import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  @media print {
    .print-header,
    .print-footer {
      position: fixed;
      width: 100%;
      left: 0;
      z-index: 9999;
    }

    .print-header {
      top: 0;
      height: 150px;
    }

    .print-footer {
      bottom: 0;
      height: 80px;
    }

    .print-header img,
    .print-footer img {
      width: 100%;
      object-fit: cover;
    }

    .page-break {
      page-break-before: always;
      break-before: page;
    }

    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }
  }
`;

export default GlobalStyle;
