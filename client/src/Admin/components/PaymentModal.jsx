import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { useSelector } from "react-redux";
import API_BASE_URL from "../../config/apiBaseUrl";

const PaymentModal = ({ fetchProposals }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [proposal, setProposal] = useState(null);
  const { token } = useSelector((state) => state.user);
  
  const [paymentDetails, setPaymentDetails] = useState({
    amount: "",
    payment_mode: "Bank Transfer",
    reference_number: "",
    notes: ""
  });

  useEffect(() => {
    const handleOpen = (e) => {
      setProposal(e.detail);
      setPaymentDetails({
        amount: e.detail.grand_total_excl_gst, // default to full amount
        payment_mode: "Bank Transfer",
        reference_number: "",
        notes: ""
      });
      setIsOpen(true);
    };
    
    document.addEventListener("open-payment-modal", handleOpen);
    return () => document.removeEventListener("open-payment-modal", handleOpen);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${API_BASE_URL}/auth/api/re_calculator/proposal/${proposal.id}/payment`,
        paymentDetails,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.status === "Success") {
        Swal.fire({
          icon: "success",
          title: "Payment Recorded",
          text: "Payment has been successfully recorded."
        });
        setIsOpen(false);
        fetchProposals();
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Failed to record payment"
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Record Payment</h2>
          <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700 font-bold text-xl">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Received</label>
            <input
              type="number"
              required
              value={paymentDetails.amount}
              onChange={(e) => setPaymentDetails({...paymentDetails, amount: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
            <select
              value={paymentDetails.payment_mode}
              onChange={(e) => setPaymentDetails({...paymentDetails, payment_mode: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
            <input
              type="text"
              value={paymentDetails.reference_number}
              onChange={(e) => setPaymentDetails({...paymentDetails, reference_number: e.target.value})}
              placeholder="e.g. UTR / Cheque No."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              value={paymentDetails.notes}
              onChange={(e) => setPaymentDetails({...paymentDetails, notes: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows="3"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-lg shadow-red-500/30"
            >
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
