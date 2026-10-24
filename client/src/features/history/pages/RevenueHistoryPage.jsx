
import React, { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../../../config/apiBaseUrl";
import Swal from "sweetalert2";
import { useSelector } from "react-redux";
import { Banknote, Hourglass, Search } from "lucide-react";

const RevenueHistoryPage = () => {
  const baseURL = API_BASE_URL;
  const { token } = useSelector((state) => state.user);
  const [data, setData] = useState({
    totals: { totalPayment: 0, totalReceived: 0, totalServiceRevenue: 0, totalAdBudgetCollected: 0, totalPending: 0, totalTds: 0 },
    clientLedger: [],
    invoices: []
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const res = await axios.get(`${baseURL}/auth/api/re_calculator/revenue/history`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        });
        if (res.data.status === "Success") {
          setData(res.data);
        }
      } catch (err) {
        console.error("Error fetching revenue:", err);
        Swal.fire({ icon: "error", title: "Error", text: "Failed to fetch revenue data." });
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchRevenue();
  }, [token]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  if (loading) {
    return <div className="p-8 text-center text-white">Loading Revenue Data...</div>;
  }

  const { totals, clientLedger, invoices } = data;

  // ── Build client rows from the new clientLedger (grouped by client_id).
  //    Falls back to legacy invoice-based grouping if clientLedger is absent/empty.
  let clientRows = [];

  if (clientLedger && clientLedger.length > 0) {
    // New path: every active proforma is included (even unpaid ones).
    // Grouping is by client_id — immune to client_name spelling differences.
    clientRows = clientLedger;
  } else {
    // Legacy fallback: derive from raw invoices (only invoiced proformas visible).
    const legacyMap = {};
    (invoices || []).forEach((inv) => {
      const cid = inv.client_id || inv.client_name || "unknown";
      const pid = inv.proforma_id || `inv_${inv.txn_id}`;

      if (!legacyMap[cid]) {
        legacyMap[cid] = {
          client_id: cid,
          client_name: inv.client_name || "Unknown Client",
          invoices_count: 0,
          total_received: 0,
          total_pending: 0,
          seen_proformas: new Set(),
        };
      }

      legacyMap[cid].invoices_count += 1;
      legacyMap[cid].total_received += Number(inv.received_amt || 0);

      // For pending: take only the latest current_amt per proforma (API sorts DESC)
      if (!legacyMap[cid].seen_proformas.has(pid)) {
        legacyMap[cid].seen_proformas.add(pid);
        legacyMap[cid].total_pending += Number(inv.current_amt || 0);
      }
      legacyMap[cid].proformas_count = legacyMap[cid].seen_proformas.size;
      legacyMap[cid].total_amount = legacyMap[cid].total_received + legacyMap[cid].total_pending;
    });
    clientRows = Object.values(legacyMap);
  }

  // Apply search filter on client_name
  const filteredClients = clientRows.filter(
    (c) => (c.client_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="history-touch font-body selection:bg-primary/30 antialiased w-full min-h-full flex-1 text-[#dee2f3]">
      <style>{ `
        .glass-card {
          background: rgba(48, 53, 65, 0.4);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }
        .neon-glow-primary {
          box-shadow: 0 0 15px rgba(49, 225, 147, 0.3);
        }
        .neon-glow-tertiary {
          box-shadow: 0 0 15px rgba(255, 183, 134, 0.3);
        }
        .neon-text-gradient {
          background: linear-gradient(135deg, #31e193 0%, #00a668 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* ── Light Mode High-Contrast Overrides ── */
        [data-theme="light"] .font-body {
          color: #1a1a2e !important;
        }
        [data-theme="light"] .rev-title {
          color: #0f172a !important;
        }
        [data-theme="light"] .rev-subtitle {
          color: #475569 !important;
        }
        [data-theme="light"] .rev-table-header {
          color: #1e293b !important;
        }
        [data-theme="light"] .rev-table-header > div {
          color: #1e293b !important;
          font-weight: 700 !important;
        }
        [data-theme="light"] .rev-client-name {
          color: #0f172a !important;
        }
        [data-theme="light"] .rev-total-amt {
          color: #0f172a !important;
        }
        [data-theme="light"] .rev-received-amt {
          color: #047857 !important;
        }
        [data-theme="light"] .rev-pending-amt {
          color: #c2410c !important;
        }
        [data-theme="light"] .glass-card {
          background: #ffffff !important;
          border: 1px solid rgba(234, 88, 12, 0.15) !important;
          box-shadow: 0 8px 24px rgba(234, 88, 12, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04) !important;
        }
        [data-theme="light"] .glass-card h3 {
          color: #4b5563 !important;
        }
        [data-theme="light"] .rev-hero-card {
          background: linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%) !important;
          border: 1.5px solid rgba(16, 185, 129, 0.35) !important;
          box-shadow: 0 12px 32px rgba(16, 185, 129, 0.12) !important;
        }
        [data-theme="light"] .rev-hero-card .neon-text-gradient {
          background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
        }
        [data-theme="light"] .rev-hero-card h2 {
          color: #374151 !important;
        }
        [data-theme="light"] .rev-card-blue {
          border: 1.5px solid rgba(59, 130, 246, 0.35) !important;
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.08) !important;
        }
        [data-theme="light"] .rev-card-blue p {
          color: #1e3a8a !important;
        }
        [data-theme="light"] .rev-service-subtext {
          color: #047857 !important;
        }
        [data-theme="light"] .rev-adbudget-subtext {
          color: #1d4ed8 !important;
        }
        [data-theme="light"] .rev-subtext-border {
          border-color: rgba(0, 0, 0, 0.1) !important;
        }
        [data-theme="light"] .rev-card-orange {
          border: 1.5px solid rgba(249, 115, 22, 0.35) !important;
          box-shadow: 0 8px 24px rgba(249, 115, 22, 0.08) !important;
        }
        [data-theme="light"] .rev-card-orange p {
          color: #c2410c !important;
        }
        [data-theme="light"] .rev-card-purple {
          border: 1.5px solid rgba(168, 85, 247, 0.35) !important;
          box-shadow: 0 8px 24px rgba(168, 85, 247, 0.08) !important;
        }
        [data-theme="light"] .rev-card-purple p {
          color: #6b21a8 !important;
        }
        [data-theme="light"] .rev-row {
          background: #ffffff !important;
          border: 1px solid rgba(234, 88, 12, 0.14) !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03) !important;
        }
        [data-theme="light"] .rev-row:hover {
          border-color: rgba(234, 88, 12, 0.35) !important;
          background: #fffbf7 !important;
        }
        [data-theme="light"] .rev-avatar {
          background: #fef3e8 !important;
          color: #ea580c !important;
          border-color: rgba(234, 88, 12, 0.25) !important;
        }
        [data-theme="light"] .rev-input {
          background: #ffffff !important;
          color: #1a1a2e !important;
          border: 1px solid rgba(234, 88, 12, 0.25) !important;
        }
        [data-theme="light"] .rev-input:focus {
          border-color: #ea580c !important;
          box-shadow: 0 0 0 2px rgba(234, 88, 12, 0.15) !important;
        }
      `}</style>

      <div className="py-2 sm:py-4 px-1 sm:px-2 max-w-7xl mx-auto space-y-6">
        <section className="grid grid-cols-2 xl:grid-cols-12 gap-3 md:gap-6 mb-8">

          <div className="col-span-2 sm:col-span-1 xl:col-span-4 relative overflow-hidden rounded-[1.5rem] xl:rounded-[2rem] bg-gradient-to-br from-[#31e193]/20 to-[#090e19] rev-hero-card p-4 sm:p-6 xl:p-8 shadow-2xl">
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#31e193]/20 blur-[80px] rounded-full group-hover:bg-[#31e193]/30 transition-all"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <span className="font-label uppercase tracking-widest text-[0.6875rem] text-[#31e193]/80 mb-2 block">Executive Overview</span>
                <h2 className="font-headline text-[#c2c6d6] text-lg font-medium">Total Amount</h2>
              </div>
              <div className="mt-4 xl:mt-8">
                <span className="font-headline text-2xl sm:text-3xl xl:text-4xl font-extrabold tracking-tight neon-text-gradient break-words">{ formatCurrency(totals.totalInvoiced || totals.totalPayment || 0) }</span>
              </div>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 xl:col-span-3 glass-card rev-card-blue rounded-[1.5rem] xl:rounded-[2rem] p-4 sm:p-6 xl:p-8 border border-white/5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#0566d9]/20 flex items-center justify-center text-[#adc6ff] mb-6">
                <Banknote size={ 24 } />
              </div>
              <h3 className="font-headline text-[#c2c6d6] text-base">Total Received</h3>
            </div>
            <div className="mt-4">
              <p className="font-headline text-2xl xl:text-3xl font-bold text-[#dee2f3] break-words">{ formatCurrency(totals.totalReceived) }</p>
              {(Number(totals.totalServiceRevenue || 0) > 0 || Number(totals.totalAdBudgetCollected || 0) > 0) && (
                <div className="mt-3 pt-3 border-t border-white/10 rev-subtext-border text-xs space-y-1.5">
                  <div className="flex justify-between items-center text-[#31e193] rev-service-subtext">
                    <span className="opacity-90">Service Revenue:</span>
                    <span className="font-bold">{ formatCurrency(totals.totalServiceRevenue) }</span>
                  </div>
                  <div className="flex justify-between items-center text-[#60a5fa] rev-adbudget-subtext">
                    <span className="opacity-90">Ad Budget Collected:</span>
                    <span className="font-bold">{ formatCurrency(totals.totalAdBudgetCollected) }</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 xl:col-span-3 glass-card rev-card-orange rounded-[1.5rem] xl:rounded-[2rem] p-4 sm:p-6 xl:p-8 border border-white/5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#df7412]/20 flex items-center justify-center text-[#ffb786] mb-6">
                <Hourglass size={ 24 } />
              </div>
              <h3 className="font-headline text-[#c2c6d6] text-base">Total Pending</h3>
            </div>
            <div className="mt-4">
              <p className="font-headline text-2xl xl:text-3xl font-bold text-[#ffb786] break-words">{ formatCurrency(totals.totalPending) }</p>
              <div className="w-full bg-[#090e19] h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="bg-[#ffb786] h-full rounded-full w-[73%]" style={ { boxShadow: '0 0 10px rgba(255, 183, 134, 0.4)' } }></div>
              </div>
              <p className="text-[#c2c6d6] text-xs mt-2">Current outstanding balance</p>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 xl:col-span-2 glass-card rev-card-purple rounded-[1.5rem] xl:rounded-[2rem] p-4 sm:p-6 xl:p-8 border border-white/5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#9333ea]/20 flex items-center justify-center text-[#d8b4fe] mb-6">
                <Banknote size={ 24 } />
              </div>
              <h3 className="font-headline text-[#c2c6d6] text-base">Total TDS</h3>
            </div>
            <div className="mt-4">
              <p className="font-headline text-2xl font-bold text-[#d8b4fe]">{ formatCurrency(totals.totalTds || 0) }</p>
            </div>
          </div>

        </section>

        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-headline text-2xl font-bold text-gray-900 dark:text-[#dee2f3] rev-title tracking-tight">Client Ledgers</h2>
              <p className="text-gray-600 dark:text-[#c2c6d6] rev-subtitle text-sm mt-1">Real-time ledger of digital transactions</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#c2c6d6]" size={ 18 } />
              <input
                type="text"
                placeholder="Search by client name..."
                value={ searchQuery }
                onChange={ (e) => setSearchQuery(e.target.value) }
                className="w-full bg-[#303541] rev-input border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-base text-[#dee2f3] placeholder:text-[#c2c6d6]/50 focus:outline-none focus:border-[#31e193]/50 focus:ring-1 focus:ring-[#31e193]/50 transition-all"
              />
            </div>
          </div>

          <div className="history-cards xl:hidden pb-40">
            { filteredClients.map((client, idx) => {
              const totalAmt = client.total_amount !== undefined && client.total_amount !== null
                ? Number(client.total_amount)
                : (Number(client.total_received || 0) + Number(client.total_pending || 0));
              const received = Number(client.total_received || 0);
              const pending = Number(client.total_pending || 0);
              const proformasCount = client.proformas_count || client.invoices_count || 0;
              const status = pending <= 0 && received > 0 ? "Clear" : pending > 0 && received > 0 ? "Partial" : pending > 0 ? "Pending" : "Draft";
              return (
                <div key={ client.client_id || idx } className="glass-card rev-row rounded-2xl border border-white/5 p-4 space-y-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-[#303541] rev-avatar flex items-center justify-center text-sm font-bold text-[#dee2f3] border border-gray-600/50 shrink-0">
                      { client.client_name ? client.client_name.substring(0, 2).toUpperCase() : "C" }
                    </div>
                    <p className="text-gray-900 dark:text-[#dee2f3] font-semibold text-base break-words">{ client.client_name }</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-[#c2c6d6]/70">Proformas</p>
                      <p className="font-semibold">{ proformasCount }</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-[#c2c6d6]/70">Total</p>
                      <p className="font-bold break-words">{ formatCurrency(totalAmt) }</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-[#c2c6d6]/70">Received</p>
                      <p className="font-bold text-emerald-700 dark:text-[#31e193] break-words">{ formatCurrency(received) }</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-[#c2c6d6]/70">Pending</p>
                      <p className="font-bold text-amber-700 dark:text-[#ffb786] break-words">{ formatCurrency(pending) }</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold">{ status }</p>
                </div>
              );
            }) }
            { filteredClients.length === 0 && (
              <div className="col-span-full text-center text-gray-600 dark:text-[#c2c6d6]/60 py-12 glass-card rounded-2xl">
                No clients found matching &quot;{ searchQuery }&quot;
              </div>
            )}
          </div>

          <div className="hidden xl:block overflow-x-auto pb-4">
            <div className="min-w-[640px] space-y-3">
              <div className="grid grid-cols-12 px-8 py-3.5 font-label uppercase tracking-wider text-xs font-bold text-gray-800 dark:text-[#c2c6d6]/70 rev-table-header">
                <div className="col-span-3">Client</div>
                <div className="col-span-1 text-center">Proformas</div>
                <div className="col-span-2 text-right">Total Amount</div>
                <div className="col-span-2 text-right">Received</div>
                <div className="col-span-2 text-right">Pending</div>
                <div className="col-span-2 text-right">Status</div>
              </div>

              { filteredClients.map((client, idx) => {
                const totalAmt = client.total_amount !== undefined && client.total_amount !== null
                  ? Number(client.total_amount)
                  : (Number(client.total_received || 0) + Number(client.total_pending || 0));
                const received = Number(client.total_received || 0);
                const pending = Number(client.total_pending || 0);
                const proformasCount = client.proformas_count || client.invoices_count || 0;

                let statusBadge = null;
                if (pending <= 0 && received > 0) {
                  statusBadge = <span className="px-4 py-1.5 rounded-full bg-[#31e193]/10 text-[#31e193] text-[10px] font-bold uppercase tracking-wider border border-[#31e193]/20 neon-glow-primary">Clear</span>;
                } else if (pending > 0 && received > 0) {
                  statusBadge = <span className="px-4 py-1.5 rounded-full bg-[#ffb786]/10 text-[#ffb786] text-[10px] font-bold uppercase tracking-wider border border-[#ffb786]/20 neon-glow-tertiary">Partial</span>;
                } else if (pending > 0 && received === 0) {
                  statusBadge = <span className="px-4 py-1.5 rounded-full bg-[#ffb4ab]/10 text-[#ffb4ab] text-[10px] font-bold uppercase tracking-wider border border-[#ffb4ab]/20" style={ { boxShadow: '0 0 15px rgba(255,180,171,0.2)' } }>Pending</span>;
                } else {
                  statusBadge = <span className="px-4 py-1.5 rounded-full bg-[#303541] text-[#dee2f3] text-[10px] font-bold uppercase tracking-wider border border-[#424754]">Draft</span>;
                }

                return (
                  <div key={ client.client_id || idx } className="grid grid-cols-12 items-center px-8 py-5 glass-card rev-row rounded-2xl border border-white/5 hover:border-[#31e193]/20 transition-all group">
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#303541] rev-avatar flex items-center justify-center text-[12px] font-bold text-[#dee2f3] border border-gray-600/50 flex-shrink-0">
                        { client.client_name ? client.client_name.substring(0, 2).toUpperCase() : 'C' }
                      </div>
                      <span className="text-gray-900 dark:text-[#dee2f3] rev-client-name font-semibold text-sm truncate" title={ client.client_name }>
                        { client.client_name }
                      </span>
                    </div>
                    <div className="col-span-1 text-center text-gray-700 dark:text-[#c2c6d6] text-sm font-medium">
                      <span className="bg-[#303541] rev-avatar px-2.5 py-1 rounded-full text-xs border border-gray-700/50 font-semibold">
                        { proformasCount }
                      </span>
                    </div>
                    <div className="col-span-2 text-gray-900 dark:text-[#dee2f3] rev-total-amt font-bold text-right">
                      { formatCurrency(totalAmt) }
                    </div>
                    <div className="col-span-2 text-emerald-700 dark:text-[#31e193] rev-received-amt font-bold text-right">
                      { formatCurrency(received) }
                    </div>
                    <div className="col-span-2 text-amber-700 dark:text-[#ffb786] rev-pending-amt font-bold text-right">
                      { formatCurrency(pending) }
                    </div>
                    <div className="col-span-2 flex justify-end">
                      { statusBadge }
                    </div>
                  </div>
                );
              }) }

              { filteredClients.length === 0 && (
                <div className="text-center text-gray-600 dark:text-[#c2c6d6]/60 py-12 glass-card rounded-2xl">
                  No clients found matching &quot;{ searchQuery }&quot;
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="fixed top-1/4 -left-20 w-96 h-96 bg-[#31e193]/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
    </div>
  );
};

export default RevenueHistoryPage;


