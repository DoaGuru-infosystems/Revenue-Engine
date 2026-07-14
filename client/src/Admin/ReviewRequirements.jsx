import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import API_BASE_URL from "../config/apiBaseUrl";

const baseURL = API_BASE_URL;

function inr(n) {
  const num = Number(n || 0);
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function ReviewRequirements() {
  const { linkId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState(null);
  const [openIdx, setOpenIdx] = useState(0); // first open by default

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${baseURL}/auth/api/calculator/getRequirementsDetail/${linkId}`,
          {
            headers: { Accept: "application/json" },
            params: { ts: Date.now() },
            validateStatus: () => true,
          }
        );
        setPayload(res?.data?.data ?? null);
      } catch (e) {
        console.error("detail fetch error:", e);
        if (!alive) return;
        setPayload(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [linkId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-200">
        Loading…
      </div>
    );
  }

  if (payload === null) {
    return (
      <div className="min-h-screen p-6 text-gray-200">
        <div className="mb-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-gray-700 hover:bg-gray-600"
          >
            ← Back
          </button>
        </div>
        <div className="text-red-400">No data found for this link.</div>
      </div>
    );
  }

  const { link, submissions = [] } = payload || { link: {}, submissions: [] };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-gray-100">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60 bg-gray-900/80 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-sm">
            <span className="text-gray-400">Admin</span>
            <span className="mx-2 text-gray-600">/</span>
            <span className="text-gray-200">Requirements Review</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-sm"
            >
              ← Back
            </button>
            {/* <Link
              to="/admin/dashboard"
              className="px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-sm"
            >
              Dashboard
            </Link> */}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Page title */}
        <div className="flex items-end justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Requirements Review
          </h1>
          <div className="text-sm text-gray-400">Link #{link?.link_id}</div>
        </div>

        {/* Link Overview */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoChip
              label="Client"
              value={link?.client_name || "-"}
              accent="emerald"
            />
            <InfoChip
              label="Created"
              value={
                link?.created_at
                  ? moment(link.created_at).format("DD MMM YYYY, hh:mm A")
                  : "-"
              }
              accent="cyan"
            />
            <InfoChip label="Created By" value={link?.created_by ?? "-"} />
            <InfoChip
              label="Submissions"
              value={String(link?.submission_count ?? 0)}
            />
            <InfoChip
              label="Grand Total"
              value={inr(link?.grand_total)}
              accent="cyan"
              bold
            />
            <InfoChip
              label="Client ID"
              value={String(link?.client_id ?? "-")}
            />
          </div>
        </div>

        {/* Submissions */}
        <div className="space-y-4">
          <div className="text-sm text-gray-300">
            Showing{" "}
            <span className="text-white font-medium">{submissions.length}</span>{" "}
            submission{submissions.length !== 1 ? "s" : ""} for this link.
          </div>

          {submissions.length === 0 ? (
            <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6">
              No submissions yet.
            </div>
          ) : (
            submissions.map((s, idx) => {
              const isOpen = openIdx === idx;
              const itemsCount = s.items?.length ?? 0;
              return (
                <div
                  key={s.id}
                  className="bg-gray-800/40 border border-gray-700 rounded-xl overflow-hidden"
                >
                  {/* Submission header — super clear badges */}
                  <button
                    className="w-full text-left px-5 py-4 hover:bg-gray-700/40 transition flex items-start justify-between gap-4"
                    onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-white font-semibold">
                          Submission #{s.id}
                        </span>
                        <Badge label={s.name} />
                        <Badge label={s.phone} href={`tel:${s.phone}`} />
                        {s.email ? (
                          <Badge label={s.email} href={`mailto:${s.email}`} />
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <Pill
                          label="Created"
                          value={
                            s.created_at
                              ? moment(s.created_at).format(
                                  "DD MMM YYYY, hh:mm A"
                                )
                              : "-"
                          }
                        />
                        <Pill label="Items" value={String(itemsCount)} />
                        <Pill
                          label="Total"
                          value={inr(s.total_amount)}
                          highlight
                        />
                      </div>

                      {s.requirement ? (
                        <div className="text-sm text-gray-300 mt-1">
                          <span className="text-gray-400">Note: </span>
                          {s.requirement}
                        </div>
                      ) : null}
                    </div>

                    <div className="shrink-0 mt-1">
                      {isOpen ? <ChevronUp /> : <ChevronDown />}
                    </div>
                  </button>

                  {/* Items table */}
                  {isOpen && (
                    <div className="px-5 pb-5">
                      {itemsCount > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead>
                              <tr className="text-xs uppercase tracking-wide text-gray-400 border-b border-gray-700">
                                <th className="text-left py-3 pr-4">#</th>
                                <th className="text-left py-3 pr-4">
                                  Category
                                </th>
                                <th className="text-left py-3 pr-4">
                                  Sub-category
                                </th>
                                <th className="text-right py-3 pr-4">
                                  Unit Price
                                </th>
                                <th className="text-right py-3 pr-4">Qty</th>
                                <th className="text-right py-3">Line Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {s.items.map((it, i) => (
                                <tr
                                  key={it.id}
                                  className="border-b border-gray-700/40"
                                >
                                  <td className="py-3 pr-4">{i + 1}</td>
                                  <td className="py-3 pr-4">{it.category}</td>
                                  <td className="py-3 pr-4">
                                    {it.sub_category}
                                  </td>
                                  <td className="py-3 pr-4 text-right">
                                    {inr(it.unit_price)}
                                  </td>
                                  <td className="py-3 pr-4 text-right">
                                    {it.qty}
                                  </td>
                                  <td className="py-3 text-right">
                                    {inr(it.line_total)}
                                  </td>
                                </tr>
                              ))}
                              {/* footer row */}
                              <tr>
                                <td
                                  colSpan={5}
                                  className="py-3 pr-4 text-right font-semibold"
                                >
                                  Submission Total
                                </td>
                                <td className="py-3 text-right font-bold text-amber-400">
                                  {inr(s.total_amount)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">
                          No items in this submission.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Back button as well */}
        <div className="pt-2">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-sm"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- small presentational helpers ---------- */

function InfoChip({ label, value, accent, bold }) {
  const accentCls =
    accent === "emerald"
      ? "text-yellow-300"
      : accent === "cyan"
      ? "text-amber-300"
      : "text-gray-300";
  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4">
      <div className="text-xs uppercase tracking-wider text-gray-400">
        {label}
      </div>
      <div className={`mt-1 ${accentCls} ${bold ? "font-semibold" : ""}`}>
        {value ?? "-"}
      </div>
    </div>
  );
}

function Badge({ label, href }) {
  const Tag = href ? "a" : "span";
  return (
    <Tag
      href={href}
      className="px-2 py-0.5 rounded-full bg-gray-700/70 border border-gray-600 text-xs hover:bg-gray-600"
    >
      {label}
    </Tag>
  );
}

function Pill({ label, value, highlight }) {
  return (
    <div
      className={`px-2 py-0.5 rounded-md text-xs border ${
        highlight
          ? "border-amber-700 bg-amber-900/20 text-amber-300"
          : "border-gray-700 bg-gray-800/40 text-gray-300"
      }`}
    >
      <span className="text-gray-400">{label}:</span>{" "}
      <span className="ml-1">{value}</span>
    </div>
  );
}
