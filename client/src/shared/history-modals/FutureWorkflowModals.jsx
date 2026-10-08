import React from "react";
import { X, CheckCircle2, CalendarDays, Loader2 } from "lucide-react";

/**
 * FutureWorkflowModals:
 * Contains the 5 workflow modals planned for future development:
 * 1. Build Project Strategy Modal
 * 2. Send Strategy to Client Modal
 * 3. Client Strategy Decision Modal
 * 4. Assign Team Lead Modal
 * 5. Assign Task Owners Modal
 */
export default function FutureWorkflowModals({
  isAdmin,
  // 1. Build Strategy
  strategyModal,
  setStrategyModal,
  strategyTasks,
  setStrategyTasks,
  handleSaveStrategy,

  // 2. Send Strategy to Client
  sendStrategyModal,
  setSendStrategyModal,
  strategySendSuccess,
  setStrategySendSuccess,
  savedStrategy,
  selectedChannel,
  setSelectedChannel,
  handleSendStrategyToClient,

  // 3. Client Strategy Decision
  clientStrategyModal,
  setClientStrategyModal,
  clientDecision,
  setClientDecision,
  handleClientStrategyDecision,

  // 4. Assign Team Lead
  teamLeadModal,
  setTeamLeadModal,
  sfTeams,
  selectedTeam,
  setSelectedTeam,
  sfTeamLeads,
  setSfTeamLeads,
  selectedTeamLead,
  setSelectedTeamLead,
  fetchSFTeamLeads,
  handleAssignTeamLead,

  // 5. Assign Task Owners
  taskOwnersModal,
  setTaskOwnersModal,
  taskAssignments,
  setTaskAssignments,
  sfEmployees,
  handleSaveTaskOwners,

  // Shared
  workflowRemark,
  setWorkflowRemark,
  workflowLoading,
}) {
  if (!isAdmin) return null;

  return (
    <>
      {/* ── MODAL: Make Strategy ──────────────────────────────── */}
      { strategyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Build Project Strategy</h2>
              <button onClick={ () => setStrategyModal(false) } className="text-gray-400 hover:text-gray-600">
                <X size={ 20 } />
              </button>
            </div>
            { strategyTasks.map((task, idx) => (
              <div key={ idx } className="border border-gray-200 rounded-lg p-4 mb-3 relative">
                <button
                  onClick={ () => setStrategyTasks((prev) => prev.filter((_, i) => i !== idx)) }
                  className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                >
                  <X size={ 16 } />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Service Name *</label>
                    <input
                      type="text"
                      value={ task.service_name }
                      placeholder="e.g. SEO Audit"
                      onChange={ (e) =>
                        setStrategyTasks((prev) =>
                          prev.map((t, i) => (i === idx ? { ...t, service_name: e.target.value } : t))
                        )
                      }
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Deadline *</label>
                    <input
                      type="date"
                      value={ task.deadline }
                      onChange={ (e) =>
                        setStrategyTasks((prev) =>
                          prev.map((t, i) => (i === idx ? { ...t, deadline: e.target.value } : t))
                        )
                      }
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-gray-500 font-medium">Description</label>
                    <textarea
                      value={ task.description }
                      placeholder="What needs to be done..."
                      onChange={ (e) =>
                        setStrategyTasks((prev) =>
                          prev.map((t, i) => (i === idx ? { ...t, description: e.target.value } : t))
                        )
                      }
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                      rows={ 2 }
                    />
                  </div>
                </div>
              </div>
            )) }
            <button
              onClick={ () =>
                setStrategyTasks((prev) => [
                  ...prev,
                  { service_name: "", description: "", deadline: "" },
                ])
              }
              className="w-full py-2 rounded-lg border-2 border-dashed border-orange-300 text-orange-500 text-sm font-medium hover:border-orange-400 hover:bg-orange-50 mb-4"
            >
              + Add Service
            </button>
            <button
              onClick={ handleSaveStrategy }
              disabled={ workflowLoading }
              className="w-full py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              { workflowLoading && <Loader2 size={ 16 } className="animate-spin" /> }
              Save Strategy
            </button>
          </div>
        </div>
      ) }

      {/* ── MODAL: Send Strategy to Client ───────────────────── */}
      { sendStrategyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Send Strategy to Client</h2>
              <button
                onClick={ () => {
                  setSendStrategyModal(false);
                  setStrategySendSuccess(false);
                  setWorkflowRemark("");
                  setSelectedChannel("email");
                } }
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={ 20 } />
              </button>
            </div>

            { strategySendSuccess ? (
              <div className="flex flex-col items-center justify-center py-6">
                <CheckCircle2 size={ 48 } className="text-green-500 mb-3" />
                <p className="text-lg font-semibold text-gray-800 mb-1">Sent Successfully!</p>
                <p className="text-sm text-gray-500 mb-6">
                  Strategy has been sent to the client via{ " " }
                  { selectedChannel === "both"
                    ? "Email & WhatsApp"
                    : selectedChannel === "email"
                    ? "Email"
                    : "WhatsApp" }
                </p>
              </div>
            ) : (
              <>
                { savedStrategy.length > 0 && (
                  <div className="border border-gray-100 rounded-lg p-3 mb-4 bg-gray-50">
                    <p className="text-xs text-gray-500 font-medium mb-2">Strategy Tasks:</p>
                    { savedStrategy.map((t, i) => (
                      <div
                        key={ i }
                        className="flex justify-between text-sm text-gray-700 py-1 border-b border-gray-100 last:border-0"
                      >
                        <span>{ t.service_name }</span>
                        <span className="text-gray-400 text-xs">
                          { t.deadline ? t.deadline.split("T")[0] : "" }
                        </span>
                      </div>
                    )) }
                  </div>
                ) }
                <p className="text-sm text-gray-500 mb-3">Select how to send:</p>
                <div className="flex gap-3 mb-4">
                  { ["email", "whatsapp", "both"].map((ch) => (
                    <button
                      key={ ch }
                      onClick={ () => setSelectedChannel(ch) }
                      className={ `flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${
                        selectedChannel === ch
                          ? "bg-orange-500 text-white border-orange-500"
                          : "border-gray-300 text-gray-600 hover:border-orange-400"
                      }` }
                    >
                      { ch === "email"
                        ? "📧 Email"
                        : ch === "whatsapp"
                        ? "💬 WhatsApp"
                        : "📧+💬 Both" }
                    </button>
                  )) }
                </div>
                <textarea
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                  rows={ 2 }
                  placeholder="Add a remark (optional)"
                  value={ workflowRemark }
                  onChange={ (e) => setWorkflowRemark(e.target.value) }
                />
              </>
            ) }

            <div className="flex gap-2 mt-4">
              <button
                onClick={ handleSendStrategyToClient }
                disabled={ workflowLoading || strategySendSuccess }
                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                { workflowLoading && <Loader2 size={ 16 } className="animate-spin" /> }
                { strategySendSuccess ? "Sent" : "Send Now" }
              </button>
              { strategySendSuccess && (
                <button
                  onClick={ () => {
                    setStrategySendSuccess(false);
                    setWorkflowRemark("");
                    setSelectedChannel("email");
                  } }
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-red-500 to-amber-500 text-white font-semibold hover:opacity-90 flex items-center justify-center gap-2"
                >
                  🔄 Retry
                </button>
              ) }
            </div>
          </div>
        </div>
      ) }

      {/* ── MODAL: Client Strategy Decision ──────────────────── */}
      { clientStrategyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Client Strategy Response</h2>
              <button onClick={ () => setClientStrategyModal(false) } className="text-gray-400 hover:text-gray-600">
                <X size={ 20 } />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              { [
                { val: "approved", label: "✅ Approved", color: "border-green-400 bg-green-50 text-green-700" },
                { val: "rejected", label: "❌ Rejected", color: "border-red-400 bg-red-50 text-red-700" },
                { val: "changes", label: "🔄 Changes", color: "border-amber-400 bg-amber-50 text-amber-700" },
              ].map((opt) => (
                <button
                  key={ opt.val }
                  onClick={ () => setClientDecision(opt.val) }
                  className={ `p-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                    clientDecision === opt.val ? opt.color : "border-gray-200 text-gray-500"
                  }` }
                >
                  { opt.label }
                </button>
              )) }
            </div>
            <textarea
              className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
              rows={ 2 }
              placeholder="Add a remark (optional)"
              value={ workflowRemark }
              onChange={ (e) => setWorkflowRemark(e.target.value) }
            />
            <button
              onClick={ handleClientStrategyDecision }
              disabled={ workflowLoading }
              className="mt-4 w-full py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              { workflowLoading && <Loader2 size={ 16 } className="animate-spin" /> }
              Save Response
            </button>
          </div>
        </div>
      ) }

      {/* ── MODAL: Assign Team Lead ───────────────────────────── */}
      { teamLeadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Assign Team Lead</h2>
              <button onClick={ () => setTeamLeadModal(false) } className="text-gray-400 hover:text-gray-600">
                <X size={ 20 } />
              </button>
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-500 font-medium">Select Team</label>
              <select
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={ selectedTeam?.id || "" }
                onChange={ (e) => {
                  const t = sfTeams.find((x) => String(x.id) === e.target.value);
                  setSelectedTeam(t || null);
                  setSelectedTeamLead(null);
                  setSfTeamLeads([]);
                  if (t) fetchSFTeamLeads(t.id);
                } }
              >
                <option value="">-- Select Team --</option>
                { sfTeams.map((t) => (
                  <option key={ t.id } value={ t.id }>
                    { t.team_name }
                  </option>
                )) }
              </select>
            </div>
            { sfTeamLeads.length > 0 && (
              <div className="mb-4">
                <label className="text-xs text-gray-500 font-medium">Select Team Lead</label>
                <select
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  value={ selectedTeamLead?.id || "" }
                  onChange={ (e) => {
                    const lead = sfTeamLeads.find((x) => String(x.id) === e.target.value);
                    setSelectedTeamLead(lead || null);
                  } }
                >
                  <option value="">-- Select Team Lead --</option>
                  { sfTeamLeads.map((l) => (
                    <option key={ l.id } value={ l.id }>
                      { l.name } — { l.designation }
                    </option>
                  )) }
                </select>
              </div>
            ) }
            <textarea
              className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
              rows={ 2 }
              placeholder="Add a remark (optional)"
              value={ workflowRemark }
              onChange={ (e) => setWorkflowRemark(e.target.value) }
            />
            <button
              onClick={ handleAssignTeamLead }
              disabled={ workflowLoading }
              className="mt-4 w-full py-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              { workflowLoading && <Loader2 size={ 16 } className="animate-spin" /> }
              Assign Team Lead
            </button>
          </div>
        </div>
      ) }

      {/* ── MODAL: Assign Task Owners ─────────────────────────── */}
      { taskOwnersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Assign Task Owners</h2>
              <button onClick={ () => setTaskOwnersModal(false) } className="text-gray-400 hover:text-gray-600">
                <X size={ 20 } />
              </button>
            </div>
            { taskAssignments.map((task, idx) => (
              <div key={ idx } className="border border-gray-200 rounded-lg p-4 mb-3 bg-gray-50">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  <CalendarDays size={ 14 } className="inline mr-1 text-orange-500" />
                  { task.task_name }
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Assign To *</label>
                    <select
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      value={ task.assigned_to_id }
                      onChange={ (e) => {
                        const emp = sfEmployees.find((x) => String(x.id) === e.target.value);
                        setTaskAssignments((prev) =>
                          prev.map((t, i) =>
                            i === idx
                              ? {
                                  ...t,
                                  assigned_to_id: emp?.id || "",
                                  assigned_to_name: emp?.name || "",
                                  assigned_to_email: emp?.email || "",
                                }
                              : t
                          )
                        );
                      } }
                    >
                      <option value="">-- Select Employee --</option>
                      { sfEmployees.map((e) => (
                        <option key={ e.id } value={ e.id }>
                          { e.name } — { e.designation } ({ e.team })
                        </option>
                      )) }
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Deadline *</label>
                    <input
                      type="date"
                      value={ task.deadline }
                      onChange={ (e) =>
                        setTaskAssignments((prev) =>
                          prev.map((t, i) => (i === idx ? { ...t, deadline: e.target.value } : t))
                        )
                      }
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                </div>
              </div>
            )) }

            { taskAssignments.some((t) => t.deadline) && (
              <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-red-50">
                <p className="text-xs font-medium text-gray-500 mb-2">Assigned Deadlines:</p>
                <div className="flex flex-wrap gap-2">
                  { taskAssignments
                    .filter((t) => t.deadline && t.assigned_to_name)
                    .map((t, i) => (
                      <span
                        key={ i }
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium"
                      >
                        <CalendarDays size={ 12 } />
                        { t.task_name } — { t.assigned_to_name } — { t.deadline }
                      </span>
                    )) }
                </div>
              </div>
            ) }

            <button
              onClick={ handleSaveTaskOwners }
              disabled={ workflowLoading }
              className="mt-4 w-full py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              { workflowLoading && <Loader2 size={ 16 } className="animate-spin" /> }
              Save &amp; Assign All Tasks
            </button>
          </div>
        </div>
      ) }
    </>
  );
}
