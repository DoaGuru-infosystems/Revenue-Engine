import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  CalendarDays,
  Search,
  Clock,
  Send,
  CheckCircle2,
  X,
  Layers,
  Briefcase,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../../../redux/user/userSlice";
import Swal from "sweetalert2";
import API_BASE_URL from "../../../config/apiBaseUrl";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useTheme } from "../../../context/ThemeContext";

const localizer = momentLocalizer(moment);

const PAGE_SIZE = 8;

export default function AssignQuotationPage() {
  const baseURL = API_BASE_URL;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token, currentUser } = useSelector((s) => s.user);
  const isOwner = currentUser?.role === "Owner" || currentUser?.employee_role === "Owner";

  const { theme } = useTheme();
  const isLight = theme === "light";
  const isDark = !isLight;

  const [mainTab, setMainTab] = useState("assign");
  const [keyword, setKeyword] = useState("");
  const [projectKeyword, setProjectKeyword] = useState("");
  const [projectPage, setProjectPage] = useState(0);

  // Proformas & SF Sync State
  const [proformas, setProformas] = useState([]);
  const [proformaLoading, setProformaLoading] = useState(false);
  const [proformaPage, setProformaPage] = useState(0);
  const [syncingId, setSyncingId] = useState(null);

  // Universal Calendar State
  const [calendarData, setCalendarData] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

  // Project Tasks Calendar Drill-down Modal State
  const [selectedProjectDetail, setSelectedProjectDetail] = useState(null);
  const [projectTasks, setProjectTasks] = useState([]);
  const [projectTasksLoading, setProjectTasksLoading] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);

  const fetchProformas = async () => {
    try {
      setProformaLoading(true);
      const res = await axios.get(`${baseURL}/auth/api/re_calculator/proforma/all`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.data?.status === "Success") {
        setProformas(res.data.data || []);
      }
    } catch (err) {
      console.error("fetchProformas error:", err);
      if (err?.response?.status === 401) {
        Swal.fire({
          title: "Session Expired",
          text: "Please login again.",
          icon: "warning",
          confirmButtonText: "OK",
          background: isLight ? "#ffffff" : "#1e293b",
          color: isLight ? "#0f172a" : "#fff",
        }).then(() => {
          dispatch(clearUser());
          localStorage.removeItem("token");
          navigate("/");
        });
      }
    } finally {
      setProformaLoading(false);
    }
  };

  const fetchCalendarData = async () => {
    try {
      setCalendarLoading(true);
      const res = await axios.get(`${baseURL}/auth/api/re_calculator/re-sf/calendar`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.data?.status === "Success") {
        setCalendarData(res.data.data || []);
      }
    } catch (err) {
      console.error("fetchCalendarData error:", err);
    } finally {
      setCalendarLoading(false);
    }
  };

  const fetchProjectTasks = async (proformaId) => {
    try {
      setProjectTasksLoading(true);
      const res = await axios.get(
        `${baseURL}/auth/api/re_calculator/re-sf/project/${proformaId}/tasks`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data?.status === "Success") {
        setSelectedProjectDetail(res.data.data.project);
        setProjectTasks(res.data.data.tasks || []);
      }
    } catch (err) {
      console.error("fetchProjectTasks error:", err);
    } finally {
      setProjectTasksLoading(false);
    }
  };

  useEffect(() => {
    fetchProformas();
    fetchCalendarData();
  }, [token]);

  // Live sync polling: 20s interval when Calendar or Projects tab is active, or project modal open
  useEffect(() => {
    const isCalendarOrProjects = mainTab === "calendar" || mainTab === "projects" || mainTab === "history";
    if (!isCalendarOrProjects && !showProjectModal) return;

    fetchCalendarData();

    const interval = setInterval(() => {
      fetchCalendarData();
      if (showProjectModal && selectedProjectDetail?.proforma_id) {
        fetchProjectTasks(selectedProjectDetail.proforma_id);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [mainTab, showProjectModal, selectedProjectDetail?.proforma_id]);

  const norm = (s) => String(s || "").toLowerCase();

  const filteredProformas = useMemo(() => {
    if (!keyword.trim()) return proformas;
    const q = norm(keyword);
    return proformas.filter(
      (p) =>
        norm(p.proforma_number).includes(q) ||
        norm(p.client_name).includes(q) ||
        norm(p.client_organization).includes(q) ||
        norm(p.id).includes(q) ||
        norm(p.proposal_id).includes(q)
    );
  }, [proformas, keyword]);

  const proformaTotalPages = Math.ceil(filteredProformas.length / PAGE_SIZE) || 1;
  const proformaPageRows = useMemo(() => {
    const start = proformaPage * PAGE_SIZE;
    return filteredProformas.slice(start, start + PAGE_SIZE);
  }, [filteredProformas, proformaPage]);

  useEffect(() => {
    setProformaPage(0);
  }, [keyword]);

  // Projects Tab Filter & Pagination
  const filteredProjects = useMemo(() => {
    if (!projectKeyword.trim()) return calendarData || [];
    const q = norm(projectKeyword);
    return (calendarData || []).filter(
      (p) =>
        norm(p.client_name).includes(q) ||
        norm(p.client_organization).includes(q) ||
        norm(p.proforma_number).includes(q) ||
        norm(p.proforma_id).includes(q) ||
        norm(p.sf_project_id).includes(q) ||
        norm(p.current_status).includes(q) ||
        norm(p.sf_status).includes(q)
    );
  }, [calendarData, projectKeyword]);

  const projectTotalPages = Math.ceil(filteredProjects.length / PAGE_SIZE) || 1;
  const projectPageRows = useMemo(() => {
    const start = projectPage * PAGE_SIZE;
    return filteredProjects.slice(start, start + PAGE_SIZE);
  }, [filteredProjects, projectPage]);

  useEffect(() => {
    setProjectPage(0);
  }, [projectKeyword]);

  const handleAssignToSF = async (proformaId) => {
    if (!isOwner) {
      return Swal.fire({
        icon: "warning",
        title: "Permission Denied",
        text: "Only Owner accounts can assign projects to SF.",
        background: isLight ? "#ffffff" : "#1e293b",
        color: isLight ? "#0f172a" : "#fff",
      });
    }

    const alreadyAssigned = (calendarData || []).some(
      (c) => Number(c.proforma_id) === Number(proformaId)
    );
    if (alreadyAssigned) {
      return Swal.fire({
        icon: "info",
        title: "Already Assigned",
        text: "This proforma has already been assigned to SF operations.",
        background: isLight ? "#ffffff" : "#1e293b",
        color: isLight ? "#0f172a" : "#fff",
      });
    }

    const confirmRes = await Swal.fire({
      title: "Assign to SF?",
      text: `Are you sure you want to hand off Proforma #${proformaId} to SF operations?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Assign",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#f59e0b",
      cancelButtonColor: "#64748b",
      background: isLight ? "#ffffff" : "#1e293b",
      color: isLight ? "#0f172a" : "#fff",
    });

    if (!confirmRes.isConfirmed) return;

    try {
      setSyncingId(proformaId);
      const res = await axios.post(
        `${baseURL}/auth/api/re_calculator/re-sf/assign`,
        { proforma_id: proformaId },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data?.status === "Success") {
        await Swal.fire({
          icon: "success",
          title: "Assigned to SF",
          text: "Assigned to SF. Initial sync queued.",
          background: isLight ? "#ffffff" : "#1e293b",
          color: isLight ? "#0f172a" : "#fff",
        });
        fetchProformas();
        fetchCalendarData();
      } else {
        Swal.fire({
          icon: "error",
          title: "Assignment Failed",
          text: res.data?.message || "Failed to assign to SF.",
          background: isLight ? "#ffffff" : "#1e293b",
          color: isLight ? "#0f172a" : "#fff",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Assignment Failed",
        text: err.response?.data?.message || err.message || "Server error while assigning to SF.",
        background: isLight ? "#ffffff" : "#1e293b",
        color: isLight ? "#0f172a" : "#fff",
      });
    } finally {
      setSyncingId(null);
    }
  };

  const calendarEvents = useMemo(() => {
    return (calendarData || []).map((project) => {
      const rawStart = project.start_date || project.duration_start_date;
      const rawEnd = project.end_date || project.duration_end_date;
      const start = rawStart ? new Date(rawStart) : new Date();
      let end = rawEnd ? new Date(rawEnd) : new Date(start);
      if (end < start) end = new Date(start);

      return {
        id: project.id || project.sync_id,
        title: `${project.client_name || "Client"} - ${project.project_name || "Project #" + project.proforma_id}`,
        start,
        end,
        allDay: true,
        resource: project,
      };
    });
  }, [calendarData]);

  const getEventColors = (status) => {
    switch (status) {
      case "in_progress":
      case "working":
        return isLight
          ? { bg: "#e0f2fe", text: "#0369a1", border: "1px solid #7dd3fc", dot: "#0284c7", label: "In Progress" }
          : { bg: "rgba(14, 165, 233, 0.22)", text: "#e0f2fe", border: "1px solid rgba(56, 189, 248, 0.45)", dot: "#38bdf8", label: "In Progress" };
      case "completed":
      case "done":
        return isLight
          ? { bg: "#dcfce7", text: "#15803d", border: "1px solid #86efac", dot: "#10b981", label: "Completed" }
          : { bg: "rgba(16, 185, 129, 0.22)", text: "#d1fae5", border: "1px solid rgba(52, 211, 153, 0.45)", dot: "#34d399", label: "Completed" };
      case "blocked":
      case "delayed":
        return isLight
          ? { bg: "#fee2e2", text: "#b91c1c", border: "1px solid #fca5a5", dot: "#ef4444", label: "Blocked" }
          : { bg: "rgba(239, 68, 68, 0.22)", text: "#fee2e2", border: "1px solid rgba(248, 113, 113, 0.45)", dot: "#f87171", label: "Blocked" };
      case "review":
        return isLight
          ? { bg: "#fef3c7", text: "#b45309", border: "1px solid #fcd34d", dot: "#f59e0b", label: "Review" }
          : { bg: "rgba(245, 158, 11, 0.22)", text: "#fef3c7", border: "1px solid rgba(245, 158, 11, 0.45)", dot: "#fbbf24", label: "Review" };
      default: // assigned / pending
        return isLight
          ? { bg: "#f1f5f9", text: "#334155", border: "1px solid #cbd5e1", dot: "#64748b", label: "Assigned" }
          : { bg: "rgba(100, 116, 139, 0.22)", text: "#cbd5e1", border: "1px solid rgba(148, 163, 184, 0.45)", dot: "#94a3b8", label: "Assigned" };
    }
  };

  const CustomAgendaEvent = ({ event }) => {
    const status = event.resource?.sf_status || event.resource?.current_status || "assigned";
    const colors = getEventColors(status);
    return (
      <div className="flex items-center justify-between gap-3 w-full py-1">
        <span className={`font-semibold text-sm ${isLight ? "text-slate-900" : "text-slate-100"}`}>
          {event.title}
        </span>
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0"
          style={{ background: colors.bg, color: colors.text, border: colors.border }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors.dot }} />
          {colors.label}
        </span>
      </div>
    );
  };

  const CustomTaskAgendaEvent = ({ event }) => {
    const status = event.resource?.status || "pending";
    const colors = getEventColors(status);
    return (
      <div className="flex items-center justify-between gap-3 w-full py-1">
        <span className={`font-semibold text-sm ${isLight ? "text-slate-900" : "text-slate-100"}`}>
          {event.title}
        </span>
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0"
          style={{ background: colors.bg, color: colors.text, border: colors.border }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors.dot }} />
          {colors.label}
        </span>
      </div>
    );
  };

  const eventPropGetter = (event) => {
    const status = event.resource?.sf_status || event.resource?.current_status || "assigned";
    const colors = getEventColors(status);

    return {
      style: {
        backgroundColor: colors.bg,
        color: colors.text,
        border: colors.border,
        borderRadius: "6px",
        fontWeight: "600",
        fontSize: "12px",
        padding: "2px 6px",
        boxShadow: isLight ? "0 1px 2px rgba(0,0,0,0.05)" : "0 2px 4px rgba(0,0,0,0.25)",
      },
    };
  };

  const projectTaskEvents = useMemo(() => {
    return (projectTasks || []).map((t) => {
      const deadlineDate = t.deadline ? new Date(t.deadline) : new Date();
      return {
        id: t.id || t.sf_task_id,
        title: `${t.task_name} (${t.assigned_to_name || "Unassigned"})`,
        start: deadlineDate,
        end: deadlineDate,
        allDay: true,
        resource: t,
      };
    });
  }, [projectTasks]);

  const taskEventPropGetter = (event) => {
    const status = event.resource?.status || "pending";
    const colors = getEventColors(status);

    return {
      style: {
        backgroundColor: colors.bg,
        color: colors.text,
        border: colors.border,
        borderRadius: "6px",
        fontWeight: "600",
        fontSize: "12px",
        padding: "2px 6px",
        boxShadow: isLight ? "0 1px 2px rgba(0,0,0,0.05)" : "0 2px 4px rgba(0,0,0,0.25)",
      },
    };
  };

  const handleSelectTaskEvent = (event) => {
    const task = event.resource || {};
    const deadlineStr = task.deadline ? moment(task.deadline).format("DD MMM YYYY") : "No deadline set";

    Swal.fire({
      title: `<span style="font-size:18px; font-weight:700;">${task.task_name || "Task Detail"}</span>`,
      html: `
        <div style="text-align:left; font-size:13px; line-height:1.8;">
          <div><strong style="color:${isLight ? '#64748b' : '#94a3b8'};">Assigned To:</strong> <span style="color:#f59e0b; font-weight:600;">${task.assigned_to_name || "Unassigned"}</span> ${task.assigned_to_role ? `<span style="color:${isLight ? '#475569' : '#cbd5e1'};">(${task.assigned_to_role})</span>` : ""}</div>
          <div><strong style="color:${isLight ? '#64748b' : '#94a3b8'};">Status:</strong> <span style="text-transform:capitalize; font-weight:600; color:#059669;">${task.status || "pending"}</span></div>
          <div><strong style="color:${isLight ? '#64748b' : '#94a3b8'};">Deadline:</strong> ${deadlineStr}</div>
          ${task.sf_task_id ? `<div><strong style="color:${isLight ? '#64748b' : '#94a3b8'};">SF Task ID:</strong> ${task.sf_task_id}</div>` : ""}
          <div style="margin-top:10px; padding:10px; background:${isLight ? '#f8fafc' : '#0f172a'}; border-radius:8px; border:1px solid ${isLight ? '#e2e8f0' : '#334155'};">
            <strong style="color:#f59e0b; display:block; margin-bottom:4px; font-size:11px; text-transform:uppercase;">Description / Scope:</strong>
            <div style="color:${isLight ? '#334155' : '#cbd5e1'}; font-size:12px; white-space:pre-wrap;">${task.task_description || "No description provided."}</div>
          </div>
        </div>
      `,
      background: isLight ? "#ffffff" : "#1e293b",
      color: isLight ? "#0f172a" : "#fff",
      confirmButtonColor: "#f59e0b",
      confirmButtonText: "Close",
    });
  };

  // 9b: Lightweight info popover on global calendar click (no heavy task calendar here)
  const handleSelectCalendarEvent = (event) => {
    const project = event.resource || {};
    const startDate = project.start_date || project.duration_start_date;
    const endDate = project.end_date || project.duration_end_date;
    const startDateStr = startDate ? moment(startDate).format("DD MMM YYYY") : "N/A";
    const endDateStr = endDate ? moment(endDate).format("DD MMM YYYY") : "N/A";
    const status = project.sf_status || project.current_status || "assigned";
    const statusColors = getEventColors(status);

    Swal.fire({
      title: `<span style="font-size:18px; font-weight:700;">${project.client_name || "Project Overview"}</span>`,
      html: `
        <div style="text-align:left; font-size:13px; line-height:1.9;">
          <div><strong style="color:${isLight ? '#64748b' : '#94a3b8'};">Proforma No:</strong> <span style="font-weight:600; color:#f59e0b;">${project.proforma_number || ("PROF-" + (project.proforma_id || project.id))}</span></div>
          <div>
            <strong style="color:${isLight ? '#64748b' : '#94a3b8'};">Status:</strong> 
            <span style="display:inline-block; padding:2px 8px; border-radius:12px; font-size:12px; font-weight:600; text-transform:capitalize; background:${statusColors.bg}; color:${statusColors.text}; border:${statusColors.border};">
              ${statusColors.label}
            </span>
          </div>
          <div><strong style="color:${isLight ? '#64748b' : '#94a3b8'};">Start Date:</strong> <span style="color:${isLight ? '#0f172a' : '#f1f5f9'};">${startDateStr}</span></div>
          <div><strong style="color:${isLight ? '#64748b' : '#94a3b8'};">End Date:</strong> <span style="color:${isLight ? '#0f172a' : '#f1f5f9'};">${endDateStr}</span></div>
          ${project.sf_project_id ? `<div><strong style="color:${isLight ? '#64748b' : '#94a3b8'};">SF Project ID:</strong> ${project.sf_project_id}</div>` : ""}
          <div style="margin-top:12px; padding:10px; background:${isLight ? '#f1f5f9' : '#0f172a'}; border-radius:8px; border:1px solid ${isLight ? '#e2e8f0' : '#334155'}; font-size:12px; color:${isLight ? '#64748b' : '#94a3b8'};">
            ℹ️ To view individual task deadlines and full execution calendar, open this project from the <strong>Projects</strong> tab.
          </div>
        </div>
      `,
      background: isLight ? "#ffffff" : "#1e293b",
      color: isLight ? "#0f172a" : "#fff",
      confirmButtonColor: "#f59e0b",
      confirmButtonText: "Close",
    });
  };

  // 9a: Open per-project task calendar drilldown (triggered via Projects tab "View Calendar" button)
  const openProjectCalendarModal = (project) => {
    const proformaId = project.proforma_id || project.id;
    if (!proformaId) return;

    setSelectedProjectDetail(project);
    setShowProjectModal(true);
    fetchProjectTasks(proformaId);
  };

  useEffect(() => {
    if (showProjectModal) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => (document.body.style.overflow = prev);
    }
  }, [showProjectModal]);

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-200 ${
      isLight 
        ? "bg-slate-100 text-slate-800" 
        : "bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white"
    }`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl animate-pulse ${
          isLight ? "bg-orange-300/20" : "bg-orange-500/10"
        }`} />
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl animate-pulse delay-1000 ${
          isLight ? "bg-amber-300/20" : "bg-red-500/10"
        }`} />
      </div>

      <div className="relative z-10 p-3 sm:p-6 space-y-4 sm:space-y-6 pb-12">
        {/* Top Header & Navigation Bar */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className={`text-xl sm:text-3xl font-bold tracking-tight ${
                isLight ? "text-slate-900" : "bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
              }`}>
                {mainTab === "assign"
                  ? "Proforma Project Assignments"
                  : mainTab === "projects" || mainTab === "history"
                  ? "Projects"
                  : "Global Project Calendar"}
              </h2>
              <p className={`text-xs mt-1 ${isLight ? "text-slate-500" : "text-gray-400"}`}>
                {mainTab === "assign"
                  ? "Hand off approved proforma invoices to SF operations and track live execution schedules."
                  : mainTab === "projects" || mainTab === "history"
                  ? "View all synced SF projects and drill down into per-project execution calendars and task deadlines."
                  : "Universal schedule and execution statuses across all active projects."}
              </p>
            </div>

            <div className={`flex flex-wrap p-1 rounded-xl border transition-all ${
              isLight 
                ? "bg-white border-slate-200 shadow-sm" 
                : "bg-gray-800/50 border-gray-700/50"
            }`}>
              <button
                onClick={() => setMainTab("assign")}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  mainTab === "assign"
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                    : isLight 
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Layers className="w-4 h-4" />
                Active Proformas
              </button>
              <button
                onClick={() => setMainTab("projects")}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  mainTab === "projects" || mainTab === "history"
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                    : isLight 
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Projects
              </button>
              <button
                onClick={() => setMainTab("calendar")}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  mainTab === "calendar"
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                    : isLight 
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                Project Calendar
              </button>
            </div>
          </div>

          {mainTab === "assign" && (
            <div className="relative group w-full">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                isLight ? "text-slate-400 group-focus-within:text-amber-500" : "text-gray-400 group-focus-within:text-amber-400"
              }`} />
              <input
                type="text"
                value={keyword}
                placeholder="Search by client / proforma no / organization / txn id"
                className={`w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border text-sm transition-all outline-none ${
                  isLight 
                    ? "bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 shadow-sm" 
                    : "bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                }`}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          )}

          {(mainTab === "projects" || mainTab === "history") && (
            <div className="relative group w-full">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                isLight ? "text-slate-400 group-focus-within:text-amber-500" : "text-gray-400 group-focus-within:text-amber-400"
              }`} />
              <input
                type="text"
                value={projectKeyword}
                placeholder="Search projects by client / proforma no / status / SF project ID"
                className={`w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border text-sm transition-all outline-none ${
                  isLight 
                    ? "bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 shadow-sm" 
                    : "bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                }`}
                onChange={(e) => setProjectKeyword(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Content Body Based on Active Main Tab */}
        {mainTab === "assign" ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-amber-500" />
                <h3 className={`text-base sm:text-lg font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>
                  Proforma Invoices — SF Operations Hand-off
                </h3>
              </div>
              <div className={`text-xs px-3 py-1 rounded-full border ${
                isLight ? "bg-white text-slate-600 border-slate-200" : "bg-gray-800/50 text-gray-400 border-gray-700/50"
              }`}>
                {filteredProformas.length ? `${filteredProformas.length} proformas` : "Empty"}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className={`hidden sm:block rounded-2xl border overflow-hidden transition-all ${
              isLight ? "bg-white border-slate-200 shadow-sm" : "bg-gray-800/30 backdrop-blur-xl border-gray-700/50 shadow-2xl"
            }`}>
              <div className="p-4 sm:p-6">
                {proformaLoading ? (
                  <div className={`py-16 text-center text-sm ${isLight ? "text-slate-500" : "text-gray-400"}`}>
                    <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                    Loading proforma invoices...
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px]">
                      <thead>
                        <tr className={`border-b ${isLight ? "border-slate-200 bg-slate-50/50" : "border-gray-700/50"}`}>
                          {["SNo.", "Date", "Client", "Proforma No", "Duration", "Total Amount", "SF Status", "Action"].map((h) => (
                            <th key={h} className={`text-left py-3 px-4 uppercase tracking-wider text-xs font-semibold ${
                              isLight ? "text-slate-500" : "text-gray-400"
                            }`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {proformaPageRows.length ? proformaPageRows.map((item, idx) => {
                          const syncRecord = (calendarData || []).find(
                            (c) => Number(c.proforma_id) === Number(item.id)
                          );
                          const sfStatus = syncRecord ? (syncRecord.sf_status || syncRecord.current_status || "assigned") : null;
                          const colors = sfStatus ? getEventColors(sfStatus) : null;

                          return (
                            <tr key={`prof-${item.id}-${idx}`} className={`border-b transition-colors ${
                              isLight ? "border-slate-100 hover:bg-slate-50" : "border-gray-700/30 hover:bg-gray-700/20"
                            }`}>
                              <td className={`py-4 px-4 text-sm ${isLight ? "text-slate-500" : "text-white/60"}`}>
                                {proformaPage * PAGE_SIZE + idx + 1}
                              </td>
                              <td className="py-4 px-4">
                                <div className={`flex items-center gap-2 text-sm ${isLight ? "text-slate-600" : "text-gray-300"}`}>
                                  <Calendar className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                  {item.created_at ? moment(item.created_at).format("DD MMM YYYY") : "-"}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className={`font-semibold text-sm ${isLight ? "text-slate-900" : "text-white"}`}>{item.client_name || "N/A"}</div>
                                {item.client_organization && (
                                  <div className={`text-xs ${isLight ? "text-slate-500" : "text-gray-400"}`}>{item.client_organization}</div>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                <span className={`font-mono font-semibold text-sm ${isLight ? "text-amber-700" : "text-yellow-300"}`}>
                                  {item.proforma_number || `PROF-${item.id}`}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div className={`text-xs ${isLight ? "text-slate-600" : "text-gray-300"}`}>
                                  {item.duration_start_date ? moment(item.duration_start_date).format("DD MMM YY") : "—"}
                                  {" → "}
                                  {item.duration_end_date ? moment(item.duration_end_date).format("DD MMM YY") : "—"}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`font-bold text-sm ${isLight ? "text-amber-700" : "text-orange-400"}`}>
                                  ₹{Number(item.total_amount || 0).toLocaleString("en-IN")}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                {syncRecord && colors ? (
                                  <span
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                                    style={{ background: colors.bg, color: colors.text, border: colors.border }}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors.dot }} />
                                    <span>{colors.label}</span>
                                  </span>
                                ) : (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                                    isLight ? "text-slate-500 bg-slate-100 border border-slate-200" : "text-gray-400 bg-gray-700/40 border border-gray-600/30"
                                  }`}>
                                    Not Synced
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                {!isOwner ? (
                                  <span className={`text-xs italic ${isLight ? "text-slate-400" : "text-gray-500"}`}>Owner only</span>
                                ) : syncRecord ? (
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-default select-none ${
                                    isLight ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                  }`}>
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Assigned
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleAssignToSF(item.id)}
                                    disabled={syncingId === item.id}
                                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                                  >
                                    {syncingId === item.id ? (
                                      <Clock className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Send className="w-3.5 h-3.5" />
                                    )}
                                    <span>Assign to SF</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr><td colSpan={8} className={`py-12 text-center text-sm ${isLight ? "text-slate-400" : "text-gray-500"}`}>No proforma invoices found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Card List for Proformas */}
            <div className="sm:hidden space-y-3">
              {proformaPageRows.length ? proformaPageRows.map((item, idx) => {
                const syncRecord = (calendarData || []).find((c) => Number(c.proforma_id) === Number(item.id));
                const sfStatus = syncRecord ? (syncRecord.sf_status || syncRecord.current_status || "assigned") : null;
                const colors = sfStatus ? getEventColors(sfStatus) : null;

                return (
                  <div key={`m-prof-${item.id}-${idx}`} className={`rounded-2xl border p-4 space-y-3 shadow-sm ${
                    isLight ? "bg-white border-slate-200" : "bg-gray-800/40 backdrop-blur-xl border-gray-700/50"
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-base truncate ${isLight ? "text-slate-900" : "text-white"}`}>{item.client_name}</p>
                        <p className={`text-sm font-mono font-bold mt-0.5 ${isLight ? "text-amber-700" : "text-yellow-300"}`}>{item.proforma_number || `PROF-${item.id}`}</p>
                      </div>
                      <span className={`shrink-0 text-xs px-2 py-1 rounded-lg ${
                        isLight ? "bg-slate-100 text-slate-600" : "bg-gray-700/50 text-gray-400"
                      }`}>
                        #{proformaPage * PAGE_SIZE + idx + 1}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className={`flex items-center gap-1.5 ${isLight ? "text-slate-500" : "text-gray-400"}`}>
                        <Calendar className="w-3.5 h-3.5 text-orange-500" />
                        {item.created_at ? moment(item.created_at).format("DD MMM YYYY") : "-"}
                      </div>
                      <div className={`font-bold text-sm ${isLight ? "text-amber-700" : "text-orange-400"}`}>
                        ₹{Number(item.total_amount || 0).toLocaleString("en-IN")}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        {syncRecord && colors ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                            style={{ background: colors.bg, color: colors.text, border: colors.border }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors.dot }} />
                            <span>{colors.label}</span>
                          </span>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border ${
                            isLight ? "bg-slate-100 text-slate-500 border-slate-200" : "text-gray-400 bg-gray-700/40 border-gray-600/30"
                          }`}>
                            Not Synced
                          </span>
                        )}
                      </div>
                      {!isOwner ? (
                        <span className={`text-xs italic ${isLight ? "text-slate-400" : "text-gray-500"}`}>Owner only</span>
                      ) : syncRecord ? (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          isLight ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        }`}>
                          <CheckCircle2 className="w-3 h-3" /> Assigned
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAssignToSF(item.id)}
                          disabled={syncingId === item.id}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white active:scale-95 transition-transform flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                        >
                          {syncingId === item.id ? (
                            <Clock className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>Assign to SF</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              }) : (
                <div className={`py-12 text-center text-sm rounded-2xl border ${
                  isLight ? "bg-white border-slate-200 text-slate-400" : "bg-gray-800/20 border-gray-700/30 text-gray-500"
                }`}>
                  No proforma invoices found.
                </div>
              )}
            </div>

            {proformaTotalPages > 1 && (
              <div className="p-2 flex items-center justify-center gap-3 mt-2">
                <button
                  onClick={() => setProformaPage((p) => Math.max(0, p - 1))}
                  disabled={proformaPage === 0}
                  className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                    isLight ? "bg-slate-200 text-slate-700 hover:bg-slate-300" : "bg-gray-700/50 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  ← Prev
                </button>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${isLight ? "text-slate-500" : "text-gray-400"}`}>Page</span>
                  <select
                    value={proformaPage}
                    onChange={(e) => setProformaPage(Number(e.target.value))}
                    className={`rounded-lg px-2.5 py-1 text-xs sm:text-sm cursor-pointer border ${
                      isLight ? "bg-white border-slate-300 text-slate-800" : "bg-gray-900/80 border-gray-600 text-white"
                    }`}
                  >
                    {Array.from({ length: proformaTotalPages }, (_, i) => (
                      <option key={i} value={i}>{i + 1}</option>
                    ))}
                  </select>
                  <span className={`text-xs ${isLight ? "text-slate-500" : "text-gray-500"}`}>of {proformaTotalPages}</span>
                </div>
                <button
                  onClick={() => setProformaPage((p) => Math.min(proformaTotalPages - 1, p + 1))}
                  disabled={proformaPage >= proformaTotalPages - 1}
                  className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                    isLight ? "bg-slate-200 text-slate-700 hover:bg-slate-300" : "bg-gray-700/50 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Next →
                </button>
              </div>
            )}
          </section>
        ) : (mainTab === "projects" || mainTab === "history") ? (
          /* Main Tab 2: Projects List / Table View (9a) */
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-500" />
                <h3 className={`text-base sm:text-lg font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>
                  Synced Projects Overview
                </h3>
              </div>
              <div className={`text-xs px-3 py-1 rounded-full border ${
                isLight ? "bg-white text-slate-600 border-slate-200" : "bg-gray-800/50 text-gray-400 border-gray-700/50"
              }`}>
                {filteredProjects.length ? `${filteredProjects.length} projects` : "Empty"}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className={`hidden sm:block rounded-2xl border overflow-hidden transition-all ${
              isLight ? "bg-white border-slate-200 shadow-sm" : "bg-gray-800/30 backdrop-blur-xl border-gray-700/50 shadow-2xl"
            }`}>
              <div className="p-4 sm:p-6">
                {calendarLoading ? (
                  <div className={`py-16 text-center text-sm ${isLight ? "text-slate-500" : "text-gray-400"}`}>
                    <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                    Loading synced projects...
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px]">
                      <thead>
                        <tr className={`border-b ${isLight ? "border-slate-200 bg-slate-50/50" : "border-gray-700/50"}`}>
                          {["SNo.", "Client Name", "Proforma No", "Status", "Start Date", "End Date", "Action"].map((h) => (
                            <th key={h} className={`text-left py-3 px-4 uppercase tracking-wider text-xs font-semibold ${
                              isLight ? "text-slate-500" : "text-gray-400"
                            }`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {projectPageRows.length ? projectPageRows.map((project, idx) => {
                          const sfStatus = project.sf_status || project.current_status || "assigned";
                          const colors = getEventColors(sfStatus);
                          const startDate = project.start_date || project.duration_start_date;
                          const endDate = project.end_date || project.duration_end_date;

                          return (
                            <tr key={`proj-${project.sync_id || project.id}-${idx}`} className={`border-b transition-colors ${
                              isLight ? "border-slate-100 hover:bg-slate-50" : "border-gray-700/30 hover:bg-gray-700/20"
                            }`}>
                              <td className={`py-4 px-4 text-sm ${isLight ? "text-slate-500" : "text-white/60"}`}>
                                {projectPage * PAGE_SIZE + idx + 1}
                              </td>
                              <td className="py-4 px-4">
                                <div className={`font-semibold text-sm ${isLight ? "text-slate-900" : "text-white"}`}>
                                  {project.client_name || "N/A"}
                                </div>
                                {project.client_organization && (
                                  <div className={`text-xs ${isLight ? "text-slate-500" : "text-gray-400"}`}>
                                    {project.client_organization}
                                  </div>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                <span className={`font-mono font-semibold text-sm ${isLight ? "text-amber-700" : "text-yellow-300"}`}>
                                  {project.proforma_number || `PROF-${project.proforma_id}`}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                                  style={{ background: colors.bg, color: colors.text, border: colors.border }}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors.dot }} />
                                  <span>{colors.label}</span>
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div className={`flex items-center gap-1.5 text-xs ${isLight ? "text-slate-600" : "text-gray-300"}`}>
                                  <Calendar className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                  {startDate ? moment(startDate).format("DD MMM YYYY") : "—"}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className={`flex items-center gap-1.5 text-xs ${isLight ? "text-slate-600" : "text-gray-300"}`}>
                                  <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  {endDate ? moment(endDate).format("DD MMM YYYY") : "—"}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <button
                                  onClick={() => openProjectCalendarModal(project)}
                                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
                                >
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>View Calendar</span>
                                </button>
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan={7} className={`py-12 text-center text-sm ${isLight ? "text-slate-400" : "text-gray-500"}`}>
                              No synced projects found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Card List for Projects */}
            <div className="sm:hidden space-y-3">
              {projectPageRows.length ? projectPageRows.map((project, idx) => {
                const sfStatus = project.sf_status || project.current_status || "assigned";
                const colors = getEventColors(sfStatus);
                const startDate = project.start_date || project.duration_start_date;
                const endDate = project.end_date || project.duration_end_date;

                return (
                  <div key={`m-proj-${project.sync_id || project.id}-${idx}`} className={`rounded-2xl border p-4 space-y-3 shadow-sm ${
                    isLight ? "bg-white border-slate-200" : "bg-gray-800/40 backdrop-blur-xl border-gray-700/50"
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-base truncate ${isLight ? "text-slate-900" : "text-white"}`}>{project.client_name}</p>
                        <p className={`text-sm font-mono font-bold mt-0.5 ${isLight ? "text-amber-700" : "text-yellow-300"}`}>{project.proforma_number || `PROF-${project.proforma_id}`}</p>
                      </div>
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0"
                        style={{ background: colors.bg, color: colors.text, border: colors.border }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors.dot }} />
                        <span>{colors.label}</span>
                      </span>
                    </div>

                    <div className={`text-xs space-y-1 ${isLight ? "text-slate-600" : "text-gray-300"}`}>
                      <div>Start: <strong>{startDate ? moment(startDate).format("DD MMM YYYY") : "—"}</strong></div>
                      <div>End: <strong>{endDate ? moment(endDate).format("DD MMM YYYY") : "—"}</strong></div>
                    </div>

                    <button
                      onClick={() => openProjectCalendarModal(project)}
                      className="w-full py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>View Calendar</span>
                    </button>
                  </div>
                );
              }) : (
                <div className={`py-12 text-center text-sm rounded-2xl border ${
                  isLight ? "bg-white border-slate-200 text-slate-500" : "bg-gray-800/20 border-gray-700/30 text-gray-500"
                }`}>
                  No synced projects found.
                </div>
              )}
            </div>

            {/* Pagination for Projects */}
            {projectTotalPages > 1 && (
              <div className="p-2 flex items-center justify-center gap-3 mt-2">
                <button
                  onClick={() => setProjectPage((p) => Math.max(0, p - 1))}
                  disabled={projectPage === 0}
                  className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                    isLight ? "bg-slate-200 text-slate-700 hover:bg-slate-300" : "bg-gray-700/50 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  ← Prev
                </button>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${isLight ? "text-slate-500" : "text-gray-400"}`}>Page</span>
                  <select
                    value={projectPage}
                    onChange={(e) => setProjectPage(Number(e.target.value))}
                    className={`rounded-lg px-2.5 py-1 text-xs sm:text-sm cursor-pointer border ${
                      isLight ? "bg-white border-slate-300 text-slate-800" : "bg-gray-900/80 border-gray-600 text-white"
                    }`}
                  >
                    {Array.from({ length: projectTotalPages }, (_, i) => (
                      <option key={i} value={i}>{i + 1}</option>
                    ))}
                  </select>
                  <span className={`text-xs ${isLight ? "text-slate-500" : "text-gray-500"}`}>of {projectTotalPages}</span>
                </div>
                <button
                  onClick={() => setProjectPage((p) => Math.min(projectTotalPages - 1, p + 1))}
                  disabled={projectPage >= projectTotalPages - 1}
                  className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                    isLight ? "bg-slate-200 text-slate-700 hover:bg-slate-300" : "bg-gray-700/50 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Next →
                </button>
              </div>
            )}
          </section>
        ) : (
          /* Main Tab 3: Universal Project Calendar */
          <div className="space-y-4">
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border transition-all ${
              isLight ? "bg-white border-slate-200 shadow-sm" : "bg-gray-800/40 backdrop-blur-xl border-gray-700/50"
            }`}>
              <div>
                <h3 className={`text-base sm:text-lg font-bold flex items-center gap-2 ${isLight ? "text-slate-900" : "text-white"}`}>
                  <CalendarDays className="w-5 h-5 text-amber-500" />
                  SF Project Calendar
                </h3>
                <p className={`text-xs mt-0.5 ${isLight ? "text-slate-500" : "text-gray-400"}`}>
                  Live project schedule and execution statuses synced from SF Operations.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
                  isLight ? "bg-slate-100 text-slate-700 border-slate-300" : "text-gray-300 bg-slate-700/50 border-slate-600/40"
                }`}>
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span> Assigned
                </span>
                <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
                  isLight ? "bg-sky-50 text-sky-700 border-sky-200" : "text-gray-300 bg-sky-500/10 border-sky-500/30"
                }`}>
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span> In Progress
                </span>
                <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
                  isLight ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "text-gray-300 bg-emerald-500/10 border-emerald-500/30"
                }`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Completed
                </span>
                <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
                  isLight ? "bg-red-50 text-red-700 border-red-200" : "text-gray-300 bg-red-500/10 border-red-500/30"
                }`}>
                  <span className="w-2 h-2 rounded-full bg-red-500"></span> Blocked
                </span>
              </div>
            </div>

            {calendarLoading ? (
              <div className={`py-20 text-center text-sm rounded-2xl border ${
                isLight ? "bg-white border-slate-200 text-slate-500" : "bg-gray-800/20 border-gray-700/30 text-gray-400"
              }`}>
                <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                Loading calendar events...
              </div>
            ) : calendarEvents.length === 0 ? (
              <div className={`py-16 text-center text-sm rounded-2xl border ${
                isLight ? "bg-white border-slate-200 text-slate-500" : "bg-gray-800/20 border-gray-700/30 text-gray-500"
              }`}>
                No project sync calendar records found.
              </div>
            ) : (
              <div className={`rounded-2xl border p-3 sm:p-6 shadow-xl overflow-hidden transition-all ${
                isLight 
                  ? "bg-white border-slate-200 calendar-light-theme" 
                  : "bg-gray-800/30 backdrop-blur-xl border-gray-700/50 calendar-dark-theme"
              }`}>
                <style>{`
                  /* DARK THEME STYLES */
                  .calendar-dark-theme .rbc-calendar { color: #e2e8f0; }
                  .calendar-dark-theme .rbc-header { color: #94a3b8; border-bottom: 1px solid #334155; padding: 10px 0; font-weight: 600; font-size: 13px; }
                  .calendar-dark-theme .rbc-month-view { border: 1px solid #334155; background: rgba(15, 23, 42, 0.7); border-radius: 12px; overflow: hidden; }
                  .calendar-dark-theme .rbc-day-bg + .rbc-day-bg, .calendar-dark-theme .rbc-month-row + .rbc-month-row { border-color: #334155; }
                  .calendar-dark-theme .rbc-date-cell { color: #cbd5e1; font-weight: 500; padding: 4px 6px; }
                  .calendar-dark-theme .rbc-off-range-bg { background: rgba(15, 23, 42, 0.95); }
                  .calendar-dark-theme .rbc-off-range .rbc-date-cell { color: #475569; }
                  .calendar-dark-theme .rbc-today { background: rgba(245, 158, 11, 0.12); }
                  .calendar-dark-theme .rbc-toolbar button { color: #cbd5e1; border: 1px solid #475569; border-radius: 8px; padding: 6px 14px; font-size: 13px; background: rgba(30, 41, 59, 0.8); transition: all 0.2s; }
                  .calendar-dark-theme .rbc-toolbar button:hover { background: rgba(51, 65, 85, 0.9); color: #ffffff; }
                  .calendar-dark-theme .rbc-toolbar button.rbc-active { background: #f59e0b; color: #0f172a; border-color: #f59e0b; font-weight: 700; }
                  .calendar-dark-theme .rbc-toolbar-label { color: #ffffff; font-weight: 700; font-size: 16px; }
                  .calendar-dark-theme .rbc-event { cursor: pointer; }

                  /* AGENDA VIEW - DARK THEME */
                  .calendar-dark-theme .rbc-agenda-view table.rbc-agenda-table {
                    border: 1px solid #334155;
                    background: rgba(15, 23, 42, 0.7);
                    border-radius: 12px;
                    overflow: hidden;
                    width: 100%;
                  }
                  .calendar-dark-theme .rbc-agenda-view table.rbc-agenda-table thead > tr > th {
                    background: rgba(30, 41, 59, 0.9);
                    color: #94a3b8;
                    padding: 12px 16px;
                    border-bottom: 1px solid #334155;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                  }
                  .calendar-dark-theme .rbc-agenda-view table.rbc-agenda-table tbody > tr > td {
                    padding: 12px 16px;
                    border-bottom: 1px solid rgba(51, 65, 85, 0.5);
                    color: #cbd5e1;
                    background: transparent !important;
                  }
                  .calendar-dark-theme .rbc-agenda-view table.rbc-agenda-table tbody > tr:hover {
                    background: rgba(51, 65, 85, 0.25) !important;
                  }
                  .calendar-dark-theme .rbc-agenda-date-cell { font-weight: 600; color: #f1f5f9; }
                  .calendar-dark-theme .rbc-agenda-time-cell { color: #94a3b8; font-size: 12px; }

                  /* LIGHT THEME STYLES */
                  .calendar-light-theme .rbc-calendar { color: #1e293b; }
                  .calendar-light-theme .rbc-header { color: #475569; border-bottom: 1px solid #e2e8f0; padding: 10px 0; font-weight: 600; font-size: 13px; background: #f8fafc; }
                  .calendar-light-theme .rbc-month-view { border: 1px solid #e2e8f0; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
                  .calendar-light-theme .rbc-day-bg + .rbc-day-bg, .calendar-light-theme .rbc-month-row + .rbc-month-row { border-color: #e2e8f0; }
                  .calendar-light-theme .rbc-date-cell { color: #1e293b; font-weight: 600; padding: 4px 6px; }
                  .calendar-light-theme .rbc-off-range-bg { background: #f8fafc; }
                  .calendar-light-theme .rbc-off-range .rbc-date-cell { color: #94a3b8; }
                  .calendar-light-theme .rbc-today { background: rgba(245, 158, 11, 0.1); }
                  .calendar-light-theme .rbc-toolbar button { color: #334155; border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px 14px; font-size: 13px; background: #f1f5f9; transition: all 0.2s; }
                  .calendar-light-theme .rbc-toolbar button:hover { background: #e2e8f0; color: #0f172a; }
                  .calendar-light-theme .rbc-toolbar button.rbc-active { background: #f59e0b; color: #ffffff; border-color: #f59e0b; font-weight: 700; }
                  .calendar-light-theme .rbc-toolbar-label { color: #0f172a; font-weight: 700; font-size: 16px; }
                  .calendar-light-theme .rbc-event { cursor: pointer; }

                  /* AGENDA VIEW - LIGHT THEME */
                  .calendar-light-theme .rbc-agenda-view table.rbc-agenda-table {
                    border: 1px solid #e2e8f0;
                    background: #ffffff;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    width: 100%;
                  }
                  .calendar-light-theme .rbc-agenda-view table.rbc-agenda-table thead > tr > th {
                    background: #f8fafc;
                    color: #475569;
                    padding: 12px 16px;
                    border-bottom: 1px solid #e2e8f0;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                  }
                  .calendar-light-theme .rbc-agenda-view table.rbc-agenda-table tbody > tr > td {
                    padding: 12px 16px;
                    border-bottom: 1px solid #f1f5f9;
                    color: #334155;
                    background: transparent !important;
                  }
                  .calendar-light-theme .rbc-agenda-view table.rbc-agenda-table tbody > tr:hover {
                    background: #f8fafc !important;
                  }
                  .calendar-light-theme .rbc-agenda-date-cell { font-weight: 600; color: #0f172a; }
                  .calendar-light-theme .rbc-agenda-time-cell { color: #64748b; font-size: 12px; }

                  /* OVERRIDE: Prevent RBC from painting solid full-width background on Agenda event rows */
                  .rbc-agenda-view .rbc-agenda-event-cell {
                    background: transparent !important;
                    width: 100% !important;
                  }
                  .rbc-agenda-view .rbc-agenda-event-cell .rbc-event {
                    background: transparent !important;
                    box-shadow: none !important;
                    border: none !important;
                    padding: 0 !important;
                    color: inherit !important;
                    width: 100% !important;
                  }

                  /* COMMON RESPONSIVE TOOLBAR */
                  @media (max-width: 640px) {
                    .rbc-toolbar {
                      display: flex;
                      flex-direction: column;
                      gap: 10px;
                      align-items: stretch;
                      margin-bottom: 12px;
                    }
                    .rbc-toolbar .rbc-btn-group {
                      display: flex;
                      justify-content: center;
                      width: 100%;
                    }
                    .rbc-toolbar button {
                      flex: 1;
                      padding: 6px 8px;
                      font-size: 12px;
                    }
                    .rbc-toolbar-label {
                      text-align: center;
                      margin: 4px 0;
                      font-size: 15px;
                    }
                  }
                `}</style>
                <div style={{ minHeight: "500px", height: "clamp(500px, 70vh, 680px)" }}>
                  <BigCalendar
                    localizer={localizer}
                    events={calendarEvents}
                    startAccessor="start"
                    endAccessor="end"
                    titleAccessor="title"
                    allDayAccessor="allDay"
                    views={["month", "agenda"]}
                    defaultView="month"
                    popup
                    eventPropGetter={eventPropGetter}
                    onSelectEvent={handleSelectCalendarEvent}
                    components={{
                      agenda: {
                        event: CustomAgendaEvent,
                      },
                    }}
                    style={{ height: "100%" }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Per-Project Tasks Calendar Drill-down Modal */}
        {showProjectModal && selectedProjectDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4">
            {/*
              This calendar is opened from the Projects tab, where the global
              calendar stylesheet is not mounted. Keep its theme rules local so
              react-big-calendar's default light cells never leak into the
              dark project drill-down.
            */}
            <style>{`
              .project-task-calendar.calendar-dark-theme .rbc-calendar { color: #e2e8f0; }
              .project-task-calendar.calendar-dark-theme .rbc-month-view {
                border: 1px solid #334155;
                border-radius: 12px;
                overflow: hidden;
                background: #0f172a;
              }
              .project-task-calendar.calendar-dark-theme .rbc-header {
                padding: 10px 0;
                color: #cbd5e1;
                background: #1e293b;
                border-color: #334155;
                font-size: 13px;
                font-weight: 600;
              }
              .project-task-calendar.calendar-dark-theme .rbc-day-bg + .rbc-day-bg,
              .project-task-calendar.calendar-dark-theme .rbc-month-row + .rbc-month-row { border-color: #334155; }
              .project-task-calendar.calendar-dark-theme .rbc-date-cell {
                padding: 5px 7px;
                color: #e2e8f0;
                font-weight: 600;
              }
              .project-task-calendar.calendar-dark-theme .rbc-off-range-bg { background: #111827 !important; }
              .project-task-calendar.calendar-dark-theme .rbc-off-range .rbc-date-cell { color: #64748b; }
              .project-task-calendar.calendar-dark-theme .rbc-today { background: rgba(245, 158, 11, 0.13) !important; }
              .project-task-calendar.calendar-dark-theme .rbc-selected-cell { background: rgba(245, 158, 11, 0.20) !important; }
              .project-task-calendar.calendar-dark-theme .rbc-toolbar { margin-bottom: 14px; }
              .project-task-calendar.calendar-dark-theme .rbc-toolbar-label { color: #f8fafc; font-size: 16px; font-weight: 700; }
              .project-task-calendar.calendar-dark-theme .rbc-toolbar button {
                padding: 6px 14px;
                color: #cbd5e1;
                background: #1e293b;
                border: 1px solid #475569;
                border-radius: 7px;
                font-size: 13px;
                transition: background-color .2s, color .2s, border-color .2s;
              }
              .project-task-calendar.calendar-dark-theme .rbc-toolbar button:hover,
              .project-task-calendar.calendar-dark-theme .rbc-toolbar button:focus { color: #fff; background: #334155; border-color: #64748b; }
              .project-task-calendar.calendar-dark-theme .rbc-toolbar button.rbc-active,
              .project-task-calendar.calendar-dark-theme .rbc-toolbar button:active { color: #111827; background: #f59e0b; border-color: #f59e0b; box-shadow: none; }
              .project-task-calendar.calendar-dark-theme .rbc-show-more { color: #fbbf24; background: rgba(30, 41, 59, .9); }
              .project-task-calendar.calendar-dark-theme .rbc-overlay { color: #e2e8f0; background: #1e293b; border-color: #475569; }
              .project-task-calendar.calendar-dark-theme .rbc-agenda-view table.rbc-agenda-table { color: #e2e8f0; background: #0f172a; border-color: #334155; }
              .project-task-calendar.calendar-dark-theme .rbc-agenda-view table.rbc-agenda-table th { color: #cbd5e1; background: #1e293b; border-color: #334155; }
              .project-task-calendar.calendar-dark-theme .rbc-agenda-view table.rbc-agenda-table td { color: #cbd5e1; border-color: #334155; }
              @media (max-width: 640px) {
                .project-task-calendar .rbc-toolbar { flex-direction: column; gap: 10px; align-items: stretch; }
                .project-task-calendar .rbc-toolbar .rbc-btn-group { display: flex; justify-content: center; }
                .project-task-calendar .rbc-toolbar button { flex: 1; padding: 6px 8px; }
              }
            `}</style>
            <div className={`relative w-full sm:w-[96%] max-w-6xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border transition-all ${
              isLight 
                ? "bg-white border-slate-200 text-slate-800" 
                : "bg-gray-900 border-gray-700/80 text-white"
            }`}>
              {/* Header */}
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b shrink-0 gap-3 ${
                isLight ? "bg-slate-50 border-slate-200" : "bg-gray-800/80 border-gray-700/60"
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl border mt-0.5 shrink-0 ${
                    isLight ? "bg-amber-100 text-amber-700 border-amber-300" : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  }`}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`text-base sm:text-lg font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                        {selectedProjectDetail.client_name || "Client Project"}
                      </h3>
                      <span className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full border ${
                        isLight ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {selectedProjectDetail.proforma_number || `PROF-${selectedProjectDetail.proforma_id}`}
                      </span>
                      {selectedProjectDetail.sf_project_id && (
                        <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded-full border ${
                          isLight ? "bg-sky-100 text-sky-800 border-sky-300" : "bg-sky-500/10 text-sky-400 border-sky-500/20"
                        }`}>
                          SF: {selectedProjectDetail.sf_project_id}
                        </span>
                      )}
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize border ${
                        selectedProjectDetail.current_status === "completed"
                          ? isLight ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : selectedProjectDetail.current_status === "in_progress"
                          ? isLight ? "bg-sky-100 text-sky-800 border-sky-300" : "bg-sky-500/10 text-sky-400 border-sky-500/30"
                          : selectedProjectDetail.current_status === "blocked"
                          ? isLight ? "bg-red-100 text-red-800 border-red-300" : "bg-red-500/10 text-red-400 border-red-500/30"
                          : isLight ? "bg-slate-200 text-slate-700 border-slate-300" : "bg-slate-700/50 text-slate-300 border-slate-600/40"
                      }`}>
                        {selectedProjectDetail.current_status || "assigned"}
                      </span>
                    </div>

                    <div className={`flex items-center gap-3 text-xs mt-1.5 flex-wrap ${isLight ? "text-slate-500" : "text-gray-400"}`}>
                      <span>
                        Timeline: <strong className={isLight ? "text-slate-800" : "text-gray-200"}>
                          {selectedProjectDetail.start_date ? moment(selectedProjectDetail.start_date).format("DD MMM YYYY") : "N/A"} → {selectedProjectDetail.end_date ? moment(selectedProjectDetail.end_date).format("DD MMM YYYY") : "N/A"}
                        </strong>
                      </span>
                      <span>
                        Tasks: <strong className="text-amber-500 font-semibold">{projectTasks.length}</strong> total
                        {projectTasks.length > 0 && ` (${projectTasks.filter(t => t.status === "completed" || t.status === "done").length} completed)`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="hidden md:flex items-center gap-2">
                    <span className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border ${
                      isLight ? "bg-slate-100 text-slate-700 border-slate-300" : "bg-slate-800 text-gray-300 border-slate-700"
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Pending
                    </span>
                    <span className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border ${
                      isLight ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-sky-950/60 text-gray-300 border-sky-700/40"
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span> In Progress
                    </span>
                    <span className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border ${
                      isLight ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-amber-950/60 text-gray-300 border-amber-700/40"
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Review
                    </span>
                    <span className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border ${
                      isLight ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-emerald-950/60 text-gray-300 border-emerald-700/40"
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Done
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setShowProjectModal(false);
                      setSelectedProjectDetail(null);
                      setProjectTasks([]);
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold transition-colors ${
                      isLight 
                        ? "bg-slate-200 hover:bg-slate-300 text-slate-700" 
                        : "bg-gray-700/60 hover:bg-gray-700 text-gray-300 hover:text-white"
                    }`}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className={`project-task-calendar flex-1 overflow-y-auto p-3 sm:p-6 transition-all ${
                isLight ? "bg-white calendar-light-theme" : "bg-gray-900 calendar-dark-theme"
              }`}>
                {projectTasksLoading && projectTasks.length === 0 ? (
                  <div className={`py-24 text-center text-sm ${isLight ? "text-slate-500" : "text-gray-400"}`}>
                    <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                    Loading project tasks...
                  </div>
                ) : projectTasks.length === 0 ? (
                  <div className={`py-16 sm:py-20 text-center text-sm rounded-2xl border p-4 ${
                    isLight ? "bg-slate-50 border-slate-200 text-slate-600" : "bg-gray-800/20 border-gray-700/30 text-gray-400"
                  }`}>
                    <p className={`font-semibold mb-1 text-base ${isLight ? "text-slate-900" : "text-white"}`}>
                      No tasks synced for this project yet.
                    </p>
                    <p className="text-xs max-w-sm mx-auto leading-relaxed">
                      Tasks created or assigned in SF operations will sync automatically via webhook and appear here on their respective deadlines.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className={`mb-3 flex items-center justify-between text-xs px-1 ${
                      isLight ? "text-slate-500" : "text-gray-400"
                    }`}>
                      <span>Click any task on the calendar to view full assignee, role and description.</span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">Live sync active (20s)</span>
                    </div>
                    <div style={{ minHeight: "420px", height: "clamp(420px, 62vh, 580px)" }}>
                      <BigCalendar
                        localizer={localizer}
                        events={projectTaskEvents}
                        startAccessor="start"
                        endAccessor="end"
                        titleAccessor="title"
                        allDayAccessor="allDay"
                        views={["month", "agenda"]}
                        defaultView="month"
                        defaultDate={selectedProjectDetail.start_date ? new Date(selectedProjectDetail.start_date) : new Date()}
                        popup
                        eventPropGetter={taskEventPropGetter}
                        onSelectEvent={handleSelectTaskEvent}
                        components={{
                          agenda: {
                            event: CustomTaskAgendaEvent,
                          },
                        }}
                        style={{ height: "100%" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
