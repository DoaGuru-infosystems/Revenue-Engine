import React from "react";
import moment from "moment";

export default function QuotationCustomerInfoCard({
  clientData = {},
  isBalanceProforma = false,
  docTypeFromURL = "quotation",
  sourceFromURL = null,
  proformaMeta = null,
  txn_id = null,
}) {
  return (
    <>
      {isBalanceProforma && (
        <div className="mb-2 print:mb-1 text-center">
          <p className="text-sm print:text-xs font-bold tracking-wide text-gray-800 uppercase">
            BALANCE PROFORMA INVOICE
          </p>
        </div>
      )}
      {docTypeFromURL === "proforma" && !isBalanceProforma && (
        <div className="mb-2 print:mb-1 text-center">
          <p className="text-sm print:text-xs font-bold tracking-wide text-gray-800 uppercase">
            PROFORMA INVOICE
          </p>
        </div>
      )}

      {/* Client Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 print:grid-cols-2 print:gap-1 print:mb-1">
        <div className="break-words text-xs print:text-[11px] print:leading-tight">
          <h3 className="text-md print:text-xs font-bold">Client Details</h3>
          <p className="break-words">
            <strong>Name:</strong> {clientData?.client_name}
          </p>
          <p className="break-words">
            <strong>Organization Name:</strong>{" "}
            {clientData?.client_organization}
          </p>
          <p className="break-words">
            <strong>Contact:</strong> {clientData?.phone}
          </p>
          <p className="break-words">
            <strong>Address:</strong> {clientData?.address}
          </p>
          <p className="break-words">
            <strong>Email:</strong> {clientData?.email || "N/A"}
          </p>
        </div>

        <div className="text-end text-xs print:text-[11px] print:leading-tight">
          <p className="font-bold">
            {sourceFromURL === "proposal" ||
            docTypeFromURL === "proforma" ||
            isBalanceProforma ? null : (
              <span className="font-bold text-amber-600 border border-amber-600 px-1 py-0.5 rounded mr-1">
                Legacy
              </span>
            )}
            {isBalanceProforma
              ? "Balance  Proforma Invoice No: "
              : docTypeFromURL === "proforma"
              ? "Proforma Invoice: "
              : "Quotation: "}{" "}
            {isBalanceProforma
              ? proformaMeta?.balance_proforma_number || clientData?.proforma_number
              : proformaMeta?.proforma_number ||
                clientData?.proforma_number ||
                txn_id}
          </p>
          {isBalanceProforma &&
            (proformaMeta?.source_proforma_number ||
              clientData?.source_proforma_number) && (
              <p className="text-gray-600 font-semibold mt-0.5 text-xs">
                Ref:{" "}
                {proformaMeta?.source_proforma_number ||
                  clientData?.source_proforma_number}
              </p>
            )}
          <p>{moment().format("DD/MM/YYYY")}</p>
          {(docTypeFromURL === "proforma" || isBalanceProforma) &&
            (clientData?.duration_start_date ||
              proformaMeta?.duration_start_date) && (
              <p className="text-gray-700 mt-0.5 font-medium">
                <strong>Service From:</strong>{" "}
                {moment(
                  clientData?.duration_start_date ||
                    proformaMeta?.duration_start_date
                ).format("DD/MM/YYYY")}{" "}
                to{" "}
                {moment(
                  clientData?.duration_end_date ||
                    proformaMeta?.duration_end_date
                ).format("DD/MM/YYYY")}
              </p>
            )}
        </div>
      </div>
    </>
  );
}
