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

  const rawServices = asArray(data.services);
  const rawAds = asArray(data.ads);
  const notes = asArray(data.notes);
  const clientLabel = data.client_organization || data.client_name || "Client";

  const isComp = (item) => {
    if (!item) return false;
    if (item.is_complimentary !== undefined && item.is_complimentary !== null) {
      return Boolean(item.is_complimentary);
    }
    if (item.source === "custom_complimentary" || item.source === "complimentary") return true;
    if (item.include_in_total === false) return true;
    const s = String(item.service_name || item.service || "").toLowerCase();
    return s.includes("(complimentary)") || s.includes("(complimntory)") || s === "complimentary";
  };

  const paidServices = rawServices.filter((s) => !isComp(s));
  const compServices = rawServices.filter(isComp);

  const adChargeLines = [];
  const adBudgetLines = [];

  rawAds.forEach((row) => {
    const budget = Number(row.budget || row.amount || 0);
    const charge = Number(row.charge || 0);
    const rawPercent =
      row.percent !== undefined && row.percent !== null
        ? String(row.percent).trim()
        : "";
    const percentStr =
      rawPercent && rawPercent !== "N/A" ? ` (${rawPercent}%)` : "";
    const category = row.category_name || "Ads";

    if (charge > 0) {
      adChargeLines.push({
        service_name: "Ads Service Charge",
        category_name: `${category}${percentStr}`,
        quantity: 1,
        rate: charge,
        amount: charge,
      });
    }

    adBudgetLines.push({
      service_name: "Ads Campaign",
      category_name: category,
      quantity: 1,
      budget,
      amount: budget,
    });
  });

  const displayServices = [
    ...paidServices.map((row) => ({
      service_name: row.service_name || row.editing_type_name || "Service",
      category_name: row.category_name || "—",
      quantity: row.quantity || 1,
      amount: Number(
        row.total_amount ||
          row.total_price ||
          (Number(row.editing_type_amount || 0) * Number(row.quantity || 1)) ||
          0
      ),
    })),
    ...adChargeLines,
  ];

  const servicesSubtotal = displayServices.reduce(
    (sum, row) => sum + Number(row.amount || 0),
    0
  );
  const adsBudgetTotal = adBudgetLines.reduce(
    (sum, row) => sum + Number(row.budget || 0),
    0
  );

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
  const servicesAfterDiscount = Math.max(0, servicesSubtotal - discountAmt);
  const finalTotal = data.grand_total_excl_gst
    ? Number(data.grand_total_excl_gst)
    : servicesAfterDiscount + adsBudgetTotal;

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
            {displayServices.length === 0 ? <p className="text-sm text-slate-500">No services on this quotation.</p> : (
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
                    {displayServices.map((row, idx) => (
                      <tr key={idx} className="border-t border-slate-100">
                        <td className="py-2 pr-3 font-medium">{row.service_name}</td>
                        <td className="py-2 pr-3">{row.category_name || "-"}</td>
                        <td className="py-2 pr-3 text-right">{row.quantity || 1}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {adBudgetLines.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-900 mb-2">Ads Budget</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-slate-500">
                    <tr>
                      <th className="py-2 pr-3">Campaign Platform</th>
                      <th className="py-2 pr-3">Category</th>
                      <th className="py-2 pr-3 text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adBudgetLines.map((ad, idx) => (
                      <tr key={idx} className="border-t border-slate-100">
                        <td className="py-2 pr-3 font-medium">{ad.service_name || "Ads Campaign"}</td>
                        <td className="py-2 pr-3">{ad.category_name}</td>
                        <td className="py-2 pr-3 text-right">{ad.quantity || 1}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {compServices.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-900 mb-2">Complimentary Services</h2>
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
                    {compServices.map((row, idx) => (
                      <tr key={idx} className="border-t border-slate-100">
                        <td className="py-2 pr-3 font-medium">{row.service_name}</td>
                        <td className="py-2 pr-3">{row.category_name || "-"}</td>
                        <td className="py-2 pr-3 text-right">{row.quantity || 1}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div className="border-t border-slate-200 pt-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-900 mb-2">Pricing</h2>
            <div className="space-y-1 text-sm text-slate-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{money(servicesSubtotal)}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount {discountLabel}</span>
                  <span>- {money(discountAmt)}</span>
                </div>
              )}
              {adBudgetLines.map((ad, idx) => {
                let catName = ad.category_name || "Ads";
                catName = catName.replace(/\badd\b/gi, "Ad");
                return (
                  <div key={idx} className="flex justify-between text-slate-700">
                    <span>{catName} Budget</span>
                    <span>{money(ad.budget || ad.amount)}</span>
                  </div>
                );
              })}
            </div>
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
