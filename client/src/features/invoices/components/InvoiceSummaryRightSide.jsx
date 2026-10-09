import React from "react";

export default function InvoiceSummaryRightSide({
  isPartialPayment = false,
  currentBillGrossReceived = 0,
  totalAfterDiscount = 0,
  pastActiveTaxableSubtotal = 0,
  projectValueDeferred = 0,
  activeTaxableSubtotal = 0,
  isGST = false,
  gstAmount = 0,
  invoiceSubtotal = 0,
  activeInvoiceTotal = 0,
  hasReceivedAmount = false,
  receivedAmountForSummary = 0,
  clientData = {},
  isProforma = false,
  visibleAdBudget = 0,
  visibleGoogleBudget = 0,
  visibleMetaBudget = 0,
  hasPayment = false,
  tdsAmountToShow = 0,
  isBalanceProforma = false,
  formatAmount = (val) => Number(val || 0).toLocaleString("en-IN"),
  formatAmountNoDecimals = (val) => Number(val || 0).toLocaleString("en-IN"),
}) {
  return (
    <div className="w-[55%] flex flex-col text-xs bg-white">
      <div className="flex flex-col">
        {isPartialPayment && currentBillGrossReceived > 0 ? (
          <>
            <div
              style={{
                background: "#f5f8fc",
                fontWeight: 800,
                color: "#111827",
              }}
              className="flex justify-between items-center px-3 py-1 border-b border-gray-100"
            >
              <span className="text-gray-600">Total Project Base Value</span>
              <span className="text-gray-900 font-medium">
                ₹{formatAmount(totalAfterDiscount)}
              </span>
            </div>
            {pastActiveTaxableSubtotal > 0 && (
              <div
                style={{
                  background: "white",
                  color: "#5f6b7a",
                  fontWeight: "normal",
                }}
                className="flex justify-between items-center px-3 py-1 border-b border-gray-100"
              >
                <span className="text-gray-600">
                  Less: Taxable Value Billed Earlier
                </span>
                <span className="text-gray-900 font-medium">
                  -₹{formatAmount(pastActiveTaxableSubtotal)}
                </span>
              </div>
            )}
            {projectValueDeferred > 0 && (
              <div
                style={{
                  background: "#fef2f2",
                  color: "#dc2626",
                  fontWeight: 700,
                }}
                className="flex justify-between items-center px-3 py-1 border-b border-gray-100"
              >
                <span>Less: Amount to be Billed Separately</span>
                <span className="font-medium">
                  -₹{formatAmount(projectValueDeferred)}
                </span>
              </div>
            )}
            <div
              style={{
                background: "#e8edff",
                color: "#111827",
                fontWeight: 800,
              }}
              className="flex justify-between items-center px-3 py-1 border-b border-gray-200"
            >
              <span className="text-gray-800">Net Taxable Value</span>
              <span className="text-gray-900">
                ₹{formatAmount(activeTaxableSubtotal)}
              </span>
            </div>
            {isGST && (
              <>
                <div
                  style={{
                    background: "white",
                    color: "#5f6b7a",
                    fontWeight: "normal",
                  }}
                  className="flex justify-between items-center px-3 py-1 border-b border-gray-100"
                >
                  <span className="text-gray-600">CGST @9%</span>
                  <span className="text-gray-900 font-medium">
                    ₹{formatAmount(gstAmount / 2)}
                  </span>
                </div>
                <div
                  style={{
                    background: "white",
                    color: "#5f6b7a",
                    fontWeight: "normal",
                  }}
                  className="flex justify-between items-center px-3 py-1 border-b border-gray-100"
                >
                  <span className="text-gray-600">SGST @9%</span>
                  <span className="text-gray-900 font-medium">
                    ₹{formatAmount(gstAmount / 2)}
                  </span>
                </div>
              </>
            )}
          </>
        ) : (
          isGST && (
            <>
              <div
                style={{
                  background: "white",
                  color: "#5f6b7a",
                  fontWeight: "normal",
                }}
                className="flex justify-between items-center px-3 py-1 border-b border-gray-100"
              >
                <span className="text-gray-600">Taxable Amount</span>
                <span className="text-gray-900 font-medium">
                  ₹{formatAmount(invoiceSubtotal)}
                </span>
              </div>
              <div
                style={{
                  background: "white",
                  color: "#5f6b7a",
                  fontWeight: "normal",
                }}
                className="flex justify-between items-center px-3 py-1 border-b border-gray-100"
              >
                <span className="text-gray-600">CGST @9%</span>
                <span className="text-gray-900 font-medium">
                  ₹{formatAmount(gstAmount / 2)}
                </span>
              </div>
              <div
                style={{
                  background: "white",
                  color: "#5f6b7a",
                  fontWeight: "normal",
                }}
                className="flex justify-between items-center px-3 py-1 border-b border-gray-100"
              >
                <span className="text-gray-600">SGST @9%</span>
                <span className="text-gray-900 font-medium">
                  ₹{formatAmount(gstAmount / 2)}
                </span>
              </div>
            </>
          )
        )}

        <div
          style={{
            background: "#dcf7e8",
            color: "#047968",
            fontWeight: 900,
          }}
          className="flex justify-between items-center px-3 py-1.5 border-b border-gray-100"
        >
          <span className="font-bold text-xs">Total Service Amount</span>
          <span className="font-bold text-xs">
            ₹{formatAmountNoDecimals(activeInvoiceTotal)}
          </span>
        </div>
      </div>

      {/* Payment / Ad Budget Summary */}
      {(hasReceivedAmount ||
        receivedAmountForSummary > 0 ||
        clientData?.invoice_source === "proposal" ||
        isProforma ||
        visibleAdBudget > 0) && (
        <div className="flex flex-col border-b border-gray-100">
          {visibleGoogleBudget > 0 && (
            <div
              style={{
                background: "white",
                color: "#5f6b7a",
                fontWeight: "normal",
              }}
              className="flex justify-between items-center px-3 py-1 border-b border-gray-100"
            >
              <span className="text-gray-600">
                Google Ad Budget (Reimbursable)
              </span>
              <span className="text-gray-900 font-medium">
                ₹{formatAmountNoDecimals(visibleGoogleBudget)}
              </span>
            </div>
          )}
          {visibleMetaBudget > 0 && (
            <div
              style={{
                background: "white",
                color: "#5f6b7a",
                fontWeight: "normal",
              }}
              className="flex justify-between items-center px-3 py-1 border-b border-gray-100"
            >
              <span className="text-gray-600">
                Meta Ad Budget (Reimbursable)
              </span>
              <span className="text-gray-900 font-medium">
                ₹{formatAmountNoDecimals(visibleMetaBudget)}
              </span>
            </div>
          )}
          {visibleAdBudget > 0 && !hasPayment && (
            <div
              style={{
                background: "#dcf7e8",
                color: "#047968",
                fontWeight: 900,
              }}
              className="flex justify-between items-center px-3 py-1.5 border-b border-gray-100"
            >
              <span className="font-bold text-xs">Grand Total</span>
              <span className="font-bold text-xs">
                ₹{formatAmountNoDecimals(activeInvoiceTotal + visibleAdBudget)}
              </span>
            </div>
          )}
          {hasPayment && (
            <>
              <div
                style={{
                  background: "#dcf7e8",
                  color: "#047968",
                  fontWeight: 900,
                }}
                className="flex justify-between items-center px-3 py-1 border-b border-gray-100"
              >
                <span className="text-gray-600">
                  Gross Payments Received (Now)
                </span>
                <span className="text-gray-900 font-medium">
                  ₹{formatAmountNoDecimals(receivedAmountForSummary)}
                </span>
              </div>
              {tdsAmountToShow > 0 && (
                <div
                  style={{
                    background: "#fef2f2",
                    color: "#dc2626",
                    fontWeight: 700,
                  }}
                  className="flex justify-between items-center px-3 py-1 border-b border-gray-100"
                >
                  <span className="text-red-600">Less: TDS Deducted</span>
                  <span className="text-red-600 font-medium">
                    ₹{formatAmountNoDecimals(tdsAmountToShow)}
                  </span>
                </div>
              )}
              <div
                style={{
                  background: "#dcf7e8",
                  color: "#047968",
                  fontWeight: 900,
                }}
                className="flex justify-between items-center px-3 py-1.5 border-b border-gray-100"
              >
                <span className="font-bold text-yellow-700">
                  Net Amount Credited to Bank
                </span>
                <span className="font-bold text-yellow-700">
                  ₹{formatAmountNoDecimals(receivedAmountForSummary - tdsAmountToShow)}
                </span>
              </div>
            </>
          )}
          {isBalanceProforma && (
            <div className="flex flex-col border-t border-gray-200 mt-1 pt-1 bg-white">
              <div
                style={{ background: "#f8fafc", color: "#334155" }}
                className="flex justify-between items-center px-3 py-1 border-b border-gray-100"
              >
                <span className="font-semibold text-xs text-gray-700">
                  Received Amount
                </span>
                <span className="font-bold text-xs text-gray-900">
                  ₹{formatAmountNoDecimals(clientData?.received_amt || 0)}
                </span>
              </div>
              <div
                style={{ background: "#ecfdf5", color: "#065f46" }}
                className="flex justify-between items-center px-3 py-1.5 border-b border-gray-100"
              >
                <span className="font-bold text-xs text-green-800">
                  Current Balance
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-green-700">
                    ₹{formatAmountNoDecimals(clientData?.current_amt || 0)}
                  </span>
                  {Number(clientData?.current_amt || 0) <= 0 && (
                    <span className="bg-green-200 text-green-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-green-400">
                      Fully Paid
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
