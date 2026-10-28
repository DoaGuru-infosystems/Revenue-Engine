import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Eye, Pencil, Send, FilePlus, CheckCircle, Trash, FileText, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import { useSelector } from "react-redux";
import API_BASE_URL from "../../../config/apiBaseUrl";
import { checkDraftStatus, clearQuotationDraft } from "../../calculator/utils/quotationDraftPersistence";

const QuotationActions = ({
  quotation,
  fetchQuotations,
  handleCreateProformaFromQuotation,
  openProformaManager,
  fullWidth = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.user);

  const qStatus = String(quotation.status || "").toLowerCase();
  const isDraft = qStatus === "draft";
  const draftStatus = checkDraftStatus({ quotationId: quotation.id });
  const hasLocalStorageDraft = Boolean(draftStatus?.restoreAvailable && draftStatus?.draft);
  const isUnsavedDraft = hasLocalStorageDraft || (isDraft && Number(quotation.grand_total_excl_gst || 0) === 0);
  const hasProforma = Boolean(
    quotation.proforma_id ||
    Number(quotation.proforma_count) > 0 ||
    ["proforma_generated", "proforma_sent", "payment_awaited", "payment_received", "partially_paid", "paid", "invoiced"].includes(qStatus)
  );

  const toggleDropdown = () => {
    if (!isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpwards(spaceBelow < 280 && rect.top > spaceBelow);
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleAction = async (actionType) => {
    setIsOpen(false);
    const basePath = window.location.pathname.includes("/BD/") ? "/BD" : "/admin";
    try {
      if (actionType === "view") {
        navigate(
          `${basePath}/quotation/${quotation.client_id}/${quotation.id}?doc=quotation&source=new_quotation`
        );
      } else if (actionType === "edit_services") {
        navigate(
          `${basePath}/ServicesLanding/${quotation.client_id}/${quotation.id}?mode=quotation`,
          { state: { mode: "quotation", quotationId: quotation.id } }
        );
      } else if (actionType === "send_to_client") {
        const { value: channel } = await Swal.fire({
          title: "Send Quotation to Client",
          background: "#1f2937",
          color: "#f3f4f6",
          html: `
            <div class="flex flex-col gap-3 mt-4 text-left">
              <label class="flex items-center gap-3 p-3 rounded-lg border border-gray-600 hover:bg-gray-700 cursor-pointer transition-all">
                <input type="radio" name="swal-channel" value="email" class="w-4 h-4">
                <span class="text-sm font-semibold text-gray-200">Email only</span>
              </label>
              <label class="flex items-center gap-3 p-3 rounded-lg border border-gray-600 hover:bg-gray-700 cursor-pointer transition-all">
                <input type="radio" name="swal-channel" value="whatsapp" class="w-4 h-4">
                <span class="text-sm font-semibold text-gray-200">WhatsApp only</span>
              </label>
              <label class="flex items-center gap-3 p-3 rounded-lg border border-gray-600 hover:bg-gray-700 cursor-pointer transition-all">
                <input type="radio" name="swal-channel" value="both" class="w-4 h-4">
                <span class="text-sm font-semibold text-gray-200">Email and WhatsApp</span>
              </label>
            </div>
          `,
          showCancelButton: true,
          confirmButtonColor: "#4f46e5",
          cancelButtonColor: "#4b5563",
          confirmButtonText: "Send now",
          preConfirm: () => {
            const selected = document.querySelector('input[name="swal-channel"]:checked');
            if (!selected) {
              Swal.showValidationMessage("Please select a channel");
              return false;
            }
            return selected.value;
          },
        });
        if (!channel) return;
        Swal.fire({ title: "Sending...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const res = await axios.post(
          `${API_BASE_URL}/auth/api/re_calculator/quotation/${quotation.id}/send`,
          { channel },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.status === "Success") {
          const failed = [];
          const success = [];
          const { emailStatus, waStatus } = res.data;
          if (emailStatus && !emailStatus.ok) failed.push("Email");
          else if (emailStatus && emailStatus.ok) success.push("Email");
          if (waStatus && !waStatus.ok) failed.push("WhatsApp");
          else if (waStatus && waStatus.ok) success.push("WhatsApp");
          if (failed.length > 0) {
            Swal.fire({
              icon: success.length ? "warning" : "error",
              title: success.length ? "Partial send" : "Not delivered",
              html: `<div style="text-align:left;font-size:14px"><p>Failed: ${failed.join(", ")}</p>${success.length ? `<p>Sent: ${success.join(", ")}</p>` : ""}<p style="margin-top:8px">Quotation status is sent. WhatsApp needs the Meta template quotation_review_request.</p></div>`,
            });
          } else {
            Swal.fire({ icon: "success", title: "Sent", text: "Quotation sent to the client.", timer: 1400, showConfirmButton: false });
          }
          fetchQuotations?.();
        }
      } else if (actionType === "mark_approved") {
        const confirm = await Swal.fire({
          title: "Approve Quotation?",
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Yes, Approve",
        });
        if (!confirm.isConfirmed) return;
        const res = await axios.put(
          `${API_BASE_URL}/auth/api/re_calculator/quotation/${quotation.id}/status`,
          { status: "approved" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.status === "Success") {
          Swal.fire({ icon: "success", title: "Approved", timer: 1200, showConfirmButton: false });
          fetchQuotations?.();
        }
      } else if (actionType === "mark_client_response") {
        const { value: decision } = await Swal.fire({
          title: "Mark Client Response",
          input: "select",
          inputOptions: { client_approved: "Approved", changes: "Changes Requested", rejected: "Rejected" },
          showCancelButton: true,
        });
        if (!decision) return;
        const res = await axios.put(
          `${API_BASE_URL}/auth/api/re_calculator/quotation/${quotation.id}/status`,
          { status: decision },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.status === "Success") {
          Swal.fire({ icon: "success", title: "Updated", timer: 1200, showConfirmButton: false });
          fetchQuotations?.();
        }
      } else if (actionType === "generate_proforma") {
        handleCreateProformaFromQuotation?.(quotation);
      } else if (actionType === "view_proformas") {
        openProformaManager?.({ ...quotation, isQuotation: true });
      } else if (actionType === "download_pdf") {
        navigate(
          `${basePath}/quotation/${quotation.client_id}/${quotation.id}?doc=quotation&source=new_quotation`
        );
      } else if (actionType === "delete_quotation") {
        if (hasProforma) {
          Swal.fire({
            icon: "warning",
            title: "Cannot Delete",
            text: "Please delete all proformas first before deleting the quotation.",
          });
          return;
        }
        const confirm = await Swal.fire({
          title: isDraft ? "Discard Draft?" : "Delete this quotation?",
          text: isDraft ? "Are you sure you want to discard this draft quotation?" : "Are you sure you want to delete this quotation?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: isDraft ? "Yes, discard" : "Yes, delete it",
        });
        if (!confirm.isConfirmed) return;
        clearQuotationDraft(quotation.id);
        const res = await axios.delete(
          `${API_BASE_URL}/auth/api/re_calculator/quotation/${quotation.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.status === "Success") {
          Swal.fire({ icon: "success", title: isDraft ? "Discarded" : "Deleted", timer: 1000, showConfirmButton: false });
          fetchQuotations?.();
        }
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Action Failed",
        text: err.response?.data?.message || "Failed to perform action",
      });
    }
  };

  return (
    <div className={`relative text-left ${fullWidth ? "block w-full" : "inline-block"} ${isOpen ? "z-50" : "z-10"}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className={`inline-flex items-center justify-center px-4 py-2.5 sm:py-2 rounded-xl sm:rounded-full text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 ${fullWidth ? "w-full" : ""}`}
      >
        Actions <ChevronDown size={16} className={`ml-2 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div
          className={`absolute ${openUpwards ? "bottom-full mb-2" : "top-full mt-2"} ${
            fullWidth ? "left-0 right-0 w-full" : "right-0 w-56 sm:w-60"
          } bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-xl shadow-2xl z-[100] py-1.5 max-h-[46vh] sm:max-h-72 overflow-y-auto`}
        >
          <ul className="py-1 text-sm text-gray-700 dark:text-gray-200">
            {isUnsavedDraft ? (
              <>
                <li>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2.5 font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center gap-2"
                    onClick={() => handleAction("edit_services")}
                  >
                    <Pencil size={14} /> Continue Editing
                  </button>
                </li>
                <li className="border-t border-gray-100 dark:border-gray-800 mt-1 pt-1">
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2.5 flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                    onClick={() => handleAction("delete_quotation")}
                  >
                    <Trash size={14} /> Discard / Delete Draft
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                    onClick={() => handleAction("view")}
                  >
                    <Eye size={14} className="text-gray-400 shrink-0" /> View Quotation
                  </button>
                </li>
                {!hasProforma && (
                  <li>
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2.5 font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center gap-2"
                      onClick={() => handleAction("edit_services")}
                    >
                      <Pencil size={14} /> {isDraft ? "Continue Editing" : "Edit Services"}
                    </button>
                  </li>
                )}

                {["draft", "sent", "changes", "rejected"].includes(qStatus) && (
                  <>
                    <li>
                      <button
                        type="button"
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-emerald-600 dark:text-emerald-400 flex items-center gap-2"
                        onClick={() => handleAction("send_to_client")}
                      >
                        <Send size={14} /> {["sent", "changes", "rejected"].includes(qStatus) ? "Send Again" : "Send to client"}
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="w-full text-left px-4 py-2.5 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center gap-2"
                        onClick={() => handleAction("mark_approved")}
                      >
                        <CheckCircle size={14} /> Mark approved
                      </button>
                    </li>
                  </>
                )}

                {qStatus === "approved" && (
                  <li>
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                      onClick={() => handleAction("send_to_client")}
                    >
                      <Send size={14} /> Send to client
                    </button>
                  </li>
                )}

                {qStatus === "sent" && (
                  <li>
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center gap-2"
                      onClick={() => handleAction("mark_client_response")}
                    >
                      <CheckCircle size={14} /> Mark client response
                    </button>
                  </li>
                )}

                {["approved", "client_approved", "proforma_generated", "proforma_sent", "payment_awaited", "payment_received", "partially_paid", "invoiced"].includes(qStatus) && (
                  <li>
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2.5 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400 flex items-center gap-2"
                      onClick={() => handleAction("generate_proforma")}
                    >
                      <FilePlus size={14} /> Generate Proforma
                    </button>
                  </li>
                )}

                {hasProforma && (
                  <li>
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                      onClick={() => handleAction("view_proformas")}
                    >
                      <FileText size={14} /> View Proformas
                    </button>
                  </li>
                )}

                <li>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                    onClick={() => handleAction("download_pdf")}
                  >
                    <FileText size={14} /> Download PDF
                  </button>
                </li>

                <li className="border-t border-gray-100 dark:border-gray-800 mt-1 pt-1">
                  <button
                    type="button"
                    disabled={hasProforma}
                    title={hasProforma ? "Cannot delete while proforma exists. Delete all proformas first." : isDraft ? "Discard draft quotation" : "Delete quotation"}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-2 text-red-600 ${
                      hasProforma
                        ? "opacity-40 cursor-not-allowed hover:bg-transparent"
                        : "hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                    }`}
                    onClick={() => handleAction("delete_quotation")}
                  >
                    <Trash size={14} /> {isDraft ? "Discard / Delete Draft" : "Delete"}
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default QuotationActions;
