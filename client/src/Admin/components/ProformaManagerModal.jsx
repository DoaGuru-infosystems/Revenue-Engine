import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import Swal from "sweetalert2";
import { ArrowLeft, CreditCard, CheckCircle2, IndianRupee, FileText, X, Trash } from "lucide-react";
import moment from "moment";
import API_BASE_URL from "../../config/apiBaseUrl";
import { classifyProformaServices } from "../../utils/proformaPricing";

const getClientDisplayName = (client) =>
  client?.company_name || client?.client_organization || client?.client_name || "Client";

export default function ProformaManagerModal({ isOpen, onClose, proposal }) {
  const { currentUser, token } = useSelector((state) => state.user);
  const baseURL = API_BASE_URL;

  const [proformas, setProformas] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clientData, setClientData] = useState(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedProforma, setSelectedProforma] = useState(null);
  const [savingPayment, setSavingPayment] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    is_gst: false,
    tds_applicable: false,
    tds_percentage: 10,
    tds_amount: 0,
    final_amount: 0,
    has_ad_budget: false,
    realized_ad_budget: "",
    realized_google_budget: "",
    realized_meta_budget: "",
    payment_date: moment().format("YYYY-MM-DD"),
    payment_mode: "UPI",
    transaction_reference: "",
    remark: "",
  });

  useEffect(() => {
    if (isOpen && proposal) {
      fetchClientData();
      fetchProformas();
      fetchPayments();
    }
  }, [isOpen, proposal]);

  const fetchClientData = async () => {
    try {
      const { data } = await axios.get(`${baseURL}/auth/api/calculator/getClientDetailsById/${proposal.client_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const client = data.status === "Success" ? (Array.isArray(data.data) ? data.data[0] : data.data) : null;
      if (client) setClientData(client);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProformas = async () => {
    try {
      setLoading(true);

      // If it's a direct/manual proforma passed from history, skip fetching by proposal ID
      if (proposal.isDirectProforma) {
        setProformas([proposal]);
        return;
      }

      // Fetch specifically for this proposal instead of all proformas for the client
      const { data } = await axios.get(`${baseURL}/auth/api/calculator/proforma/proposal/${proposal.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.status === "Success") setProformas(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const { data } = await axios.get(`${baseURL}/auth/api/calculator/proposal-payments/client/${proposal.client_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.status === "Success") setPayments(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openPaymentModal = (proforma) => {
    setSelectedProforma(proforma);
    setPaymentForm({
      amount: "",
      is_gst: proforma.is_gst && typeof proforma.is_gst === 'object' && proforma.is_gst.data ? proforma.is_gst.data[0] === 1 : Number(proforma.is_gst) === 1,
      tds_applicable: false,
      tds_percentage: 10,
      tds_amount: 0,
      final_amount: 0,
      has_ad_budget: false,
      realized_ad_budget: "",
      realized_google_budget: "",
      realized_meta_budget: "",
      payment_date: moment().format("YYYY-MM-DD"),
      payment_mode: "UPI",
      transaction_reference: "",
      remark: "",
    });
    setShowPaymentModal(true);
  };

  let hasGoogleAd = false;
  let hasMetaAd = false;
  let remainingGoogleAdBudget = 0;
  let remainingMetaAdBudget = 0;

  if (selectedProforma && selectedProforma.pricing_snapshot) {
    try {
      const parsed = JSON.parse(selectedProforma.pricing_snapshot);
      const { adsServices } = classifyProformaServices(parsed);
      
      const googleAds = adsServices.filter(ad => (ad.category_name||"").toLowerCase().includes("google"));
      const metaAds = adsServices.filter(ad => (ad.category_name||"").toLowerCase().includes("meta"));

      hasGoogleAd = googleAds.length > 0;
      hasMetaAd = metaAds.length > 0;

      const totalGoogleBudget = googleAds.reduce((sum, ad) => sum + Number(ad.amount || ad.total_price || ad.unit_price || 0), 0);
      const totalMetaBudget = metaAds.reduce((sum, ad) => sum + Number(ad.amount || ad.total_price || ad.unit_price || 0), 0);

      const proformaPayments = payments.filter(p => p.proforma_id === selectedProforma.id);
      const alreadyPaidGoogle = proformaPayments.reduce((sum, p) => sum + Number(p.realized_google_budget || 0), 0);
      const alreadyPaidMeta = proformaPayments.reduce((sum, p) => sum + Number(p.realized_meta_budget || 0), 0);

      remainingGoogleAdBudget = Math.max(0, totalGoogleBudget - alreadyPaidGoogle);
      remainingMetaAdBudget = Math.max(0, totalMetaBudget - alreadyPaidMeta);

    } catch (e) { }
  }

  useEffect(() => {
    if (showPaymentModal && selectedProforma) {
      const amount = Number(paymentForm.amount) || 0;
      let tdsAmount = 0;

      if (paymentForm.tds_applicable) {
        const adBudgetAmount = paymentForm.has_ad_budget ? (Number(paymentForm.realized_google_budget || 0) + Number(paymentForm.realized_meta_budget || 0)) : 0;
        const serviceAmount = Math.max(0, amount - adBudgetAmount);
        const baseForTds = paymentForm.is_gst ? (serviceAmount / (1 + (selectedProforma.gst_rate / 100))) : serviceAmount;
        tdsAmount = (baseForTds * Number(paymentForm.tds_percentage)) / 100;
      }

      const finalAmount = amount - tdsAmount;

      setPaymentForm(prev => ({
        ...prev,
        tds_amount: tdsAmount.toFixed(2),
        final_amount: finalAmount.toFixed(2)
      }));
    }
  }, [
    paymentForm.amount,
    paymentForm.tds_applicable,
    paymentForm.tds_percentage,
    paymentForm.is_gst,
    paymentForm.has_ad_budget,
    paymentForm.realized_google_budget,
    paymentForm.realized_meta_budget,
    selectedProforma,
    showPaymentModal
  ]);


  const [approvingPaymentId, setApprovingPaymentId] = useState(null);

  const handleApprovePayment = async (paymentId) => {
    try {
      setApprovingPaymentId(paymentId);
      const { data } = await axios.put(`${baseURL}/auth/api/calculator/proposal-payment/approve/${paymentId}`,
        { status: 'approved', approved_by: currentUser?.name || "System" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.status === "Success") {
        let htmlText = `<p style='color: #d1d5db; font-size: 1.05em;'>${data.message || 'Payment approved successfully.'}</p>`;

        if (data.invoiceSent) {

          const getStatusHtml = (label, status) => {
            if (status === "N/A" || status === undefined) return "";
            const isSuccess = !!status;
            const icon = isSuccess
              ? `<svg style="width: 18px; height: 18px; color: #10b981; margin-right: 8px;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>`
              : `<svg style="width: 18px; height: 18px; color: #ef4444; margin-right: 8px;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>`;
            const textColor = isSuccess ? "#065f46" : "#991b1b";
            const bgColor = isSuccess ? "#d1fae5" : "#fee2e2";

            return `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; margin-bottom: 8px; background-color: ${bgColor}; border-radius: 8px; border: 1px solid ${isSuccess ? '#a7f3d0' : '#fecaca'};">
                <span style="display: flex; align-items: center; color: #374151; font-weight: 500;">
                  ${icon} ${label}
                </span>
                <span style="font-size: 0.85em; font-weight: 700; color: ${textColor}; text-transform: uppercase; letter-spacing: 0.5px;">
                  ${isSuccess ? 'Sent' : 'Failed'}
                </span>
              </div>
            `;
          };

          htmlText += `
            <div style="text-align: left; margin-top: 24px; padding-top: 16px; border-top: 1px solid #374151;">
              <h4 style="margin: 0 0 12px 0; color: #f3f4f6; font-size: 1em; font-weight: 600;">
                Final Invoice Notifications
              </h4>
              <div style="display: flex; flex-direction: column;">
                ${getStatusHtml("Client Email", data.invoiceSent.clientEmail)}
                ${getStatusHtml("Client WhatsApp", data.invoiceSent.clientWhatsapp)}
                ${getStatusHtml("Admin Email", data.invoiceSent.adminEmail)}
                ${getStatusHtml("Admin WhatsApp", data.invoiceSent.adminWhatsapp)}
              </div>
            </div>
          `;
        }

        Swal.fire({
          icon: 'success',
          title: 'Approved!',
          html: htmlText,
          background: '#1f2937',
          color: '#fff',
        });
        fetchPayments();
        fetchProformas();
      } else {
        Swal.fire('Error', data.message, 'error');
      }
    } catch (err) {
      console.error("Error approving payment", err);
      Swal.fire('Error', 'Failed to approve payment', 'error');
    } finally {
      setApprovingPaymentId(null);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedProforma) return;
    setSavingPayment(true);

    try {
      const payload = {
        proforma_id: selectedProforma.id,
        proposal_id: selectedProforma.proposal_id,
        client_id: proposal.client_id,
        ...paymentForm,
        realized_ad_budget: paymentForm.has_ad_budget ? (Number(paymentForm.realized_google_budget || 0) + Number(paymentForm.realized_meta_budget || 0)) : 0,
        realized_google_budget: paymentForm.has_ad_budget ? Number(paymentForm.realized_google_budget || 0) : 0,
        realized_meta_budget: paymentForm.has_ad_budget ? Number(paymentForm.realized_meta_budget || 0) : 0,
        created_by: currentUser?.name || "System"
      };

      console.log("realized_ad_budget:", payload.realized_ad_budget);

      const { data } = await axios.post(`${baseURL}/auth/api/calculator/proposal-payment`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.status === "Success") {
        let htmlText = "<p style='color: #4b5563; font-size: 1.05em;'>Payment recorded successfully.</p>";

        if (data.adminAlertSent) {
          const getStatusHtml = (label, status) => {
            if (status === "N/A") return "";
            const isSuccess = !!status;
            const icon = isSuccess
              ? `<svg style="width: 18px; height: 18px; color: #10b981; margin-right: 8px;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>`
              : `<svg style="width: 18px; height: 18px; color: #ef4444; margin-right: 8px;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>`;
            const textColor = isSuccess ? "#065f46" : "#991b1b";
            const bgColor = isSuccess ? "#d1fae5" : "#fee2e2";

            return `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; margin-bottom: 8px; background-color: ${bgColor}; border-radius: 8px; border: 1px solid ${isSuccess ? '#a7f3d0' : '#fecaca'};">
                <span style="display: flex; align-items: center; color: #374151; font-weight: 500;">
                  ${icon} ${label}
                </span>
                <span style="font-size: 0.85em; font-weight: 700; color: ${textColor}; text-transform: uppercase; letter-spacing: 0.5px;">
                  ${isSuccess ? 'Sent' : 'Failed'}
                </span>
              </div>
            `;
          };

          htmlText += `
            <div style="text-align: left; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
              <h4 style="margin: 0 0 12px 0; color: #1f2937; font-size: 1em; font-weight: 600;">
                Automated Notifications Triggered
              </h4>
              <div style="display: flex; flex-direction: column;">
                ${getStatusHtml("Admin Email", data.adminAlertSent.adminEmail)}
                ${getStatusHtml("Admin WhatsApp", data.adminAlertSent.adminWhatsapp)}
              </div>
            </div>
          `;
        }

        Swal.fire({
          icon: "success",
          title: "Saved!",
          html: htmlText,
          showConfirmButton: true
        });
        setShowPaymentModal(false);
        fetchPayments();
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to record payment." });
    } finally {
      setSavingPayment(false);
    }
  };

  const handleDeleteProforma = async (proformaId) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this proforma permanently?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    });

    if (confirm.isConfirmed) {
      try {
        const { data } = await axios.delete(`${baseURL}/auth/api/calculator/proforma/${proformaId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data.status === "Success") {
          Swal.fire({ icon: "success", title: "Deleted!", text: "Proforma deleted successfully.", timer: 1000, showConfirmButton: false });
          fetchProformas();
        }
      } catch (err) {
        console.error(err);
        Swal.fire({ icon: "error", title: "Error", text: "Failed to delete proforma." });
      }
    }
  };

  const handleViewProforma = (proforma) => {
    const isGST = proforma.is_gst && typeof proforma.is_gst === 'object' && proforma.is_gst.data ? proforma.is_gst.data[0] === 1 : Number(proforma.is_gst) === 1;
    const url = `#/admin/quotation/${proposal.client_id}/${proforma.id}?doc=proforma&source=proposal&gst=${isGST ? 1 : 0}`;
    window.open(url, "_blank");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {/* Main Manager Modal */ }
      <div className={ `relative w-full max-w-5xl h-[90vh] flex flex-col bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${showPaymentModal ? 'scale-95 opacity-50 pointer-events-none' : 'scale-100 opacity-100'}` }>

        {/* Header */ }
        <div className="flex items-center justify-between p-6 bg-gray-800 border-b border-gray-700">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">
              Proposal Proformas & Payments
            </h1>
            <p className="text-gray-400 text-sm mt-1">Client: { getClientDisplayName(clientData) } | Proposal Ref: #{ proposal?.id }</p>
          </div>
          <button onClick={ onClose } className="p-2 bg-gray-700 hover:bg-gray-600 rounded-xl transition text-gray-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */ }
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          { loading ? (
            <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div></div>
          ) : proformas.length === 0 ? (
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-10 text-center text-gray-400">
              No Proforma Invoices found for this proposal. Generate one from the dropdown first.
            </div>
          ) : (
            proformas.map(proforma => {
              const proformaPayments = payments.filter(p => p.proforma_id === proforma.id);
              const totalReceived = proformaPayments.reduce((sum, p) => sum + Number(p.amount), 0);
              const isPaid = totalReceived >= Number(proforma.total_amount);

              return (
                <div key={ proforma.id } className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden">
                  <div className="p-5 border-b border-gray-700/50 flex flex-wrap items-center justify-between bg-gray-800/60 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-white">Proforma #{ proforma.id }</h3>
                        <p className="text-sm text-gray-400">Created: { moment(proforma.created_at).format('DD MMM YYYY') }</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Invoice Total</p>
                        <p className="text-2xl font-bold text-white">₹{ Number(proforma.total_amount).toLocaleString() }</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={ () => handleViewProforma(proforma) }
                          className="px-4 py-2 bg-green-600/20 text-green-300 border border-green-500/30 rounded-xl hover:bg-green-600/30 transition text-sm font-semibold whitespace-nowrap"
                        >
                          View Proforma
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
                      <h4 className="font-semibold text-gray-300">Payment History</h4>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={ () => handleDeleteProforma(proforma.id) }
                          className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-600/30 transition text-sm font-semibold flex items-center gap-2"
                        >
                          <Trash className="w-4 h-4" /> Delete Proforma
                        </button>
                        { !isPaid && (
                          <button
                            onClick={ () => openPaymentModal(proforma) }
                            className="px-4 py-2 bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 rounded-xl hover:bg-yellow-600/30 transition text-sm font-semibold flex items-center gap-2"
                          >
                            <CreditCard className="w-4 h-4" /> Record Payment
                          </button>
                        ) }
                        { isPaid && (
                          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-bold uppercase flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Fully Paid
                          </span>
                        ) }
                      </div>
                    </div>

                    { proformaPayments.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No payments recorded yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-gray-700 text-gray-400 uppercase tracking-wider text-xs">
                              <th className="pb-3 font-semibold">Date</th>
                              <th className="pb-3 font-semibold">Mode</th>
                              <th className="pb-3 font-semibold">Ref</th>
                              <th className="pb-3 font-semibold">TDS</th>
                              <th className="pb-3 font-semibold text-right">Received Amount</th>
                              <th className="pb-3 font-semibold text-center">Status / Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            { proformaPayments.map(p => (
                              <tr key={ p.id } className="border-b border-gray-800 text-gray-300">
                                <td className="py-3">{ moment(p.payment_date).format('DD MMM YYYY') }</td>
                                <td className="py-3">{ p.payment_mode }</td>
                                <td className="py-3">{ p.transaction_reference || '-' }</td>
                                <td className="py-3">
                                  { p.tds_applicable ? (
                                    <span className="text-orange-400 text-xs">₹{ p.tds_amount } ({ p.tds_percentage }%)</span>
                                  ) : '-' }
                                </td>

                                <td className="py-3 text-right font-bold text-yellow-400">₹{ Number(p.amount).toLocaleString() }</td>
                                <td className="py-3 text-center">
                                  { p.status === 'pending_approval' ? (
                                    <div className="flex flex-col items-center gap-2">
                                      <span className="px-2 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-xs font-bold uppercase">Pending</span>
                                      <button
                                        onClick={ () => handleApprovePayment(p.id) }
                                        disabled={ approvingPaymentId === p.id }
                                        className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-xs font-semibold shadow transition disabled:opacity-50"
                                      >
                                        { approvingPaymentId === p.id ? 'Approving...' : 'Approve' }
                                      </button>
                                    </div>
                                  ) : p.status === 'approved' ? (
                                    <div className="flex flex-col items-center gap-2">
                                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded text-xs font-bold uppercase flex items-center gap-1 justify-center"><CheckCircle2 className="w-3 h-3" /> Approved</span>
                                      <button 
                                        onClick={() => {
                                          const isGST = p.is_gst && typeof p.is_gst === 'object' && p.is_gst.data ? p.is_gst.data[0] === 1 : Number(p.is_gst) === 1;
                                          window.open(`#/admin/invoice/${proposal.client_id}/${p.txn_id}?gst=${isGST ? 1 : 0}`, "_blank");
                                        }}
                                        className="px-3 py-1 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded hover:bg-blue-600/30 text-xs font-semibold"
                                      >
                                        View Invoice
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500 text-xs">-</span>
                                  ) }
                                </td>

                              </tr>
                            )) }
                          </tbody>
                        </table>
                      </div>
                    ) }
                  </div>
                </div>
              );
            })
          ) }
        </div>
        
        {/* Footer with Close Button */}
        <div className="p-4 border-t border-gray-700 bg-gray-800 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 rounded-xl bg-gray-700 text-gray-300 hover:bg-gray-600 font-semibold transition">
            Close
          </button>
        </div>
      </div>

      {/* Dark Themed Record Payment Modal (renders on top of the manager) */ }
      { showPaymentModal && selectedProforma && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-yellow-500/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-yellow-400" /> Record Payment
              </h3>
              <button onClick={ () => setShowPaymentModal(false) } className="text-gray-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={ handleRecordPayment } className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Total Amount Received</label>
                  <input type="number" step="0.01" required value={ paymentForm.amount } onChange={ e => setPaymentForm({ ...paymentForm, amount: e.target.value }) } className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-yellow-500 outline-none" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Payment Date</label>
                  <input type="date" required value={ paymentForm.payment_date } onChange={ e => setPaymentForm({ ...paymentForm, payment_date: e.target.value }) } className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-yellow-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Payment Mode</label>
                  <select value={ paymentForm.payment_mode } onChange={ e => setPaymentForm({ ...paymentForm, payment_mode: e.target.value }) } className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-yellow-500 outline-none">
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Transaction Ref</label>
                  <input type="text" value={ paymentForm.transaction_reference } onChange={ e => setPaymentForm({ ...paymentForm, transaction_reference: e.target.value }) } className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-yellow-500 outline-none" placeholder="Txn ID / UTR" />
                </div>
              </div>

              <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-300">TDS Applicable?</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={ paymentForm.tds_applicable } onChange={ e => setPaymentForm({ ...paymentForm, tds_applicable: e.target.checked }) } className="w-4 h-4 accent-yellow-500" />
                    <span className="text-sm text-gray-400">Yes</span>
                  </label>
                </div>

                { paymentForm.tds_applicable && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-700">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">TDS Percentage</label>
                      <select value={ paymentForm.tds_percentage } onChange={ e => setPaymentForm({ ...paymentForm, tds_percentage: e.target.value }) } className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-white">
                        <option value={ 1 }>1%</option>
                        <option value={ 2 }>2%</option>
                        <option value={ 5 }>5%</option>
                        <option value={ 10 }>10%</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Calculated TDS Amount</label>
                      <input type="text" readOnly value={ `₹${paymentForm.tds_amount}` } className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-orange-400 font-bold" />
                    </div>
                  </div>
                ) }
              </div>

              { (hasGoogleAd || hasMetaAd) && (
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-300">Ad Budget (This Payment)?</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={ paymentForm.has_ad_budget } onChange={ e => {
                        setPaymentForm({
                          ...paymentForm,
                          has_ad_budget: e.target.checked,
                          realized_google_budget: e.target.checked ? paymentForm.realized_google_budget : "",
                          realized_meta_budget: e.target.checked ? paymentForm.realized_meta_budget : ""
                        })
                      } } className="w-4 h-4 accent-yellow-500" />
                      <span className="text-sm text-gray-400">Yes</span>
                    </label>
                  </div>

                  { paymentForm.has_ad_budget && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-700 mt-2">
                      { hasGoogleAd && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            GOOGLE BUDGET (REMAINING: ₹{ remainingGoogleAdBudget })
                          </label>
                          <input type="number" step="0.01" value={ paymentForm.realized_google_budget } onChange={ e => {
                            setPaymentForm({ ...paymentForm, realized_google_budget: e.target.value });
                          } } className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-white focus:border-yellow-500 outline-none" placeholder="0.00" />
                          { Number(paymentForm.realized_google_budget) > remainingGoogleAdBudget && (
                            <p className="text-red-500 text-xs mt-1">Cannot exceed remaining Google budget ₹{ remainingGoogleAdBudget }</p>
                          ) }
                        </div>
                      ) }
                      { hasMetaAd && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            META BUDGET (REMAINING: ₹{ remainingMetaAdBudget })
                          </label>
                          <input type="number" step="0.01" value={ paymentForm.realized_meta_budget } onChange={ e => {
                            setPaymentForm({ ...paymentForm, realized_meta_budget: e.target.value });
                          } } className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-white focus:border-yellow-500 outline-none" placeholder="0.00" />
                          { Number(paymentForm.realized_meta_budget) > remainingMetaAdBudget && (
                            <p className="text-red-500 text-xs mt-1">Cannot exceed remaining Meta budget ₹{ remainingMetaAdBudget }</p>
                          ) }
                        </div>
                      ) }
                    </div>
                  ) }
                </div>
              ) }

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Remark</label>
                <textarea rows="2" value={ paymentForm.remark } onChange={ e => setPaymentForm({ ...paymentForm, remark: e.target.value }) } className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-yellow-500 outline-none" placeholder="Any notes..."></textarea>
              </div>

              <div className="pt-4 border-t border-gray-800 mt-4">
                { (() => {
                  const proformaPayments = payments.filter(p => p.proforma_id === selectedProforma.id);
                  const totalReceivedTillDate = proformaPayments.reduce((sum, p) => sum + Number(p.amount), 0);
                  const currentOutstanding = Number(selectedProforma.total_amount) - totalReceivedTillDate;
                  const finalSettleAmount = Number(paymentForm.amount) || 0;
                  const pendingAfterPayment = currentOutstanding - finalSettleAmount;

                  return (
                    <div className="flex justify-between items-end">
                      <div className="flex gap-6">
                        <div className="text-left">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Outstanding</p>
                          <p className="text-lg font-bold text-gray-300">₹{ currentOutstanding.toLocaleString("en-IN") }</p>
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] text-yellow-500/70 uppercase tracking-wider mb-1">Settle Amount</p>
                          <p className="text-xl font-bold text-yellow-400">₹{ finalSettleAmount.toLocaleString("en-IN") }</p>
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] text-orange-500/70 uppercase tracking-wider mb-1">Pending Balance</p>
                          <p className="text-lg font-bold text-orange-400">₹{ pendingAfterPayment > 0 ? pendingAfterPayment.toLocaleString("en-IN") : 0 }</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button type="button" onClick={ () => setShowPaymentModal(false) } className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 font-semibold transition">Cancel</button>
                        <button type="submit" disabled={ savingPayment || (paymentForm.has_ad_budget && ((Number(paymentForm.realized_google_budget || 0) + Number(paymentForm.realized_meta_budget || 0)) <= 0 || Number(paymentForm.realized_google_budget || 0) > remainingGoogleAdBudget || Number(paymentForm.realized_meta_budget || 0) > remainingMetaAdBudget)) } className="px-6 py-2 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white font-semibold transition flex items-center gap-2 disabled:opacity-50">
                          { savingPayment ? 'Saving...' : 'Save Payment' }
                        </button>
                      </div>
                    </div>
                  );
                })() }
              </div>
            </form>
          </div>
        </div>
      ) }
    </div>
  );
}
