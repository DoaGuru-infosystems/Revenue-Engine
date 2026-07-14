import React from "react";
import moment from "moment";
import { Calendar } from "lucide-react";

const LegacyQuotationTableBD = ({
  quotations,
  clientName,
  setSelectedClient,
  setSelectedTxn,
  setShowModal,
  clientDataReceived,
  handleDeletequotation,
  createdInvoices,
  handleNavigateInovice,
  handleDeleteInvoice,
  handleCreateClientInvoice,
}) => {
  return (
    <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-900/80 border-b border-gray-700">
              <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">
                #
              </th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Date
              </th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Client Name
              </th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                TXN ID
              </th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Action
              </th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Invoice
              </th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Amount Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {quotations.length > 0 ? (
              quotations.map((item, index) => (
                <tr
                  key={item.id || index}
                  className="hover:bg-gray-800/60 transition-all duration-300 group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <td className="py-5 px-6">
                    <div className="font-semibold text-white text-lg group-hover:text-amber-300 transition-colors">
                      {index + 1}
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-3 text-gray-300 group-hover:text-white transition-colors">
                      <Calendar className="w-4 h-4 text-orange-400" />
                      <span className="font-medium">
                        {moment(item.txn_date).format("DD MMMM YYYY")}
                      </span>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <div className="font-semibold text-white text-lg group-hover:text-amber-300 transition-colors">
                      {clientName}
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <div className="font-bold text-xl bg-gradient-to-r from-green-400 to-yellow-400 bg-clip-text text-transparent">
                      {item.txn_id ? item.txn_id : "N/A"}
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <button
                      onClick={() => {
                        setSelectedClient(item.client_id);
                        setSelectedTxn(item.txn_id);
                        setShowModal(true);
                      }}
                      className="inline-block px-2 py-2 rounded-full text-sm font-semibold transform hover:scale-105 transition-all duration-200 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25 mx-2"
                    >
                      Preview
                    </button>

                    {clientDataReceived[item.txn_id]?.tag_received_amt !==
                      "received" && (
                      <button
                        onClick={() => handleDeletequotation(item.txn_id)}
                        className="inline-block px-4 py-2 rounded-full text-sm font-semibold transform hover:scale-105 transition-all duration-200 bg-gradient-to-r from-red-500 to-red-500 text-white shadow-lg shadow-red-500/25 mx-2"
                      >
                        Delete
                      </button>
                    )}
                  </td>

                  <td className="py-5 px-6">
                    {createdInvoices[item.txn_id] ? (
                      <>
                        {clientDataReceived[item.txn_id]?.tag_received_amt === "received" ? (
                          <button
                            onClick={() => {
                              handleNavigateInovice(
                                clientDataReceived[item.txn_id]?.txn_id,
                                clientDataReceived[item.txn_id]?.bill_type
                              );
                            }}
                            className="inline-block px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-green-500 to-yellow-500 text-white shadow-lg shadow-green-500/25"
                          >
                            Preview
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                handleNavigateInovice(
                                  clientDataReceived[item.txn_id]?.txn_id,
                                  clientDataReceived[item.txn_id]?.bill_type
                                );
                              }}
                              className="inline-block px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-green-500 to-yellow-500 text-white shadow-lg shadow-green-500/25"
                            >
                              Invoice Created
                            </button>
                            <button
                              onClick={() => handleDeleteInvoice(item.txn_id)}
                              className="mx-2 inline-block px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-red-500 to-red-500 text-white shadow-lg shadow-red-500/25"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          handleCreateClientInvoice();
                          setSelectedTxn(item.txn_id);
                        }}
                        className="inline-block px-4 py-2 rounded-full text-sm font-semibold transform hover:scale-105 transition-all duration-200 bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25"
                      >
                        Create Invoice
                      </button>
                    )}
                  </td>

                  <td className="py-5 px-6">
                    {clientDataReceived[item.txn_id]?.tag_received_amt === "received" ? (
                      <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-red-500 to-red-500 text-white shadow-lg">
                        {clientDataReceived[item.txn_id].tag_received_amt}
                      </div>
                    ) : (
                      <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-red-500 to-red-500 text-white shadow-lg">
                        {clientDataReceived[item.txn_id]?.tag_received_amt || "pending"}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="py-12 text-center text-gray-500">
                  <p className="text-xl font-semibold text-gray-400 mb-2">No Quotation History Found</p>
                  <p className="text-sm">There are no quotations available for this client.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LegacyQuotationTableBD;
