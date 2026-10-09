import React from "react";
import moment from "moment";

export default function InvoicePaymentHistoryTable({
  isProforma = false,
  isBalanceProforma = false,
  proformaPayments = [],
  id,
  txn_id,
  parseAmount = (val) => Number(val || 0),
  formatAmount = (val) => Number(val || 0).toLocaleString("en-IN"),
}) {
  if (!isProforma || isBalanceProforma || !proformaPayments || proformaPayments.length === 0) {
    return null;
  }

  return (
    <div className="payment-history-section w-full text-left pt-2 border-t border-gray-300">
      <h2 className="font-bold mb-1 text-gray-800">
        Payment History
      </h2>
      <table className="w-full border text-xs">
        <thead className="bg-orange-100">
          <tr>
            <th className="border px-2 py-1 text-left">Date</th>
            <th className="border px-2 py-1 text-left">TXN ID</th>
            <th className="border px-2 py-1 text-left">Mode</th>
            <th className="border px-2 py-1 text-left">Ref</th>
            <th className="border px-2 py-1 text-right">TDS</th>
            <th className="border px-2 py-1 text-right">Received Amount</th>
          </tr>
        </thead>
        <tbody>
          {proformaPayments.map((payment) => {
            const tdsAmount = parseAmount ? parseAmount(payment.tds_amount) : Number(payment.tds_amount || 0);
            return (
              <tr key={payment.id} className="bg-white">
                <td className="border px-2 py-1 whitespace-nowrap">
                  {payment.txn_id ? (
                    <a
                      href={`/#/admin/invoice/${id}/${txn_id}?doc=proforma&source=proposal&txnId=${payment.txn_id}`}
                      className="text-orange-600 hover:underline font-semibold"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {moment(payment.payment_date).format("DD MMM YYYY")} 🔗
                    </a>
                  ) : (
                    moment(payment.payment_date).format("DD MMM YYYY")
                  )}
                </td>
                <td className="border px-2 py-1">
                  {payment.txn_id ? (
                    <span
                      className="font-mono text-[10px] text-gray-600 cursor-pointer hover:text-orange-700"
                      title={payment.txn_id}
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(payment.txn_id);
                        }
                      }}
                    >
                      {payment.txn_id.length > 20
                        ? payment.txn_id.slice(-20)
                        : payment.txn_id}{" "}
                      📋
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="border px-2 py-1">
                  {payment.payment_mode || "-"}
                </td>
                <td className="border px-2 py-1">
                  {payment.transaction_reference || "-"}
                </td>
                <td className="border px-2 py-1 text-right">
                  {payment.tds_applicable && tdsAmount > 0
                    ? `₹${formatAmount(tdsAmount)} (${formatAmount(
                        payment.tds_percentage
                      )}%)`
                    : "-"}
                </td>
                <td className="border px-2 py-1 text-right font-semibold">
                  ₹{formatAmount(payment.amount)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
