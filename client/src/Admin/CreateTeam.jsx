import React, { useEffect, useMemo, useState } from "react";
import { Check, Plus, Search, Trash2, Users, UserPlus } from "lucide-react";
import Swal from "sweetalert2";
import axios from "axios";
import { useSelector } from "react-redux";
import API_BASE_URL from "../config/apiBaseUrl";

const CreateTeam = () => {
  // If your server is on a different base path, set VITE_API_BASE_URL accordingly.
  // e.g. https://revenueengine.siarasystems.com  (no trailing slash)
  const baseURL = API_BASE_URL;
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

  // ---- API endpoints mapped to YOUR routes ----
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
    // supports {data: []} or [] directly; anything else -> []
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload)) return payload;
    return [];
  };

  // --- Filters (use employee_email from your API)
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

  console.log(filteredEmployees);

  // --- Load employees & teams (404 -> treat as empty list, not an error popup)
  // const loadAll = async () => {
  //   setLoading(true);
  //   try {
  //     const [empRes, teamRes] = await Promise.allSettled([
  //       axios.get(endpoints.listEmployees),
  //       axios.get(endpoints.listTeams),
  //     ]);

  //     if (empRes.status === "fulfilled") {
  //       setEmployees(empRes.value?.data?.data || empRes.value?.data || []);
  //     } else if (empRes.reason?.response?.status === 404) {
  //       setEmployees([]);
  //     } else {
  //       throw empRes.reason;
  //     }

  //     if (teamRes.status === "fulfilled") {
  //       setTeams(teamRes.value?.data?.data || teamRes.value?.data || []);
  //     } else if (teamRes.reason?.response?.status === 404) {
  //       setTeams([]);
  //     } else {
  //       throw teamRes.reason;
  //     }
  //   } catch (e) {
  //     console.error(e);
  //     Swal.fire("Error", "Failed to load employees/teams.", "error");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

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
        // Token is invalid or expired
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

  console.log(employees);

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

  // --- Create a team
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

      // Reset form & refresh
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

  // --- Add members to existing team
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

  // --- Remove a member
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

  // --- Delete a whole team
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
    <div className="text-gray-100">
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6" /> Create & Manage Teams
        </h2>
        <p className="text-gray-400">
          Create multiple teams, add/remove members, and view team compositions
          instantly.
        </p>
      </div>

      {/* Grid: Left = Create / Add Members; Right = Teams & Members */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-800/40 border border-gray-700 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Create a new team</h3>
            </div>

            <label className="block text-sm text-gray-400 mb-1">
              Team Name
            </label>
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Graphic Ninjas"
              className="w-full rounded-xl bg-gray-900 border border-gray-700 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500"
            />

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-400">
                  Select Employees
                </label>
                <div className="text-xs text-gray-400">
                  {selectedEmpIds.length} selected
                </div>
              </div>

              <div className="relative mb-2">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
                <input
                  value={empQuery}
                  onChange={(e) => setEmpQuery(e.target.value)}
                  placeholder="Search by name/email/id"
                  className="w-full rounded-xl bg-gray-900 border border-gray-700 pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="max-h-56 overflow-auto rounded-xl border border-gray-700">
                {loading ? (
                  <div className="p-4 text-sm text-gray-400">
                    Loading employees…
                  </div>
                ) : filteredEmployees.length ? (
                  filteredEmployees.map((emp) => {
                    const checked = selectedEmpIds.includes(emp.id);
                    return (
                      <button
                        key={emp.id}
                        onClick={() => toggleSelect(emp.id)}
                        className={`w-full flex items-center justify-between text-left px-3 py-2 border-b border-gray-800 hover:bg-gray-800/40 ${
                          checked ? "bg-orange-500/10" : ""
                        }`}
                      >
                        <div>
                          <div className="font-medium">{emp.employee_name}</div>
                          <div className="text-xs text-gray-400">
                            ID: {emp.id}{" "}
                            {emp.employee_email
                              ? `• ${emp.employee_email}`
                              : ""}
                          </div>
                        </div>
                        {checked ? (
                          <Check className="w-4 h-4 text-orange-400" />
                        ) : null}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-4 text-sm text-gray-400">
                    No employees found.
                  </div>
                )}
              </div>

              <button
                onClick={handleCreateTeam}
                disabled={saving}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 transition disabled:opacity-60"
              >
                <Plus className="w-4 h-4" />
                {saving ? "Creating…" : "Create Team"}
              </button>
            </div>
          </div>

          {/* Add members to existing team */}
          <div className="bg-gray-800/40 border border-gray-700 rounded-2xl p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <UserPlus className="w-5 h-5" /> Add Selected Employees to an
              Existing Team
            </h3>

            <select
              className="w-full rounded-xl bg-gray-900 border border-gray-700 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500"
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
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 transition disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              {modifyingTeam ? "Adding…" : "Add to Team"}
            </button>
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-800/40 border border-gray-700 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Teams</h3>
              <div className="text-sm text-gray-400">
                {teams.length
                  ? `${teams.length} teams`
                  : "No teams created yet"}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {teams.map((t) => (
                <div
                  key={t.id}
                  className={`rounded-xl border ${
                    selectedTeamId === t.id
                      ? "border-orange-500"
                      : "border-gray-700"
                  } bg-gray-900 p-4`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{t.name}</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedTeamId(Number(t.id))}
                        className="text-xs px-2 py-1 rounded-lg bg-gray-800 hover:bg-gray-700"
                      >
                        View
                      </button>
                      <button
                        onClick={() => deleteTeam(t.id)}
                        className="text-xs px-2 py-1 rounded-lg bg-red-600/80 hover:bg-red-600 flex items-center gap-1"
                        title="Delete team"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">ID: {t.id}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Members of selected team */}
          <div className="bg-gray-800/40 border border-gray-700 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">
                {selectedTeamId
                  ? `Team #${selectedTeamId} Members`
                  : "Select a team to view members"}
              </h3>
              {selectedTeamId ? (
                <button
                  onClick={() => loadTeamDetails(selectedTeamId)}
                  className="text-xs px-2 py-1 rounded-lg bg-gray-800 hover:bg-gray-700"
                >
                  Refresh
                </button>
              ) : null}
            </div>

            {!selectedTeamId ? (
              <div className="text-sm text-gray-400">Choose a team above.</div>
            ) : modifyingTeam ? (
              <div className="text-sm text-gray-400">Loading members…</div>
            ) : selectedTeamMembers.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedTeamMembers.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl bg-gray-900 border border-gray-700 p-4 flex items-start justify-between"
                  >
                    <div>
                      <div className="font-medium">{m.employee_name}</div>
                      <div className="text-xs text-gray-400">
                        ID: {m.id}{" "}
                        {m.employee_email ? `• ${m.employee_email}` : ""}
                      </div>
                    </div>
                    <button
                      className="text-red-400 hover:text-red-300"
                      onClick={() => removeMember(m.id)}
                      title="Remove from team"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-400">
                No members in this team yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTeam;
