const fs = require('fs');

const componentCode = `
import React, { useState, useEffect } from "react";
import axios from "axios";
import { baseURL } from "../config";
import Swal from "sweetalert2";
import { format } from "date-fns";

const RevenueHistory = () => {
  const [data, setData] = useState({
    totals: { totalPayment: 0, totalReceived: 0, totalPending: 0 },
    invoices: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(\`\${baseURL}/auth/api/calculator/revenue/history\`, {
          headers: { Authorization: \`Bearer \${token}\` }
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
    fetchRevenue();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return <div className="p-8 text-center text-white">Loading Revenue Data...</div>;
  }

  const { totals, invoices } = data;

  return (
    <div className="font-body selection:bg-primary/30 antialiased overflow-x-hidden min-h-screen text-[#dee2f3]">
      {/* Styles copied from generated design */}
      <style>{\`
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
      \`}</style>

      <main className="pt-8 pb-32 px-6 max-w-7xl mx-auto">
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">
          
          <div className="md:col-span-6 lg:col-span-5 relative group overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#31e193]/20 to-[#090e19] p-8 shadow-2xl transition-all hover:translate-y-[-4px]">
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#31e193]/20 blur-[80px] rounded-full group-hover:bg-[#31e193]/30 transition-all"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <span className="font-label uppercase tracking-widest text-[0.6875rem] text-[#31e193]/80 mb-2 block">Executive Overview</span>
                <h2 className="font-headline text-[#c2c6d6] text-lg font-medium">Total Revenue</h2>
              </div>
              <div className="mt-8">
                <span className="font-headline text-5xl font-extrabold tracking-tight neon-text-gradient">{formatCurrency(totals.totalPayment)}</span>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-6 lg:col-span-3 glass-card rounded-[2rem] p-8 border border-white/5 shadow-xl flex flex-col justify-between hover:bg-[#303541]/60 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#0566d9]/20 flex items-center justify-center text-[#adc6ff] mb-6">
                <span className="material-symbols-outlined" data-icon="payments">payments</span>
              </div>
              <h3 className="font-headline text-[#c2c6d6] text-base">Total Received</h3>
            </div>
            <div className="mt-4">
              <p className="font-headline text-3xl font-bold text-[#dee2f3]">{formatCurrency(totals.totalReceived)}</p>
            </div>
          </div>
          
          <div className="md:col-span-12 lg:col-span-4 glass-card rounded-[2rem] p-8 border border-white/5 shadow-xl flex flex-col justify-between hover:bg-[#303541]/60 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#df7412]/20 flex items-center justify-center text-[#ffb786] mb-6">
                <span className="material-symbols-outlined" data-icon="hourglass_empty">hourglass_empty</span>
              </div>
              <h3 className="font-headline text-[#c2c6d6] text-base">Total Pending</h3>
            </div>
            <div className="mt-4">
              <p className="font-headline text-3xl font-bold text-[#ffb786]">{formatCurrency(totals.totalPending)}</p>
              <div className="w-full bg-[#090e19] h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="bg-[#ffb786] h-full rounded-full w-[73%]" style={{ boxShadow: '0 0 10px rgba(255, 183, 134, 0.4)' }}></div>
              </div>
              <p className="text-[#c2c6d6] text-xs mt-2">Current outstanding balance</p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-headline text-2xl font-bold text-[#dee2f3] tracking-tight">Recent Invoices</h2>
              <p className="text-[#c2c6d6] text-sm mt-1">Real-time ledger of digital transactions</p>
            </div>
          </div>
          
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[800px] space-y-3">
              <div className="grid grid-cols-12 px-8 py-4 font-label uppercase tracking-widest text-[0.6875rem] text-[#c2c6d6]/50">
                <div className="col-span-2">Invoice #</div>
                <div className="col-span-3">Client</div>
                <div className="col-span-2">Received</div>
                <div className="col-span-2">Pending</div>
                <div className="col-span-3 text-right">Status</div>
              </div>
              
              {invoices.map((inv, idx) => {
                const received = Number(inv.received_amt || 0);
                const pending = Number(inv.current_amt || 0);
                
                let statusBadge = null;
                if (pending === 0 && received > 0) {
                  statusBadge = <span className="px-4 py-1.5 rounded-full bg-[#31e193]/10 text-[#31e193] text-[10px] font-bold uppercase tracking-wider border border-[#31e193]/20 neon-glow-primary">Paid</span>;
                } else if (pending > 0 && received > 0) {
                  statusBadge = <span className="px-4 py-1.5 rounded-full bg-[#ffb786]/10 text-[#ffb786] text-[10px] font-bold uppercase tracking-wider border border-[#ffb786]/20 neon-glow-tertiary">Partial</span>;
                } else if (pending > 0 && received === 0) {
                  statusBadge = <span className="px-4 py-1.5 rounded-full bg-[#ffb4ab]/10 text-[#ffb4ab] text-[10px] font-bold uppercase tracking-wider border border-[#ffb4ab]/20" style={{ boxShadow: '0 0 15px rgba(255,180,171,0.2)' }}>Pending</span>;
                } else {
                  statusBadge = <span className="px-4 py-1.5 rounded-full bg-[#303541] text-[#dee2f3] text-[10px] font-bold uppercase tracking-wider border border-[#424754]">Draft</span>;
                }

                return (
                  <div key={idx} className="grid grid-cols-12 items-center px-8 py-5 glass-card rounded-2xl border border-white/5 hover:border-[#31e193]/20 transition-all group">
                    <div className="col-span-2 font-mono text-sm text-[#dee2f3] font-medium">#{inv.bill_number || inv.txn_id.substring(0, 8)}</div>
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#303541] flex items-center justify-center text-[10px] font-bold text-[#dee2f3]">{inv.client_name ? inv.client_name.substring(0,2).toUpperCase() : 'C'}</div>
                      <span className="text-[#dee2f3] font-medium">{inv.client_name}</span>
                    </div>
                    <div className="col-span-2 text-[#31e193] font-bold">{formatCurrency(received)}</div>
                    <div className="col-span-2 text-[#ffb786] font-bold">{formatCurrency(pending)}</div>
                    <div className="col-span-3 flex justify-end">
                      {statusBadge}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      
      <div className="fixed top-1/4 -left-20 w-96 h-96 bg-[#31e193]/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
    </div>
  );
};

export default RevenueHistory;
`;

fs.writeFileSync('src/Admin/RevenueHistory.jsx', componentCode);
console.log("Component successfully generated!");
