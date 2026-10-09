import React from "react";
import {
  FileText,
  Save,
  ArrowLeft,
  Download,
  Send,
  Plus,
  Trash2,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Target,
  IndianRupee,
} from "lucide-react";
import { PROPOSAL_SECTIONS, PROPOSAL_TYPES, BILLING_TYPES } from "../../../config/proposalDefaults";
import { useProposalBuilder, getClientDisplayName } from "../hooks/useProposalBuilder";
import ProposalPricingSection from "../components/ProposalPricingSection";
import ProposalMilestonesTable from "../components/ProposalMilestonesTable";
import ProposalSendModal from "../components/ProposalSendModal";

export default function ProposalBuilderPage() {
  const {
    proposalId,
    navigate,
    isAdmin,
    loading,
    clientData,
    proposalType,
    setProposalType,
    billingType,
    setBillingType,
    billingStartDate,
    setBillingStartDate,
    billingEndDate,
    setBillingEndDate,
    sections,
    handleSectionChange,
    toggles,
    setToggles,
    openSections,
    toggleSection,
    pricingTable,
    pricingMode,
    setPricingMode,
    searchQuery,
    setSearchQuery,
    dropdownOpen,
    setDropdownOpen,
    filteredPlans,
    handlePlanSelect,
    activeCalculator,
    setActiveCalculator,
    handleServiceAdded,
    handleServiceDeleted,
    removePricingRow,
    milestones,
    addMilestoneRow,
    removeMilestoneRow,
    handleMilestoneChange,
    predefinedNotes,
    handleAddPredefinedNote,
    manualNote,
    setManualNote,
    handleAddManualNote,
    removeNote,
    discountValue,
    discountSettings,
    showDiscountModal,
    setShowDiscountModal,
    formDataDis,
    openDiscountModal,
    handleApplyDiscount,
    handleChangeDis,
    showSendModal,
    setShowSendModal,
    sendChannel,
    setSendChannel,
    sending,
    isReadOnly,
    saveProposal,
    downloadPdf,
    sendToClient,
    executeSend,
    markAsApproved,
    getBillableTotals,
    getDiscountAmount,
  } = useProposalBuilder();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 pb-24">
      {isReadOnly && (
        <div className="max-w-5xl mx-auto mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 shadow-lg">
          <CheckCircle className="w-6 h-6 text-red-400" />
          <div>
            <h4 className="text-red-400 font-bold text-sm">Editing Locked</h4>
            <p className="text-red-300 text-xs mt-0.5">
              An invoice has been generated for this proposal. Further edits are disabled.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-5xl mx-auto flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
              {proposalId ? "Edit Proposal" : "Create New Proposal"}
            </h1>
            <p className="text-gray-400 text-sm">
              Client: {clientData ? getClientDisplayName(clientData) : "Loading..."}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {proposalId && (
            <>
              <button
                onClick={() => sendToClient()}
                className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-600/30 transition text-sm font-semibold"
              >
                <Send className="w-4 h-4" /> Send to Client
              </button>
              {isAdmin && (
                <button
                  onClick={() => markAsApproved()}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded-xl hover:bg-green-600/30 transition text-sm font-semibold"
                >
                  <CheckCircle className="w-4 h-4" /> Mark Approved
                </button>
              )}
              <button
                onClick={() => downloadPdf()}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 rounded-xl hover:bg-yellow-600/30 transition text-sm font-semibold"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Basic Info Setup */}
        <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-red-400" /> Setup Proposal
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Proposal Category
              </label>
              <select
                value={proposalType}
                onChange={(e) => setProposalType(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-white focus:border-red-500 outline-none"
              >
                {PROPOSAL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Billing Type
              </label>
              <select
                value={billingType}
                onChange={(e) => setBillingType(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-white focus:border-red-500 outline-none"
              >
                {BILLING_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            {billingType === "custom" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={billingStartDate}
                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                    onChange={(e) => setBillingStartDate(e.target.value)}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={billingEndDate}
                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                    onChange={(e) => setBillingEndDate(e.target.value)}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-white"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* 13 Sections */}
        <div className="space-y-4">
          {PROPOSAL_SECTIONS.map((sec, idx) => {
            const isOpen = openSections[sec.key];
            const isOptional = sec.optional;
            const isEnabled = !isOptional || toggles[sec.key];

            return (
              <div
                key={sec.key}
                className={`bg-gray-800/30 backdrop-blur-xl border ${
                  isOpen ? "border-red-500/50 shadow-lg shadow-red-900/20" : "border-gray-700/50"
                } rounded-2xl overflow-hidden transition-all duration-300`}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/50"
                  onClick={() => toggleSection(sec.key)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-700/50 flex items-center justify-center text-red-400">
                      {sec.key === "pricing_investment" ? (
                        <IndianRupee className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">
                        {idx + 1}. {sec.label}
                      </h3>
                      <p className="text-xs text-gray-400">{sec.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {isOptional && (
                      <label className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className="text-xs text-gray-400 font-medium uppercase">Include</span>
                        <input
                          type="checkbox"
                          checked={toggles[sec.key]}
                          onChange={(e) =>
                            setToggles((prev) => ({ ...prev, [sec.key]: e.target.checked }))
                          }
                          className="w-4 h-4 accent-red-500"
                        />
                      </label>
                    )}
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </div>

                {/* Body */}
                {isOpen && (
                  <div
                    className={`p-4 border-t border-gray-700/50 bg-gray-900/30 ${
                      !isEnabled ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    {sec.type === "textarea" || sec.type === "readonly" ? (
                      <textarea
                        value={sections[sec.key] || ""}
                        onChange={(e) => handleSectionChange(sec.key, e.target.value)}
                        readOnly={sec.type === "readonly"}
                        className="w-full h-48 bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-y text-sm leading-relaxed"
                        placeholder="Enter content here..."
                      />
                    ) : sec.type === "cover_fields" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Client Name
                          </label>
                          <input
                            type="text"
                            value={clientData?.client_name || getClientDisplayName(clientData)}
                            readOnly
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-gray-400 cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Organization
                          </label>
                          <input
                            type="text"
                            value={
                              clientData?.company_name ||
                              clientData?.client_organization ||
                              getClientDisplayName(clientData)
                            }
                            readOnly
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-gray-400 cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Duration
                          </label>
                          <input
                            type="text"
                            value={sections[sec.key]?.duration || ""}
                            onChange={(e) =>
                              handleSectionChange(sec.key, {
                                ...sections[sec.key],
                                duration: e.target.value,
                              })
                            }
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 outline-none"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Proposal Date
                          </label>
                          <input
                            type="text"
                            value={sections[sec.key]?.proposal_date || ""}
                            onChange={(e) =>
                              handleSectionChange(sec.key, {
                                ...sections[sec.key],
                                proposal_date: e.target.value,
                              })
                            }
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 outline-none"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Proposal Validity
                          </label>
                          <input
                            type="text"
                            value={sections[sec.key]?.proposal_validity || ""}
                            onChange={(e) =>
                              handleSectionChange(sec.key, {
                                ...sections[sec.key],
                                proposal_validity: e.target.value,
                              })
                            }
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 outline-none"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Prepared By
                          </label>
                          <input
                            type="text"
                            value={sections[sec.key]?.prepared_by || ""}
                            onChange={(e) =>
                              handleSectionChange(sec.key, {
                                ...sections[sec.key],
                                prepared_by: e.target.value,
                              })
                            }
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 outline-none"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Website
                          </label>
                          <input
                            type="text"
                            value={sections[sec.key]?.website || ""}
                            onChange={(e) =>
                              handleSectionChange(sec.key, {
                                ...sections[sec.key],
                                website: e.target.value,
                              })
                            }
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 outline-none"
                          />
                        </div>
                      </div>
                    ) : sec.type === "pricing_table" ? (
                      <ProposalPricingSection
                        pricingMode={pricingMode}
                        setPricingMode={setPricingMode}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        dropdownOpen={dropdownOpen}
                        setDropdownOpen={setDropdownOpen}
                        filteredPlans={filteredPlans}
                        handlePlanSelect={handlePlanSelect}
                        activeCalculator={activeCalculator}
                        setActiveCalculator={setActiveCalculator}
                        handleServiceAdded={handleServiceAdded}
                        handleServiceDeleted={handleServiceDeleted}
                        pricingTable={pricingTable}
                        isAdmin={isAdmin}
                        removePricingRow={removePricingRow}
                        openDiscountModal={openDiscountModal}
                        showDiscountModal={showDiscountModal}
                        setShowDiscountModal={setShowDiscountModal}
                        handleApplyDiscount={handleApplyDiscount}
                        formDataDis={formDataDis}
                        handleChangeDis={handleChangeDis}
                        discountValue={discountValue}
                        discountSettings={discountSettings}
                        getBillableTotals={getBillableTotals}
                        getDiscountAmount={getDiscountAmount}
                      />
                    ) : sec.type === "combined_notes_tc" ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Left: Available Predefined Notes */}
                          <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 h-64 overflow-y-auto">
                            <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
                              Available Notes
                            </h4>
                            <div className="space-y-2">
                              {predefinedNotes.map((note) => (
                                <div
                                  key={note.id}
                                  className="flex items-center justify-between p-2 hover:bg-gray-800 rounded-lg group"
                                >
                                  <span
                                    className="text-sm text-gray-400 truncate w-3/4"
                                    title={note.note_text}
                                  >
                                    {note.note_text}
                                  </span>
                                  <button
                                    onClick={() => handleAddPredefinedNote(note)}
                                    className="text-red-400 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Right: Selected Notes & Custom Input */}
                          <div className="space-y-4 h-64 flex flex-col">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={manualNote}
                                onChange={(e) => setManualNote(e.target.value)}
                                className="flex-1 bg-gray-900/50 border border-gray-700 rounded-lg p-2 text-sm text-white focus:border-red-500 outline-none"
                                placeholder="Add custom note..."
                              />
                              <button
                                onClick={handleAddManualNote}
                                className="px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg transition text-sm font-semibold"
                              >
                                Add
                              </button>
                            </div>
                            <div className="flex-1 bg-gray-900/50 p-4 rounded-xl border border-gray-700 overflow-y-auto">
                              <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
                                Selected Notes
                              </h4>
                              <div className="space-y-2">
                                {(sections["notes_selection"] || []).map((n, i) => (
                                  <div
                                    key={i}
                                    className="flex items-start justify-between gap-2 p-2 bg-gray-800 rounded-lg"
                                  >
                                    <span className="text-sm text-gray-300">{n.note_name}</span>
                                    <button
                                      onClick={() => removeNote(i)}
                                      className="text-red-400 p-1 hover:bg-red-400/20 rounded transition mt-0.5"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                                {(!sections["notes_selection"] ||
                                  sections["notes_selection"].length === 0) && (
                                  <p className="text-sm text-gray-500 italic text-center mt-4">
                                    No notes selected.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : sec.type === "approval" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-300 border-b border-gray-700 pb-2">
                            Our Signature
                          </h4>
                          <input
                            type="text"
                            placeholder="Signatory Name"
                            value={sections[sec.key]?.our_signatory_name || ""}
                            onChange={(e) =>
                              handleSectionChange(sec.key, {
                                ...sections[sec.key],
                                our_signatory_name: e.target.value,
                              })
                            }
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white"
                          />
                          <input
                            type="text"
                            placeholder="Designation"
                            value={sections[sec.key]?.our_signatory_designation || ""}
                            onChange={(e) =>
                              handleSectionChange(sec.key, {
                                ...sections[sec.key],
                                our_signatory_designation: e.target.value,
                              })
                            }
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white"
                          />
                        </div>
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-300 border-b border-gray-700 pb-2">
                            Client Approval
                          </h4>
                          <input
                            type="text"
                            placeholder="Client Name"
                            value={sections[sec.key]?.client_signatory_name || ""}
                            onChange={(e) =>
                              handleSectionChange(sec.key, {
                                ...sections[sec.key],
                                client_signatory_name: e.target.value,
                              })
                            }
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white"
                          />
                          <input
                            type="text"
                            placeholder="Designation"
                            value={sections[sec.key]?.client_signatory_designation || ""}
                            onChange={(e) =>
                              handleSectionChange(sec.key, {
                                ...sections[sec.key],
                                client_signatory_designation: e.target.value,
                              })
                            }
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white"
                          />
                        </div>
                      </div>
                    ) : sec.key === "timeline" ? (
                      <ProposalMilestonesTable
                        milestones={milestones}
                        onAddMilestone={addMilestoneRow}
                        onRemoveMilestone={removeMilestoneRow}
                        onMilestoneChange={handleMilestoneChange}
                      />
                    ) : sec.key === "scope_of_work" ? (
                      <div className="overflow-x-auto bg-gray-900/40 rounded-xl border border-gray-800/50">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-gray-700/50 bg-gray-800/30 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                              <th className="p-3">Service Category</th>
                              <th className="p-3">Service Name</th>
                              <th className="p-3 w-24 text-center">Quantity</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pricingTable.length === 0 ? (
                              <tr>
                                <td colSpan="3" className="p-8 text-center text-gray-500 text-sm">
                                  No deliverables added yet. Please select a plan or custom services.
                                </td>
                              </tr>
                            ) : (
                              pricingTable.map((row, i) => (
                                <tr
                                  key={`sow-${i}`}
                                  className="border-b border-gray-800/50 hover:bg-gray-800/20 transition"
                                >
                                  <td className="p-3 text-gray-300 font-medium">
                                    {row.category_name || "-"}
                                    {row.editing_type_name &&
                                    row.editing_type_name !== "null" &&
                                    row.editing_type_name !== "N/A" &&
                                    row.editing_type_name !== "undefined" &&
                                    row.editing_type_name.toLowerCase() !== "proposal item" &&
                                    row.editing_type_name.trim().toLowerCase() !==
                                      (row.category_name || "").trim().toLowerCase() &&
                                    row.editing_type_name.trim().toLowerCase() !==
                                      (row.service_name || row.service || "").trim().toLowerCase()
                                      ? ` (${row.editing_type_name})`
                                      : ""}
                                  </td>
                                  <td className="p-3 text-gray-300">
                                    {row.service_name || row.service || "-"}
                                  </td>
                                  <td className="p-3 text-center text-gray-300">
                                    {row.quantity || "-"}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-gray-500 italic text-sm">
                        Table layout placeholder — Use text for now or expand this component.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Bar (Sticky Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900/90 backdrop-blur-md border-t border-gray-800 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
            Status:{" "}
            <span className="text-red-400">{proposalId ? "Draft / Saved" : "Unsaved"}</span>
          </div>
          <div className="flex gap-3">
            {!isReadOnly && (
              <>
                <button
                  onClick={() => saveProposal(false)}
                  disabled={loading}
                  className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 rounded-xl font-semibold transition"
                >
                  {loading ? "Saving..." : "Save Draft"}
                </button>
                <button
                  onClick={() => saveProposal(true)}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-xl font-semibold shadow-lg shadow-red-900/20 transition"
                >
                  <Save className="w-4 h-4" /> Save & Generate PDF
                </button>
              </>
            )}
            {isReadOnly && (
              <button
                onClick={() => downloadPdf(proposalId)}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white rounded-xl font-semibold shadow-lg transition"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Send Modal */}
      <ProposalSendModal
        show={showSendModal}
        onClose={() => setShowSendModal(false)}
        clientDisplayName={getClientDisplayName(clientData)}
        sendChannel={sendChannel}
        setSendChannel={setSendChannel}
        onSend={executeSend}
        sending={sending}
      />
    </div>
  );
}
