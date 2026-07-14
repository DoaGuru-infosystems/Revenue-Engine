import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";

// ---- Team Picker Modal (no retrieveTeamById used) ----
export default function TeamPickerModal({
  open,
  onClose,
  baseURL,
  headers,
  onSelectTeam,
}) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setLoading(true);
        // Team list
        const res = await axios.get(
          `${baseURL}/auth/api/calculator/retrieveTeam`,
          { headers }
        );
        setTeams(res?.data?.data || []);
      } catch (e) {
        if (e?.response?.status === 404) {
          setTeams([]);
        } else {
          Swal.fire("Error", "Failed to load teams.", "error");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [open, baseURL, headers]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return teams;
    return teams.filter(
      (t) =>
        String(t.id).includes(s) ||
        String(t.name || "")
          .toLowerCase()
          .includes(s)
    );
  }, [q, teams]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
      <div className="relative bg-white p-5 rounded-lg w-[92%] max-w-lg">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-red-600 text-xl font-bold"
          aria-label="Close"
        >
          ×
        </button>

        <h3 className="text-lg font-semibold mb-3">Select a Team</h3>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search team by name or id"
          className="w-full border rounded px-3 py-2 mb-3"
        />

        {loading ? (
          <div className="text-sm text-gray-600">Loading teams…</div>
        ) : filtered.length ? (
          <div className="max-h-72 overflow-auto space-y-2">
            {filtered.map((t) => (
              <div
                key={t.id}
                className="border rounded p-3 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-gray-500">ID: {t.id}</div>
                </div>
                <button
                  className="px-3 py-1 rounded bg-orange-600 text-white hover:bg-orange-500"
                  onClick={() => onSelectTeam(t)}
                >
                  Select
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-600">No teams found.</div>
        )}
      </div>
    </div>
  );
}
