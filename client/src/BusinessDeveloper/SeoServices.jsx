import axios from "axios";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { clearUser } from "../redux/user/userSlice";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { 
  Building2, Globe, Search, Plus, Trash2, Edit2, Download, 
  ChevronLeft, ChevronRight, X, AlertCircle, Save, TrendingUp
} from "lucide-react";
import API_BASE_URL from "../config/apiBaseUrl";

const SeoServices = () => {
  const baseURL = API_BASE_URL;
  const { currentUser, token } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // data / state
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // add client
  const [newClientName, setNewClientName] = useState("");
  const [newClientWebsite, setNewClientWebsite] = useState("");
  const [addingClient, setAddingClient] = useState(false);

  // per-client keyword input
  const [keywordTextMap, setKeywordTextMap] = useState({});
  const [addingKeywordForClient, setAddingKeywordForClient] = useState(null);

  // edit client state
  const [editingClientId, setEditingClientId] = useState(null);
  const [editNameMap, setEditNameMap] = useState({});
  const [editWebsiteMap, setEditWebsiteMap] = useState({});
  const [savingEditForClient, setSavingEditForClient] = useState(null);

  // delete keyword state (stores currently deleting keyword id)
  const [deletingKeywordId, setDeletingKeywordId] = useState(null);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Helper: normalize rows returned by API into array of clients w/ keywords
  const normalizeRowsToClients = useCallback((rows) => {
    if (!Array.isArray(rows)) return [];

    const looksNested =
      rows.length && rows[0] && Array.isArray(rows[0].keywords);
    if (looksNested) {
      return rows.map((c) => ({
        id: c.id,
        name: c.name,
        website: c.website,
        keywords: Array.isArray(c.keywords)
          ? c.keywords.map((k) => ({
              id: k.id ?? k.keyword_id ?? null,
              keyword: k.keyword,
              created_at: k.created_at ?? k.keyword_created_at ?? null,
            }))
          : [],
      }));
    }

    const map = new Map();
    rows.forEach((r) => {
      const id = r.client_id ?? r.id ?? r.clientId ?? null;
      const clientKey =
        id !== null && id !== undefined
          ? `id:${id}`
          : `nm:${r.name || ""}|ws:${r.website || ""}`;
      if (!map.has(clientKey)) {
        map.set(clientKey, {
          id: id,
          name: r.name,
          website: r.website,
          keywords: [],
        });
      }
      if (r.keyword) {
        map.get(clientKey).keywords.push({
          id: r.keyword_id ?? r.keywordId ?? null,
          keyword: r.keyword,
          created_at: r.keyword_created_at || r.created_at || null,
        });
      }
    });
    return Array.from(map.values());
  }, []);

  // Fetch clients
  async function fetchClients(signal) {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `${baseURL}/auth/api/re_calculator/getSeoClientsWithKeywords`,
        {
          signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        let msg = `Server returned ${res.status}`;
        try {
          const js = await res.json();
          if (js && js.message) msg = js.message;
        } catch {
          console.log("catch");
        }
        throw new Error(msg);
      }
      const json = await res.json();
      const rows = json && json.data ? json.data : json;
      const grouped = normalizeRowsToClients(rows || []);
      setClients(grouped);

      const totalPages = Math.max(1, Math.ceil(grouped.length / pageSize));
      if (currentPage > totalPages) setCurrentPage(totalPages);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("fetchClients error:", err);
      setError(err.message || "Failed to fetch clients");
      if (err.response && err.response.status === 401) {
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
  }

  // effect: initial fetch (with AbortController)
  useEffect(() => {
    const ac = new AbortController();
    fetchClients(ac.signal);
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reset to first page when pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  // Add client
  async function handleAddClient(e) {
    e.preventDefault();
    const name = (newClientName || "").trim();
    const website = (newClientWebsite || "").trim();
    if (!name || !website) return alert("Name & Website required");

    const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
    if (!urlRegex.test(website))
      return alert("Website must include http/https");

    try {
      setAddingClient(true);
      const res = await fetch(
        `${baseURL}/auth/api/re_calculator/seoClientsDetails`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name, website }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || `Server ${res.status}`);

      setNewClientName("");
      setNewClientWebsite("");
      await fetchClients();
      setCurrentPage(1);
    } catch (err) {
      console.error("Add client error:", err);
      alert(err.message || "Failed to add client");
    } finally {
      setAddingClient(false);
    }
  }

  // Add keyword for client
  async function handleAddKeyword(e, clientId) {
    e.preventDefault();
    const keywordText = (keywordTextMap[clientId] || "").trim();
    if (!keywordText) return alert("Keyword required");

    try {
      setAddingKeywordForClient(clientId);
      const res = await fetch(
        `${baseURL}/auth/api/re_calculator/seoWebsiteKeyword/${clientId}`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ keyword: keywordText }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || `Server ${res.status}`);

      setKeywordTextMap((prev) => ({ ...prev, [clientId]: "" }));
      await fetchClients();
    } catch (err) {
      console.error("Add keyword error:", err);
      alert(err.message || "Failed to add keyword");
    } finally {
      setAddingKeywordForClient(null);
    }
  }

  // Edit flows
  function handleEditClick(client) {
    if (!client || !client.id) {
      return alert("Cannot edit this client (missing id). Refresh list.");
    }
    setEditingClientId(client.id);
    setEditNameMap((p) => ({ ...p, [client.id]: client.name || "" }));
    setEditWebsiteMap((p) => ({ ...p, [client.id]: client.website || "" }));
  }

  function handleCancelEdit(clientId) {
    setEditingClientId((cur) => (cur === clientId ? null : cur));
    setEditNameMap((p) => {
      const copy = { ...p };
      delete copy[clientId];
      return copy;
    });
    setEditWebsiteMap((p) => {
      const copy = { ...p };
      delete copy[clientId];
      return copy;
    });
  }

  async function handleSaveEdit(e, clientId) {
    if (e && e.preventDefault) e.preventDefault();
    const name = (editNameMap[clientId] || "").trim();
    const website = (editWebsiteMap[clientId] || "").trim();
    if (!name || !website) return alert("Name & Website are required");

    const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
    if (!urlRegex.test(website))
      return alert("Website must include http/https");

    try {
      setSavingEditForClient(clientId);
      const res = await fetch(
        `${baseURL}/auth/api/re_calculator/updateSeoClient/${clientId}`,
        {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name, website }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || `Server ${res.status}`);

      setClients((prev) =>
        prev.map((c) => (c.id === clientId ? { ...c, name, website } : c))
      );
      setEditingClientId(null);
      setEditNameMap((p) => {
        const copy = { ...p };
        delete copy[clientId];
        return copy;
      });
      setEditWebsiteMap((p) => {
        const copy = { ...p };
        delete copy[clientId];
        return copy;
      });
    } catch (err) {
      console.error("Save edit error:", err);
      alert(err.message || "Failed to update client");
    } finally {
      setSavingEditForClient(null);
    }
  }

  // Delete keyword handler
  async function handleDeleteKeyword(keywordId, clientId) {
    console.log(keywordId, clientId);

    if (!keywordId) {
      return alert("Cannot delete keyword (missing id).");
    }
    const ok = window.confirm(
      "Delete this keyword? This action cannot be undone."
    );
    if (!ok) return;

    try {
      setDeletingKeywordId(keywordId);
      const res = await fetch(
        `${baseURL}/auth/api/re_calculator/deleteSeoKeyword/${keywordId}`,
        { 
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || `Server ${res.status}`);

      // remove from local state (optimistic update confirmed)
      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId
            ? { ...c, keywords: c.keywords.filter((k) => k.id !== keywordId) }
            : c
        )
      );
    } catch (err) {
      console.error("Delete keyword error:", err);
      alert(err.message || "Failed to delete keyword");
    } finally {
      setDeletingKeywordId(null);
    }
  }

  // Open search in new tab
  function openSearch(keyword) {
    if (!keyword) return;
    const url = `https://www.google.com/search?q=${encodeURIComponent(
      keyword
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  // Pagination computed values
  const totalItems = clients.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return clients.slice(start, start + pageSize);
  }, [clients, currentPage, pageSize]);

  console.log(paginatedClients);

  // Helper to render page numbers compacted
  function renderPageNumbers() {
    const pages = [];
    const maxButtons = 7;
    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const left = Math.max(2, currentPage - 1);
      const right = Math.min(totalPages - 1, currentPage + 1);
      pages.push(1);
      if (left > 2) pages.push("left-ellipsis");
      for (let i = left; i <= right; i++) pages.push(i);
      if (right < totalPages - 1) pages.push("right-ellipsis");
      pages.push(totalPages);
    }

    return pages.map((p, idx) => {
      if (p === "left-ellipsis" || p === "right-ellipsis")
        return (
          <span key={p + idx} className="px-2 text-white/40">
            ...
          </span>
        );
      return (
        <button
          key={p}
          onClick={() => setCurrentPage(p)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${
            p === currentPage 
              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow-[0_0_10px_rgba(52,211,153,0.1)]" 
              : "bg-white/5 text-white/60 border border-white/5 hover:bg-white/10 hover:text-white"
          }`}
        >
          {p}
        </button>
      );
    });
  }

  const handleDeleteClient = async (clientID) => {
    try {
      const ok = window.confirm(
        "Are you Sure, Do you want to Delete this Client?"
      );
      if (!ok) return;
      const res = await axios.delete(
        `${baseURL}/auth/api/re_calculator/deleteSeoClient/${clientID}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(res.data);
      if (res.data.status === "Success") {
        alert(`${res.data.message}` || "Client Deleted Successfully");
        fetchClients();
      }
    } catch (error) {
      console.log(error);
    }
  };

  function handleOpenPagespeedPdf(client) {
    if (!client || !client.website) {
      return alert("Client website not available");
    }
    const pdfUrl = `${baseURL}/auth/api/re_calculator/pagespeedReportpdf?url=${encodeURIComponent(
      client.website
    )}&strategy=desktop`;
    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  }

  // Add Keyword on Enter
  const handleKeywordKeyDown = (e, clientId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword(e, clientId);
    }
  };

  return (
    <div className="flex-1 w-full h-full text-white overflow-hidden flex flex-col font-sans transition-all duration-300">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6 lg:space-y-8">
          
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                  SEO Dashboard
                </h1>
              </div>
              <p className="text-white/50 text-sm pl-13">Manage your clients and keyword tracking</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
              <span className="text-xs text-white/50 font-mono tracking-wider">{baseURL.replace('https://', '')}</span>
            </div>
          </header>

          {/* Add Client Form */}
          <section className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl p-5 shadow-sm backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 bg-gradient-to-b from-orange-400 to-orange-500 h-full"></div>
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider pl-1">Client Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-orange-400/50 focus:bg-white/10 transition-all"
                    placeholder="E.g. Acme Corp"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider pl-1">Website URL</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-orange-400/50 focus:bg-white/10 transition-all"
                    placeholder="https://example.com"
                    value={newClientWebsite}
                    onChange={(e) => setNewClientWebsite(e.target.value)}
                  />
                </div>
              </div>
              <button
                onClick={handleAddClient}
                disabled={addingClient}
                className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-orange-500/25 transition-all transform hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {addingClient ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : <Plus className="w-4 h-4" />}
                {addingClient ? "Adding..." : "Add Client"}
              </button>
            </div>
          </section>

          {/* Controls */}
          <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3">
            <div className="text-sm text-white/60">
              Showing <strong className="text-white">{(currentPage - 1) * pageSize + 1}</strong> to <strong className="text-white">{Math.min(currentPage * pageSize, totalItems)}</strong> of <strong className="text-white">{totalItems}</strong> clients
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/40 font-semibold uppercase tracking-wider">Per page</span>
              <div className="relative">
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="appearance-none bg-transparent border border-white/10 rounded-lg pl-3 pr-8 py-1.5 text-sm text-white outline-none focus:border-white/20"
                >
                  <option value={5} className="bg-gray-800 text-white">5</option>
                  <option value={10} className="bg-gray-800 text-white">10</option>
                  <option value={20} className="bg-gray-800 text-white">20</option>
                  <option value={50} className="bg-gray-800 text-white">50</option>
                </select>
              </div>
            </div>
          </section>

          {/* Client List */}
          <section className="space-y-4">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-white/10 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                <p className="text-white/40 text-sm">Loading clients data...</p>
              </div>
            ) : error ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex flex-col items-center text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
                <p className="text-red-300">{error}</p>
              </div>
            ) : clients.length === 0 ? (
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/10 shadow-inner inline-flex">
                  <Building2 className="w-8 h-8 text-white/20" />
                </div>
                <h3 className="text-lg font-semibold text-white/80 mb-1">No Clients Found</h3>
                <p className="text-white/40 text-sm max-w-sm">You haven't added any clients yet. Add a client above to start tracking keywords.</p>
              </div>
            ) : (
              paginatedClients.map((client) => (
                <div key={client.id ?? `${client.name}-${client.website}`} className="group bg-gradient-to-br from-white/[0.03] to-white/[0.01] border w-full border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.04] transition-all duration-300 rounded-2xl overflow-hidden shadow-sm">
                  
                  {/* Card Header */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between p-5 md:p-6 border-b border-white/5 gap-4">
                    <div className="flex-1 min-w-0">
                      {editingClientId === client.id ? (
                        <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/10">
                          <input
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-orange-400/50 focus:bg-white/10 outline-none"
                            placeholder="Client Name"
                            value={editNameMap[client.id] ?? ""}
                            onChange={(e) => setEditNameMap((prev) => ({ ...prev, [client.id]: e.target.value }))}
                          />
                          <input
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-orange-400/50 focus:bg-white/10 outline-none"
                            placeholder="Website URL"
                            value={editWebsiteMap[client.id] ?? ""}
                            onChange={(e) => setEditWebsiteMap((prev) => ({ ...prev, [client.id]: e.target.value }))}
                          />
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={(e) => handleSaveEdit(e, client.id)}
                              disabled={savingEditForClient === client.id}
                              className="px-4 py-1.5 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500 hover:text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                            >
                              <Save className="w-3.5 h-3.5" /> Save
                            </button>
                            <button
                              onClick={() => handleCancelEdit(client.id)}
                              disabled={savingEditForClient === client.id}
                              className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                            >
                              <X className="w-3.5 h-3.5" /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-lg md:text-xl font-bold tracking-wide text-white flex items-center gap-2 mb-1.5">
                            {client.name}
                          </h3>
                          <a href={client.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-red-400/80 hover:text-red-400 transition-colors">
                            <Globe className="w-3.5 h-3.5" /> {client.website}
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 mr-2 flex items-center gap-1.5 shadow-inner">
                        <span className="text-[10px] uppercase text-white/40 font-bold tracking-wider">Keywords</span>
                        <span className="text-sm font-semibold text-yellow-400">{client.keywords.length}</span>
                      </div>
                      
                      {editingClientId !== client.id && client.id && (
                        <button
                          onClick={() => handleEditClick(client)}
                          className="p-1.5 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-lg transition-colors"
                          title="Edit Client"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteClient(client.id)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-colors"
                        title="Delete Client"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                         onClick={() => handleOpenPagespeedPdf(client)}
                         className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" /> PageSpeed
                      </button>
                    </div>
                  </div>

                  {/* Card Body - Keywords */}
                  <div className="p-5 md:p-6 bg-black/20">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                      <div className="relative flex-1 w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 outline-none focus:border-orange-400/40 focus:bg-white/10 transition-all"
                          placeholder="Add new keyword..."
                          value={keywordTextMap[client.id] || ""}
                          onChange={(e) => setKeywordTextMap((prev) => ({ ...prev, [client.id]: e.target.value }))}
                          onKeyDown={(e) => handleKeywordKeyDown(e, client.id)}
                        />
                      </div>
                      <button
                        onClick={(e) => handleAddKeyword(e, client.id)}
                        disabled={addingKeywordForClient === client.id || !keywordTextMap[client.id]?.trim()}
                        className="w-full sm:w-auto px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 flex shrink-0 items-center justify-center min-w-[70px]"
                      >
                        {addingKeywordForClient === client.id ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Add"}
                      </button>
                    </div>

                    {client.keywords.length > 0 ? (
                      <div className="flex flex-wrap gap-2.5">
                        {client.keywords.map((k) => (
                          <div key={k.id ?? k.keyword} className="group/kw flex items-center bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full pl-3 pr-1 py-1 transition-all shadow-sm">
                            <button onClick={() => openSearch(k.keyword)} className="text-xs text-white/80 hover:text-white transition-colors mr-2 flex items-center gap-1.5 focus:outline-none">
                              <Search className="w-3 h-3 text-white/40" /> {k.keyword}
                            </button>
                            <button
                              onClick={() => handleDeleteKeyword(k.id, client.id)}
                              disabled={deletingKeywordId === k.id}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors focus:outline-none"
                              title="Delete keyword"
                            >
                              {deletingKeywordId === k.id ? (
                                <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                              ) : <X className="w-3 h-3" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-white/20 italic mt-2">No keywords tracked yet.</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </section>

          {/* Pagination */}
          {clients.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 pb-2 border-t border-white/10">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="First Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-white/10 mx-1"></div>
                {renderPageNumbers()}
                <div className="w-px h-4 bg-white/10 mx-1"></div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs text-white/40 font-semibold tracking-wider">
                PAGE {currentPage} OF {totalPages}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SeoServices;
