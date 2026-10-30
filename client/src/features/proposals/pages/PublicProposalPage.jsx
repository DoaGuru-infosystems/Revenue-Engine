import React, { useEffect, useRef, useState } from "react";
import img3 from "../../../assets/DOAGuru IT Solution.png";
import { usePublicProposal } from "../hooks/usePublicProposal";
import { useForceLight } from "../../../context/ThemeContext";

/** Horizontal table scroller with always-visible scrollbar + slide hint */
function ScrollableTable({ children, className = "" }) {
  const scrollerRef = useRef(null);
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const check = () => {
      setCanScroll(el.scrollWidth > el.clientWidth + 2);
    };

    check();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(check) : null;
    ro?.observe(el);
    window.addEventListener("resize", check);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", check);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      {canScroll && (
        <div className="flex items-center justify-end gap-1.5 mb-1.5 px-0.5 sm:hidden">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-2.5 py-0.5">
            <span aria-hidden>←</span>
            Slide to see more
            <span aria-hidden>→</span>
          </span>
        </div>
      )}
      <div
        ref={scrollerRef}
        className="proposal-h-scroll overflow-x-scroll rounded-xl border border-slate-200 shadow-sm"
      >
        {children}
      </div>
    </div>
  );
}

export default function PublicProposalPage() {
  useForceLight();
  const {
    data,
    loading,
    error,
    status,
    downloading,
    handleDownloadPDF,
    parseJson,
  } = usePublicProposal();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl font-semibold text-gray-600 animate-pulse">Loading Proposal...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full border border-gray-100">
          <img src={img3} alt="Doaguru" className="w-32 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {status === 404 ? "Proposal Not Found" : status === 403 ? "Access Denied" : "Error"}
          </h1>
          <p className="text-gray-600 mb-6">
            {status === 404
              ? "The requested proposal does not exist."
              : status === 403
                ? "This link has expired or been revoked due to a newer version."
                : error}
          </p>
          <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
            Please contact support or request a new link from your account manager.
          </div>
        </div>
      </div>
    );
  }

  const sections = parseJson(data.sections_json, {});
  const rawPricing = parseJson(data.pricing_table_json, []);
  const terms = parseJson(data.terms_notes_json, []);

  const clientName = data.client_name || "";
  const organization = data.company_name || "";

  const dmPricing = [];
  const adsPricing = [];
  rawPricing.forEach((item) => {
    const isAds =
      item.source === "custom_ads" ||
      item.service_type === "Ads Campaign" ||
      item.service_name === "Ads Campaign" ||
      item.source_type === "ads_campaign";

    if (isAds) {
      const explicitBudget =
        item.budget !== undefined
          ? item.budget
          : item.ad_budget !== undefined
            ? item.ad_budget
            : item.amount !== undefined
              ? item.amount
              : null;
      const charge = Number(item.charge || item.ad_charge || 0);
      let budget = 0;
      if (explicitBudget !== null) {
        budget = Number(explicitBudget);
      } else {
        const fallback = Number(item.unit_price || item.total_price || 0);
        budget = fallback > charge ? fallback - charge : fallback;
      }

      const percent =
        item.percent !== undefined && item.percent !== null
          ? item.percent
          : item.ad_percent || "N/A";
      const category =
        item.category_name ||
        item.service_name ||
        item.service ||
        "Ads Campaign";

      if (charge > 0) {
        dmPricing.push({
          ...item,
          service: `Service Charge - ${category}${percent && percent !== "N/A" ? ` (${percent}%)` : ""}`,
          service_name: "Service Charge",
          category_name: category,
          quantity: 1,
          total_price: charge,
        });
      }

      adsPricing.push({
        ...item,
        service: `Ads Budget - ${category}`,
        service_name: "Ads Campaign",
        category_name: category,
        quantity: "-",
        total_price: budget,
      });
    } else {
      const fallbackName =
        item.service ||
        (item.editing_type_name &&
        item.editing_type_name !== "null" &&
        item.editing_type_name !== "N/A"
          ? `${item.service_name || "Service"} - ${item.category_name || "Category"} (${item.editing_type_name})`
          : item.service_name && item.category_name
            ? `${item.service_name} - ${item.category_name}`
            : item.service_name || item.category_name || "Deliverable");

      dmPricing.push({
        ...item,
        service: fallbackName,
      });
    }
  });

  const pricing = [...dmPricing, ...adsPricing];

  const isItemComplimentary = (item) => {
    if (item.is_complimentary !== undefined && item.is_complimentary !== null) {
      return Boolean(item.is_complimentary);
    }
    if (item.source === "custom_complimentary" || item.source === "complimentary") return true;
    if (item.include_in_total === false) return true;
    const sName = String(item.service_name || item.service || "").toLowerCase();
    return (
      sName.includes("(complimentary)") ||
      sName.includes("(complimntory)") ||
      sName === "complimentary"
    );
  };

  const getComplimentaryAmount = (item) => {
    const qty = Number(item.quantity) || 1;
    let unitAmt =
      Number(item.editing_type_amount) > 0
        ? Number(item.editing_type_amount)
        : Number(item.price) > 0
          ? Number(item.price)
          : Number(item.unit_price) > 0
            ? Number(item.unit_price)
            : Number(item.amount) > 0
              ? Number(item.amount) / qty
              : Number(item.total_price || item.total_amount) > 0
                ? Number(item.total_price || item.total_amount) / qty
                : 0;

    if (item.include_thumbnail_creation) {
      unitAmt += Number(item.include_thumbnail_creation) || 0;
    }
    if (item.include_content_posting) {
      unitAmt += Number(item.include_content_posting) || 0;
    }
    if (item.include_youtube_video_posting) {
      unitAmt += Number(item.include_youtube_video_posting) || 0;
    }

    let baseTotal = unitAmt * qty;

    let itemAddons = [];
    if (item.additional_services) {
      try {
        itemAddons =
          typeof item.additional_services === "string"
            ? JSON.parse(item.additional_services)
            : item.additional_services;
        if (!Array.isArray(itemAddons)) itemAddons = [];
      } catch {
        itemAddons = [];
      }
    }

    let addonsSum = 0;
    if (itemAddons.length > 0) {
      addonsSum = itemAddons.reduce(
        (s, a) =>
          s +
          (Number(a.total || a.total_amount) ||
            (Number(a.amount || a.unit_price || a.price) || 0) * (Number(a.quantity) || qty)),
        0
      );
    } else if (Number(item.additional_services_amount) > 0) {
      addonsSum = Number(item.additional_services_amount);
    }

    return baseTotal + addonsSum;
  };

  const dmSubtotal = dmPricing.reduce((sum, item) => {
    if (isItemComplimentary(item)) return sum;
    let addonsSum = 0;
    const itemQty = item.quantity !== undefined ? Number(item.quantity) : 1;
    if (item.additional_services) {
      try {
        const itemAddons = typeof item.additional_services === "string"
          ? JSON.parse(item.additional_services)
          : item.additional_services;
        if (Array.isArray(itemAddons)) {
          addonsSum = itemAddons.reduce((s, a) => s + ((Number(a.amount || a.unit_price) || 0) * (Number(a.quantity) || itemQty)), 0);
        }
      } catch {}
    }
    const base = Number(item.editing_type_amount || item.price || item.unit_price || 0);
    const baseTotal = base * itemQty;
    const recordedTotal = Number(item.total_price || 0);
    const effective = (recordedTotal >= baseTotal + addonsSum && recordedTotal > 0)
      ? recordedTotal
      : (recordedTotal > 0 ? recordedTotal : baseTotal) + addonsSum;
    return sum + effective;
  }, 0);
  const adsSubtotal = adsPricing.reduce(
    (sum, item) => sum + (Number(item.total_price) || 0),
    0
  );

  const pricingDiscount = sections.pricing_discount || {};
  const discountVal = Number(pricingDiscount.value) || 0;
  const discountType = pricingDiscount.type || "Amount";
  const discountAmt =
    discountType === "Percentage" ? (dmSubtotal * discountVal) / 100 : discountVal;
  const finalGrandTotal = Math.max(0, dmSubtotal - discountAmt) + adsSubtotal;

  const cover = typeof sections.cover_page === "object" ? sections.cover_page : {};
  const propType =
    data.proposal_type === "digital_marketing"
      ? "Digital Marketing Proposal For"
      : "Development Proposal For";
  const duration = cover.duration || "1 Month";
  const propDate =
    cover.proposal_date ||
    new Date(data.created_at || Date.now()).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  const validity = cover.proposal_validity || "7 Days";
  const prepBy = cover.prepared_by || "DOAGuru InfoSystems";
  const web = cover.website || "www.doaguru.com";
  const approval = sections.approval_acceptance || {};
  const toggles = parseJson(data.optional_toggles, {}) || {};

  const isSectionIncluded = (key) => {
    const optionalKeys = [
      "client_problem",
      "strategy_overview",
      "timeline",
      "expected_results",
      "additional_remarks",
      "client_instructions",
      "why_choose_us",
    ];
    if (optionalKeys.includes(key)) {
      return toggles[key] === true || toggles[key] === "true";
    }
    return true;
  };

  const renderContent = (content) => {
    if (!content) return null;
    const text = typeof content === "object" ? content.content : content;
    if (!text || typeof text !== "string" || !text.trim()) return null;

    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(text);
    if (hasHtmlTags) {
      return (
        <div
          className="prose-html leading-relaxed text-slate-700 text-sm sm:text-base break-words"
          dangerouslySetInnerHTML={{ __html: text }}
        />
      );
    }
    return (
      <div className="whitespace-pre-line leading-relaxed text-slate-700 text-sm sm:text-base break-words">
        {text}
      </div>
    );
  };

  const hasContent = (content) => {
    if (!content) return false;
    const text = typeof content === "object" ? content.content : content;
    return !!text && String(text).trim() !== "";
  };

  const SectionTitle = ({ children }) => (
    <h2 className="text-lg sm:text-xl font-bold text-blue-900 uppercase tracking-wide border-b-2 border-blue-100 pb-2.5 sm:pb-3 mt-8 sm:mt-14 mb-4 sm:mb-8 flex items-center gap-2.5 sm:gap-3">
      <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm shadow-sm border border-blue-100/50 shrink-0">
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      </span>
      <span>{children}</span>
    </h2>
  );

  return (
    <div
      data-theme="light"
      className="proposal-public-view theme-force-light min-h-screen bg-slate-50 py-6 sm:py-12 px-2.5 sm:px-4 font-sans selection:bg-blue-100 selection:text-blue-900"
      style={{ colorScheme: "light", color: "#1e293b", backgroundColor: "#f8fafc" }}
    >
      <div className="max-w-4xl mx-auto mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div></div>
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 sm:px-6 py-2.5 rounded-xl sm:rounded-full font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed text-xs sm:text-sm"
        >
          {downloading ? "Generating PDF..." : "Download Full PDF"}
        </button>
      </div>

      <div
        className="proposal-card max-w-4xl mx-auto bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden border border-slate-100"
        style={{ backgroundColor: "#ffffff", color: "#1e293b" }}
      >
        <div className="p-4 sm:p-8 md:p-16">
          {/* Header Info Table */}
          <div className="mb-10 sm:mb-16">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-cyan-600 text-center mb-6 sm:mb-10 tracking-tight leading-tight">
              {propType} {(organization ? organization : clientName).toUpperCase()}
            </h1>

            <div className="max-w-2xl mx-auto bg-slate-50/50 rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-100 shadow-sm">
              <table className="w-full text-slate-700 text-xs sm:text-sm">
                <tbody className="divide-y divide-slate-100/50">
                  <tr>
                    <td className="py-2.5 sm:py-3 font-semibold text-slate-800 w-2/5">Client Name:</td>
                    <td className="py-2.5 sm:py-3 break-words text-slate-700">{clientName}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 sm:py-3 font-semibold text-slate-800">Organization:</td>
                    <td className="py-2.5 sm:py-3 break-words text-slate-700">{organization}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 sm:py-3 font-semibold text-slate-800">Duration:</td>
                    <td className="py-2.5 sm:py-3 text-slate-700">{duration}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 sm:py-3 font-semibold text-slate-800">Proposal Date:</td>
                    <td className="py-2.5 sm:py-3 text-slate-700">{propDate}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 sm:py-3 font-semibold text-slate-800">Proposal Validity:</td>
                    <td className="py-2.5 sm:py-3 text-slate-700">{validity}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 sm:py-3 font-semibold text-slate-800">Prepared By:</td>
                    <td className="py-2.5 sm:py-3 text-blue-700 font-medium break-words">{prepBy}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 sm:py-3 font-semibold text-slate-800">Website:</td>
                    <td className="py-2.5 sm:py-3 break-all">
                      <a href={`https://${web}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                        {web}
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <style>
            {`
              .proposal-public-view {
                color-scheme: light !important;
                background-color: #f8fafc !important;
                color: #1e293b !important;
              }
              .proposal-public-view .proposal-card {
                background-color: #ffffff !important;
                color: #1e293b !important;
              }
              .prose-custom,
              .prose-custom *,
              .prose-html,
              .prose-html * {
                color: #334155 !important;
              }
              .prose-custom p,
              .prose-html p {
                margin-bottom: 1rem;
                color: #334155 !important;
                line-height: 1.7;
                font-size: 0.9375rem;
                white-space: pre-line;
              }
              .prose-custom ul,
              .prose-html ul {
                padding-left: 1.25rem;
                margin-bottom: 1rem;
                color: #334155 !important;
                list-style-type: disc;
              }
              .prose-custom ol,
              .prose-html ol {
                padding-left: 1.25rem;
                margin-bottom: 1rem;
                color: #334155 !important;
                list-style-type: decimal;
              }
              .prose-custom li,
              .prose-html li {
                margin-bottom: 0.5rem;
                font-size: 0.9375rem;
                color: #334155 !important;
              }
              .prose-custom strong,
              .prose-custom b,
              .prose-html strong,
              .prose-html b {
                color: #0f172a !important;
                font-weight: 600;
              }
              .prose-custom h1,
              .prose-custom h2,
              .prose-custom h3,
              .prose-custom h4,
              .prose-html h1,
              .prose-html h2,
              .prose-html h3,
              .prose-html h4 {
                color: #0f172a !important;
                font-weight: 700;
                margin-top: 1.5rem;
                margin-bottom: 0.75rem;
              }
              .prose-custom h3,
              .prose-custom h4,
              .prose-html h3,
              .prose-html h4 {
                font-size: 1.05rem;
              }
              .prose-custom a,
              .prose-html a {
                color: #2563eb !important;
                text-decoration: underline;
              }
              @media (max-width: 640px) {
                .prose-custom,
                .prose-custom p,
                .prose-custom li,
                .prose-html,
                .prose-html p,
                .prose-html li {
                  font-size: 0.85rem;
                }
              }

              /* Always-visible horizontal scrollbar on proposal tables */
              .proposal-h-scroll {
                overflow-x: scroll;
                -webkit-overflow-scrolling: touch;
                scrollbar-gutter: stable;
                scrollbar-width: auto;
                scrollbar-color: #f97316 #fed7aa;
                padding-bottom: 2px;
              }
              .proposal-h-scroll::-webkit-scrollbar {
                height: 10px;
                display: block;
                -webkit-appearance: none;
              }
              .proposal-h-scroll::-webkit-scrollbar-track {
                background: #ffedd5;
                border-radius: 999px;
                margin: 0 6px;
              }
              .proposal-h-scroll::-webkit-scrollbar-thumb {
                background: linear-gradient(90deg, #f97316, #ea580c);
                border-radius: 999px;
                border: 2px solid #ffedd5;
                min-width: 40px;
              }
              .proposal-h-scroll::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(90deg, #ea580c, #c2410c);
              }
            `}
          </style>

          <div className="space-y-4">
            {/* 2. Executive Summary */}
            {isSectionIncluded("executive_summary") && hasContent(sections.executive_summary) && (
              <div>
                <SectionTitle>Executive Summary</SectionTitle>
                <div className="prose-custom">
                  {renderContent(sections.executive_summary || sections.problem_statement)}
                </div>
              </div>
            )}

            {/* 3. About Us */}
            {isSectionIncluded("about_us") && hasContent(sections.about_us) && (
              <div>
                <SectionTitle>About Us</SectionTitle>
                <div className="prose-custom">{renderContent(sections.about_us)}</div>
              </div>
            )}

            {/* 4. Client's Problem */}
            {isSectionIncluded("client_problem") && hasContent(sections.client_problem) && (
              <div>
                <SectionTitle>Understanding Client&apos;s Problem</SectionTitle>
                <div className="prose-custom">{renderContent(sections.client_problem)}</div>
              </div>
            )}

            {/* 5. Proposed Solution */}
            {isSectionIncluded("proposed_solution") && hasContent(sections.proposed_solution) && (
              <div>
                <SectionTitle>Proposed Solution</SectionTitle>
                <div className="prose-custom">{renderContent(sections.proposed_solution)}</div>
              </div>
            )}

            {/* 6. Scope of Work */}
            {isSectionIncluded("scope_of_work") && (
              <div>
                <SectionTitle>Scope of Work</SectionTitle>
                {rawPricing && rawPricing.length > 0 ? (
                  <ScrollableTable>
                    <table className="w-full text-left text-xs sm:text-sm text-slate-600 min-w-[480px]">
                      <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[11px] sm:text-xs tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="px-4 sm:px-6 py-3 sm:py-4">Service Category</th>
                          <th className="px-4 sm:px-6 py-3 sm:py-4">Service Name</th>
                          <th className="px-4 sm:px-6 py-3 sm:py-4 text-center w-28 sm:w-32">Quantity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rawPricing.map((item, idx) => {
                          const isAds =
                            item.source === "custom_ads" ||
                            item.service_type === "Ads Campaign" ||
                            item.service_name === "Ads Campaign" ||
                            item.source_type === "ads_campaign";

                          const categoryName = item.category_name || (isAds ? "Ads Campaign" : "-");
                          const serviceName = isAds
                            ? item.service_name || "Ads Campaign"
                            : item.service_name || item.service || "-";
                          const quantityVal = isAds ? item.quantity || 1 : item.quantity || 1;

                          const editingSuffix =
                            !isAds &&
                            item.editing_type_name &&
                            item.editing_type_name !== "null" &&
                            item.editing_type_name !== "N/A" &&
                            item.editing_type_name !== "undefined" &&
                            item.editing_type_name.toLowerCase() !== "proposal item" &&
                            item.editing_type_name.trim().toLowerCase() !==
                              (categoryName || "").trim().toLowerCase() &&
                            item.editing_type_name.trim().toLowerCase() !==
                              (serviceName || "").trim().toLowerCase()
                              ? ` (${item.editing_type_name})`
                              : "";

                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-slate-800">
                                {categoryName}
                                {editingSuffix}
                              </td>
                              <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-700">{serviceName}</td>
                              <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium text-xs">
                                  {quantityVal}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </ScrollableTable>
                ) : (
                  <p className="text-slate-500 italic px-4 py-3 bg-slate-50 rounded-lg border border-slate-100 text-xs sm:text-sm">
                    No deliverables added yet.
                  </p>
                )}
              </div>
            )}

            {/* 7. Strategy Overview */}
            {isSectionIncluded("strategy_overview") && hasContent(sections.strategy_overview) && (
              <div>
                <SectionTitle>Strategy Overview</SectionTitle>
                <div className="prose-custom">{renderContent(sections.strategy_overview)}</div>
              </div>
            )}

            {/* 8. Timeline & Milestones */}
            {isSectionIncluded("timeline") &&
              Array.isArray(sections.timeline) &&
              sections.timeline.length > 0 && (
                <div>
                  <SectionTitle>Timeline & Milestones</SectionTitle>
                  <ScrollableTable>
                    <table className="w-full text-left text-xs sm:text-sm text-slate-600 min-w-[500px]">
                      <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[11px] sm:text-xs tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="px-4 sm:px-6 py-3 sm:py-4 w-1/3">Milestone Title</th>
                          <th className="px-4 sm:px-6 py-3 sm:py-4 w-1/4">Duration</th>
                          <th className="px-4 sm:px-6 py-3 sm:py-4">Deliverables / Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sections.timeline.map((m, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-slate-800">{m.title || ""}</td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-blue-600 font-medium">{m.duration || ""}</td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-700">{m.deliverables || ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollableTable>
                </div>
              )}

            {/* 9. Expected Results */}
            {isSectionIncluded("expected_results") && hasContent(sections.expected_results) && (
              <div>
                <SectionTitle>Expected Results</SectionTitle>
                <div className="prose-custom">{renderContent(sections.expected_results)}</div>
              </div>
            )}

            {/* 10. Pricing & Investment */}
            {isSectionIncluded("pricing_investment") && pricing && pricing.length > 0 && (
              <div>
                <SectionTitle>Pricing & Investment</SectionTitle>
                <ScrollableTable>
                  <table className="w-full text-left text-xs sm:text-sm text-slate-600 min-w-[520px]">
                    <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[11px] sm:text-xs tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 sm:py-4">Service / Item</th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-center w-24 sm:w-32">Quantity</th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-right w-40 sm:w-48">Total Price (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pricing.map((item, idx) => {
                        const isComp = isItemComplimentary(item);
                        const compAmt = isComp ? getComplimentaryAmount(item) : 0;
                        let itemAddons = [];
                        if (item.additional_services) {
                          try {
                            itemAddons = typeof item.additional_services === "string"
                              ? JSON.parse(item.additional_services)
                              : item.additional_services;
                            if (!Array.isArray(itemAddons)) itemAddons = [];
                          } catch {
                            itemAddons = [];
                          }
                        }
                        const itemQty = item.quantity !== undefined ? Number(item.quantity) : 1;
                        const addonsSum = itemAddons.reduce((s, a) => s + ((Number(a.amount || a.unit_price) || 0) * (Number(a.quantity) || itemQty)), 0);
                        const recordedTotal = Number(item.total_price || 0);
                        const rowBaseTotal = (recordedTotal >= addonsSum && addonsSum > 0 && !isComp)
                          ? recordedTotal - addonsSum
                          : recordedTotal;

                        return (
                          <React.Fragment key={idx}>
                            <tr className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-slate-800">{item.service}</td>
                              <td className="px-4 sm:px-6 py-3 sm:py-4 text-center text-slate-700">
                                {itemQty}
                              </td>
                              <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-medium">
                                {isComp ? (
                                  <span className="text-slate-800">
                                    ₹ {compAmt.toLocaleString("en-IN")}{" "}
                                    <span className="text-emerald-600 font-semibold text-xs">(Free)</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-700">
                                    ₹ {Number(rowBaseTotal).toLocaleString("en-IN")}
                                  </span>
                                )}
                              </td>
                            </tr>
                            {itemAddons.map((addon, aIdx) => {
                              const addonAmt = Number(addon.amount || addon.unit_price || 0);
                              const addonQty = Number(addon.quantity) || itemQty;
                              const addonTotal = addonAmt * addonQty;
                              const addonName = addon.name || addon.additional_service_name || "Additional Service";
                              const parentName = item.service_name || item.service || "Service";
                              return (
                                <tr key={`addon-${idx}-${aIdx}`} className="bg-slate-50/40 hover:bg-slate-50/80 transition-colors">
                                  <td className="px-4 sm:px-6 py-2.5 sm:py-3 font-medium text-slate-700">
                                    {addonName} ({parentName})
                                  </td>
                                  <td className="px-4 sm:px-6 py-2.5 sm:py-3 text-center text-slate-600">{addonQty}</td>
                                  <td className="px-4 sm:px-6 py-2.5 sm:py-3 text-right font-medium text-slate-700">
                                    {isComp ? (
                                      <span>
                                        ₹ {addonTotal.toLocaleString("en-IN")}{" "}
                                        <span className="text-emerald-600 font-semibold text-xs">(Free)</span>
                                      </span>
                                    ) : (
                                      `₹ ${addonTotal.toLocaleString("en-IN")}`
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                    <tfoot className="border-t border-slate-200">
                      <tr className="bg-slate-50/50">
                        <td colSpan="2" className="px-4 sm:px-6 py-3 sm:py-4 text-right font-semibold text-slate-600">
                          Subtotal (Excl. GST)
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-bold text-slate-800">
                          ₹ {dmSubtotal.toLocaleString("en-IN")}
                        </td>
                      </tr>
                      {discountVal > 0 && (
                        <tr className="bg-slate-50/50">
                          <td colSpan="2" className="px-4 sm:px-6 py-2.5 sm:py-3 text-right font-medium text-rose-500">
                            Discount ({discountType === "Percentage" ? `${discountVal}%` : "₹"})
                          </td>
                          <td className="px-4 sm:px-6 py-2.5 sm:py-3 text-right font-bold text-rose-500">
                            - ₹ {discountAmt.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      )}
                      {adsSubtotal > 0 && (
                        <tr className="bg-slate-50/50">
                          <td colSpan="2" className="px-4 sm:px-6 py-3 sm:py-4 text-right font-semibold text-slate-600">
                            Ads Budget Total
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-bold text-slate-800">
                            ₹ {adsSubtotal.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      )}
                      <tr className="bg-blue-50/80">
                        <td
                          colSpan="2"
                          className="px-4 sm:px-6 py-3.5 sm:py-5 text-right font-bold text-blue-900 text-sm sm:text-base uppercase tracking-wide"
                        >
                          Grand Total (Excl. GST)
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 sm:py-5 text-right font-black text-blue-900 text-base sm:text-lg">
                          ₹ {Number(data.grand_total_excl_gst || finalGrandTotal).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </ScrollableTable>
              </div>
            )}

            {/* 11 & 12. Notes and T&C */}
            {isSectionIncluded("combined_notes_tc") && (
              <div>
                {(sections.notes_selection || (terms && terms.length > 0)) && (
                  <>
                    <SectionTitle>Notes & Terms</SectionTitle>
                    <div className="bg-amber-50/50 rounded-xl p-4 sm:p-6 md:p-8 border border-amber-100/50 text-xs sm:text-sm">
                      <ul className="space-y-3 sm:space-y-4">
                        {(() => {
                          const rawNotes = sections.notes_selection || terms;
                          const notesList = (Array.isArray(rawNotes) ? rawNotes : [])
                            .map((note) => note?.note_name || note?.note_text || note?.text || String(note || ""))
                            .filter(Boolean);

                          return notesList.map((text, idx) => {
                            let cleanText = String(text).trim();
                            if (cleanText.startsWith("- ") || cleanText.startsWith("• ")) {
                              cleanText = cleanText.substring(2).trim();
                            }
                            if (!cleanText) return null;
                            return (
                              <li key={idx} className="flex gap-3 sm:gap-4 text-slate-700 leading-relaxed">
                                <div className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-amber-400"></div>
                                <div>{cleanText}</div>
                              </li>
                            );
                          });
                        })()}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 13. Additional Remarks */}
            {isSectionIncluded("additional_remarks") && hasContent(sections.additional_remarks) && (
              <div>
                <SectionTitle>Additional Remarks</SectionTitle>
                <div className="prose-custom bg-slate-50/50 p-4 sm:p-6 rounded-xl border border-slate-100">
                  {renderContent(sections.additional_remarks)}
                </div>
              </div>
            )}

            {/* 14. Client Instructions */}
            {isSectionIncluded("client_instructions") && hasContent(sections.client_instructions) && (
              <div>
                <SectionTitle>Client Instructions</SectionTitle>
                <div className="prose-custom bg-slate-50/50 p-4 sm:p-6 rounded-xl border border-slate-100">
                  {renderContent(sections.client_instructions)}
                </div>
              </div>
            )}

            {/* 15. Why Choose Us */}
            {isSectionIncluded("why_choose_us") && hasContent(sections.why_choose_us) && (
              <div>
                <SectionTitle>Why Choose Us</SectionTitle>
                <div className="prose-custom">{renderContent(sections.why_choose_us)}</div>
              </div>
            )}

            {/* Approval Block */}
            <div className="mt-12 sm:mt-20 pt-8 sm:pt-12 border-t border-slate-200">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 sm:mb-4 text-center">Approval & Acceptance</h2>
              <p className="text-slate-500 text-center mb-8 sm:mb-16 text-xs sm:text-sm">
                By signing below, you agree to the terms and scope of work outlined in this proposal.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="bg-slate-50/80 p-5 sm:p-8 rounded-2xl border border-slate-100">
                  <div className="border-t-2 border-slate-400 w-full mb-4 sm:mb-6 pt-3 sm:pt-4 text-base sm:text-lg font-bold text-slate-800 tracking-wide text-center">
                    Authorized Client Signature
                  </div>
                  <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-slate-600">
                    <p className="flex items-center gap-3">
                      <span className="font-semibold text-slate-800 w-24">Name:</span>{" "}
                      {approval.client_signatory_name || "______________________"}
                    </p>
                    <p className="flex items-center gap-3">
                      <span className="font-semibold text-slate-800 w-24">Designation:</span>{" "}
                      {approval.client_signatory_designation || "______________________"}
                    </p>
                    <p className="flex items-center gap-3">
                      <span className="font-semibold text-slate-800 w-24">Date:</span> ______________________
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50/50 p-5 sm:p-8 rounded-2xl border border-blue-100/50">
                  <div className="border-t-2 border-blue-400 w-full mb-4 sm:mb-6 pt-3 sm:pt-4 text-base sm:text-lg font-bold text-blue-900 tracking-wide text-center">
                    DOAGuru InfoSystems
                  </div>
                  <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-blue-900/80">
                    <p className="flex items-center gap-3">
                      <span className="font-semibold text-blue-900 w-24">Name:</span>{" "}
                      {approval.our_signatory_name || "______________________"}
                    </p>
                    <p className="flex items-center gap-3">
                      <span className="font-semibold text-blue-900 w-24">Designation:</span>{" "}
                      {approval.our_signatory_designation || "______________________"}
                    </p>
                    <p className="flex items-center gap-3">
                      <span className="font-semibold text-blue-900 w-24">Date:</span> ______________________
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
