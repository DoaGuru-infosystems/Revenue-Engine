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
  return (
    <>
      <div className="mb-1 text-center">
        <p className="text-sm font-bold tracking-wide uppercase">
          {isProforma
            ? isBalanceProforma
              ? "BALANCE PROFORMA INVOICE"
              : "PROFORMA INVOICE"
            : isQuotation
              ? "QUOTATION"
              : "INVOICE"}
        </p>
      </div>

      {/* Client Details */}
      <div className="flex justify-between text-xs mb-1">
        <div className="space-y-1">
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

        <div className="space-y-1 text-xs">
          <p>
            {isProforma ? (
              <>
                <strong>Proforma Invoice No: </strong> {clientData?.bill_number}
                {isBalanceProforma && clientData?.source_proforma_number && (
                  <div className="text-gray-500 font-semibold text-[11px] mt-0.5">
                    Ref: {clientData.source_proforma_number}
                  </div>
                )}
              </>
            ) : isQuotation ? (
              <>
                <strong>Quotation: </strong> {clientData?.bill_number || clientData?.id}
              </>
            ) : isGST > 0 ? (
              <>
                <strong>GST Invoice No: </strong> {clientData?.bill_number}
              </>
            ) : (
              <>
                <strong>N-GST Invoice No: </strong> {clientData?.bill_number}
              </>
            )}
          </p>
          <p>
            <strong>Date:</strong>{" "}
            {moment(clientData?.created_at).format("DD/MM/YYYY")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
        {/* Client Info */}
        <div className="border p-2 rounded-lg">
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
        <DocumentCompanyFrom isGST={isGST} className="mt-1" />
      </div>
    </>
  );
}
