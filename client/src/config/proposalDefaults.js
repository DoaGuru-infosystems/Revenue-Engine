/**
 * Proposal Builder — Default section placeholder text and metadata.
 *
 * These are STARTER CONTENT that pre-fills textareas so the DM Manager
 * has a starting point. All content is fully editable and replaceable.
 */

// ─── Section Definitions ─────────────────────────────────────────────────────
export const PROPOSAL_SECTIONS = [
  {
    key: "cover_page",
    label: "Cover Page",
    icon: "FileText",
    type: "cover_fields",
    description: "Structured cover page data (Client info is auto-filled).",
  },
  {
    key: "executive_summary",
    label: "Executive Summary",
    icon: "AlignLeft",
    type: "textarea",
    description: "A concise overview of what this proposal covers.",
    placeholder: `We are pleased to present this proposal for [Client Name]. This document outlines our recommended approach, scope of services, timeline, and investment to help achieve your business objectives.

Our team has carefully evaluated your requirements and developed a comprehensive strategy that aligns with your goals and budget. We believe this partnership will deliver measurable results and drive sustainable growth for your organization.`,
  },
  {
    key: "about_us",
    label: "About Us / Company Introduction",
    icon: "Building2",
    type: "textarea",
    description: "Your company introduction — editable per proposal.",
    placeholder: `DoaGuru InfoSystems is a leading digital solutions company specializing in web development, digital marketing, graphic design, and IT consulting. With a proven track record of delivering exceptional results, we partner with businesses of all sizes to transform their digital presence.

Our Expertise:
• Digital Marketing (SEO, SEM, Social Media, Content Marketing)
• Web & App Development (React, Node.js, Mobile Apps)
• Graphic Design & Branding (Logo, UI/UX, Print Media)
• IT Consulting & Cloud Solutions

With a dedicated team of 50+ professionals and 200+ successful projects delivered, we bring the expertise and commitment needed to drive your business forward.`,
  },
  {
    key: "client_problem",
    label: "Understanding Client's Problem",
    icon: "Search",
    type: "textarea",
    optional: true,
    description: "Describe the client's challenges and pain points.",
    placeholder: `Based on our initial discussions and analysis, we have identified the following key challenges that [Client Name] is currently facing:

1. [Challenge 1] — Describe the specific problem area
2. [Challenge 2] — Describe another pain point
3. [Challenge 3] — Additional challenge

These challenges are impacting [area of business] and require a strategic, data-driven approach to resolve effectively.`,
  },
  {
    key: "proposed_solution",
    label: "Proposed Solution",
    icon: "Lightbulb",
    type: "textarea",
    description: "Your recommended solution approach.",
    placeholder: `To address the challenges outlined above, we propose the following solution:

Approach:
Our strategy combines [methodology/approach] with [tools/platforms] to deliver a comprehensive solution that addresses each challenge systematically.

Key Components:
1. [Component 1] — Brief description of what this involves
2. [Component 2] — Brief description
3. [Component 3] — Brief description

This solution is designed to be scalable, measurable, and aligned with your business objectives.`,
  },
  {
    key: "scope_of_work",
    label: "Scope of Work",
    icon: "ClipboardList",
    type: "table",
    description: "Dynamic table of deliverables — add/remove rows.",
    columns: ["Deliverable", "Service Category", "Count/Quantity"],
    placeholder: [],
  },
  {
    key: "strategy_overview",
    label: "Strategy Overview",
    icon: "Target",
    type: "textarea",
    optional: true,
    description: "High-level strategy outline (optional section).",
    placeholder: `Our strategic approach involves a phased implementation:

Phase 1 — Foundation & Setup (Month 1)
• Initial audit and analysis
• Strategy development and planning
• Tool setup and configuration

Phase 2 — Execution & Optimization (Month 2-3)
• Campaign launch and management
• Content creation and distribution
• Performance monitoring and optimization

Phase 3 — Growth & Scaling (Month 4+)
• Advanced optimization techniques
• Scaling successful campaigns
• Monthly reporting and strategy refinement`,
  },
  {
    key: "timeline",
    label: "Timeline & Milestones",
    icon: "Calendar",
    type: "timeline",
    optional: true,
    description: "Derived from billing type. Add milestones.",
    placeholder: [],
  },
  {
    key: "expected_results",
    label: "Expected Results",
    icon: "TrendingUp",
    type: "textarea",
    optional: true,
    description: "Projected outcomes and KPIs (optional section).",
    placeholder: `Based on our experience with similar projects, we anticipate the following results:

Within 3 Months:
• [Result 1 with metric, e.g., 30% increase in organic traffic]
• [Result 2 with metric]

Within 6 Months:
• [Result 3 with metric]
• [Result 4 with metric]

Note: These projections are based on industry benchmarks and past performance. Actual results may vary based on market conditions and implementation consistency.`,
  },
  {
    key: "pricing_investment",
    label: "Pricing & Investment",
    icon: "IndianRupee",
    type: "pricing_table",
    description:
      "Dynamic pricing table with auto-calculated grand total (excl. GST).",
    columns: [
      "Service / Deliverable",
      "Quantity",
      "Unit Price (₹)",
      "Total Price (₹)",
    ],
    placeholder: [],
  },
  {
    key: "combined_notes_tc",
    label: "Terms & Conditions",
    icon: "ScrollText",
    type: "combined_notes_tc",
    description: "Select predefined notes, custom notes, and T&C templates.",
    placeholder: "",
  },
  {
    key: "additional_remarks",
    label: "Additional Remarks",
    icon: "AlignLeft",
    type: "textarea",
    optional: true,
    description: "Any extra remarks for the client.",
    placeholder: "",
  },
  {
    key: "client_instructions",
    label: "Client Instructions",
    icon: "AlertCircle",
    type: "textarea",
    optional: true,
    description: "Specific instructions or requirements from the client.",
    placeholder: "",
  },
  {
    key: "why_choose_us",
    label: "Why Choose Us",
    icon: "Award",
    type: "textarea",
    optional: true,
    description: "Your competitive differentiators (optional section).",
    placeholder: `Why DoaGuru InfoSystems?

✓ Proven Track Record — 200+ successful projects across diverse industries
✓ Dedicated Team — Assigned project managers and specialists for each client
✓ Transparent Reporting — Monthly reports with clear metrics and ROI tracking
✓ Flexible Engagement — Customizable packages to fit your budget and goals
✓ 24/7 Support — Round-the-clock assistance for critical issues
✓ Result-Oriented — We focus on measurable outcomes, not just activities`,
  },
  {
    key: "approval_acceptance",
    label: "Approval & Acceptance",
    icon: "PenTool",
    type: "approval",
    description: "Signature fields — 'Our Signature' + 'Client Approval'.",
    placeholder: {
      our_signatory_name: "",
      our_signatory_designation: "",
      client_signatory_name: "",
      client_signatory_designation: "",
      acceptance_date: "",
    },
  },
];

