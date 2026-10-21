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
  Eye,
} from "lucide-react";
import { PROPOSAL_SECTIONS, PROPOSAL_TYPES, BILLING_TYPES } from "../../../config/proposalDefaults";
import { useProposalBuilder, getClientDisplayName, hasRequiredPricing } from "../hooks/useProposalBuilder";
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
    proposalStatus,
    isApproved,
    viewProposal,
    saveProposal,
    downloadPdf,
    sendToClient,
    executeSend,
    markAsApproved,
    getBillableTotals,
    getDiscountAmount,
  } = useProposalBuilder();

  return (
    <div className="touch-form h-dvh overflow-hidden flex flex-col bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <header className="shrink-0 z-30 border-b border-gray-200 dark:border-gray-800 bg-slate-50/95 dark:bg-gray-900/95 backdrop-blur-md px-5 sm:px-6 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
            <button
              type="button"
              onClick={() => navigate(isAdmin ? "/admin/dashboard" : "/BD/dashboard")}
              className="min-h-11 min-w-11 flex items-center justify-center bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl transition shadow-sm shrink-0 touch-manipulation"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent truncate">
                {proposalId ? "Edit Proposal" : "Create New Proposal"}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm truncate">
                Client: {clientData ? getClientDisplayName(clientData) : "Loading..."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {proposalId && (
              <>
                <button
                  type="button"
                  onClick={() => viewProposal()}
                  className="min-h-11 flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-600/20 dark:hover:bg-blue-600/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 rounded-xl transition text-xs sm:text-sm font-semibold shadow-sm touch-manipulation"
                  title="Preview client proposal (Public View)"
                >
                  <Eye className="w-4 h-4 shrink-0" />
                  <span>View</span>
                </button>
                <button
                  type="button"
                  onClick={() => sendToClient()}
                  className="min-h-11 flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-600/20 dark:hover:bg-red-600/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded-xl transition text-xs sm:text-sm font-semibold shadow-sm touch-manipulation"
                >
                  <Send className="w-4 h-4 shrink-0" />
                  <span>Send</span>
                </button>
                {isApproved ? (
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-xs sm:text-sm font-semibold shadow-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Approved</span>
                  </div>
                ) : (
                  isAdmin && (
                    <button
                      type="button"
                      onClick={() => markAsApproved()}
                      className="min-h-11 flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-green-50 hover:bg-green-100 dark:bg-green-600/20 dark:hover:bg-green-600/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30 rounded-xl transition text-xs sm:text-sm font-semibold shadow-sm touch-manipulation"
                    >
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>Approve</span>
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={() => downloadPdf()}
                  className="min-h-11 flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-yellow-600/20 dark:hover:bg-yellow-600/30 text-amber-700 dark:text-yellow-400 border border-amber-200 dark:border-yellow-500/30 rounded-xl transition text-xs sm:text-sm font-semibold shadow-sm touch-manipulation"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>PDF</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
      <div className="p-3 sm:p-5 md:p-6 pb-6">
      {isReadOnly && (
        <div className="max-w-5xl mx-auto mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 shadow-sm">
          <CheckCircle className="w-6 h-6 text-red-500 dark:text-red-400 shrink-0" />
          <div>
            <h4 className="text-red-600 dark:text-red-400 font-bold text-sm">Editing Locked</h4>
            <p className="text-red-500 dark:text-red-300 text-xs mt-0.5">
              An invoice has been generated for this proposal. Further edits are disabled.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Basic Info Setup */}
        <div className="bg-white dark:bg-gray-800/40 backdrop-blur-xl border border-gray-200 dark:border-gray-700/50 rounded-2xl p-4 sm:p-6 shadow-sm">
          <h2 className="text-base sm:text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-red-500 dark:text-red-400" /> Setup Proposal
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                Proposal Category
              </label>
              <select
                value={proposalType}
                onChange={(e) => setProposalType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 sm:p-3 text-gray-900 dark:text-white text-sm focus:border-red-500 outline-none transition"
              >
                {PROPOSAL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                Billing Type
              </label>
              <select
                value={billingType}
                onChange={(e) => setBillingType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 sm:p-3 text-gray-900 dark:text-white text-sm focus:border-red-500 outline-none transition"
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
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={billingStartDate}
                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                    onChange={(e) => setBillingStartDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 sm:p-3 text-gray-900 dark:text-white text-sm focus:border-red-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={billingEndDate}
                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                    onChange={(e) => setBillingEndDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 sm:p-3 text-gray-900 dark:text-white text-sm focus:border-red-500 outline-none transition"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* 13 Sections */}
        <div className="space-y-3 sm:space-y-4">
          {PROPOSAL_SECTIONS.map((sec, idx) => {
            const isOpen = openSections[sec.key];
            const isOptional = sec.optional;
            const isEnabled = !isOptional || toggles[sec.key];

            return (
              <div
                key={sec.key}
                className={`bg-white dark:bg-gray-800/30 backdrop-blur-xl border ${
                  isOpen
                    ? "border-red-400 dark:border-red-500/50 shadow-md ring-1 ring-red-400/20 overflow-visible"
                    : "border-gray-200 dark:border-gray-700/50 overflow-hidden"
                } rounded-2xl transition-all duration-300 shadow-sm`}
              >
                {/* Header */}
                <div
                  className="flex items-start sm:items-center justify-between gap-2 p-3.5 sm:p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  onClick={() => toggleSection(sec.key)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center text-red-500 dark:text-red-400 shrink-0">
                      {sec.key === "pricing_investment" ? (
                        <IndianRupee className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white leading-snug">
                        {idx + 1}. {sec.label}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 sm:line-clamp-1">{sec.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    {isOptional && (
                      <label className="flex items-center gap-1.5 sm:gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">Include</span>
                        <input
                          type="checkbox"
                          checked={toggles[sec.key]}
                          onChange={(e) =>
                            setToggles((prev) => ({ ...prev, [sec.key]: e.target.checked }))
                          }
                          className="w-5 h-5 accent-red-500 cursor-pointer touch-manipulation"
                        />
                      </label>
                    )}
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                </div>

                {/* Body */}
                {isOpen && (
                  <div
                    className={`p-3.5 sm:p-5 border-t border-gray-150 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/30 ${
                      !isEnabled ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    {sec.type === "textarea" || sec.type === "readonly" ? (
                      <textarea
                        value={sections[sec.key] || ""}
                        onChange={(e) => handleSectionChange(sec.key, e.target.value)}
                        readOnly={sec.type === "readonly"}
                        className="w-full h-40 sm:h-48 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4 text-gray-900 dark:text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-y text-sm leading-relaxed"
                        placeholder="Enter content here..."
                      />
                    ) : sec.type === "cover_fields" ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2 sm:space-y-3">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Client Name
                          </label>
                          <input
                            type="text"
                            value={clientData?.client_name || getClientDisplayName(clientData)}
                            readOnly
                            className="w-full bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 sm:p-3 text-gray-500 dark:text-gray-400 cursor-not-allowed text-sm"
                          />
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
                            className="w-full bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 sm:p-3 text-gray-500 dark:text-gray-400 cursor-not-allowed text-sm"
                          />
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
                            className="w-full bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 sm:p-3 text-gray-900 dark:text-white focus:border-red-500 outline-none text-sm"
                          />
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
                            className="w-full bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 sm:p-3 text-gray-900 dark:text-white focus:border-red-500 outline-none text-sm"
                          />
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
                            className="w-full bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 sm:p-3 text-gray-900 dark:text-white focus:border-red-500 outline-none text-sm"
                          />
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
                            className="w-full bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 sm:p-3 text-gray-900 dark:text-white focus:border-red-500 outline-none text-sm"
                          />
                        </div>
                        <div className="space-y-2 sm:space-y-3 sm:col-span-2">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
                            className="w-full bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 sm:p-3 text-gray-900 dark:text-white focus:border-red-500 outline-none text-sm"
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
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                          {/* Left: Available Predefined Notes */}
                          <div className="bg-white dark:bg-gray-900/50 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 h-64 overflow-y-auto">
                            <h4 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
                              Available Notes
                            </h4>
                            <div className="space-y-2">
                              {predefinedNotes.map((note) => (
                                <div
                                  key={note.id}
                                  className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg group transition"
                                >
                                  <span
                                    className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate w-3/4"
                                    title={note.note_text}
                                  >
                                    {note.note_text}
                                  </span>
                                  <button
                                    onClick={() => handleAddPredefinedNote(note)}
                                    className="text-red-500 dark:text-red-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Right: Selected Notes & Custom Input */}
                          <div className="space-y-3 sm:space-y-4 h-64 flex flex-col">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={manualNote}
                                onChange={(e) => setManualNote(e.target.value)}
                                className="flex-1 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs sm:text-sm text-gray-900 dark:text-white focus:border-red-500 outline-none"
                                placeholder="Add custom note..."
                              />
                              <button
                                onClick={handleAddManualNote}
                                className="px-3 sm:px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg transition text-xs sm:text-sm font-semibold"
                              >
                                Add
                              </button>
                            </div>
                            <div className="flex-1 bg-white dark:bg-gray-900/50 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 overflow-y-auto">
                              <h4 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
                                Selected Notes
                              </h4>
                              <div className="space-y-2">
                                {(sections["notes_selection"] || []).map((n, i) => (
                                  <div
                                    key={i}
                                    className="flex items-start justify-between gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-150 dark:border-transparent"
                                  >
                                    <span className="text-xs sm:text-sm text-gray-800 dark:text-gray-300">{n.note_name}</span>
                                    <button
                                      onClick={() => removeNote(i)}
                                      className="text-red-500 dark:text-red-400 p-1 hover:bg-red-400/20 rounded transition mt-0.5 shrink-0"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                                {(!sections["notes_selection"] ||
                                  sections["notes_selection"].length === 0) && (
                                  <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 italic text-center mt-4">
                                    No notes selected.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : sec.type === "approval" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2 sm:space-y-3">
                          <h4 className="font-semibold text-gray-800 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2 text-sm sm:text-base">
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
                            className="w-full bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 sm:p-3 text-gray-900 dark:text-white text-sm focus:border-red-500 outline-none"
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
                            className="w-full bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 sm:p-3 text-gray-900 dark:text-white text-sm focus:border-red-500 outline-none"
                          />
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                          <h4 className="font-semibold text-gray-800 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2 text-sm sm:text-base">
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
                            className="w-full bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 sm:p-3 text-gray-900 dark:text-white text-sm focus:border-red-500 outline-none"
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
                            className="w-full bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 sm:p-3 text-gray-900 dark:text-white text-sm focus:border-red-500 outline-none"
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
                      <div className="overflow-x-auto bg-white dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-800/50 shadow-sm">
                        <table className="w-full text-left text-sm min-w-[480px]">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                              <th className="p-3">Service Category</th>
                              <th className="p-3">Service Name</th>
                              <th className="p-3 w-24 text-center">Quantity</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pricingTable.length === 0 ? (
                              <tr>
                                <td colSpan="3" className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                                  No deliverables added yet. Please select a plan or custom services.
                                </td>
                              </tr>
                            ) : (
                              pricingTable.map((row, i) => (
                                <tr
                                  key={`sow-${i}`}
                                  className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition"
                                >
                                  <td className="p-3 text-gray-800 dark:text-gray-300 font-medium">
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
                                  <td className="p-3 text-gray-700 dark:text-gray-300">
                                    {row.service_name || row.service || "-"}
                                  </td>
                                  <td className="p-3 text-center text-gray-700 dark:text-gray-300">
                                    {row.quantity || "-"}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-gray-400 dark:text-gray-500 italic text-sm">
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
      </div>
      </div>

      {/* Action bar stays pinned; it does not scroll with the form */}
      <div className="shrink-0 z-40 border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-[0_-8px_24px_rgba(0,0,0,0.06)] px-3 py-3 sm:px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 w-full sm:w-auto justify-between sm:justify-start">
            <span>Status:</span>
            <span className="text-orange-500 dark:text-orange-400 font-semibold capitalize bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-200 dark:border-orange-500/20">
              {proposalStatus ? proposalStatus.replace(/_/g, " ") : (proposalId ? "Draft / Saved" : "Unsaved")}
            </span>
          </div>
          <div className="flex flex-col items-stretch sm:items-end gap-1.5 w-full sm:w-auto">
            {!isReadOnly && !hasRequiredPricing(pricingTable) && (
              <p className="text-[11px] sm:text-xs text-amber-600 dark:text-amber-400 text-right">
                Pricing is required. Add a service or ads amount before saving.
              </p>
            )}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            {!isReadOnly && (
              <>
                <button
                  onClick={() => saveProposal(false)}
                  disabled={loading}
                  className="flex-1 sm:flex-initial px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-700 rounded-xl font-semibold transition text-xs sm:text-sm text-center disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Draft"}
                </button>
                <button
                  onClick={() => saveProposal(true)}
                  disabled={loading}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-xl font-semibold shadow-md shadow-red-900/20 transition text-xs sm:text-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4 shrink-0" />
                  <span>{loading ? "Saving..." : "Save & Generate PDF"}</span>
                </button>
              </>
            )}
            {isReadOnly && (
              <button
                onClick={() => downloadPdf(proposalId)}
                disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white rounded-xl font-semibold shadow-lg transition text-xs sm:text-sm"
              >
                <Download className="w-4 h-4 shrink-0" /> Download PDF
              </button>
            )}
          </div>
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
