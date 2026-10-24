import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API_BASE_URL from "../../../config/apiBaseUrl";

const money = (value) => {
  const amount = Number(value || 0);
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export default function PublicQuotationPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/api/re_calculator/public/quotation/${token}`);
        const result = await response.json();
        if (!response.ok || result.status !== "Success") {
          throw new Error(result.message || "This quotation link is not valid.");
        }
        if (!cancelled) setData(result.data || {});
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not open this quotation.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (token) load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return <main className="min-h-screen bg-indigo-50 text-indigo-950 grid place-items-center">Loading quotation...</main>;
  }

  if (error) {
    return <main className="min-h-screen bg-indigo-50 text-indigo-950 grid place-items-center px-4 text-center">{error}</main>;
  }

  const services = asArray(data.services);
  const ads = asArray(data.ads);
  const notes = asArray(data.notes);
  const clientLabel = data.client_organization || data.client_name || "Client";

  return (
    <main className="min-h-screen bg-indigo-50 text-slate-900 px-4 py-8">
      <article className="max-w-3xl mx-auto bg-white border border-indigo-100 rounded-2xl overflow-hidden shadow-sm">
        <header className="bg-indigo-900 text-white px-6 py-6">
          <p className="text-xs tracking-[0.2em] text-indigo-200">QUOTATION</p>
          <h1 className="text-2xl font-semibold mt-2">{data.quotation_number || "Quotation"}</h1>
          <p className="mt-1 text-indigo-100">{clientLabel}</p>
        </header>
        <section className="px-6 py-6 space-y-6">
          <p className="text-sm text-slate-600">Total excluding GST: <span className="font-semibold text-slate-900">{money(data.grand_total_excl_gst)}</span></p>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-900 mb-2">Services</h2>
            {services.length === 0 ? <p className="text-sm text-slate-500">No services on this quotation.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-slate-500">
                    <tr>
                      <th className="py-2 pr-3">Service</th>
                      <th className="py-2 pr-3">Category</th>
                      <th className="py-2 pr-3">Qty</th>
                      <th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((row) => (
                      <tr key={row.id || `${row.service_name}-${row.category_name}`} className="border-t border-slate-100">
                        <td className="py-2 pr-3">{row.service_name || row.editing_type_name || "Service"}</td>
                        <td className="py-2 pr-3">{row.category_name || "-"}</td>
                        <td className="py-2 pr-3">{row.quantity || 1}</td>
                        <td className="py-2 text-right">{money(row.total_amount || row.total_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-900 mb-2">Ads</h2>
            {ads.length === 0 ? <p className="text-sm text-slate-500">No ads on this quotation.</p> : (
              <ul className="text-sm space-y-1">
                {ads.map((row) => (
                  <li key={row.id || row.category_name} className="flex justify-between gap-4 border-t border-slate-100 py-2">
                    <span>{row.category_name || "Ads"}</span>
                    <span>{money(row.total || row.charge || row.budget)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-900 mb-2">Notes</h2>
            {notes.length === 0 ? <p className="text-sm text-slate-500">No notes.</p> : (
              <ul className="text-sm list-disc pl-5 space-y-1">
                {notes.map((note, index) => (
                  <li key={note.id || index}>{typeof note === "string" ? note : note.note_name || note.note || ""}</li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </article>
    </main>
  );
}