export const MILESTONE_PRESETS = {
  monthly: [
    {
      title: "Month 1: Strategy",
      duration: "Days 1-7",
      deliverables: "Setup, Research",
    },
    {
      title: "Month 1: Execution",
      duration: "Days 8-30",
      deliverables: "Ads, Content",
    },
  ],
  project: [
    {
      title: "Phase 1: Planning",
      duration: "Week 1",
      deliverables: "Requirement gathering",
    },
    {
      title: "Phase 2: Development",
      duration: "Week 2-4",
      deliverables: "Execution",
    },
  ],
};
// ─── Proposal Type Options ───────────────────────────────────────────────────
export const PROPOSAL_TYPES = [
  { value: "development", label: "Development" },
  { value: "digital_marketing", label: "Digital Marketing" },
];

// ─── Billing Type Options ────────────────────────────────────────────────────
export const BILLING_TYPES = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Custom (Date Range)" },
];

// ─── Helper to build initial sections state ──────────────────────────────────
export function buildInitialSections() {
  const sections = {};
  PROPOSAL_SECTIONS.forEach((sec) => {
    if (sec.type === "textarea") {
      sections[sec.key] = sec.placeholder || "";
    } else if (
      sec.type === "table" ||
      sec.type === "pricing_table" ||
      sec.type === "timeline"
    ) {
      sections[sec.key] = [];
    } else if (sec.key === "pricing_investment") {
      sections[sec.key] = [];
    } else if (sec.key === "cover_page") {
      sections[sec.key] = {
        duration: "1 Month",
        proposal_date: new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        proposal_validity: "7 Days",
        prepared_by: "DOAGuru InfoSystems",
        website: "www.doaguru.com",
      };
    } else if (sec.type === "approval") {
      sections[sec.key] = { ...(sec.placeholder || {}) };
    } else if (sec.type === "combined_notes_tc") {
      sections["terms_conditions"] = [];
      sections["notes_selection"] = [];
    } else {
      sections[sec.key] = "";
    }
  });
  return sections;
}

// ─── Helper to build initial optional toggles ────────────────────────────────
export function buildInitialToggles() {
  const toggles = {};
  PROPOSAL_SECTIONS.forEach((sec) => {
    if (sec.optional) {
      toggles[sec.key] = false;
    }
  });
  return toggles;
}

export default PROPOSAL_SECTIONS;
