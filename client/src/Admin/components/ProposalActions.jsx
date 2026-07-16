import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Eye, Send, FilePlus, CreditCard, CheckCircle, Trash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import { useSelector } from "react-redux";
import API_BASE_URL from "../../config/apiBaseUrl";

const ProposalActions = ({ proposal, fetchProposals, handleCreateProformaFromProposal, openProformaManager }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.user);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAction = async (actionType) => {
    setIsOpen(false);
    const basePath = window.location.pathname.includes('/BD/') ? '/BD' : '/admin';

    try {
      if (actionType === "view") {
        navigate(`${basePath}/proposal-builder/${proposal.client_id}/${proposal.id}`);
      } else if (actionType === "send_to_client") {
        const { value: channel } = await Swal.fire({
          title: 'Send Proposal to Client',
          background: '#1f2937', // gray-800
          color: '#f3f4f6', // gray-100
          html: `
            <div class="flex flex-col gap-3 mt-4 text-left">
              <label class="flex items-center gap-3 p-3 rounded-lg border border-gray-600 hover:bg-gray-700 cursor-pointer transition-all">
                <input type="radio" name="swal-channel" value="email" class="w-4 h-4 text-yellow-500 bg-gray-700 border-gray-600 focus:ring-yellow-500">
                <span class="text-sm font-semibold text-gray-200">📧 Email Only</span>
              </label>
              <label class="flex items-center gap-3 p-3 rounded-lg border border-gray-600 hover:bg-gray-700 cursor-pointer transition-all">
                <input type="radio" name="swal-channel" value="whatsapp" class="w-4 h-4 text-yellow-500 bg-gray-700 border-gray-600 focus:ring-yellow-500">
                <span class="text-sm font-semibold text-gray-200">💬 WhatsApp Only</span>
              </label>
              <label class="flex items-center gap-3 p-3 rounded-lg border border-gray-600 hover:bg-gray-700 cursor-pointer transition-all">
                <input type="radio" name="swal-channel" value="both" class="w-4 h-4 text-yellow-500 bg-gray-700 border-gray-600 focus:ring-yellow-500">
                <span class="text-sm font-semibold text-gray-200">📧 + 💬 Both</span>
              </label>
            </div>
          `,
          showCancelButton: true,
          confirmButtonColor: '#10b981', // yellow-500
          cancelButtonColor: '#4b5563', // gray-600
          confirmButtonText: 'Send Now',
          preConfirm: () => {
            const selected = document.querySelector('input[name="swal-channel"]:checked');
            if (!selected) {
              Swal.showValidationMessage('Please select a channel!');
              return false;
            }
            return selected.value;
          }
        });

        if (channel) {
          Swal.fire({ title: 'Sending...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
          const res = await axios.post(`${API_BASE_URL}/auth/api/re_calculator/proposal/${proposal.id}/send`, { channel }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.status === "Success") {
            let msg = "Proposal sent successfully.";
            let icon = "success";
            let title = "Sent!";
            
            const { emailStatus, waStatus, adminEmailStatus, adminWAStatus } = res.data;
            const failed = [];
            const success = [];
            if (emailStatus && !emailStatus.ok) failed.push("Client Email"); else if (emailStatus && emailStatus.ok) success.push("Client Email");
            if (waStatus && !waStatus.ok) failed.push("Client WhatsApp"); else if (waStatus && waStatus.ok) success.push("Client WhatsApp");
            if (adminEmailStatus && !adminEmailStatus.ok) failed.push("Admin Email"); else if (adminEmailStatus && adminEmailStatus.ok) success.push("Admin Email");
            if (adminWAStatus && !adminWAStatus.ok) failed.push("Admin WhatsApp"); else if (adminWAStatus && adminWAStatus.ok) success.push("Admin WhatsApp");
            
            if (failed.length > 0) {
              const htmlContent = `
                <div style="text-align: left; margin-top: 10px; font-size: 14px;">
                  <p style="margin-bottom: 5px;"><strong>❌ Failed to send to:</strong></p>
                  <ul style="color: #ef4444; list-style-type: none; padding-left: 10px; margin-bottom: 15px;">
                    ${failed.map(f => `<li>• ${f}</li>`).join('')}
                  </ul>
                  ${success.length > 0 ? `
                  <p style="margin-bottom: 5px;"><strong>✅ Successfully sent to:</strong></p>
                  <ul style="color: #10b981; list-style-type: none; padding-left: 10px;">
                    ${success.map(s => `<li>• ${s}</li>`).join('')}
                  </ul>
                  ` : ''}
                </div>
              `;
              Swal.fire({ icon: "warning", title: "Partial Success", html: htmlContent });
            } else {
              const htmlContent = `
                <div style="text-align: left; margin-top: 10px; font-size: 14px;">
                  <p style="margin-bottom: 5px;"><strong>✅ Successfully sent to:</strong></p>
                  <ul style="color: #10b981; list-style-type: none; padding-left: 10px;">
                    ${success.map(s => `<li>• ${s}</li>`).join('')}
                  </ul>
                </div>
              `;
              Swal.fire({ icon: "success", title: "Sent Successfully!", html: htmlContent });
            }
            fetchProposals();
          }
        }
      } else if (actionType === "mark_client_response") {
        const { value: decision } = await Swal.fire({
          title: 'Mark Client Response',
          background: '#1f2937',
          color: '#f3f4f6',
          html: `
            <div class="flex flex-col gap-3 mt-4 text-left">
              <label class="flex items-center gap-3 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 cursor-pointer transition-all">
                <input type="radio" name="swal-decision" value="approved" class="w-4 h-4 text-yellow-500 bg-gray-700 border-gray-600">
                <span class="text-sm font-semibold text-yellow-400">✅ Approved</span>
              </label>
              <label class="flex items-center gap-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer transition-all">
                <input type="radio" name="swal-decision" value="changes" class="w-4 h-4 text-amber-500 bg-gray-700 border-gray-600">
                <span class="text-sm font-semibold text-amber-400">🔄 Changes Requested</span>
              </label>
              <label class="flex items-center gap-3 p-3 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 cursor-pointer transition-all">
                <input type="radio" name="swal-decision" value="rejected" class="w-4 h-4 text-red-500 bg-gray-700 border-gray-600">
                <span class="text-sm font-semibold text-red-400">❌ Rejected</span>
              </label>
            </div>
          `,
          showCancelButton: true,
          confirmButtonColor: '#3b82f6', // red-500
          cancelButtonColor: '#4b5563',
          confirmButtonText: 'Update Status',
          preConfirm: () => {
            const selected = document.querySelector('input[name="swal-decision"]:checked');
            if (!selected) {
              Swal.showValidationMessage('Please select a response!');
              return false;
            }
            return selected.value;
          }
        });

        if (decision) {
          Swal.fire({ title: 'Updating...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
          const res = await axios.put(`${API_BASE_URL}/auth/api/re_calculator/proposal/${proposal.id}/status`, { status: decision, updated_by: "System" }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.status === "Success") {
            Swal.fire({ icon: "success", title: "Updated!", text: `Proposal marked as ${decision}.`, timer: 1500, showConfirmButton: false });
            fetchProposals();
          }
        }
      } else if (actionType === "mark_approved") {
        const confirm = await Swal.fire({
          title: 'Approve Proposal?',
          text: "Are you sure you want to manually mark this proposal as approved?",
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Yes, Approve',
          cancelButtonText: 'Cancel',
          confirmButtonColor: '#10b981',
        });
        
        if (!confirm.isConfirmed) return;
        
        Swal.fire({ title: 'Approving...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const res = await axios.put(`${API_BASE_URL}/auth/api/re_calculator/proposal/${proposal.id}/status`, { status: "approved", updated_by: "System" }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.status === "Success") {
          Swal.fire({ icon: "success", title: "Approved!", text: "Proposal marked as approved.", timer: 1500, showConfirmButton: false });
          fetchProposals();
        }
      } else if (actionType === "generate_proforma") {
        if (handleCreateProformaFromProposal) {
          handleCreateProformaFromProposal(proposal);
        } else {
          const payload = {
            proposal_id: proposal.id,
            client_id: proposal.client_id,
            base_amount: proposal.grand_total_excl_gst,
            total_amount: proposal.grand_total_excl_gst
          };
          const res = await axios.post(`${API_BASE_URL}/auth/api/re_calculator/proforma`, payload, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.status === "Success") {
            Swal.fire({ icon: "success", title: "Proforma Generated", text: "Proforma invoice successfully generated." });
            fetchProposals();
          }
        }
      } else if (actionType === "record_payment") {
        if (openProformaManager) {
          openProformaManager(proposal);
        } else {
          document.dispatchEvent(new CustomEvent('open-payment-modal', { detail: proposal }));
        }
      } else if (actionType === "generate_invoice") {
        navigate(`${basePath}/create-invoice/${proposal.client_id}?proposalId=${proposal.id}`);
      } else if (actionType === "download_pdf") {
        const res = await axios.post(`${API_BASE_URL}/auth/api/re_calculator/proposal/${proposal.id}/pdf`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.status === "Success" && res.data.html) {
          const printWindow = window.open('', '_blank');
          printWindow.document.open();
          printWindow.document.write(res.data.html);
          printWindow.document.close();
          
          // Extract title to set as PDF filename
          const titleMatch = res.data.html.match(/<title>(.*?)<\/title>/i);
          const docTitle = titleMatch ? titleMatch[1] : `${proposal.client_name || 'Client'} Proposal`;
          printWindow.document.title = docTitle;
          
          // Allow base64 images to render before printing
          printWindow.onload = () => {
            printWindow.focus();
            setTimeout(() => {
              printWindow.print();
            }, 500);
          };
        } else {
          throw new Error("Failed to generate PDF HTML");
        }
      } else if (actionType === "delete_proposal") {
        if (proposal.proforma_id) {
          Swal.fire({
            icon: "warning",
            title: "Cannot Delete",
            text: "Please delete the proforma first before deleting the proposal."
          });
          return;
        }
        const confirm = await Swal.fire({
          title: "Are you sure?",
          text: "Do you want to delete this proposal permanently?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          cancelButtonColor: "#3085d6",
          confirmButtonText: "Yes, delete it!"
        });
        
        if (confirm.isConfirmed) {
          const res = await axios.delete(`${API_BASE_URL}/auth/api/re_calculator/proposal/${proposal.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.status === "Success") {
            Swal.fire({ icon: "success", title: "Deleted!", text: "Proposal deleted successfully.", timer: 1000, showConfirmButton: false });
            fetchProposals();
          }
        }
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Action Failed", text: err.response?.data?.message || "Failed to perform action" });
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-orange-500 to-orange-500 text-white shadow-lg shadow-orange-500/25 transition-all duration-200 hover:scale-105"
      >
        Actions <ChevronDown size={16} className="ml-2" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-900/95 backdrop-blur-md border border-gray-700/60 rounded-xl shadow-2xl z-50 py-1">
          <ul className="py-1 text-sm text-gray-300">
            <li>
              <button onClick={() => handleAction("view")} className="w-full text-left px-4 py-2 hover:bg-gray-800/80 hover:text-white transition-all flex items-center gap-2">
                <Eye size={14} className="text-gray-400" /> View / Edit Proposal
              </button>
            </li>
            
            {['draft', 'sent', 'changes', 'rejected'].includes(proposal.status) && (
              <>
                <li>
                  <button onClick={() => handleAction("send_to_client")} className="w-full text-left px-4 py-2 hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 transition-all flex items-center gap-2">
                    <Send size={14} /> {['sent', 'changes', 'rejected'].includes(proposal.status) ? 'Send Again' : 'Send to Client'}
                  </button>
                </li>
                <li>
                  <button onClick={() => handleAction("mark_approved")} className="w-full text-left px-4 py-2 hover:bg-green-500/10 text-green-400 hover:text-green-300 transition-all flex items-center gap-2">
                    <CheckCircle size={14} /> Mark Approved
                  </button>
                </li>
              </>
            )}
            
            {proposal.status === 'sent' && (
              <li>
                <button onClick={() => handleAction("mark_client_response")} className="w-full text-left px-4 py-2 hover:bg-blue-500/10 text-blue-400 hover:text-blue-300 transition-all flex items-center gap-2">
                  <CheckCircle size={14} /> Mark Client Response
                </button>
              </li>
            )}
            
            {['approved', 'proforma_generated', 'proforma_sent', 'payment_awaited', 'payment_received', 'partially_paid', 'invoiced'].includes(proposal.status) && (
              <li>
                <button onClick={() => handleAction("generate_proforma")} className="w-full text-left px-4 py-2 hover:bg-orange-500/10 text-orange-400 hover:text-orange-300 transition-all flex items-center gap-2">
                  <FilePlus size={14} /> Generate Proforma
                </button>
              </li>
            )}

            {['proforma_generated', 'proforma_sent', 'payment_awaited', 'payment_received', 'partially_paid', 'invoiced'].includes(proposal.status) && (
              <li>
                <button onClick={() => handleAction("record_payment")} className="w-full text-left px-4 py-2 hover:bg-orange-500/10 text-orange-400 hover:text-orange-300 transition-all flex items-center gap-2">
                  <CreditCard size={14} /> Record Payment
                </button>
              </li>
            )}



            {['draft', 'sent', 'changes', 'rejected', 'approved', 'proforma_generated', 'proforma_sent', 'payment_awaited', 'payment_received', 'partially_paid', 'invoiced'].includes(proposal.status) && (
              <li>
                <button onClick={() => handleAction("download_pdf")} className="w-full text-left px-4 py-2 hover:bg-gray-700/50 text-gray-300 hover:text-white transition-all flex items-center gap-2">
                  <FilePlus size={14} /> Download PDF
                </button>
              </li>
            )}

            <li>
              <button onClick={() => handleAction("delete_proposal")} className="w-full text-left px-4 py-2 hover:bg-red-500/15 text-red-400 hover:text-red-300 transition-all flex items-center gap-2">
                <Trash size={14} /> Delete Proposal
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProposalActions;
