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

  const servicesSubtotal = services.reduce(
    (sum, row) => sum + Number(row.total_amount || row.total_price || (Number(row.editing_type_amount || 0) * Number(row.quantity || 1)) || 0),
    0
  );
  const adsSubtotal = ads.reduce(
    (sum, row) => sum + Number(row.total || row.charge || row.budget || 0),
    0
  );
  const rawSubtotal = servicesSubtotal + adsSubtotal;

  let discountAmt = 0;
  let discountLabel = "";
  if (data?.discount_json) {
    try {
      const d = typeof data.discount_json === "string" ? JSON.parse(data.discount_json) : data.discount_json;
      if (d && (Number(d.value) > 0 || Number(d.discount_amt) > 0 || Number(d.discount_per) > 0)) {
        const isPer = d.type === "Percentage" || d.discount_type === "percent";
        const val = Number(d.value || (isPer ? d.discount_per : d.discount_amt) || 0);
        discountAmt = isPer ? (servicesSubtotal * val) / 100 : val;
        discountLabel = isPer ? `(${val}%)` : `(₹${val.toLocaleString("en-IN")})`;
      }
    } catch (e) {}
  }
  const finalTotal = data.grand_total_excl_gst ? Number(data.grand_total_excl_gst) : Math.max(0, rawSubtotal - discountAmt);

  return (
    <main className="min-h-screen bg-indigo-50 text-slate-900 px-4 py-8">
      <article className="max-w-3xl mx-auto bg-white border border-indigo-100 rounded-2xl overflow-hidden shadow-sm">
        <header className="bg-indigo-900 text-white px-6 py-6">
          <p className="text-xs tracking-[0.2em] text-indigo-200">QUOTATION</p>
          <h1 className="text-2xl font-semibold mt-2">{data.quotation_number || "Quotation"}</h1>
          <p className="mt-1 text-indigo-100">{clientLabel}</p>
        </header>
        <section className="px-6 py-6 space-y-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-900 mb-2">Services</h2>
            {services.length === 0 ? <p className="text-sm text-slate-500">No services on this quotation.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-slate-500">
                    <tr>
                      <th className="py-2 pr-3">Service</th>
                      <th className="py-2 pr-3">Category</th>
                      <th className="py-2 pr-3 text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((row) => (
                      <tr key={row.id || `${row.service_name}-${row.category_name}`} className="border-t border-slate-100">
                        <td className="py-2 pr-3">{row.service_name || row.editing_type_name || "Service"}</td>
                        <td className="py-2 pr-3">{row.category_name || "-"}</td>
                        <td className="py-2 pr-3 text-right">{row.quantity || 1}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {ads.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-900 mb-2">Ads Campaign</h2>
              <ul className="text-sm space-y-1">
                {ads.map((row) => (
                  <li key={row.id || row.category_name} className="flex justify-between gap-4 border-t border-slate-100 py-2">
                    <span>{row.category_name || "Ads"}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="border-t border-slate-200 pt-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-900 mb-2">Pricing</h2>
            {discountAmt > 0 && (
              <div className="space-y-1 text-sm text-slate-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{money(rawSubtotal)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Discount {discountLabel}</span>
                  <span>- {money(discountAmt)}</span>
                </div>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-300 mt-2">
              <span>Total (Excl. GST)</span>
              <span>{money(finalTotal)}</span>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-900 mb-2">Notes</h2>
            {notes.length === 0 ? <p className="text-sm text-slate-500">No notes.</p> : (
              <ul className="text-sm list-disc pl-5 space-y-1 text-slate-700">
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
