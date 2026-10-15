
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
    totals: { totalPayment: 0, totalReceived: 0, totalPending: 0, totalTds: 0 },
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
    <div className="font-body selection:bg-primary/30 antialiased overflow-x-hidden min-h-screen text-[#dee2f3]">
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
      `}</style>

      <main className="pt-8 pb-32 px-6 max-w-7xl mx-auto">
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">

          <div className="md:col-span-6 lg:col-span-4 relative group overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#31e193]/20 to-[#090e19] p-8 shadow-2xl transition-all hover:translate-y-[-4px]">
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#31e193]/20 blur-[80px] rounded-full group-hover:bg-[#31e193]/30 transition-all"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <span className="font-label uppercase tracking-widest text-[0.6875rem] text-[#31e193]/80 mb-2 block">Executive Overview</span>
                <h2 className="font-headline text-[#c2c6d6] text-lg font-medium">Total Amount</h2>
              </div>
              <div className="mt-8">
                <span className="font-headline text-4xl font-extrabold tracking-tight neon-text-gradient">{ formatCurrency(totals.totalInvoiced || totals.totalPayment || 0) }</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-6 lg:col-span-3 glass-card rounded-[2rem] p-8 border border-white/5 shadow-xl flex flex-col justify-between hover:bg-[#303541]/60 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#0566d9]/20 flex items-center justify-center text-[#adc6ff] mb-6">
                <Banknote size={ 24 } />
              </div>
              <h3 className="font-headline text-[#c2c6d6] text-base">Total Received</h3>
            </div>
            <div className="mt-4">
              <p className="font-headline text-3xl font-bold text-[#dee2f3]">{ formatCurrency(totals.totalReceived) }</p>
            </div>
          </div>

          <div className="md:col-span-6 lg:col-span-3 glass-card rounded-[2rem] p-8 border border-white/5 shadow-xl flex flex-col justify-between hover:bg-[#303541]/60 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#df7412]/20 flex items-center justify-center text-[#ffb786] mb-6">
                <Hourglass size={ 24 } />
              </div>
              <h3 className="font-headline text-[#c2c6d6] text-base">Total Pending</h3>
            </div>
            <div className="mt-4">
              <p className="font-headline text-3xl font-bold text-[#ffb786]">{ formatCurrency(totals.totalPending) }</p>
              <div className="w-full bg-[#090e19] h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="bg-[#ffb786] h-full rounded-full w-[73%]" style={ { boxShadow: '0 0 10px rgba(255, 183, 134, 0.4)' } }></div>
              </div>
              <p className="text-[#c2c6d6] text-xs mt-2">Current outstanding balance</p>
            </div>
          </div>

          <div className="md:col-span-6 lg:col-span-2 glass-card rounded-[2rem] p-8 border border-white/5 shadow-xl flex flex-col justify-between hover:bg-[#303541]/60 transition-colors">
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
              <h2 className="font-headline text-2xl font-bold text-[#dee2f3] tracking-tight">Client Ledgers</h2>
              <p className="text-[#c2c6d6] text-sm mt-1">Real-time ledger of digital transactions</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c2c6d6]" size={ 18 } />
              <input
                type="text"
                placeholder="Search by client name..."
                value={ searchQuery }
                onChange={ (e) => setSearchQuery(e.target.value) }
                className="w-full bg-[#303541] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#dee2f3] placeholder:text-[#c2c6d6]/50 focus:outline-none focus:border-[#31e193]/50 focus:ring-1 focus:ring-[#31e193]/50 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto pb-4">
            <div className="min-w-[900px] space-y-3">
              <div className="grid grid-cols-12 px-8 py-4 font-label uppercase tracking-widest text-[0.6875rem] text-[#c2c6d6]/50">
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
                  <div key={ client.client_id || idx } className="grid grid-cols-12 items-center px-8 py-5 glass-card rounded-2xl border border-white/5 hover:border-[#31e193]/20 transition-all group">
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#303541] flex items-center justify-center text-[12px] font-bold text-[#dee2f3] border border-gray-600/50 flex-shrink-0">
                        { client.client_name ? client.client_name.substring(0, 2).toUpperCase() : 'C' }
                      </div>
                      <span className="text-[#dee2f3] font-semibold text-sm truncate" title={ client.client_name }>
                        { client.client_name }
                      </span>
                    </div>
                    <div className="col-span-1 text-center text-[#c2c6d6] text-sm font-medium">
                      <span className="bg-[#303541] px-2.5 py-1 rounded-full text-xs border border-gray-700/50">
                        { proformasCount }
                      </span>
                    </div>
                    <div className="col-span-2 text-[#dee2f3] font-bold text-right">
                      { formatCurrency(totalAmt) }
                    </div>
                    <div className="col-span-2 text-[#31e193] font-bold text-right">
                      { formatCurrency(received) }
                    </div>
                    <div className="col-span-2 text-[#ffb786] font-bold text-right">
                      { formatCurrency(pending) }
                    </div>
                    <div className="col-span-2 flex justify-end">
                      { statusBadge }
                    </div>
                  </div>
                );
              }) }

              { filteredClients.length === 0 && (
                <div className="text-center text-[#c2c6d6]/60 py-12 glass-card rounded-2xl">
                  No clients found matching &quot;{ searchQuery }&quot;
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <div className="fixed top-1/4 -left-20 w-96 h-96 bg-[#31e193]/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
    </div>
  );
};

export default RevenueHistoryPage;


