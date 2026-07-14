// src/Public/PublicRequirementForm.jsx
import React, { useMemo, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import API_BASE_URL from "../config/apiBaseUrl";

const baseURL = API_BASE_URL;


/** Excel → Services master */
const SERVICES = [
  // -------- Flat services ----------
  {
    category: "Graphic Services",
    items: [
      { type: "flat", name: "Banner/Poster Design", price: 500 },
      { type: "flat", name: "Meta Growth & Content Management", price: 300 },
      { type: "flat", name: "Youtube Thumbnail", price: 300 },
    ],
  },
  {
    category: "Video Services",
    items: [
      { type: "flat", name: "Reels Standard Editing", price: 1500 },
      { type: "flat", name: "Reels Thumbnail Creation", price: 250 },
      { type: "flat", name: "Reels Content Posting", price: 300 },
      { type: "flat", name: "Youtube Video Editing", price: 3000 },
    ],
  },
  {
    category: "Video Shoot",
    items: [{ type: "flat", name: "Mobile Shoot (15min - 1hr)", price: 850 }],
  },
  {
    category: "Social Media Posting",
    items: [{ type: "flat", name: "YouTube Channel Growth & Optimization", price: 200 }],
  },
  {
    category: "Complimentary",
    items: [
      { type: "flat", name: "Festive Post Creation", price: 0 },
      { type: "flat", name: "Information Reel", price: 0 },
      { type: "flat", name: "Facebook Page Setup", price: 0 },
      { type: "flat", name: "Instagram Page Setup", price: 0 },
      { type: "flat", name: "Meta Ads Account Setup", price: 0 },
      { type: "flat", name: "Meta Business Suit Setup", price: 0 },
    ],
  },

  // -------- New flat services with defaults ----------
  {
    category: "SEO (Website)",
    items: [
      {
        type: "flat",
        name: "1 Keyword / On-Page Optimization / Off-Page Optimization / Keyword Research",
        price: 1200,
        defaultQty: 10,
      },
    ],
  },
  {
    category: "GMB",
    items: [
      { type: "flat", name: "LOCAL SEO", price: 1200, defaultQty: 5 },
      {
        type: "flat",
        name: "Local SEO and negative comment handling",
        price: 1000,
        defaultQty: 5,
      },
    ],
  },

  // -------- Percent (budget-based) slabs ----------
  {
    category: "Meta Ads Campaign Management & Optimization",
    items: [
      {
        type: "percent",
        name: "Meta Ads Campaign Management & Optimization",
        rate: 0.35,
        minBudget: 1000,
        maxBudget: 10000,
      },
      {
        type: "percent",
        name: "Meta Ads Campaign Management & Optimization",
        rate: 0.3,
        minBudget: 10001,
        maxBudget: 25000,
      },
      {
        type: "percent",
        name: "Meta Ads Campaign Management & Optimization",
        rate: 0.25,
        minBudget: 25001,
        maxBudget: 50000,
      },
      {
        type: "percent",
        name: "Meta Ads Campaign Management & Optimization",
        rate: 0.2,
        minBudget: 50001,
        maxBudget: null,
      }, // Above
    ],
  },
  {
    category: "Google Ads Campaign Management & Optimization",
    items: [
      {
        type: "percent",
        name: "Google Ads Campaign Management & Optimization",
        rate: 0.45,
        minBudget: 1000,
        maxBudget: 10000,
      },
      {
        type: "percent",
        name: "Google Ads Campaign Management & Optimization",
        rate: 0.4,
        minBudget: 10001,
        maxBudget: 25000,
      },
      {
        type: "percent",
        name: "Google Ads Campaign Management & Optimization",
        rate: 0.35,
        minBudget: 25001,
        maxBudget: 50000,
      },
      {
        type: "percent",
        name: "Google Ads Campaign Management & Optimization",
        rate: 0.3,
        minBudget: 50001,
        maxBudget: null,
      }, // Above
    ],
  },
];

export default function PublicRequirementForm() {
  const { slug } = useParams();

  // contact + extra info  (attachments removed)
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    requirement: "",
  });

  // line-items state flattened from SERVICES
  const [items, setItems] = useState(() =>
    SERVICES.flatMap((grp) =>
      grp.items.map((it) => ({
        category: grp.category,
        name: it.name,
        type: it.type || "flat",
        price: it.price ?? null,
        rate: it.rate ?? null,
        minBudget: it.minBudget ?? null,
        maxBudget: it.maxBudget ?? null,
        defaultQty: it.defaultQty ?? null,
        selected: false,
        qty: 0,
        error: "",
      }))
    )
  );

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [lastPdfData, setLastPdfData] = useState(null);

  // ---- helpers ----
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      if (!/^\d{0,10}$/.test(value)) return;
      setForm((p) => ({ ...p, phone: value }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const validatePercentRow = (it, v) => {
    if (it.type !== "percent") return "";
    if (it.minBudget && v < it.minBudget) return `Min ₹${it.minBudget}`;
    if (it.maxBudget && v > it.maxBudget) return `Max ₹${it.maxBudget}`;
    return "";
  };

  const toggleItem = (idx) => {
    setItems((prev) => {
      const next = [...prev];
      const it = { ...next[idx] };
      it.selected = !it.selected;

      if (it.selected) {
        if (it.type === "percent") {
          const budget = it.qty && it.qty > 0 ? it.qty : it.minBudget || 0;
          it.qty = budget;
          it.error = validatePercentRow(it, budget);
        } else {
          const def = it.defaultQty ?? 1;
          it.qty = it.qty && it.qty > 0 ? it.qty : def;
          it.error = "";
        }
      } else {
        it.qty = 0;
        it.error = "";
      }

      next[idx] = it;
      return next;
    });
  };

  const changeQty = (idx, val) => {
    const n = String(val).replace(/[^\d]/g, "");
    const qty = n === "" ? 0 : Math.max(0, parseInt(n, 10));
    setItems((prev) => {
      const next = [...prev];
      const it = { ...next[idx] };
      it.qty = qty;
      it.selected = qty > 0;
      it.error = validatePercentRow(it, qty);
      next[idx] = it;
      return next;
    });
  };

  const grouped = useMemo(() => {
    const map = {};
    for (const it of items) {
      if (!map[it.category]) map[it.category] = [];
      map[it.category].push(it);
    }
    return map;
  }, [items]);

  const isRowValid = (it) => (it.type === "percent" ? it.error === "" : true);

  const selectedItems = useMemo(
    () => items.filter((i) => i.selected && i.qty > 0 && isRowValid(i)),
    [items]
  );

  // fee we charge
  const feeOf = (it) =>
    it.type === "percent"
      ? Math.round((it.qty || 0) * (it.rate || 0))
      : (it.qty || 0) * (it.price || 0);

  // gross (budget + fee) for % rows; for flat, same as fee
  const grossOf = (it) =>
    it.type === "percent" ? (it.qty || 0) + feeOf(it) : feeOf(it);

  const feesTotal = useMemo(
    () => selectedItems.reduce((a, it) => a + feeOf(it), 0),
    [selectedItems]
  );
  const grandTotal = useMemo(
    () => selectedItems.reduce((a, it) => a + grossOf(it), 0),
    [selectedItems]
  );

  const hasAtLeastOneItem = selectedItems.length > 0;

  const isValid = useMemo(() => {
    if (!form.name.trim()) return false;
    if (!form.phone || form.phone.length < 10) return false;
    if (!hasAtLeastOneItem && !form.requirement.trim()) return false;
    return true;
  }, [form, hasAtLeastOneItem]);

  // ---------- PDF helpers ----------

  // fits 6 columns in A4 portrait cleanly
  const generatePDF = ({
    slug,
    form,
    selectedItems,
    feesTotal,
    grandTotal,
  }) => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const MARGIN = 20; // tighter margins => more table width (595 - 40 = 555)
    const lineY = 26;

    // header
    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.text("Requirement Submission", MARGIN, 40);

    doc.setFontSize(10);
    const now = new Date();
    doc.text(
      `Ref: ${slug} | Date: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
      MARGIN,
      40 + lineY
    );

    // client block
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const yBase = 40 + lineY * 2;
    const info = [
      `Name: ${form.name || "-"}`,
      `Phone: ${form.phone || "-"}`,
      `Email: ${form.email || "-"}`,
    ];
    info.forEach((t, i) => doc.text(t, MARGIN, yBase + i * 16));

    let afterY = yBase + 50;
    if (form.requirement) {
      const reqLines = doc.splitTextToSize(
        `Additional Requirements: ${form.requirement}`,
        555 - 2 * 0 // same inner width as table; tweak if you like
      );
      doc.text(reqLines, MARGIN, yBase + 60);
      afterY = yBase + 60 + reqLines.length * 12 + 10;
    }

    // table
    if (selectedItems.length > 0) {
      const MONEY_PREFIX = "INR ";
      const formatMoney = (n) =>
        `${MONEY_PREFIX}${Number(n || 0).toLocaleString("en-IN")}`;
      const percentStr = (r) => `${Math.round((r || 0) * 100)}%`;

      const head = [
        ["Category", "Sub Category", "Qty", "Rate", "Fee", "Total"],
      ];
      const body = selectedItems.map((it) => {
        if (it.type === "percent") {
          const fee = Math.round((it.qty || 0) * (it.rate || 0));
          const total = (it.qty || 0) + fee;
          return [
            it.category,
            it.name,
            Number(it.qty || 0).toLocaleString("en-IN"), // budget
            percentStr(it.rate),
            formatMoney(fee),
            formatMoney(total),
          ];
        } else {
          const line = (it.qty || 0) * (it.price || 0);
          return [
            it.category,
            it.name,
            String(it.qty || 0),
            formatMoney(it.price || 0),
            formatMoney(line),
            formatMoney(line),
          ];
        }
      });

      autoTable(doc, {
        head,
        body,
        startY: afterY,
        theme: "grid",
        margin: { left: MARGIN, right: MARGIN }, // inner width = 595 - 40 = 555
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 6,
          lineWidth: 0.4,
          lineColor: [220, 220, 220],
          overflow: "linebreak",
          valign: "middle",
        },
        headStyles: { fillColor: [33, 150, 243], textColor: 255 },
        // Column widths sum to ~555 (fits perfectly)
        columnStyles: {
          0: { cellWidth: 80 }, // Category
          1: { cellWidth: 210 }, // Sub Category (long text)
          2: { cellWidth: 55, halign: "right" }, // Qty/Budget
          3: { cellWidth: 55, halign: "right" }, // Rate/Unit
          4: { cellWidth: 75, halign: "right" }, // Fee
          5: { cellWidth: 80, halign: "right" }, // Total
        },
      });

      afterY = (doc.lastAutoTable?.finalY || afterY) + 16;
    } else {
      doc.setFontSize(10);
      doc.text("No specific line items selected.", MARGIN, afterY);
      afterY += 16;
    }

    // totals
    const MONEY_PREFIX = "INR ";
    const fmt = (n) =>
      `${MONEY_PREFIX}${Number(n || 0).toLocaleString("en-IN")}`;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Fees Subtotal: ${fmt(feesTotal)}`, MARGIN, afterY);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Grand Total (incl. ad budgets): ${fmt(grandTotal)}`,
      MARGIN,
      afterY + 18
    );

    // footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      "Note: This PDF is auto-generated from Revenue Engine. Prices are indicative; taxes extra where applicable.",
      MARGIN,
      820
    );

    const safeName = (form.name || "Client").replace(/[^\w\-]+/g, "_");
    doc.save(`Requirement_${safeName}_${slug}.pdf`);
  };

  // const formatINR = (n) =>
  //   `₹ ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
  //     Math.round(n || 0)
  //   )}`;

  // const pct = (r) => `${Math.round((r || 0) * 100)}%`;

  // const generatePDF = ({
  //   slug,
  //   form,
  //   selectedItems,
  //   feesTotal,
  //   grandTotal,
  // }) => {
  //   const doc = new jsPDF({ unit: "pt", format: "a4" });
  //   const marginX = 40;
  //   const lineY = 26;

  //   // Header
  //   doc.setFontSize(16);
  //   doc.text("Requirement Submission", marginX, 40);
  //   doc.setFontSize(10);
  //   const now = new Date();
  //   doc.text(
  //     `Ref: ${slug} | Date: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
  //     marginX,
  //     40 + lineY
  //   );

  //   // Client block
  //   doc.setFontSize(11);
  //   const yBase = 40 + lineY * 2;
  //   const info = [
  //     `Name: ${form.name || "-"}`,
  //     `Phone: ${form.phone || "-"}`,
  //     `Email: ${form.email || "-"}`,
  //   ];
  //   info.forEach((t, i) => doc.text(t, marginX, yBase + i * 16));

  //   if (form.requirement) {
  //     const reqLines = doc.splitTextToSize(
  //       `Additional Requirements: ${form.requirement}`,
  //       515
  //     );
  //     doc.text(reqLines, marginX, yBase + 60);
  //   }

  //   // Table when there are line items
  //   let afterTableY = yBase + (form.requirement ? 80 : 50);
  //   if (selectedItems.length > 0) {
  //     const head = [
  //       ["Category", "Sub Category", "Qty/Budget", "Rate/Unit", "Fee", "Gross"],
  //     ];
  //     const body = selectedItems.map((it) => {
  //       if (it.type === "percent") {
  //         const fee = feeOf(it);
  //         const gross = (it.qty || 0) + fee;
  //         return [
  //           it.category,
  //           it.name,
  //           formatINR(it.qty || 0),
  //           pct(it.rate),
  //           formatINR(fee),
  //           formatINR(gross),
  //         ];
  //       } else {
  //         const line = feeOf(it);
  //         return [
  //           it.category,
  //           it.name,
  //           String(it.qty || 0),
  //           formatINR(it.price || 0),
  //           formatINR(line),
  //           formatINR(line),
  //         ];
  //       }
  //     });

  //     autoTable(doc, {
  //       head,
  //       body,
  //       startY: afterTableY,
  //       styles: { fontSize: 9, cellPadding: 6 },
  //       headStyles: { fillColor: [33, 150, 243] },
  //       columnStyles: {
  //         2: { halign: "right" },
  //         3: { halign: "right" },
  //         4: { halign: "right" },
  //         5: { halign: "right" },
  //       },
  //     });

  //     afterTableY = (doc.lastAutoTable?.finalY || afterTableY) + 16;
  //   } else {
  //     // No selected items – show a small note
  //     doc.setFontSize(10);
  //     doc.text("No specific line items selected.", marginX, afterTableY);
  //     afterTableY += 16;
  //   }

  //   // Totals
  //   doc.setFontSize(11);
  //   doc.text(`Fees Subtotal: ${formatINR(feesTotal)}`, marginX, afterTableY);
  //   doc.setFont(undefined, "bold");
  //   doc.text(
  //     `Grand Total (incl. ad budgets): ${formatINR(grandTotal)}`,
  //     marginX,
  //     afterTableY + 18
  //   );
  //   doc.setFont(undefined, "normal");

  //   // Footer
  //   const footerY = 820;
  //   doc.setFontSize(9);
  //   doc.text(
  //     "Note: This PDF is auto-generated from Revenue Engine. Prices are indicative; taxes extra where applicable.",
  //     marginX,
  //     footerY
  //   );

  //   const safeName = (form.name || "Client").replace(/[^\w\-]+/g, "_");
  //   const fileName = `Requirement_${safeName}_${slug}.pdf`;
  //   doc.save(fileName);
  // };

  // ---- submit (JSON) ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;

    setSubmitting(true);
    setError("");

    try {
      const payloadItems = selectedItems.map((it) => ({
        category: it.category,
        sub_category: it.name,
        unit_price:
          it.type === "percent" ? Math.round((it.rate || 0) * 100) : it.price,
        qty: it.qty, // percent → budget; flat → count
        line_total: feeOf(it), // we store our fee
      }));

      const payload = {
        slug,
        name: form.name,
        email: form.email || null,
        phone: form.phone,
        requirement: form.requirement,
        items_json: payloadItems,
        total_amount: grandTotal,
        // grand_total: grandTotal,
      };

      const resp = await axios.post(
        `${baseURL}/auth/api/re_calculator/submitRequirement`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      if (resp?.data?.status === "Success") {
        const snapshot = {
          slug,
          form: { ...form },
          selectedItems: selectedItems.map((i) => ({ ...i })),
          feesTotal,
          grandTotal,
        };
        setLastPdfData(snapshot);
        generatePDF(snapshot);
        setDone(true);
      } else {
        setError(resp?.data?.message || "Submission failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Network/Server error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- success screen ----
  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border shadow-md p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Thanks!</h2>
          <p className="text-gray-600">
            Your requirements have been submitted successfully. Our team will
            reach out shortly.
          </p>
          <div className="mt-6">
            <button
              onClick={() => lastPdfData && generatePDF(lastPdfData)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
            >
              Download PDF again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- UI helpers ----
  const chargeLabel = (row) =>
    row.type === "percent"
      ? `${Math.round((row.rate || 0) * 100)}%`
      : `₹ ${row.price}`;
  const rangeLabel = (row) => {
    if (row.type !== "percent") return null;
    if (row.minBudget && row.maxBudget)
      return ` (₹${row.minBudget} - ₹${row.maxBudget})`;
    if (row.minBudget && !row.maxBudget) return ` (₹${row.minBudget} - Above)`;
    return "";
  };
  const qtyPlaceholder = (row) =>
    row.type === "percent" ? "Budget (₹)" : "Count";

  // ---- form UI ----
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 flex items-center justify-center px-3 sm:px-6 py-6">
      {/* wider container on desktop */}
      <div className="max-w-6xl w-full bg-white rounded-2xl border shadow-md p-5 sm:p-8 lg:p-10">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Share Your Requirements
          </h1>
          <p className="text-gray-600 mt-1">
            Select the services and quantities. No login required. (Ref: {slug})
          </p>
        </div>

        {error ? (
          <div className="mb-4 p-3 rounded bg-red-50 text-red-700 border border-red-200 text-sm">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="10-digit phone"
                inputMode="numeric"
                required
              />
            </div>
          </div>

          {/* Requirements (optional if some services selected) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Requirements {hasAtLeastOneItem ? "(optional)" : "*"}
            </label>
            <textarea
              name="requirement"
              value={form.requirement}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px] resize-y"
              placeholder="Describe anything else you need..."
              required={!hasAtLeastOneItem}
            />
          </div>

          {/* Services table */}
          <div className="border rounded-xl overflow-hidden">
            {/* make the grid scrollable on tiny screens to prevent cramping */}
            <div className="overflow-x-auto">
              {/* Header */}
              <div className="min-w-[720px] grid grid-cols-12 bg-gray-100 text-sm font-semibold text-gray-700">
                <div className="col-span-3 px-4 py-2.5 border-r">
                  Main Category
                </div>
                <div className="col-span-3 sm:col-span-4 px-4 py-2.5 border-r">
                  Sub Category
                </div>
                <div className="col-span-2 px-4 py-2.5 border-r text-right">
                  Charge
                </div>
                <div className="col-span-1 px-4 py-2.5 border-r text-center">
                  Select
                </div>
                <div className="col-span-3 sm:col-span-2 px-4 py-2.5 text-center">
                  Count / Budget
                </div>
              </div>

              {/* rows grouped by category */}
              {Object.entries(grouped).map(([category, rows]) => (
                <div key={category} className="min-w-[720px] border-t">
                  {rows.map((row, i) => {
                    const idx = items.findIndex(
                      (it) =>
                        it.category === row.category &&
                        it.name === row.name &&
                        it.type === row.type &&
                        (it.rate ?? null) === (row.rate ?? null) &&
                        (it.minBudget ?? null) === (row.minBudget ?? null) &&
                        (it.maxBudget ?? null) === (row.maxBudget ?? null)
                    );
                    const showCategory = i === 0;

                    const min = row.type === "percent" ? row.minBudget || 0 : 0;
                    const max =
                      row.type === "percent" && row.maxBudget
                        ? row.maxBudget
                        : undefined;

                    return (
                      <div
                        key={`${category}-${row.name}-${row.type}-${
                          row.rate ?? 0
                        }-${row.minBudget ?? 0}-${row.maxBudget ?? "inf"}`}
                        className="grid grid-cols-12 text-sm"
                      >
                        <div
                          className={`col-span-3 px-4 py-2.5 border-r ${
                            showCategory ? "font-medium" : "text-transparent"
                          }`}
                        >
                          {showCategory ? category : "•"}
                        </div>
                        <div className="col-span-3 sm:col-span-4 px-4 py-2.5 border-r">
                          {row.name}
                          <span className="text-gray-500">
                            {rangeLabel(row)}
                          </span>
                        </div>
                        <div className="col-span-2 px-4 py-2.5 border-r text-right">
                          {chargeLabel(row)}
                        </div>

                        {/* Select (checkbox) */}
                        <div className="col-span-1 px-4 py-2.5 border-r text-center flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={() => toggleItem(idx)}
                            className="h-5 w-5 relative z-10"
                          />
                        </div>

                        {/* Count / Budget cell */}
                        <div className="col-span-3 sm:col-span-2 px-4 py-2.5 flex justify-center items-center min-w-0">
                          <input
                            type="number"
                            min={min}
                            {...(max ? { max } : {})}
                            value={row.qty || 0}
                            onChange={(e) => changeQty(idx, e.target.value)}
                            className={`w-full sm:max-w-[160px] lg:max-w-[250px] px-3 py-2 border rounded-md text-right bg-white ${
                              row.error ? "border-red-500" : ""
                            }`}
                            placeholder={qtyPlaceholder(row)}
                            title={
                              row.type === "percent"
                                ? `Allowed: ${min}${
                                    max ? " - " + max : " and above"
                                  }`
                                : ""
                            }
                          />
                        </div>

                        {/* <div className="col-span-2 sm:col-span-1 px-4 py-2.5 flex justify-center items-center min-w-0">
                          <input
                            type="number"
                            min={min}
                            {...(max ? { max } : {})}
                            value={row.qty || 0}
                            onChange={(e) => changeQty(idx, e.target.value)}
                            className={`w-full max-w-[120px] px-3 py-2 border rounded-md text-right bg-white ${
                              row.error ? "border-red-500" : ""
                            }`}
                            placeholder={qtyPlaceholder(row)}
                            title={
                              row.type === "percent"
                                ? `Allowed: ${min}${
                                    max ? " - " + max : " and above"
                                  }`
                                : ""
                            }
                          />
                        </div> */}

                        {/* Inline error under input */}
                        {row.error && (
                          <div className="col-span-12 -mt-1 pb-2 text-[11px] text-red-600 text-center">
                            {row.error}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 border rounded-xl p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-700">
                Selected Items:{" "}
                <span className="font-semibold">{selectedItems.length}</span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-700">
                  Fees Subtotal:{" "}
                  <span className="font-semibold">₹ {feesTotal}</span>
                </div>
                <div className="text-lg font-semibold">
                  Grand Total (incl. ad budgets):{" "}
                  <span className="text-blue-600">₹ {grandTotal}</span>
                </div>
              </div>
            </div>

            {selectedItems.length > 0 && (
              <div className="mt-3 text-sm text-gray-600">
                <div className="font-medium mb-1">Breakup:</div>
                <ul className="list-disc ml-5 space-y-1">
                  {selectedItems.map((it) => {
                    if (it.type === "percent") {
                      const fee = feeOf(it);
                      const gross = (it.qty || 0) + fee;
                      const pct = Math.round((it.rate || 0) * 100);
                      return (
                        <li key={`${it.category}-${it.name}-${pct}-${it.qty}`}>
                          {it.name} — ₹{it.qty} + {pct}% (₹{fee}) = ₹{gross}
                        </li>
                      );
                    }
                    return (
                      <li key={`${it.category}-${it.name}-${it.qty}`}>
                        {it.name} — {it.qty} × ₹{it.price} = ₹{feeOf(it)}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!isValid || submitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
              onClick={handleSubmit}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {submitting ? "Submitting..." : "Submit"}
            </button>
            {!hasAtLeastOneItem && (
              <span className="ml-3 text-xs text-gray-500">
                (Select at least one service or describe in requirements.)
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// // src/Public/PublicRequirementForm.jsx
// import React, { useMemo, useState } from "react";
// import axios from "axios";
// import { useParams } from "react-router-dom";
// import { CheckCircle2, Loader2 } from "lucide-react";



// /** Excel → Services master */
// const SERVICES = [
//   {
//     category: "Graphic Services",
//     items: [
//       { name: "Banner/Poster Design", price: 500 },
//       { name: "Content Posting", price: 300 },
//       { name: "Youtube Thumbnail", price: 300 },
//     ],
//   },
//   {
//     category: "Video Services",
//     items: [
//       { name: "Reels Standard Editing", price: 1500 },
//       { name: "Reels Thumbnail Creation", price: 250 },
//       { name: "Reels Content Posting", price: 300 },
//       { name: "Youtube Video Editing", price: 3000 },
//     ],
//   },
//   {
//     category: "Video Shoot",
//     items: [{ name: "Mobile Shoot (15min - 1hr)", price: 850 }],
//   },
//   {
//     category: "Social Media Posting",
//     items: [{ name: "Youtube Video Posting", price: 200 }],
//   },
//   {
//     category: "Complimentary",
//     items: [
//       { name: "Festive Post Creation", price: 0 },
//       { name: "Information Reel", price: 0 },
//       { name: "Facebook Page Setup", price: 0 },
//       { name: "Instagram Page Setup", price: 0 },
//       { name: "Meta Ad Account Setup", price: 0 },
//       { name: "Meta Business Suit Setup", price: 0 },
//     ],
//   },
// ];

// export default function PublicRequirementForm() {
//   const { slug } = useParams();

//   // contact + extra info  (attachments removed)
//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     requirement: "",
//   });

//   // line-items state flattened from SERVICES
//   const [items, setItems] = useState(() =>
//     SERVICES.flatMap((grp) =>
//       grp.items.map((it) => ({
//         category: grp.category,
//         name: it.name,
//         price: it.price,
//         selected: false,
//         qty: 0,
//       }))
//     )
//   );

//   const [submitting, setSubmitting] = useState(false);
//   const [done, setDone] = useState(false);
//   const [error, setError] = useState("");

//   // ---- helpers ----
//   const handleChange = (e) => {
//     const { name, value } = e.target; // files logic removed
//     if (name === "phone") {
//       if (!/^\d{0,10}$/.test(value)) return;
//       setForm((p) => ({ ...p, phone: value }));
//     } else {
//       setForm((p) => ({ ...p, [name]: value }));
//     }
//   };

//   const toggleItem = (idx) => {
//     setItems((prev) => {
//       const next = [...prev];
//       const it = { ...next[idx] };
//       it.selected = !it.selected;
//       if (it.selected && (it.qty === 0 || it.qty === "")) it.qty = 1;
//       if (!it.selected) it.qty = 0;
//       next[idx] = it;
//       return next;
//     });
//   };

//   const changeQty = (idx, val) => {
//     const n = String(val).replace(/[^\d]/g, "");
//     const qty = n === "" ? 0 : Math.max(0, parseInt(n, 10));
//     setItems((prev) => {
//       const next = [...prev];
//       const it = { ...next[idx] };
//       it.qty = qty;
//       it.selected = qty > 0;
//       next[idx] = it;
//       return next;
//     });
//   };

//   const grouped = useMemo(() => {
//     const map = {};
//     for (const it of items) {
//       if (!map[it.category]) map[it.category] = [];
//       map[it.category].push(it);
//     }
//     return map;
//   }, [items]);

//   const selectedItems = useMemo(
//     () => items.filter((i) => i.selected && i.qty > 0),
//     [items]
//   );

//   const total = useMemo(
//     () =>
//       selectedItems.reduce(
//         (acc, it) => acc + (it.qty || 0) * (it.price || 0),
//         0
//       ),
//     [selectedItems]
//   );

//   const hasAtLeastOneItem = selectedItems.length > 0;

//   const isValid = useMemo(() => {
//     if (!form.name.trim()) return false;
//     if (!form.phone || form.phone.length < 10) return false;
//     if (!hasAtLeastOneItem && !form.requirement.trim()) return false;
//     return true;
//   }, [form, hasAtLeastOneItem]);

//   // ---- submit (JSON, not FormData) ----
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!isValid) return;

//     setSubmitting(true);
//     setError("");

//     try {
//       const payloadItems = selectedItems.map((it) => ({
//         category: it.category,
//         sub_category: it.name,
//         unit_price: it.price,
//         qty: it.qty,
//         line_total: it.price * it.qty,
//       }));

//       const payload = {
//         slug,
//         name: form.name,
//         email: form.email || null,
//         phone: form.phone,
//         requirement: form.requirement,
//         items_json: payloadItems, // array bhej rahe hain
//         total_amount: total,
//       };

//       const resp = await axios.post(
//         `${baseURL}/auth/api/re_calculator/submitRequirement`,
//         payload,
//         { headers: { "Content-Type": "application/json" } }
//       );

//       if (resp?.data?.status === "Success") {
//         setDone(true);
//       } else {
//         setError(resp?.data?.message || "Submission failed. Please try again.");
//       }
//     } catch (err) {
//       console.error(err);
//       setError("Network/Server error. Please try again.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // ---- success screen ----
//   if (done) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 flex items-center justify-center p-4">
//         <div className="max-w-md w-full bg-white rounded-2xl border shadow-md p-8 text-center">
//           <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
//             <CheckCircle2 className="w-8 h-8 text-green-600" />
//           </div>
//           <h2 className="text-2xl font-semibold mb-2">Thanks!</h2>
//           <p className="text-gray-600">
//             Your requirements have been submitted successfully. Our team will
//             reach out shortly.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   // ---- form UI ----
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 flex items-center justify-center p-4">
//       <div className="max-w-4xl w-full bg-white rounded-2xl border shadow-md p-6 sm:p-10">
//         <div className="mb-6">
//           <h1 className="text-2xl sm:text-3xl font-bold">
//             Share Your Requirements
//           </h1>
//           <p className="text-gray-600 mt-1">
//             Select the services and quantities. No login required. (Ref: {slug})
//           </p>
//         </div>

//         {error ? (
//           <div className="mb-4 p-3 rounded bg-red-50 text-red-700 border border-red-200 text-sm">
//             {error}
//           </div>
//         ) : null}

//         <form onSubmit={handleSubmit} className="space-y-6">
//           {/* Contact fields */}
//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Name *
//               </label>
//               <input
//                 name="name"
//                 value={form.name}
//                 onChange={handleChange}
//                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
//                 placeholder="Your name"
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Email
//               </label>
//               <input
//                 type="email"
//                 name="email"
//                 value={form.email}
//                 onChange={handleChange}
//                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
//                 placeholder="you@example.com"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Phone *
//               </label>
//               <input
//                 name="phone"
//                 value={form.phone}
//                 onChange={handleChange}
//                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
//                 placeholder="10-digit phone"
//                 inputMode="numeric"
//                 required
//               />
//             </div>
//           </div>

//           {/* Requirements (optional if some services selected) */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Additional Requirements {hasAtLeastOneItem ? "(optional)" : "*"}
//             </label>
//             <textarea
//               name="requirement"
//               value={form.requirement}
//               onChange={handleChange}
//               className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px] resize-y"
//               placeholder="Describe anything else you need..."
//               required={!hasAtLeastOneItem}
//             />
//           </div>

//           {/* Services table (Excel-like) */}
//           <div className="border rounded-xl overflow-hidden">
//             <div className="grid grid-cols-12 bg-gray-100 text-sm font-semibold text-gray-700">
//               <div className="col-span-3 px-3 py-2 border-r">Main Category</div>
//               <div className="col-span-5 px-3 py-2 border-r">Sub Category</div>
//               <div className="col-span-2 px-3 py-2 border-r text-right">
//                 Charge (₹)
//               </div>
//               <div className="col-span-1 px-3 py-2 border-r text-center">
//                 Select
//               </div>
//               <div className="col-span-1 px-3 py-2 text-center">Count</div>
//             </div>

//             {Object.entries(grouped).map(([category, rows]) => (
//               <div key={category} className="border-t">
//                 {rows.map((row, i) => {
//                   const idx = items.findIndex(
//                     (it) => it.category === row.category && it.name === row.name
//                   );
//                   const showCategory = i === 0;
//                   return (
//                     <div
//                       key={`${category}-${row.name}`}
//                       className="grid grid-cols-12 text-sm"
//                     >
//                       <div
//                         className={`col-span-3 px-3 py-2 border-r ${
//                           showCategory ? "font-medium" : "text-transparent"
//                         }`}
//                       >
//                         {showCategory ? category : "•"}
//                       </div>
//                       <div className="col-span-5 px-3 py-2 border-r">
//                         {row.name}
//                       </div>
//                       <div className="col-span-2 px-3 py-2 border-r text-right">
//                         ₹ {row.price}
//                       </div>
//                       <div className="col-span-1 px-3 py-2 border-r text-center">
//                         <input
//                           type="checkbox"
//                           checked={row.selected}
//                           onChange={() => toggleItem(idx)}
//                           className="h-4 w-4"
//                         />
//                       </div>
//                       <div className="col-span-1 px-3 py-2 text-center">
//                         <input
//                           type="number"
//                           min={0}
//                           value={row.qty || 0}
//                           onChange={(e) => changeQty(idx, e.target.value)}
//                           className="w-16 px-2 py-1 border rounded text-center"
//                         />
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             ))}
//           </div>

//           {/* Summary */}
//           <div className="bg-gray-50 border rounded-xl p-4">
//             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
//               <div className="text-sm text-gray-700">
//                 Selected Items:{" "}
//                 <span className="font-semibold">{selectedItems.length}</span>
//               </div>
//               <div className="text-lg font-semibold">
//                 Total: <span className="text-blue-600">₹ {total}</span>
//               </div>
//             </div>
//             {selectedItems.length > 0 && (
//               <div className="mt-3 text-sm text-gray-600">
//                 <div className="font-medium mb-1">Breakup:</div>
//                 <ul className="list-disc ml-5 space-y-1">
//                   {selectedItems.map((it) => (
//                     <li key={`${it.category}-${it.name}`}>
//                       {it.name} — {it.qty} × ₹{it.price} = ₹{it.qty * it.price}
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             )}
//           </div>

//           {/* Submit */}
//           <div className="pt-2">
//             <button
//               type="submit"
//               disabled={!isValid || submitting}
//               className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
//             >
//               {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
//               {submitting ? "Submitting..." : "Submit"}
//             </button>
//             {!hasAtLeastOneItem && (
//               <span className="ml-3 text-xs text-gray-500">
//                 (Select at least one service or describe in requirements.)
//               </span>
//             )}
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
