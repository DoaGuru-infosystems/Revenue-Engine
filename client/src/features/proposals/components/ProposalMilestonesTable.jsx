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
      <div className="overflow-x-auto bg-gray-900/40 rounded-xl border border-gray-800/50">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-700/50 bg-gray-800/30 text-gray-400 uppercase tracking-wider text-[10px] font-bold">
              <th className="p-3">Milestone Title</th>
              <th className="p-3 w-48">Duration</th>
              <th className="p-3">Deliverables / Details</th>
              <th className="p-3 w-16 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {milestones.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500 text-sm">
                  No milestones added yet. Click &apos;Add Milestone&apos; to begin.
                </td>
              </tr>
            ) : (
              milestones.map((row, i) => (
                <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition group">
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.title || ""}
                      onChange={(e) => onMilestoneChange(i, "title", e.target.value)}
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-2 text-white text-sm focus:border-red-500 outline-none"
                      placeholder="e.g. Month 1: Setup"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.duration || ""}
                      onChange={(e) => onMilestoneChange(i, "duration", e.target.value)}
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-2 text-white text-sm focus:border-red-500 outline-none"
                      placeholder="e.g. Days 1-7 or Week 1"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.deliverables || ""}
                      onChange={(e) => onMilestoneChange(i, "deliverables", e.target.value)}
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-2 text-white text-sm focus:border-red-500 outline-none"
                      placeholder="e.g. Initial setup, keyword research"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => onRemoveMilestone(i)}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition"
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
        className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 font-semibold py-2"
      >
        <Plus className="w-4 h-4" /> Add Milestone
      </button>
    </div>
  );
}
