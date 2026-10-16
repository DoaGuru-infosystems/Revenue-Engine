import React from "react";
import moment from "moment";
import DocumentCompanyFrom from "../../../shared/document/DocumentCompanyFrom";

export default function InvoiceCustomerInfoCard({
  clientData = {},
  isProforma = false,
  isBalanceProforma = false,
  isQuotation = false,
  isGST = false,
}) {
  const isGstActive =
    Boolean(isGST) ||
    isGST > 0 ||
    clientData?.is_gst === 1 ||
    clientData?.is_gst === "1" ||
    clientData?.bill_type === "GST";

  const refProforma =
    clientData?.proforma_number ||
    (clientData?.proforma_id ? `PROF-${clientData.proforma_id}` : "");

  return (
    <>
      <div className="mb-1 print:mb-0.5 text-center">
        <p className="text-sm print:text-xs font-bold tracking-wide uppercase">
          {isProforma
            ? isBalanceProforma
              ? "BALANCE PROFORMA INVOICE"
              : "PROFORMA INVOICE"
            : isQuotation
              ? "QUOTATION"
              : isGstActive
                ? "TAX INVOICE"
                : "INVOICE"}
        </p>
      </div>

      {/* Client Details */}
      <div className="flex justify-between text-xs mb-1 print:mb-0.5 print:text-[11px] print:leading-tight">
        <div className="space-y-1 print:space-y-0.5">
          <p>
            <strong>Payment Mode:</strong> {clientData?.payment_mode}
          </p>
          <p>
            <strong>Service From:</strong>{" "}
            {moment(clientData?.duration_start_date).format("DD/MM/YYYY")}{" "}
            to{" "}
            {moment(clientData?.duration_end_date).format("DD/MM/YYYY")}
          </p>
        </div>

        <div className="space-y-1 print:space-y-0.5 text-xs print:text-[11px]">
          <p>
            {isProforma ? (
              <>
                <strong>Proforma Invoice No: </strong> {clientData?.bill_number}
                {isBalanceProforma && clientData?.source_proforma_number && (
                  <span className="text-gray-500 font-semibold text-[11px] print:text-[10px] ml-1">
                    Ref: {clientData.source_proforma_number}
                  </span>
                )}
              </>
            ) : isQuotation ? (
              <>
                <strong>Quotation: </strong> {clientData?.bill_number || clientData?.id}
              </>
            ) : isGstActive ? (
              <>
                <strong>GST Invoice No: </strong> {clientData?.bill_number}
                {refProforma && (
                  <span className="text-gray-600 font-semibold text-[11px] print:text-[10px] ml-1">
                    Ref: {refProforma}
                  </span>
                )}
              </>
            ) : (
              <>
                <strong>N-GST Invoice No: </strong> {clientData?.bill_number}
                {refProforma && (
                  <span className="text-gray-600 font-semibold text-[11px] print:text-[10px] ml-1">
                    Ref: {refProforma}
                  </span>
                )}
              </>
            )}
          </p>
          <p>
            <strong>Date:</strong>{" "}
            {moment(clientData?.created_at).format("DD/MM/YYYY")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2 print:gap-1.5 print:mb-1 text-xs print:text-[11px] print:leading-tight invoice-client-card">
        {/* Client Info */}
        <div className="border p-2 print:p-1.5 rounded-lg print:rounded">
          <p>
            <strong>BILL TO:</strong> {clientData?.client_organization}
          </p>
          <p>
            <strong>Name:</strong> {clientData?.client_name}
          </p>

          <p>
            <strong>Contact:</strong> {clientData?.phone}
          </p>
          <p>
            <strong>Email:</strong> {clientData?.email || "N/A"}
          </p>
          {clientData?.client_gst_no && (
            <p>
              <strong>GST No:</strong> {clientData.client_gst_no}
            </p>
          )}
          {clientData?.client_pan_no && (
            <p>
              <strong>PAN No:</strong> {clientData.client_pan_no}
            </p>
          )}
          {clientData?.address && (
            <p>
              <strong>Address:</strong> {clientData.address}
            </p>
          )}
        </div>

        {/* Company Info */}
        <DocumentCompanyFrom isGST={isGST} className="print:p-1.5 print:rounded" />
      </div>
    </>
  );
}
