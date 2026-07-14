export const PROPOSAL_STATUS_MAP = {
  draft: { label: "Draft", color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  approved: {
    label: "Approved",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.12)",
  },
  sent: { label: "Sent", color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  proforma_generated: {
    label: "Proforma Generated",
    color: "#14b8a6",
    bg: "rgba(20,184,166,0.12)",
  },
  proforma_sent: {
    label: "Proforma Sent",
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.12)",
  },
  payment_awaited: {
    label: "Payment Awaited",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
  },
  payment_received: {
    label: "Payment Received",
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
  },
  invoiced: { label: "Invoiced", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  changes: {
    label: "Changes Requested",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
  },
  rejected: { label: "Rejected", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};
