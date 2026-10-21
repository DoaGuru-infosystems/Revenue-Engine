import React from "react";
import { Plus, Trash2 } from "lucide-react";

export default function ProposalMilestonesTable({
  milestones,
  onAddMilestone,
  onRemoveMilestone,
  onMilestoneChange,
}) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto bg-white dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-800/50 shadow-sm">
        <table className="w-full text-left text-sm min-w-[550px]">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px] font-bold">
              <th className="p-3">Milestone Title</th>
              <th className="p-3 w-44 sm:w-48">Duration</th>
              <th className="p-3">Deliverables / Details</th>
              <th className="p-3 w-16 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {milestones.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-6 sm:p-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                  No milestones added yet. Click &apos;Add Milestone&apos; to begin.
                </td>
              </tr>
            ) : (
              milestones.map((row, i) => (
                <tr key={i} className="border-b border-gray-150 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition group">
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.title || ""}
                      onChange={(e) => onMilestoneChange(i, "title", e.target.value)}
                      className="w-full bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-gray-900 dark:text-white text-xs sm:text-sm focus:border-red-500 outline-none transition placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="e.g. Month 1: Setup"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.duration || ""}
                      onChange={(e) => onMilestoneChange(i, "duration", e.target.value)}
                      className="w-full bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-gray-900 dark:text-white text-xs sm:text-sm focus:border-red-500 outline-none transition placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="e.g. Days 1-7 or Week 1"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.deliverables || ""}
                      onChange={(e) => onMilestoneChange(i, "deliverables", e.target.value)}
                      className="w-full bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-gray-900 dark:text-white text-xs sm:text-sm focus:border-red-500 outline-none transition placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="e.g. Initial setup, keyword research"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => onRemoveMilestone(i)}
                      className="p-2 text-red-500 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      title="Delete milestone"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <button
        onClick={onAddMilestone}
        className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:text-red-500 font-semibold py-2 transition"
      >
        <Plus className="w-4 h-4" /> Add Milestone
      </button>
    </div>
  );
}
