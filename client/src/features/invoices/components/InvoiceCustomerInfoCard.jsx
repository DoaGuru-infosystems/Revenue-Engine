import React from "react";
import moment from "moment";
import DocumentCompanyFrom from "../../../shared/document/DocumentCompanyFrom";

export default function InvoiceCustomerInfoCard({
  clientData: rawClientData,
  isProforma = false,
  isBalanceProforma = false,
  isQuotation = false,
  isGST = false,
}) {
  const clientData = rawClientData || {};
  const isGstActive =
    Boolean(isGST) ||
    isGST > 0 ||
    clientData?.is_gst === 1 ||
    clientData?.is_gst === "1" ||
    clientData?.bill_type === "GST";

  const refProforma =
    clientData?.proforma_number ||
    (clientData?.proforma_id ? `PROF-${clientData.proforma_id}` : "");

  const isValidDate = (d) => {
    if (!d) return false;
    const str = String(d).trim().toLowerCase();
    if (!str || str === "invalid date" || str === "0000-00-00" || str === "null" || str === "undefined") {
      return false;
    }
    const m = moment(d);
    return m.isValid() && m.year() > 1970;
  };

  const hasValidDuration =
    isValidDate(clientData?.duration_start_date) &&
    isValidDate(clientData?.duration_end_date);

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
          {clientData?.payment_mode && (
            <p>
              <strong>Payment Mode:</strong> {clientData?.payment_mode}
            </p>
          )}
          {hasValidDuration && (
            <p>
              <strong>Service From:</strong>{" "}
              {moment(clientData?.duration_start_date).format("DD/MM/YYYY")}{" "}
              to{" "}
              {moment(clientData?.duration_end_date).format("DD/MM/YYYY")}
            </p>
          )}
        </div>

        <div className="space-y-1 print:space-y-0.5 text-xs print:text-[11px]">
          {isProforma ? (
            <>
              <p>
                <strong>Proforma Invoice No: </strong> {clientData?.bill_number}
              </p>
              {isBalanceProforma && clientData?.source_proforma_number && (
                <p className="text-gray-500 font-semibold text-[11px] print:text-[10px]">
                  Ref: {clientData.source_proforma_number}
                </p>
              )}
            </>
          ) : isQuotation ? (
            <p>
              <strong>Quotation: </strong> {clientData?.bill_number || clientData?.id}
            </p>
          ) : isGstActive ? (
            <>
              <p>
                <strong>GST Invoice No: </strong> {clientData?.bill_number}
              </p>
              {refProforma && (
                <p className="text-gray-600 font-semibold text-[11px] print:text-[10px]">
                  Ref: {refProforma}
                </p>
              )}
            </>
          ) : (
            <>
              <p>
                <strong>N-GST Invoice No: </strong> {clientData?.bill_number}
              </p>
              {refProforma && (
                <p className="text-gray-600 font-semibold text-[11px] print:text-[10px]">
                  Ref: {refProforma}
                </p>
              )}
            </>
          )}
          <p>
            <strong>Date:</strong>{" "}
            {clientData?.created_at && moment(clientData.created_at).isValid()
              ? moment(clientData.created_at).format("DD/MM/YYYY")
              : moment().format("DD/MM/YYYY")}
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
              <strong>GST No:</strong> {clientData?.client_gst_no}
            </p>
          )}
          {clientData?.client_pan_no && (
            <p>
              <strong>PAN No:</strong> {clientData?.client_pan_no}
            </p>
          )}
          {clientData?.address && (
            <p>
              <strong>Address:</strong> {clientData?.address}
            </p>
          )}
        </div>

        {/* Company Info */}
        <DocumentCompanyFrom isGST={isGST} className="print:p-1.5 print:rounded" />
      </div>
    </>
  );
}
