import React, { useEffect, useMemo, useState } from "react";
import { Check, Plus, Search, Trash2, Users, UserPlus } from "lucide-react";
import Swal from "sweetalert2";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearUser } from "../../../redux/user/userSlice";
import API_BASE_URL from "../../../config/apiBaseUrl";

const CreateTeam = () => {
  const baseURL = API_BASE_URL;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Employees
  const [employees, setEmployees] = useState([]);
  const [empQuery, setEmpQuery] = useState("");

  // Create team form
  const [teamName, setTeamName] = useState("");
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);

  // Teams + selection
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState([]);
  const [modifyingTeam, setModifyingTeam] = useState(false);

  // API endpoints mapped to routes
  const endpoints = {
    listEmployees: `${baseURL}/auth/api/re_calculator/retrieveUser`,
    listTeams: `${baseURL}/auth/api/re_calculator/retrieveTeam`,
    createTeam: `${baseURL}/auth/api/re_calculator/createTeam`,
    getTeamMembers: (id) =>
      `${baseURL}/auth/api/re_calculator/retrieveTeamById/${id}`,
    addMembers: (id) =>
      `${baseURL}/auth/api/re_calculator/addMembersToTeam/${id}/members`,
    removeMember: (teamId, memberId) =>
      `${baseURL}/auth/api/re_calculator/removeMemberFromTeam/${teamId}/members/${memberId}`,
    deleteTeam: (id) => `${baseURL}/auth/api/re_calculator/deleteTeam/${id}`,
  };

  const headers = React.useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const toArray = (payload) => {
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload)) return payload;
    return [];
  };

  const filteredEmployees = useMemo(() => {
    const list = Array.isArray(employees) ? employees : [];
    if (!empQuery.trim()) return list;
    const q = empQuery.toLowerCase();
    return list.filter(
      (e) =>
        e?.employee_name?.toLowerCase().includes(q) ||
        e?.employee_email?.toLowerCase().includes(q) ||
        String(e?.id).includes(q)
    );
  }, [empQuery, employees]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [empRes, teamRes] = await Promise.allSettled([
        axios.get(endpoints.listEmployees, { headers }),
        axios.get(endpoints.listTeams, { headers }),
      ]);

      if (empRes.status === "fulfilled") {
        setEmployees(toArray(empRes.value?.data));
      } else if (empRes.reason?.response?.status === 404) {
        setEmployees([]);
      } else {
        throw empRes.reason;
      }

      if (teamRes.status === "fulfilled") {
        setTeams(toArray(teamRes.value?.data));
      } else if (teamRes.reason?.response?.status === 404) {
        setTeams([]);
      } else {
        throw teamRes.reason;
      }
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Failed to load employees/teams.", "error");
      if (e.response && e.response.status === 401) {
        Swal.fire({
          title: "Session Expired",
          text: "Please login again.",
          icon: "warning",
          confirmButtonText: "OK",
        }).then(() => {
          dispatch(clearUser());
          localStorage.removeItem("token");
          navigate("/");
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTeamDetails = async (teamId) => {
    if (!teamId) return;
    setModifyingTeam(true);
    try {
      const res = await axios.get(endpoints.getTeamMembers(teamId));
      const payload = res.data?.data || res.data || {};
      const members = payload.members || [];
      setSelectedTeamMembers(members);
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Failed to load team members.", "error");
    } finally {
      setModifyingTeam(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (selectedTeamId) loadTeamDetails(selectedTeamId);
  }, [selectedTeamId]);

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      Swal.fire("Validation", "Please enter a team name.", "warning");
      return;
    }
    if (!selectedEmpIds.length) {
      Swal.fire("Validation", "Select at least one employee.", "warning");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: teamName.trim(),
        member_ids: selectedEmpIds,
      };
      const res = await axios.post(endpoints.createTeam, payload);
      const created = res.data?.data || res.data;
      Swal.fire("Success", "Team created successfully.", "success");

      setTeamName("");
      setSelectedEmpIds([]);
      setEmpQuery("");
      await loadAll();
      if (created?.id) setSelectedTeamId(created.id);
    } catch (e) {
      console.error(e);
      Swal.fire(
        "Error",
        e?.response?.data?.message || "Failed to create team.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleSelect = (empId) => {
    setSelectedEmpIds((prev) =>
      prev.includes(empId)
        ? prev.filter((id) => id !== empId)
        : [...prev, empId]
    );
  };

  const addMembersToTeam = async () => {
    if (!selectedTeamId) {
      Swal.fire("Validation", "Select a team first.", "warning");
      return;
    }
    if (!selectedEmpIds.length) {
      Swal.fire(
        "Validation",
        "Select at least one employee to add.",
        "warning"
      );
      return;
    }
    setModifyingTeam(true);
    try {
      await axios.post(endpoints.addMembers(selectedTeamId), {
        member_ids: selectedEmpIds,
      });
      Swal.fire("Success", "Members added to the team.", "success");
      setSelectedEmpIds([]);
      await loadTeamDetails(selectedTeamId);
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Failed to add members.", "error");
    } finally {
      setModifyingTeam(false);
    }
  };

  const removeMember = async (memberId) => {
    const confirm = await Swal.fire({
      title: "Remove member?",
      text: "This will remove the member from the team.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remove",
    });
    if (!confirm.isConfirmed) return;

    setModifyingTeam(true);
    try {
      await axios.delete(endpoints.removeMember(selectedTeamId, memberId));
      Swal.fire("Removed", "Member removed from the team.", "success");
      await loadTeamDetails(selectedTeamId);
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Failed to remove member.", "error");
    } finally {
      setModifyingTeam(false);
    }
  };

  const deleteTeam = async (teamId) => {
    const confirm = await Swal.fire({
      title: "Delete team?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });
    if (!confirm.isConfirmed) return;

    setModifyingTeam(true);
    try {
      await axios.delete(endpoints.deleteTeam(teamId));
      Swal.fire("Deleted", "Team deleted successfully.", "success");
      if (selectedTeamId === teamId) {
        setSelectedTeamId(null);
        setSelectedTeamMembers([]);
      }
      await loadAll();
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Failed to delete team.", "error");
    } finally {
      setModifyingTeam(false);
    }
  };

  return (
    <div className="text-gray-900 dark:text-gray-100 transition-colors">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" /> Create & Manage Teams
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Create multiple teams, add/remove members, and view team compositions
          instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/90 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-2.5">
              <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">Create a new team</h3>
            </div>

            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
              Team Name *
            </label>
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Graphic Ninjas"
              className="w-full rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
            />

            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-400 uppercase tracking-wider">
                  Select Employees
                </label>
                <div className="text-xs font-bold text-orange-600 dark:text-orange-400">
                  {selectedEmpIds.length} selected
                </div>
              </div>

              <div className="relative mb-2">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  value={empQuery}
                  onChange={(e) => setEmpQuery(e.target.value)}
                  placeholder="Search by name/email/id"
                  className="w-full rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                />
              </div>

              <div className="max-h-56 overflow-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <div className="p-4 text-xs text-gray-400 text-center">
                    Loading employees…
                  </div>
                ) : filteredEmployees.length ? (
                  filteredEmployees.map((emp) => {
                    const checked = selectedEmpIds.includes(emp.id);
                    return (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => toggleSelect(emp.id)}
                        className={`w-full flex items-center justify-between text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors ${
                          checked ? "bg-orange-50 dark:bg-orange-500/10 text-orange-900 dark:text-orange-300 font-medium" : "text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-sm">{emp.employee_name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {emp.id}{" "}
                            {emp.employee_email
                              ? `• ${emp.employee_email}`
                              : ""}
                          </div>
                        </div>
                        {checked ? (
                          <Check className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 ml-2" />
                        ) : null}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-4 text-xs text-gray-400 text-center">
                    No employees found.
                  </div>
                )}
              </div>

              <button
                onClick={handleCreateTeam}
                disabled={saving}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold text-sm shadow-md shadow-orange-500/20 transition disabled:opacity-60"
              >
                <Plus className="w-4 h-4" />
                {saving ? "Creating…" : "Create Team"}
              </button>
            </div>
          </div>

          <div className="bg-white/90 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 sm:p-5 shadow-sm">
            <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" /> Add to Existing Team
            </h3>

            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
              Choose Destination Team
            </label>
            <select
              className="w-full rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
              value={selectedTeamId || ""}
              onChange={(e) =>
                setSelectedTeamId(Number(e.target.value) || null)
              }
            >
              <option value="">Select a team…</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (#{t.id})
                </option>
              ))}
            </select>

            <button
              onClick={addMembersToTeam}
              disabled={
                !selectedTeamId || !selectedEmpIds.length || modifyingTeam
              }
              className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold text-sm shadow-md shadow-red-500/20 transition disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              {modifyingTeam ? "Adding…" : "Add Selected to Team"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/90 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-2.5">
              <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">Existing Teams</h3>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {teams.length
                  ? `${teams.length} teams`
                  : "No teams created yet"}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {teams.map((t) => (
                <div
                  key={t.id}
                  className={`rounded-xl border ${
                    selectedTeamId === t.id
                      ? "border-orange-500 ring-2 ring-orange-500/20"
                      : "border-gray-200 dark:border-gray-700"
                  } bg-white dark:bg-gray-900 p-3.5 shadow-sm transition-all`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-sm text-gray-900 dark:text-white truncate">{t.name}</div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setSelectedTeamId(Number(t.id))}
                        className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => deleteTeam(t.id)}
                        className="text-xs px-2 py-1 rounded-lg bg-red-50 dark:bg-red-600/20 hover:bg-red-100 dark:hover:bg-red-600/40 text-red-600 dark:text-red-300 flex items-center gap-1 font-medium transition-colors"
                        title="Delete team"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1.5 font-mono">Team ID: #{t.id}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/90 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-2.5">
              <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                {selectedTeamId
                  ? `Team #${selectedTeamId} Members`
                  : "Select a team to view members"}
              </h3>
              {selectedTeamId ? (
                <button
                  onClick={() => loadTeamDetails(selectedTeamId)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium transition-colors"
                >
                  Refresh
                </button>
              ) : null}
            </div>

            {!selectedTeamId ? (
              <div className="text-center py-8 text-xs text-gray-400">
                Choose a team above to view and manage its assigned members.
              </div>
            ) : modifyingTeam ? (
              <div className="text-center py-8 text-xs text-gray-400">Loading members…</div>
            ) : selectedTeamMembers.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {selectedTeamMembers.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-3.5 flex items-start justify-between shadow-sm"
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <div className="font-bold text-sm text-gray-900 dark:text-white truncate">{m.employee_name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        ID: {m.id}{" "}
                        {m.employee_email ? `• ${m.employee_email}` : ""}
                      </div>
                    </div>
                    <button
                      className="p-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors shrink-0"
                      onClick={() => removeMember(m.id)}
                      title="Remove from team"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-gray-400">
                No members assigned to this team yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTeam;
