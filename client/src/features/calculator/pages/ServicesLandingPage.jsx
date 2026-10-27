import React, { useEffect, useState, useRef } from "react";
import { useTheme } from "../../../context/ThemeContext";
import {
  Palette,
  Megaphone,
  Search,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Eye,
  EyeOff,
  ArrowLeft,
  DollarSign,
  Package,
  IndianRupee,
  User,
  Notebook,
  Gift,
  FileText,
  PercentDiamond,
  ChevronDown,
  ChevronUp,
  X,
  Star,
  CheckCircle2,
  BadgePercent,
  AlertTriangle,
  Save,
} from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import { clearUser } from "../../../redux/user/userSlice";
import { createPortal } from "react-dom";
import API_BASE_URL from "../../../config/apiBaseUrl";
import ProposalDiscountModal from "../../proposals/components/ProposalDiscountModal";
import { GraphicCalculator, AdsCampaignCalculator, ComplimentaryCalculator } from "../components";
import {
  saveQuotationDraft,
  clearQuotationDraft,
  checkDraftStatus,
  mergeDraftWithDb,
} from "../utils/quotationDraftPersistence";

export default function ServicesLandingPage() {
  const location = useLocation();
  const isBd = location.pathname.toLowerCase().startsWith("/bd");
  const basePath = isBd ? "/BD" : "/admin";
  const baseURL = API_BASE_URL;
  const navigate = useNavigate();
  const { id, proposalId } = useParams();
  const [getData, setGetData] = useState([]);
  const [allPlanNote, setAllPlanNote] = useState([]);
  const [getPlanData, setGetPlanData] = useState([]);
  const [getAdsData, setGetAdsData] = useState([]);
  const [getComplimenatryData, setGetComplimenatryData] = useState([]);
  const [planName, setPlanName] = useState("");
  const [clientData, setClientData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notesData, setNotesData] = useState([]);
  const { currentUser, token } = useSelector((state) => state.user);
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [showModal, setShowModal] = useState(false);
  const userName = currentUser?.name;
  const dispatch = useDispatch();

  // ─── Quotation Mode Detection ─────────────────────────────────────────────
  const locationState = location.state || {};
  const quotationSearch = new URLSearchParams(location.search);
  const isQuotationExplicit =
    locationState.mode === "quotation" ||
    quotationSearch.get("mode") === "quotation" ||
    quotationSearch.get("doc") === "quotation";
  const [isDetectedQuotation, setIsDetectedQuotation] = useState(false);
  const isQuotationMode = isQuotationExplicit || isDetectedQuotation;
  const quotationId = locationState.quotationId || (isQuotationMode ? proposalId : null);
  // When in quotation mode, use quotationId as the "proposalId" for all fetch/navigate calls
  const effectiveProposalId = isQuotationMode ? quotationId : proposalId;
  // ─────────────────────────────────────────────────────────────────────────

  // ─── Quotation In-Memory Draft State (Phase B & D) ───────────────────────
  const [draftItems, setDraftItems] = useState([]);
  const [isSavingQuotation, setIsSavingQuotation] = useState(false);
  // ─────────────────────────────────────────────────────────────────────────

  // ─── Quotation LocalStorage Persistence & 48h Merge (Phase C) ───────────
  const [restoreAvailable, setRestoreAvailable] = useState(false);
  const [pendingDraftData, setPendingDraftData] = useState(null);
  const [conflictNotices, setConflictNotices] = useState([]);
  const baseDbSnapshotRef = useRef([]);
  // ─────────────────────────────────────────────────────────────────────────

  const [discountType, setDiscountType] = useState("Amount");
  const [discountValue, setDiscountValue] = useState(0);
  const [discountSettings, setDiscountSettings] = useState([]);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [formDataDis, setFormDataDis] = useState({
    discount_type: "amount",
    discount_amt: "",
    discount_per: "",
  });
  // ──────────────────────────────────────────────────────────────────────────

  // ─── Search & Plan Popup State ────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPlanPopup, setShowPlanPopup] = useState(false);
  const searchRef = useRef(null);
  // ──────────────────────────────────────────────────────────────────────────

   const services = [
    {
      id: 1,
      title: "Graphic & SEO ",
      subtitle: "Visual Storytelling",
      description:
        "Transform your brand with stunning visuals that captivate and convert. From logos to complete brand identities.",
      icon: Palette,
      gradient: "from-slate-600 to-gray-700",
      bgPattern: "bg-gradient-to-br from-slate-50 to-gray-50",
      navigation: `${basePath}/calculator/${id}/${effectiveProposalId}`,
      navigationState: { servicetype: "paid" },
      features: [
        "Logo Design",
        "Brand Identity",
        "Print Materials",
        "Digital Graphics",
        "SEO Services",
      ],
    },
    {
      id: 2,
      title: "Ads Campaigns",
      subtitle: "Strategic Growth",
      description:
        "Amplify your reach with data-driven advertising campaigns that deliver measurable results across all platforms.",
      icon: Megaphone,
      gradient: "from-red-600 to-slate-700",
      bgPattern: "bg-gradient-to-br from-red-50 to-slate-50",
      navigation: `${basePath}/Adscalculator/${id}/${effectiveProposalId}`,
      features: [
        "Social Media Ads",
        "Google Ads",
        "Campaign Strategy",
        "Analytics & ROI",
      ],
    },
  ];

  const customServicesCards = [
    {
      id: "graphic",
      title: "Graphic & SEO",
      subtitle: "Visual Storytelling",
      description:
        "Transform your brand with stunning visuals that captivate and convert, from logos to complete brand identities.",
      icon: Palette,
      gradient: "from-slate-500 to-gray-600",
      buttonGradient: "from-slate-600 to-gray-600",
      features: ["Logo Design", "Brand Identity", "Print Materials", "Digital Graphics", "SEO Services"],
      navigation: `${basePath}/calculator/${id}/${effectiveProposalId}`,
      navigationState: isQuotationMode
        ? { servicetype: "paid", mode: "quotation", quotationId }
        : { servicetype: "paid" },
    },
    {
      id: "ads",
      title: "Ads Campaigns",
      subtitle: "Strategic Growth",
      description:
        "Amplify your reach with data-driven advertising campaigns that deliver measurable results across all channels.",
      icon: Megaphone,
      gradient: "from-red-500 to-orange-600",
      buttonGradient: "from-red-600 to-slate-600",
      features: ["Social Media Ads", "Google Ads", "Campaign Strategy", "Analytics & ROI"],
      navigation: `${basePath}/Adscalculator/${id}/${effectiveProposalId}`,
      navigationState: isQuotationMode ? { mode: "quotation", quotationId } : undefined,
    },
    {
      id: "complimentary",
      title: "Complimentary Services",
      subtitle: "Free Value-Add",
      description:
        "Offer complimentary graphics, videos, or management services without impacting the payable quotation total.",
      icon: Gift,
      gradient: "from-yellow-400 to-orange-500",
      buttonGradient: "from-yellow-500 to-orange-500",
      features: ["Free Video Services", "Free Graphic Design", "Zero Grand Total Impact", "Included in Quotation"],
      navigation: `${basePath}/complimentary/${id}/${effectiveProposalId}`,
      navigationState: isQuotationMode
        ? { servicetype: "complimentary", mode: "quotation", quotationId }
        : { servicetype: "complimentary" },
    },
    // {
    //   id: "notes",
    //   title: "Notes",
    //   subtitle: "Key Highlights",
    //   description:
    //     "Attach important remarks, reminders, and special conditions to your quotation for better communication.",
    //   icon: FileText,
    //   gradient: "from-red-500 to-orange-600",
    //   buttonGradient: "from-red-500 to-orange-600",
    //   features: ["Custom remarks", "Special conditions", "Internal reminders", "Client-specific highlights"],
    //   navigation: `/admin/note-section/${id}/${proposalId}`,
    // },
  ];

  const searchParams = new URLSearchParams(useLocation().search);
  const docTypeFromURL = searchParams.get("doc");

  const handleCustomServiceNavigate = (card) => {
    let target = card.navigation;
    if (!target.includes(`/${id}/${effectiveProposalId}`)) {
      target = `${target}/${id}/${effectiveProposalId}`;
    }
    let navUrl = docTypeFromURL === "proforma" ? `${target}?doc=proforma` : target;
    if (isQuotationMode) {
      navUrl += `${navUrl.includes("?") ? "&" : "?"}mode=quotation`;
    }
    const navState = card.navigationState || (isQuotationMode ? { mode: "quotation", quotationId } : undefined);
    if (navState) {
      navigate(navUrl, { state: navState });
      return;
    }
    navigate(navUrl);
  };

  const fetchClient = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/re_calculator/getClientDetailsById/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.status === "Success") setClientData(res.data.data);
    } catch (error) {
      if (error.response?.status === 401) handleUnauthorized();
    }
  };

  const fetchPlanData = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/re_calculator/getAllPlanData`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.status === "Success") setGetPlanData(res.data.data);
    } catch (error) {
      if (error.response?.status === 401) handleUnauthorized();
    }
  };

  const getAllPlanNotes = async (planTitle) => {
    try {
      const response = await axios.get(
        `${baseURL}/auth/api/re_calculator/getPlanNotes`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const notes = response.data.data;
      return notes.filter((note) => String(note.plan) === String(planTitle));
    } catch (error) {
      console.error("Error fetching plan notes:", error);
      return [];
    }
  };

  const clientName = clientData?.client_name;

  const fetchData = async () => {
    if (!id || !effectiveProposalId) return;
    try {
      if (isQuotationMode) {
        // Quotation mode: fetch services from re_quotation_services
        const res = await axios.get(
          `${baseURL}/auth/api/re_calculator/quotation/${quotationId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.status === "Success") {
          const services = res.data.data?.services || [];
          const ads = res.data.data?.ads || [];
          const isComplimentary = (item) =>
            Boolean(
              item.is_complimentary ||
              item.include_in_total === false ||
              item.source === "custom_complimentary" ||
              item.source === "complimentary" ||
              String(item.service_name || item.service || "").toLowerCase().includes("(complimentary)") ||
              String(item.service_name || item.service || "").toLowerCase() === "complimentary"
            );

          const initialDraft = [
            ...services.map((s) => ({
              ...s,
              _type: "service",
              is_complimentary: isComplimentary(s),
              include_in_total: !isComplimentary(s),
              _status: "saved",
            })),
            ...ads.map((a) => ({
              ...a,
              _type: "ads",
              category: a.category || a.category_name,
              category_name: a.category || a.category_name,
              amount: a.amount || a.budget,
              budget: a.amount || a.budget,
              total: a.total || a.total_amount || a.budget,
              is_complimentary: false,
              include_in_total: true,
              _status: "saved",
            })),
          ];
          baseDbSnapshotRef.current = initialDraft;

          const sessionKey = `quotation_active_session_${quotationId}`;
          const isOwnSession = typeof window !== "undefined" && Boolean(sessionStorage.getItem(sessionKey));

          // Check for valid unsaved localStorage draft (< 48h)
          const draftStatus = checkDraftStatus({ quotationId });
          if (draftStatus.restoreAvailable && draftStatus.draft) {
            if (isOwnSession) {
              // Own-session draft (user actively edited in this tab): silently merge without banner
              const { mergedItems, conflictNotices: conflicts, discount } = mergeDraftWithDb({
                draft: draftStatus.draft,
                currentDbItems: initialDraft,
              });
              setDraftItems(mergedItems);
              if (discount) {
                if (discount.discountType) setDiscountType(discount.discountType);
                if (discount.discountValue !== undefined) setDiscountValue(discount.discountValue);
              }
              setRestoreAvailable(false);
              setPendingDraftData(null);
              if (conflicts && conflicts.length > 0) {
                setConflictNotices(conflicts);
              }
            } else {
              // Different tab/session: prompt user with restore/discard banner
              setRestoreAvailable(true);
              setPendingDraftData(draftStatus.draft);
              setDraftItems(initialDraft);
            }
          } else {
            setRestoreAvailable(false);
            setPendingDraftData(null);
            setDraftItems(initialDraft);
          }

          if (typeof window !== "undefined") {
            sessionStorage.setItem(sessionKey, "true");
          }

          setGetData(services.filter((item) => !isComplimentary(item)));
          setGetComplimenatryData(services.filter(isComplimentary));
          setGetAdsData(ads);

          const qtn = res.data.data;
          if (qtn?.discount_json) {
            try {
              const d = typeof qtn.discount_json === "string" ? JSON.parse(qtn.discount_json) : qtn.discount_json;
              if (d && (Number(d.value) > 0 || Number(d.discount_amt) > 0 || Number(d.discount_per) > 0)) {
                const isPer = d.type === "Percentage" || d.discount_type === "percent";
                setDiscountType(isPer ? "Percentage" : "Amount");
                setDiscountValue(Number(d.value || (isPer ? d.discount_per : d.discount_amt) || 0));
              }
            } catch (e) {}
          } else {
            setDiscountType("Amount");
            setDiscountValue(0);
          }
        }
      } else if (docTypeFromURL === "proforma") {
        const { data } = await axios.get(
          `${baseURL}/auth/api/re_calculator/proformas/snapshot/${effectiveProposalId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const parsed = JSON.parse(data.data?.pricing_snapshot || "[]");
        const servicesOnly = parsed.filter(
          (item) => item.source !== "custom_complimentary" && item.service_name?.toLowerCase() !== "complimentary"
        );
        setGetData(servicesOnly);
        setPlanName(parsed[0]?.plan_name || "");

        if (data.data?.discount_snapshot) {
          try {
            const disc = typeof data.data.discount_snapshot === "string" ? JSON.parse(data.data.discount_snapshot) : data.data.discount_snapshot;
            if (disc && Number(disc.value || disc.discount_amt || disc.discount_per) > 0) {
              const isPercent = disc.type === "Percentage" || disc.discount_type === "percent";
              const val = Number(disc.value || (isPercent ? disc.discount_per : disc.discount_amt) || 0);
              setDiscountType(isPercent ? "Percentage" : "Amount");
              setDiscountValue(val);
            } else {
              setDiscountType("Amount");
              setDiscountValue(0);
            }
          } catch(e) {
            setDiscountType("Amount");
            setDiscountValue(0);
          }
        } else {
          setDiscountType("Amount");
          setDiscountValue(0);
        }
      } else {
        const { data } = await axios.get(
          `${baseURL}/auth/api/re_calculator/getByIDCalculatorTransactions/${effectiveProposalId}/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (data?.data && data.data.length > 0) {
          setGetData(data.data || []);
          setPlanName(data.data?.[0]?.plan_name || "");
        } else {
          // If no proposal transactions, check if effectiveProposalId is a quotation ID
          try {
            const qRes = await axios.get(
              `${baseURL}/auth/api/re_calculator/quotation/${effectiveProposalId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (qRes.data?.status === "Success" && qRes.data?.data?.id) {
              setIsDetectedQuotation(true);
              const services = qRes.data.data?.services || [];
              const ads = qRes.data.data?.ads || [];
              const isComplimentary = (item) =>
                Boolean(
                  item.is_complimentary ||
                  item.include_in_total === false ||
                  item.source === "custom_complimentary" ||
                  item.source === "complimentary" ||
                  String(item.service_name || item.service || "").toLowerCase().includes("(complimentary)") ||
                  String(item.service_name || item.service || "").toLowerCase() === "complimentary"
                );

              const initialDraft = [
                ...services.map((s) => ({
                  ...s,
                  _type: "service",
                  is_complimentary: isComplimentary(s),
                  include_in_total: !isComplimentary(s),
                  _status: "saved",
                })),
                ...ads.map((a) => ({
                  ...a,
                  _type: "ads",
                  category: a.category || a.category_name,
                  category_name: a.category || a.category_name,
                  amount: a.amount || a.budget,
                  budget: a.amount || a.budget,
                  total: a.total || a.total_amount || a.budget,
                  is_complimentary: false,
                  include_in_total: true,
                  _status: "saved",
                })),
              ];
              baseDbSnapshotRef.current = initialDraft;

              const sessionKey = `quotation_active_session_${effectiveProposalId}`;
              const isOwnSession = typeof window !== "undefined" && Boolean(sessionStorage.getItem(sessionKey));

              // Check for valid unsaved localStorage draft (< 48h)
              const draftStatus = checkDraftStatus({ quotationId: effectiveProposalId });
              if (draftStatus.restoreAvailable && draftStatus.draft) {
                if (isOwnSession) {
                  // Own-session draft: silently merge without banner
                  const { mergedItems, conflictNotices: conflicts, discount } = mergeDraftWithDb({
                    draft: draftStatus.draft,
                    currentDbItems: initialDraft,
                  });
                  setDraftItems(mergedItems);
                  if (discount) {
                    if (discount.discountType) setDiscountType(discount.discountType);
                    if (discount.discountValue !== undefined) setDiscountValue(discount.discountValue);
                  }
                  setRestoreAvailable(false);
                  setPendingDraftData(null);
                  if (conflicts && conflicts.length > 0) {
                    setConflictNotices(conflicts);
                  }
                } else {
                  // Different tab/session: prompt user with restore/discard banner
                  setRestoreAvailable(true);
                  setPendingDraftData(draftStatus.draft);
                  setDraftItems(initialDraft);
                }
              } else {
                setRestoreAvailable(false);
                setPendingDraftData(null);
                setDraftItems(initialDraft);
              }

              if (typeof window !== "undefined") {
                sessionStorage.setItem(sessionKey, "true");
              }

              setGetData(services.filter((item) => !isComplimentary(item)));
              setGetComplimenatryData(services.filter(isComplimentary));
              setGetAdsData(ads);
              const qtn = qRes.data.data;
              if (qtn?.discount_json) {
                try {
                  const d = typeof qtn.discount_json === "string" ? JSON.parse(qtn.discount_json) : qtn.discount_json;
                  if (d && (Number(d.value) > 0 || Number(d.discount_amt) > 0 || Number(d.discount_per) > 0)) {
                    const isPer = d.type === "Percentage" || d.discount_type === "percent";
                    setDiscountType(isPer ? "Percentage" : "Amount");
                    setDiscountValue(Number(d.value || (isPer ? d.discount_per : d.discount_amt) || 0));
                  }
                } catch (e) {}
              } else {
                setDiscountType("Amount");
                setDiscountValue(0);
              }
              return;
            }
          } catch (qErr) {
            // Not a quotation
          }
          setGetData([]);
          setPlanName("");
        }
      }
    } catch (error) {
      if (error.response?.status === 401) handleUnauthorized();
    }
  };

  const fetchAdsData = async () => {
    if (isQuotationMode) return;
    if (!id || !effectiveProposalId) return;
    try {
      if (docTypeFromURL === "proforma") {
        const res = await axios.get(
          `${baseURL}/auth/api/re_calculator/proformas/snapshot/${effectiveProposalId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.status === "Success") {
          const parsed = JSON.parse(res.data.data?.ads_snapshot || "[]");
          const normalized = parsed.map((item) => ({
            ...item,
            category: item.category || item.category_name,
            amount: item.amount || item.budget,
            total: item.total || item.total_amount || item.total_price,
          }));
          setGetAdsData(normalized);
        }
      } else {
        const res = await axios.get(
          `${baseURL}/auth/api/re_calculator/getByIDAdsCampaignDetails/${effectiveProposalId}/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.status === "Success") setGetAdsData(res.data.data || []);
      }
    } catch (error) {
      if (error.response?.status === 401) handleUnauthorized();
    }
  };

  const fetchClientNotes = async () => {
    if (isQuotationMode) return;
    if (docTypeFromURL === "proforma") return;
    if (!id || !proposalId) return;
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/re_calculator/getClientNotesbyId/${id}/${proposalId}`,
        { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
      );
      if (res.data.status === "Success") setNotesData(res.data.data);
    } catch (error) {
      if (error.response?.status === 401) handleUnauthorized();
    }
  };

  const fetchComplimenatryData = async () => {
    if (isQuotationMode) return;
    if (!id || !proposalId) return;
    try {
      if (docTypeFromURL === "proforma") {
        const { data } = await axios.get(
          `${baseURL}/auth/api/re_calculator/proformas/snapshot/${proposalId}`,
          { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
        );
        const parsed = JSON.parse(data.data?.pricing_snapshot || "[]");
        const filtered = parsed.filter(
          (item) => item.source === "custom_complimentary" || item.service_name?.toLowerCase() === "complimentary"
        );
        setGetComplimenatryData(filtered);
      } else {
        const { data } = await axios.get(
          `${baseURL}/auth/api/re_calculator/getByIDComplimentaryData/${proposalId}/${id}`,
          { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
        );
        setGetComplimenatryData(data.data || []);
      }
    } catch (error) {
      if (error.response?.status === 401) handleUnauthorized();
    }
  };

  const handleUnauthorized = () => {
    Swal.fire({ title: "Session Expired", text: "Please login again.", icon: "warning", confirmButtonText: "OK" }).then(() => {
      dispatch(clearUser());
      localStorage.removeItem("token");
      navigate("/");
    });
  };

  const fetchDiscountSettings = async () => {
    try {
      const { data } = await axios.get(`${baseURL}/auth/api/re_calculator/getDiscountSetting`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDiscountSettings(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClient();
    fetchData();
    fetchAdsData();
    fetchPlanData();
    fetchClientNotes();
    fetchComplimenatryData();
    fetchDiscountSettings();
  }, [id, proposalId, docTypeFromURL]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── Draft Items & Totals Helpers ───────────────────────────────────────────
  const isCompItem = (r) =>
    Boolean(
      r.is_complimentary ||
      r.include_in_total === false ||
      r.source === "custom_complimentary" ||
      r.source === "complimentary" ||
      String(r.service_name || r.service || "").toLowerCase().includes("(complimentary)") ||
      String(r.service_name || r.service || "").toLowerCase() === "complimentary"
    );


  const handleDraftDelete = (itemToDelete) => {
    setDraftItems((prevItems) => {
      const isNewDraft = String(itemToDelete.id).startsWith("draft-");
      if (isNewDraft) {
        return prevItems.filter((i) => String(i.id) !== String(itemToDelete.id));
      }
      return prevItems.map((i) =>
        String(i.id) === String(itemToDelete.id) ? { ...i, _status: "pending_delete" } : i
      );
    });
  };

  const handleDraftUndoDelete = (itemToRestore) => {
    setDraftItems((prevItems) =>
      prevItems.map((i) =>
        String(i.id) === String(itemToRestore.id) ? { ...i, _status: "saved" } : i
      )
    );
  };

  const handleDraftEdit = (item) => {
    if (item._type === "ads") {
      navigate(`${basePath}/Adscalculator/${id}/${effectiveProposalId}?mode=quotation`, {
        state: { mode: "quotation", quotationId, editItem: item },
      });
    } else if (isCompItem(item)) {
      navigate(`${basePath}/complimentary/${id}/${effectiveProposalId}?mode=quotation`, {
        state: { servicetype: "complimentary", mode: "quotation", quotationId, editItem: item },
      });
    } else {
      navigate(`${basePath}/calculator/${id}/${effectiveProposalId}?mode=quotation`, {
        state: { servicetype: "paid", mode: "quotation", quotationId, editItem: item },
      });
    }
  };

  // ─── Quotation Draft Restore & Discard Handlers (Phase C) ───────────────────
  const handleRestoreDraft = () => {
    if (!pendingDraftData) return;
    const { mergedItems, conflictNotices: conflicts, discount } = mergeDraftWithDb({
      draft: pendingDraftData,
      currentDbItems: baseDbSnapshotRef.current,
    });
    setDraftItems(mergedItems);
    if (discount) {
      if (discount.discountType) setDiscountType(discount.discountType);
      if (discount.discountValue !== undefined) setDiscountValue(discount.discountValue);
    }
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`quotation_active_session_${effectiveProposalId}`, "true");
    }
    if (conflicts.length > 0) {
      setConflictNotices(conflicts);
      Swal.fire({
        icon: "info",
        title: "Server Changes Detected",
        html: `<div class="text-left text-xs space-y-1">` +
          `<p class="font-medium mb-2">Some items were modified or deleted on the server by another session. Server data was preserved for those items:</p>` +
          conflicts.map((c) => `<div class="p-1.5 bg-slate-800 rounded border border-slate-700"><b>${c.itemTitle}</b>: ${c.message}</div>`).join("") +
          `</div>`,
        confirmButtonText: "Got it",
      });
    } else {
      Swal.fire({
        icon: "success",
        title: "Draft Restored",
        text: `Restored ${mergedItems.length} items from your previous session.`,
        timer: 1500,
        showConfirmButton: false,
      });
    }
    setRestoreAvailable(false);
    setPendingDraftData(null);
  };

  const handleDiscardDraft = () => {
    clearQuotationDraft(effectiveProposalId);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(`quotation_active_session_${effectiveProposalId}`);
    }
    setRestoreAvailable(false);
    setPendingDraftData(null);
    Swal.fire({
      icon: "info",
      title: "Draft Discarded",
      text: "Local unsaved changes discarded. Showing current server data.",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  // ─── Single Batch Save Handler (Phase D) ──────────────────────────────────
  const handleSaveQuotation = async () => {
    if (!isQuotationMode || !effectiveProposalId) return;
    try {
      setIsSavingQuotation(true);

      // 1. Exclude pending_delete items
      const finalServices = draftItems.filter(
        (i) => i._type === "service" && i._status !== "pending_delete"
      );
      const finalAds = draftItems.filter(
        (i) => i._type === "ads" && i._status !== "pending_delete"
      );

      // 2. Client-side total calculation matching Phase 1/2 formula
      const paidServices = finalServices.filter((s) => !isCompItem(s));
      const rawServiceTotal = paidServices.reduce((sum, item) => {
        const qty = Number(item.quantity) || 1;
        let addonsTotal = 0;
        if (item.additional_services) {
          try {
            const addons = typeof item.additional_services === "string"
              ? JSON.parse(item.additional_services)
              : item.additional_services;
            if (Array.isArray(addons)) {
              addonsTotal = addons.reduce(
                (aSum, a) => aSum + ((Number(a.amount || a.unit_price) || 0) * (Number(a.quantity) || qty)),
                0
              );
            }
          } catch {}
        }
        const base = Number(item.editing_type_amount || item.price || item.unit_price || 0);
        const baseTotal = base * qty;
        const recordedTotal = parseFloat(item.total_amount || item.total_price || 0);
        const effectiveTotal = (recordedTotal >= baseTotal + addonsTotal && recordedTotal > 0)
          ? recordedTotal
          : (recordedTotal > 0 ? recordedTotal : baseTotal) + addonsTotal;
        return sum + effectiveTotal;
      }, 0);

      const adsTotal = finalAds.reduce((sum, item) => {
        return sum + Number(item.total || item.total_amount || item.budget || 0);
      }, 0);

      const discountAmount = discountType === "Percentage"
        ? (rawServiceTotal * Number(discountValue || 0)) / 100
        : Number(discountValue || 0);

      const finalGrandTotal = Math.max(0, rawServiceTotal - discountAmount) + adsTotal;

      // 3. Prepare payloads
      const servicesPayload = finalServices.map((s) => ({
        service_name: s.service_name || s.service || "",
        category_name: s.category_name || "",
        editing_type_name: s.editing_type_name || "",
        editing_type_amount: Number(s.editing_type_amount || s.unit_price || 0),
        quantity: Number(s.quantity || 1),
        additional_services: s.additional_services || null,
        total_amount: Number(s.total_amount || s.total_price || 0),
        source: s.source || (isCompItem(s) ? "custom_complimentary" : "graphic"),
      }));

      const adsPayload = finalAds.map((a) => ({
        category_name: a.category_name || a.category || a.service_name || "",
        budget: Number(a.budget || a.amount || 0),
        percent: Number(a.percent || 0),
        charge: Number(a.charge || 0),
        total: Number(a.total || a.total_amount || a.budget || 0),
      }));

      // 4. Batch Dispatch via Promise.all
      const promises = [
        axios.post(
          `${baseURL}/auth/api/re_calculator/quotation/${effectiveProposalId}/services`,
          { services: servicesPayload, grand_total_excl_gst: finalGrandTotal },
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.post(
          `${baseURL}/auth/api/re_calculator/quotation/${effectiveProposalId}/ads`,
          { ads: adsPayload },
          { headers: { Authorization: `Bearer ${token}` } }
        ),
      ];

      // Check if draft has notes to commit
      const currentDraftStatus = checkDraftStatus({ quotationId: effectiveProposalId });
      const draftNotes = currentDraftStatus?.draft?.notes;

      if (discountValue > 0 || discountType || (draftNotes && draftNotes.length > 0)) {
        const isPercent = discountType === "Percentage";
        const patchPayload = {
          discount_json: {
            type: isPercent ? "Percentage" : "Amount",
            value: Number(discountValue || 0),
            discount_type: isPercent ? "percent" : "amount",
            discount_amt: isPercent ? 0 : Number(discountValue || 0),
            discount_per: isPercent ? Number(discountValue || 0) : 0,
            calculatedAmount: discountAmount,
          },
          grand_total_excl_gst: finalGrandTotal,
        };
        if (draftNotes && Array.isArray(draftNotes)) {
          patchPayload.notes_json = draftNotes;
        }
        promises.push(
          axios.patch(
            `${baseURL}/auth/api/re_calculator/quotation/${effectiveProposalId}/notes`,
            patchPayload,
            { headers: { Authorization: `Bearer ${token}` } }
          )
        );
      }

      await Promise.all(promises);

      // 5. On success: clear draft, refetch clean state
      clearQuotationDraft(effectiveProposalId);
      await fetchData();
      await fetchAdsData();

      Swal.fire({
        icon: "success",
        title: "Quotation Saved!",
        text: "All changes have been successfully committed to the database.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Save quotation error:", error);
      Swal.fire({
        icon: "error",
        title: "Save Failed",
        text: error.response?.data?.message || "Failed to save quotation changes. Your local draft is preserved.",
      });
    } finally {
      setIsSavingQuotation(false);
    }
  };

  const handleDiscardAll = async () => {
    if (!isQuotationMode || !effectiveProposalId) return;
    const result = await Swal.fire({
      title: "Discard All Changes?",
      text: "All unsaved draft items, edits, and deletions will be discarded and reset to the database version.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, Discard All",
    });

    if (result.isConfirmed) {
      clearQuotationDraft(effectiveProposalId);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(`quotation_active_session_${effectiveProposalId}`);
      }
      await fetchData();
      await fetchAdsData();
      Swal.fire({
        icon: "info",
        title: "Draft Discarded",
        text: "Reset to saved server version.",
        timer: 1200,
        showConfirmButton: false,
      });
    }
  };

  // Auto-save draft changes to localStorage whenever draftItems or discount change
  useEffect(() => {
    if (!isQuotationMode || !effectiveProposalId) return;
    if (restoreAvailable) return; // Awaiting user decision on banner

    const hasPendingChanges = draftItems.some(
      (item) => item._status && item._status !== "saved"
    );

    const currentDraftStatus = checkDraftStatus({ quotationId: effectiveProposalId });
    const hasDraftNotes = Boolean(currentDraftStatus?.draft?.notes && currentDraftStatus.draft.notes.length > 0);

    if (hasPendingChanges) {
      saveQuotationDraft({
        quotationId: effectiveProposalId,
        draftItems,
        discount: { discountType, discountValue },
        notes: currentDraftStatus?.draft?.notes,
        baseDbSnapshot: baseDbSnapshotRef.current,
      });
    } else if (draftItems.length > 0 && !hasDraftNotes) {
      clearQuotationDraft(effectiveProposalId);
    }
  }, [draftItems, discountType, discountValue, isQuotationMode, effectiveProposalId, restoreAvailable]);

  // ─── Totals ─────────────────────────────────────────────────────────────────
  const activePaidDraft = draftItems.filter((o) => o._type === "service" && !isCompItem(o) && o._status !== "pending_delete");
  const activeAdsDraft = draftItems.filter((o) => o._type === "ads" && o._status !== "pending_delete");
  const activeCompDraft = draftItems.filter((o) => o._type === "service" && isCompItem(o) && o._status !== "pending_delete");

  const grandTotal = isQuotationMode
    ? activePaidDraft.reduce((acc, order) => {
        const qty = Number(order.quantity) || 1;
        let addonsTotal = 0;
        if (order.additional_services) {
          try {
            const addons = typeof order.additional_services === "string" ? JSON.parse(order.additional_services) : order.additional_services;
            if (Array.isArray(addons)) {
              addonsTotal = addons.reduce((sum, a) => sum + ((Number(a.amount || a.unit_price) || 0) * (Number(a.quantity) || qty)), 0);
            }
          } catch {}
        }
        const base = Number(order.editing_type_amount || order.price || order.unit_price || 0);
        const baseTotal = base * qty;
        const recordedTotal = parseFloat(order.total_amount || order.total_price || 0);
        const effectiveTotal = (recordedTotal >= baseTotal + addonsTotal && recordedTotal > 0)
          ? recordedTotal
          : (recordedTotal > 0 ? recordedTotal : baseTotal) + addonsTotal;
        return acc + effectiveTotal;
      }, 0)
    : getData.reduce((acc, order) => {
        if (order.service_name?.toLowerCase() === "complimentary") return acc;
        const qty = Number(order.quantity) || 1;
        let addonsTotal = 0;
        if (order.additional_services) {
          try {
            const addons = typeof order.additional_services === "string" ? JSON.parse(order.additional_services) : order.additional_services;
            if (Array.isArray(addons)) {
              addonsTotal = addons.reduce((sum, a) => sum + ((Number(a.amount || a.unit_price) || 0) * (Number(a.quantity) || qty)), 0);
            }
          } catch {}
        }
        const base = Number(order.editing_type_amount || order.price || 0);
        const baseTotal = base * qty;
        const recordedTotal = parseFloat(order.total_amount || order.total_price || 0);
        const effectiveTotal = (recordedTotal >= baseTotal + addonsTotal && recordedTotal > 0)
          ? recordedTotal
          : (recordedTotal > 0 ? recordedTotal : baseTotal) + addonsTotal;
        return acc + effectiveTotal;
      }, 0);

  const grandAdsTotal = isQuotationMode
    ? activeAdsDraft.reduce((acc, order) => acc + parseFloat(order.total || order.total_amount || 0), 0)
    : getAdsData.reduce((acc, order) => acc + parseFloat(order.total || 0), 0);

  const grandComplimentryTotal = isQuotationMode
    ? activeCompDraft.reduce((acc, order) => acc + parseFloat(order.total_amount || order.total_price || 0), 0)
    : getComplimenatryData.reduce((acc, order) => acc + parseFloat(order.total_amount || 0), 0);

  const calculatedDiscount = discountType === "Percentage"
    ? (grandTotal * discountValue) / 100
    : discountValue;
  const dmTotalAfterDiscount = Math.max(0, grandTotal - calculatedDiscount);

  const graphLength = isQuotationMode ? activePaidDraft.length : getData.length;
  const adsCampLength = isQuotationMode ? activeAdsDraft.length : getAdsData.length;
  const complimenatryLength = isQuotationMode ? activeCompDraft.length : getComplimenatryData.length;
  const finalLength = graphLength + adsCampLength + complimenatryLength;
  const totalAmount = dmTotalAfterDiscount + grandAdsTotal;

  // Unsaved changes count for header badge and floating action bar
  const unsavedChangesCount = isQuotationMode
    ? draftItems.filter((i) => i._status && i._status !== "saved").length
    : 0;

  // Check if there are unsaved plan items in draft
  const hasUnsavedPlanItems = isQuotationMode && draftItems.some(
    (item) => item.source === "plan" && item._status === "pending_add"
  );

  const openDiscountModal = () => {
    setFormDataDis({
      discount_type: discountType === "Percentage" ? "percent" : "amount",
      discount_amt: discountType === "Amount" ? (discountValue || "") : "",
      discount_per: discountType === "Percentage" ? (discountValue || "") : "",
    });
    setShowDiscountModal(true);
  };

  const handleApplyDiscount = async (e) => {
    e.preventDefault();
    const isPercent = formDataDis.discount_type === "percent";
    const val = Number(isPercent ? formDataDis.discount_per : formDataDis.discount_amt) || 0;

    if (docTypeFromURL === "proforma") {
      try {
        setLoading(true);
        const res = await axios.put(
          `${baseURL}/auth/api/re_calculator/proforma/${proposalId}/discount`,
          {
            discount_type: isPercent ? "percent" : "amount",
            discount_val: val,
            discount_amt: isPercent ? 0 : val,
            discount_per: isPercent ? val : 0,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.status === "Success") {
          setDiscountType(isPercent ? "Percentage" : "Amount");
          setDiscountValue(val);
          setShowDiscountModal(false);
          Swal.fire({
            icon: "success",
            title: "Discount Updated!",
            text: "Proforma discount saved successfully.",
            timer: 1200,
            showConfirmButton: false,
          });
        }
      } catch (err) {
        console.error(err);
        Swal.fire({ icon: "error", title: "Error", text: "Failed to update discount." });
      } finally {
        setLoading(false);
      }
    } else if (isQuotationMode) {
      // In Quotation mode: in-memory draft update only (persisted when Save Quotation is clicked)
      setDiscountType(isPercent ? "Percentage" : "Amount");
      setDiscountValue(val);
      setShowDiscountModal(false);
      Swal.fire({
        icon: "success",
        title: "Discount Updated",
        text: "Discount updated in draft. Click 'Save' to persist changes.",
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      setDiscountType(isPercent ? "Percentage" : "Amount");
      setDiscountValue(val);
      setShowDiscountModal(false);
    }
  };

  const handleRemoveDiscount = async () => {
    if (docTypeFromURL === "proforma") {
      try {
        setLoading(true);
        const res = await axios.put(
          `${baseURL}/auth/api/re_calculator/proforma/${proposalId}/discount`,
          {
            discount_type: "amount",
            discount_val: 0,
            discount_amt: 0,
            discount_per: 0,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.status === "Success") {
          setDiscountType("Amount");
          setDiscountValue(0);
          setShowDiscountModal(false);
          Swal.fire({
            icon: "success",
            title: "Discount Removed!",
            text: "Proforma discount cleared successfully.",
            timer: 1200,
            showConfirmButton: false,
          });
        }
      } catch (err) {
        console.error(err);
        Swal.fire({ icon: "error", title: "Error", text: "Failed to remove discount." });
      } finally {
        setLoading(false);
      }
    } else if (isQuotationMode) {
      // In Quotation mode: in-memory draft update only
      setDiscountType("Amount");
      setDiscountValue(0);
      setShowDiscountModal(false);
      Swal.fire({
        icon: "success",
        title: "Discount Cleared",
        text: "Discount cleared in draft. Click 'Save' to persist changes.",
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      setDiscountType("Amount");
      setDiscountValue(0);
      setShowDiscountModal(false);
    }
  };

  // ─── Group plan data ──────────────────────────────────────────────────────
  const groupByPlan = (data) => {
    const grouped = {};
    data.forEach((item) => {
      if (!grouped[item.plan_id]) {
        grouped[item.plan_id] = {
          id: item.plan_id,
          title: item.plan_name,
          subtitle: "Custom Plan",
          description: `Includes ${item.plan_name} services tailored to your needs.`,
          gradient: "from-green-500 to-yellow-600",
          navigation: `${basePath}/dynamicPlan`,
          features: [],
          totalAmount: 0,
        };
      }
      const qty = item.quantity ? ` - ${item.quantity}` : "";
      grouped[item.plan_id].features.push(`${item.service_name} - ${item.category_name}${qty}`);
      if (item.service_name?.toLowerCase() !== "complimentary") {
        grouped[item.plan_id].totalAmount += Number(item.total_amount || item.total_ads) || 0;
      }
    });
    return Object.values(grouped);
  };

  const plans = groupByPlan(getPlanData);

  // ─── Search filter ────────────────────────────────────────────────────────
  const filteredPlans = plans.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setSearchQuery(plan.title);
    setDropdownOpen(false);
    setShowPlanPopup(true);
  };

  const generateUniqueId = () =>
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // ─── Create Quotation ─────────────────────────────────────────────────────
  const handleCreateQuotation = async (plan) => {
    if (loading) return;
    setLoading(true);
    try {
      const existingPlanName = String(planName || "").trim().toLowerCase();
      const selectedPlanName = String(plan?.title || "").trim().toLowerCase();

      if (existingPlanName && existingPlanName === selectedPlanName) return;

      const filteredNotes = await getAllPlanNotes(plan.title);

      if (filteredNotes.length === 0) {
        Swal.fire({ icon: "info", title: "No Notes", text: "No notes found for this plan.", showConfirmButton: false, timer: 1000 });
        return;
      }

      const filteredPlanData = getPlanData.filter((item) => item.plan_id === plan.id);

      if (filteredPlanData.length === 0) {
        Swal.fire({ icon: "info", title: "No Data", text: "No services found for this plan." });
        return;
      }

      if (!isQuotationMode && existingPlanName && existingPlanName !== selectedPlanName) {
        await axios.delete(`${baseURL}/auth/api/re_calculator/deleteClientAllPlanData/${proposalId}`);
      }

      const planItems = filteredPlanData
        .filter((item) => item.service_name !== "Ads Campaign" && item.service_name !== "Complimentary")
        .map((item) => ({
          service_name: item.service_name,
          category_name: item.category_name,
          editing_type_id: item.editing_type_id,
          editing_type_name: item.editing_type_name,
          editing_type_amount: item.editing_type_amount,
          quantity: item.quantity,
          include_content_posting: item.include_content_posting,
          include_thumbnail_creation: item.include_thumbnail_creation,
          total_amount: item.total_amount,
          plan_name: item.plan_name,
          employee: userName,
        }));

      const adsItems = filteredPlanData
        .filter((item) => item.service_name === "Ads Campaign")
        .map((item) => ({
          txn_id: proposalId, client_id: id, id: generateUniqueId(),
          category: item.category_name, amount: item.amount_ads, percent: item.percent_ads,
          charge: item.charge_ads, total: item.total_ads, employee: userName,
        }));

      const complimentaryItems = filteredPlanData
        .filter((item) => item.service_name === "Complimentary")
        .map((item) => ({
          txn_id: proposalId, client_id: id,
          service_name: item.service_name, category_name: item.category_name,
          editing_type_id: item.editing_type_id, editing_type_name: item.editing_type_name,
          editing_type_amount: item.editing_type_amount, quantity: item.quantity,
          include_content_posting: item.include_content_posting,
          include_thumbnail_creation: item.include_thumbnail_creation,
          total_amount: item.total_amount, employee: userName,
        }));

      const planNotes = filteredNotes.map((item) => ({ note_name: item.note_name, plan: item.plan }));

      // ── QUOTATION MODE: purely in-memory draftItems update (Phase E - 0 DB calls) ──
      if (isQuotationMode && effectiveProposalId) {
        let skippedCount = 0;
        let skippedCompCount = 0;
        let skippedAdsCount = 0;
        const newItems = [];

        setDraftItems((prevDraft) => {
          // 1. Paid Services from plan
          planItems.forEach((pItem) => {
            const dup = prevDraft.find(
              (r) =>
                r._status !== "pending_delete" &&
                r._type === "service" &&
                !isCompItem(r) &&
                String(r.service_name || "").trim().toLowerCase() === String(pItem.service_name || "").trim().toLowerCase() &&
                String(r.category_name || "").trim().toLowerCase() === String(pItem.category_name || "").trim().toLowerCase() &&
                String(r.editing_type_name || "").trim().toLowerCase() === String(pItem.editing_type_name || "").trim().toLowerCase()
            );
            if (dup) {
              skippedCount++;
              return;
            }
            newItems.push({
              id: `draft-plan-${generateUniqueId()}`,
              service_name: pItem.service_name,
              category_name: pItem.category_name,
              editing_type_id: pItem.editing_type_id,
              editing_type_name: pItem.editing_type_name,
              editing_type_amount: Number(pItem.editing_type_amount || 0),
              quantity: Number(pItem.quantity || 1),
              unit_price: Number(pItem.editing_type_amount || 0),
              total_price: Number(pItem.total_amount || 0),
              total_amount: Number(pItem.total_amount || 0),
              include_content_posting: pItem.include_content_posting,
              include_thumbnail_creation: pItem.include_thumbnail_creation,
              include_in_total: true,
              is_complimentary: false,
              source: "plan",
              _type: "service",
              _status: "pending_add",
            });
          });

          // 2. Complimentary Services from plan
          complimentaryItems.forEach((cItem) => {
            const dup = prevDraft.find(
              (r) =>
                r._status !== "pending_delete" &&
                r._type === "service" &&
                isCompItem(r) &&
                String(r.service_name || "").trim().toLowerCase() === String(cItem.service_name || "").trim().toLowerCase() &&
                String(r.category_name || "").trim().toLowerCase() === String(cItem.category_name || "").trim().toLowerCase() &&
                String(r.editing_type_name || "").trim().toLowerCase() === String(cItem.editing_type_name || "").trim().toLowerCase()
            );
            if (dup) {
              skippedCompCount++;
              return;
            }
            newItems.push({
              id: `draft-plan-${generateUniqueId()}`,
              service_name: cItem.service_name,
              category_name: cItem.category_name,
              editing_type_id: cItem.editing_type_id,
              editing_type_name: cItem.editing_type_name,
              editing_type_amount: Number(cItem.editing_type_amount || 0),
              quantity: Number(cItem.quantity || 1),
              unit_price: Number(cItem.editing_type_amount || 0),
              total_price: Number(cItem.total_amount || 0),
              total_amount: Number(cItem.total_amount || 0),
              include_content_posting: cItem.include_content_posting,
              include_thumbnail_creation: cItem.include_thumbnail_creation,
              include_in_total: false,
              is_complimentary: true,
              source: "plan",
              _type: "service",
              _status: "pending_add",
            });
          });

          // 3. Ads Campaigns from plan
          adsItems.forEach((aItem) => {
            const dup = prevDraft.find(
              (r) =>
                r._status !== "pending_delete" &&
                r._type === "ads" &&
                String(r.category || r.category_name || "").trim().toLowerCase() === String(aItem.category || "").trim().toLowerCase()
            );
            if (dup) {
              skippedAdsCount++;
              return;
            }
            newItems.push({
              id: `draft-plan-${generateUniqueId()}`,
              category: aItem.category,
              category_name: aItem.category,
              amount: Number(aItem.amount || 0),
              budget: Number(aItem.amount || 0),
              percent: Number(aItem.percent || 0),
              charge: Number(aItem.charge || 0),
              total: Number(aItem.total || 0),
              include_in_total: true,
              is_complimentary: false,
              source: "plan",
              _type: "ads",
              _status: "pending_add",
            });
          });

          return [...prevDraft, ...newItems];
        });

        const totalSkipped = skippedCount + skippedCompCount + skippedAdsCount;
        const skipMsg = totalSkipped > 0
          ? ` (${totalSkipped} already-existing item(s) skipped)`
          : "";

        Swal.fire({
          icon: "success",
          title: "Plan Added to Draft",
          text: `${newItems.length} plan item(s) added as draft.${skipMsg} Click 'Save' to persist changes.`,
          showConfirmButton: false,
          timer: 1500,
        });

        setPlanName(plan.title);
        setShowPlanPopup(false);
        setSelectedPlan(null);
        setSearchQuery("");
        return;
      }

      // ── PROPOSAL / LEGACY MODE (unchanged) ──
      await axios.post(
        `${baseURL}/auth/api/re_calculator/savePlanClientNotes`,
        { txn_id: proposalId, client_id: id, plans: planItems, planNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (adsItems.length > 0) {
        await axios.post(
          `${baseURL}/auth/api/re_calculator/saveAdsCampaign`,
          { adsItems },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      for (const item of complimentaryItems) {
        await axios.post(
          `${baseURL}/auth/api/re_calculator/saveComplimentaryData`,
          item,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      Swal.fire({ icon: "success", title: "Quotation Created", text: "Plan quotation saved successfully!", showConfirmButton: false, timer: 1000 });
      setShowModal(true);
      setShowPlanPopup(false);
      setSelectedPlan(null);
      setSearchQuery("");
      fetchData(); fetchClientNotes(); fetchAdsData(); fetchComplimenatryData();
    } catch (err) {
      console.error("Save error:", err);
      Swal.fire({ icon: "error", title: "Error", text: "Something went wrong while saving the quotation.", showConfirmButton: false, timer: 1000 });
    } finally {
      setLoading(false);
    }
  };

  // ─── Delete handlers ──────────────────────────────────────────────────────
  const handleRemoveQuotationPlan = () => {
    setDraftItems((prev) => prev.filter((item) => item.source !== "plan"));
    setPlanName("");
    Swal.fire({
      icon: "success",
      title: "Plan Removed",
      text: "Unsaved plan items removed from draft.",
      timer: 1200,
      showConfirmButton: false,
    });
  };

  const handleDeleteClientPlanData = async (txn_id) => {
    if (isQuotationMode) {
      handleRemoveQuotationPlan();
      return;
    }
    const confirm = await Swal.fire({ title: "Are you sure?", text: "Do you want to delete this client plan data permanently?", icon: "warning", showCancelButton: true, confirmButtonText: "Yes, delete it!" });
    if (confirm.isConfirmed) {
      try {
        if (docTypeFromURL === "proforma") {
          await axios.put(
            `${baseURL}/auth/api/re_calculator/proformas/snapshot`,
            { proformaId: proposalId, action: "update", item: [], editId: null, snapshotType: 'services' },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } else {
          const res = await axios.delete(`${baseURL}/auth/api/re_calculator/deleteClientAllPlanData/${txn_id}`);
          if (res.data.status !== "Success") {
            Swal.fire("Error!", res.data.message || "Failed to delete plan.", "error");
            return;
          }
        }
        Swal.fire({ icon: "success", title: "Deleted!", text: "Plan has been deleted.", showConfirmButton: false, timer: 1000 });
        setGetData([]); setPlanName(""); setNotesData([]); fetchClientNotes(); fetchAdsData(); setGetAdsData([]); setGetComplimenatryData([]);
      } catch (err) {
        Swal.fire("Error!", "Something went wrong while deleting.", "error");
      }
    }
  };

  const handleDelete = async (entryId) => {
    const confirm = await Swal.fire({ title: "Are you sure?", text: "Do you really want to delete this entry?", icon: "warning", showCancelButton: true, confirmButtonColor: "#e11d48", cancelButtonColor: "#6b7280", confirmButtonText: "Yes, delete it!" });
    if (!confirm.isConfirmed) return;
    try {
      if (isQuotationMode) {
        const qRes = await axios.get(
          `${baseURL}/auth/api/re_calculator/quotation/${effectiveProposalId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const allServices = qRes.data?.data?.services || [];
        const isComp = (r) =>
          r.source === "custom_complimentary" ||
          r.is_complimentary === true ||
          String(r.service_name || "").toLowerCase().includes("(complimentary)") ||
          String(r.service_name || "").toLowerCase() === "complimentary";
        const updatedServices = allServices.filter((s) => String(s.id) !== String(entryId));
        const paidGrandTotal = updatedServices
          .filter((s) => !isComp(s))
          .reduce((sum, r) => sum + Number(r.total_amount || r.total_price || 0), 0);
        await axios.post(
          `${baseURL}/auth/api/re_calculator/quotation/${effectiveProposalId}/services`,
          { services: updatedServices, grand_total_excl_gst: paidGrandTotal },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setGetData((prev) => prev.filter((item) => String(item.id) !== String(entryId)));
        Swal.fire({ icon: "success", title: "Deleted!", text: "Entry has been deleted.", showConfirmButton: false, timer: 1000 });
        fetchData();
        return;
      }
      if (docTypeFromURL === "proforma") {
        const res = await axios.put(
          `${baseURL}/auth/api/re_calculator/proformas/snapshot`,
          {
            proformaId: proposalId,
            action: "delete",
            entryId: entryId,
            snapshotType: 'services',
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.status === "Success") {
          setGetData((prev) => prev.filter((item) => String(item.id) !== String(entryId)));
          Swal.fire({ icon: "success", title: "Deleted!", text: "Entry has been deleted.", showConfirmButton: false, timer: 1000 });
          fetchData();
        } else {
          Swal.fire({ icon: "error", title: "Failed!", text: res.data.message || "Failed to delete entry.", showConfirmButton: false, timer: 1000 });
        }
      } else {
        const res = await axios.delete(`${baseURL}/auth/api/re_calculator/deleteGraphicEntryById/${entryId}`);
        if (res.data.status === "Success") {
          setGetData((prev) => prev.filter((item) => item.id !== entryId));
          Swal.fire({ icon: "success", title: "Deleted!", text: "Entry has been deleted.", showConfirmButton: false, timer: 1000 });
          fetchClientNotes();
        } else {
          Swal.fire({ icon: "error", title: "Failed!", text: res.data.message || "Failed to delete entry.", showConfirmButton: false, timer: 1000 });
        }
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "An error occurred while deleting entry.", showConfirmButton: false, timer: 1000 });
    }
  };

  const handleDeleteComplimenatry = async (entryId) => {
    const confirm = await Swal.fire({ title: "Are you sure?", text: "Do you really want to delete this entry?", icon: "warning", showCancelButton: true, confirmButtonColor: "#e11d48", cancelButtonColor: "#6b7280", confirmButtonText: "Yes, delete it!" });
    if (!confirm.isConfirmed) return;
    try {
      if (isQuotationMode) {
        const qRes = await axios.get(
          `${baseURL}/auth/api/re_calculator/quotation/${effectiveProposalId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const allServices = qRes.data?.data?.services || [];
        const isComp = (r) =>
          r.source === "custom_complimentary" ||
          r.is_complimentary === true ||
          String(r.service_name || "").toLowerCase().includes("(complimentary)") ||
          String(r.service_name || "").toLowerCase() === "complimentary";
        const updatedServices = allServices.filter((s) => String(s.id) !== String(entryId));
        const paidGrandTotal = updatedServices
          .filter((s) => !isComp(s))
          .reduce((sum, r) => sum + Number(r.total_amount || r.total_price || 0), 0);
        await axios.post(
          `${baseURL}/auth/api/re_calculator/quotation/${effectiveProposalId}/services`,
          { services: updatedServices, grand_total_excl_gst: paidGrandTotal },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setGetComplimenatryData((prev) => prev.filter((item) => String(item.id) !== String(entryId)));
        Swal.fire({ icon: "success", title: "Deleted!", text: "Entry has been deleted.", showConfirmButton: false, timer: 1000 });
        fetchData();
        return;
      }
      if (docTypeFromURL === "proforma") {
        const res = await axios.put(
          `${baseURL}/auth/api/re_calculator/proformas/snapshot`,
          {
            proformaId: proposalId,
            action: "delete",
            entryId: entryId,
            snapshotType: 'services',
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.status === "Success") {
          setGetComplimenatryData((prev) => prev.filter((item) => String(item.id) !== String(entryId)));
          Swal.fire({ icon: "success", title: "Deleted!", text: "Entry has been deleted.", showConfirmButton: false, timer: 1000 });
          fetchComplimenatryData();
        } else {
          Swal.fire({ icon: "error", title: "Failed!", text: res.data.message || "Failed to delete entry.", showConfirmButton: false, timer: 1000 });
        }
      } else {
        const res = await axios.delete(`${baseURL}/auth/api/re_calculator/deleteComplimenatryById/${entryId}`);
        if (res.data.status === "Success") {
          setGetComplimenatryData((prev) => prev.filter((item) => item.id !== entryId));
          Swal.fire({ icon: "success", title: "Deleted!", text: "Entry has been deleted.", showConfirmButton: false, timer: 1000 });
          fetchComplimenatryData();
        } else {
          Swal.fire({ icon: "error", title: "Failed!", text: res.data.message || "Failed to delete entry.", showConfirmButton: false, timer: 1000 });
        }
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "An error occurred while deleting entry.", showConfirmButton: false, timer: 1000 });
    }
  };

  const handleDeleteClientNote = async (noteId) => {
    const confirm = await Swal.fire({ title: "Are you sure?", text: "Do you really want to delete this note?", icon: "warning", showCancelButton: true, confirmButtonColor: "#e11d48", cancelButtonColor: "#6b7280", confirmButtonText: "Yes, delete it!" });
    if (!confirm.isConfirmed) return;
    try {
      const res = await axios.delete(`${baseURL}/auth/api/re_calculator/deletePlanClientNotes/${noteId}`);
      if (res.data.status === "Success") {
        Swal.fire({ icon: "success", title: "Deleted!", text: "Note has been deleted.", timer: 1000, showConfirmButton: false });
        fetchClientNotes();
      } else {
        Swal.fire({ icon: "error", title: "Failed!", text: res.data.message || "Failed to delete entry.", showConfirmButton: false, timer: 1000 });
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "An error occurred while deleting entry.", showConfirmButton: false, timer: 1000 });
    }
  };

  const handleDeleteads = async (entryId) => {
    const confirm = await Swal.fire({ title: "Are you sure?", text: "Do you really want to delete this entry?", icon: "warning", showCancelButton: true, confirmButtonColor: "#e11d48", cancelButtonColor: "#6b7280", confirmButtonText: "Yes, delete it!" });
    if (!confirm.isConfirmed) return;
    try {
      if (isQuotationMode) {
        const remaining = getAdsData.filter((item) => String(item.id) !== String(entryId));
        const adsPayload = remaining.map((row) => ({
          category_name: row.category || row.category_name,
          budget: row.amount || row.budget || 0,
          percent: row.percent || 0,
          charge: row.charge || 0,
          total: row.total || row.total_amount || 0,
        }));
        await axios.post(
          `${baseURL}/auth/api/re_calculator/quotation/${effectiveProposalId}/ads`,
          { ads: adsPayload },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setGetAdsData(remaining);
        Swal.fire({ icon: "success", title: "Deleted!", text: "Entry has been deleted.", timer: 1000, showConfirmButton: false });
        fetchAdsData();
        return;
      }
      if (docTypeFromURL === "proforma") {
        const res = await axios.put(
          `${baseURL}/auth/api/re_calculator/proformas/snapshot`,
          {
            proformaId: proposalId,
            action: "delete",
            entryId: entryId,
            snapshotType: 'ads',
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.status === "Success") {
          setGetAdsData((prev) => prev.filter((item) => String(item.id) !== String(entryId)));
          Swal.fire({ icon: "success", title: "Deleted!", text: "Entry has been deleted.", timer: 1000, showConfirmButton: false });
          fetchAdsData();
        } else {
          Swal.fire({ icon: "error", title: "Failed!", text: res.data.message || "Failed to delete entry.", showConfirmButton: false, timer: 1000 });
        }
      } else {
        const res = await axios.delete(`${baseURL}/auth/api/re_calculator/deleteAdsCampaignEntryById/${entryId}`);
        if (res.data.status === "Success") {
          setGetAdsData((prev) => prev.filter((item) => item.id !== entryId));
          Swal.fire({ icon: "success", title: "Deleted!", text: "Entry has been deleted.", timer: 1000, showConfirmButton: false });
          fetchAdsData(); fetchClientNotes();
        } else {
          Swal.fire({ icon: "error", title: "Failed!", text: res.data.message || "Failed to delete entry.", showConfirmButton: false, timer: 1000 });
        }
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "An error occurred while deleting entry.", showConfirmButton: false, timer: 1000 });
    }
  };



  return (
    <div
      className="min-h-screen lg:h-screen relative overflow-x-hidden overflow-y-auto lg:overflow-hidden flex flex-col"
      style={{
        background: isLight
          ? 'linear-gradient(135deg, #fdf6ec 0%, #fef3e8 50%, #fdf6ec 100%)'
          : 'linear-gradient(to bottom right, #030712, #0f172a, #030712)',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[420px] h-[420px] bg-red-500/[0.06] rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-[420px] h-[420px] bg-orange-500/[0.06] rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/3 right-1/4 w-56 h-56 bg-yellow-500/[0.04] rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* ── MAIN LAYOUT: flex-col, fills screen ─────────────────────────── */}
      <div className="relative z-10 flex flex-col min-h-screen lg:h-full px-4 sm:px-6 py-3 pb-28 lg:pb-3 gap-3 overflow-visible lg:overflow-hidden">

        {/* ── ROW 1: Back + Stats ───────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Back */}
          <button
            onClick={async () => {
              if (isQuotationMode && effectiveProposalId) {
                const activeCount = (draftItems || []).filter((i) => i._status !== "pending_delete").length;
                const draftStatus = checkDraftStatus({ quotationId: effectiveProposalId });
                const hasLocalDraft = Boolean(
                  draftStatus?.restoreAvailable &&
                  draftStatus?.draft &&
                  Array.isArray(draftStatus.draft.draftItems) &&
                  draftStatus.draft.draftItems.filter((i) => i._status !== "pending_delete").length > 0
                );
                if (
                  activeCount === 0 &&
                  !hasLocalDraft &&
                  (!getData || getData.length === 0) &&
                  (!getAdsData || getAdsData.length === 0)
                ) {
                  try {
                    await axios.delete(`${baseURL}/auth/api/re_calculator/quotation/${effectiveProposalId}`, {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    clearQuotationDraft(effectiveProposalId);
                  } catch (e) {}
                }
              }
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                const fallback = docTypeFromURL === "proforma"
                  ? `${basePath}/balance-proforma/${id}/${proposalId}`
                  : `${basePath}/quotation/${id}/${proposalId}`;
                navigate(fallback);
              }
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 transition-all duration-200 shrink-0 font-medium text-sm ${
              isLight
                ? "text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 shadow-sm"
                : "text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20"
            }`}
          >
            <ArrowLeft className="w-4 h-4 transform transition-transform group-hover:-translate-x-1" />
            <span className="font-medium text-sm">Back</span>
          </button>

          {/* Stats row */}
          <div className={`flex-1 flex overflow-x-auto sm:grid ${isQuotationMode ? "sm:grid-cols-6" : (docTypeFromURL === "proforma" ? "sm:grid-cols-5" : "sm:grid-cols-4")} gap-2 pb-1 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent`}>
            {/* Total Amount */}
            <div className="min-w-[130px] sm:min-w-0 relative overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-xl p-2.5 border border-white/10 hover:border-yellow-400/30 flex items-center gap-2 transition-all duration-200">
              <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-r" />
              <div className="w-8 h-8 bg-yellow-500/15 rounded-lg flex items-center justify-center shrink-0">
                <IndianRupee className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="min-w-0">
                <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider truncate">Amount</p>
                <p className="text-sm font-bold text-white truncate">₹{totalAmount.toLocaleString()}</p>
                {discountValue > 0 && (
                  <p className="text-[9px] text-yellow-400/80 truncate">Disc: -₹{calculatedDiscount.toLocaleString()}</p>
                )}
              </div>
            </div>

            {/* Discount Card (in proforma or quotation mode) */}
            {(docTypeFromURL === "proforma" || isQuotationMode) && (
              <div className="min-w-[130px] sm:min-w-0 relative overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-xl p-2.5 border border-white/10 hover:border-yellow-400/30 transition-all duration-200">
                <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-amber-400 to-yellow-500 rounded-r" />
                <button onClick={openDiscountModal} className="w-full text-left flex items-center justify-between gap-1.5 group/disc">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 bg-yellow-500/15 rounded-lg flex items-center justify-center shrink-0 group-hover/disc:scale-105 transition-transform">
                      <BadgePercent className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider truncate">Discount</p>
                      <p className="text-sm font-bold text-yellow-400 truncate">
                        {discountValue > 0 ? `₹${calculatedDiscount.toLocaleString()}` : "No Discount"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-yellow-400/20 text-yellow-300 font-semibold px-2 py-0.5 rounded border border-yellow-400/30 shrink-0">
                    {discountValue > 0 ? "Edit" : "+ Add"}
                  </span>
                </button>
              </div>
            )}
            {/* Client */}
            <div className="min-w-[130px] sm:min-w-0 relative overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-xl p-2.5 border border-white/10 hover:border-orange-400/30 flex items-center gap-2 transition-all duration-200">
              <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-orange-400 to-pink-500 rounded-r" />
              <div className="w-8 h-8 bg-orange-500/15 rounded-lg flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-orange-400" />
              </div>
              <div className="min-w-0">
                <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider truncate">Client</p>
                <p className="text-sm font-bold text-white truncate">{clientName || "N/A"}</p>
              </div>
            </div>
            {/* Orders */}
            <div className="min-w-[130px] sm:min-w-0 relative overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-xl p-2.5 border border-white/10 hover:border-red-400/30 flex items-center gap-2 transition-all duration-200">
              <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-red-400 to-amber-500 rounded-r" />
              <div className="w-8 h-8 bg-red-500/15 rounded-lg flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider truncate">Orders</p>
                <p className="text-sm font-bold text-white truncate">{finalLength}</p>
              </div>
            </div>
            {/* Quotation */}
            <div className="min-w-[140px] sm:min-w-0 relative overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-xl p-2.5 border border-white/10 hover:border-amber-400/30 transition-all duration-200">
              <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-amber-400 to-orange-500 rounded-r" />
              {finalLength ? (
                <button onClick={() => {
                  if (isQuotationMode && docTypeFromURL !== "proforma") {
                    navigate(`${basePath}/quotation/${id}/${effectiveProposalId}?doc=quotation&source=new_quotation`);
                    return;
                  }
                  setShowModal(true);
                }} className="w-full text-left flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-500/15 rounded-lg flex items-center justify-center shrink-0">
                    <Eye className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider truncate">Quotation</p>
                    <p className="text-sm font-bold text-white flex items-center gap-1 group/btn">
                      Preview <ArrowRight className="w-3 h-3 transform transition-transform group-hover/btn:translate-x-1" />
                    </p>
                  </div>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-500/15 rounded-lg flex items-center justify-center shrink-0">
                    <Notebook className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-white/30 text-xs">No quotation yet</p>
                </div>
              )}
            </div>

            {/* Top Header Save Button (Quotation Mode only) */}
            {isQuotationMode && (
              <button
                type="button"
                onClick={handleSaveQuotation}
                disabled={isSavingQuotation || unsavedChangesCount === 0}
                className={`min-w-[140px] sm:min-w-0 relative overflow-hidden rounded-xl p-2.5 border transition-all duration-200 flex items-center justify-between gap-2 shrink-0 ${
                  unsavedChangesCount > 0
                    ? "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white border-emerald-400/40 shadow-lg shadow-emerald-900/30 cursor-pointer active:scale-95"
                    : "bg-white/[0.04] border-white/10 text-white/40 cursor-not-allowed"
                }`}
                title={unsavedChangesCount > 0 ? `Save ${unsavedChangesCount} pending change(s)` : "No pending changes"}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    unsavedChangesCount > 0 ? "bg-white/20 text-white" : "bg-white/5 text-white/30"
                  }`}>
                    <Save className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-[10px] font-semibold uppercase tracking-wider truncate opacity-70">Quotation</p>
                    <p className="text-xs font-bold truncate">
                      {isSavingQuotation ? "Saving..." : "Save"}
                    </p>
                  </div>
                </div>
                {unsavedChangesCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white text-emerald-800 shrink-0 shadow-sm">
                    {unsavedChangesCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ── Phase C: Unsaved Draft Restore Banner (< 48 hours) ─────────── */}
        {isQuotationMode && restoreAvailable && pendingDraftData && (
          <div className="flex-shrink-0 bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 border border-amber-500/40 rounded-2xl p-3 sm:px-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3 text-white min-w-0 w-full sm:w-auto">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                  Unsaved Draft Available
                </p>
                <p className="text-[11px] text-white/80 truncate">
                  Aapka pichla unsaved kaam mila ({pendingDraftData.draftItems?.length || 0} items,{" "}
                  {Math.max(1, Math.round((Date.now() - Number(pendingDraftData.timestamp || Date.now())) / (60 * 1000)))} min pehle).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              <button
                onClick={handleRestoreDraft}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                Restore Draft
              </button>
              <button
                onClick={handleDiscardDraft}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white/90 border border-white/20 transition-all active:scale-95"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* ── ROW 2: Plan Search Bar (prominent, top) ────────────────────── */}
        <div className="flex-shrink-0" ref={searchRef}>
          <div className="relative">
            {/* Label */}
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 flex items-center gap-1.5">
              <Star className="w-3 h-3 text-yellow-400" />
              Plan Wise Search
            </p>
            <div className="flex gap-2">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setDropdownOpen(true);
                    if (!e.target.value) { setSelectedPlan(null); setShowPlanPopup(false); }
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  placeholder="Type to search a plan..."
                  className={`w-full rounded-xl pl-10 pr-8 py-2.5 text-sm outline-none transition-all duration-200 ${
                    isLight
                      ? "bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-sm"
                      : "bg-white/[0.06] border border-white/10 text-white placeholder-white/25 focus:border-yellow-400/40 focus:bg-white/[0.09]"
                  }`}
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(""); setSelectedPlan(null); setShowPlanPopup(false); setDropdownOpen(false); }}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isLight ? "text-gray-400 hover:text-gray-700" : "text-white/30 hover:text-white"}`}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {/* Dropdown toggle */}
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className={`rounded-xl px-3 py-2.5 transition-all duration-200 flex items-center gap-1.5 text-sm font-medium ${
                  isLight
                    ? "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-900 shadow-sm"
                    : "bg-white/[0.06] border border-white/10 hover:bg-white/[0.12] hover:border-white/20 text-white/70 hover:text-white"
                }`}
              >
                Plans <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Dropdown list */}
            {dropdownOpen && filteredPlans.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900/98 backdrop-blur-xl border border-white/15 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-50 max-h-48 overflow-y-auto">
                {filteredPlans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => handlePlanSelect(plan)}
                    className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/[0.07] transition-all duration-150 flex items-center justify-between gap-3 border-b border-white/5 last:border-0"
                  >
                    <span className="flex items-center gap-2">
                      <Star className="w-3 h-3 text-yellow-400/60" />
                      <span className="font-medium">{plan.title}</span>
                    </span>
                    <span className="text-yellow-400 font-bold text-xs bg-yellow-400/10 px-2 py-0.5 rounded-md shrink-0">₹{plan.totalAmount.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            )}
            {dropdownOpen && searchQuery && filteredPlans.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900/98 backdrop-blur-xl border border-white/15 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-50 px-4 py-3 text-white/40 text-sm">
                No plan found for "{searchQuery}"
              </div>
            )}
          </div>
        </div>

        {/* ── ROW 3: Service Cards + Data Tables side by side ────────────── */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-3 min-h-0">

          {/* Left: Compact service quick-links */}
          <div className="lg:col-span-1 flex flex-col gap-1.5 lg:min-h-0 lg:overflow-hidden overflow-visible flex-shrink-0">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.15em] flex-shrink-0">Services</p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:flex lg:flex-col gap-2 lg:gap-1.5 lg:overflow-y-auto pb-2 lg:pb-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {services.map((service) => {
                const IconComponent = service.icon;
                return (
                  <div key={service.id} className={`w-full shrink-0 group relative overflow-hidden rounded-xl transition-all duration-200 flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-3 py-2.5 cursor-pointer ${
                    isLight
                      ? "bg-white hover:bg-orange-50/50 border border-gray-200 hover:border-orange-300 shadow-sm"
                      : "bg-gradient-to-r from-white/[0.06] to-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.09]"
                  }`}
                    onClick={() => handleCustomServiceNavigate(service)}>
                    <div className={`absolute left-0 top-0 w-[3px] h-full bg-gradient-to-b ${service.gradient} rounded-r opacity-70`} />
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${service.gradient} shadow flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105`}>
                      <IconComponent className="w-4 h-4 !text-white text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-xs truncate leading-tight ${isLight ? "text-gray-900" : "text-white"}`}>{service.title}</p>
                      <p className={`text-[9px] font-semibold uppercase tracking-wider bg-gradient-to-r ${service.gradient} bg-clip-text text-transparent truncate`}>{service.subtitle}</p>
                    </div>
                    <ArrowRight className={`w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-all duration-200 shrink-0 ${isLight ? "text-gray-400 group-hover:text-gray-700" : "text-white/20 group-hover:text-white/60"}`} />
                  </div>
                );
              })}
            </div>

            {/* Active Plan */}
            {planName && (
              <div className={`flex-shrink-0 relative overflow-hidden rounded-xl px-3 py-2 flex items-center justify-between gap-2 mt-1 ${
                isLight
                  ? "bg-amber-50/70 border border-amber-300 shadow-sm"
                  : "bg-gradient-to-r from-yellow-500/10 to-white/[0.03] border border-yellow-400/20"
              }`}>
                <div className="absolute left-0 top-0 w-[3px] h-full bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-r" />
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                  <div className="min-w-0">
                    <p className={`text-[9px] font-semibold uppercase tracking-wider ${isLight ? "text-amber-800" : "text-yellow-300/60"}`}>Active Plan</p>
                    <p className={`font-semibold text-[11px] truncate ${isLight ? "text-gray-900" : "text-white"}`}>{planName}</p>
                  </div>
                </div>
                {isQuotationMode ? (
                  hasUnsavedPlanItems ? (
                    <button
                      onClick={handleRemoveQuotationPlan}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/15 text-red-300 hover:bg-red-500 hover:text-white border border-red-400/25 transition-all shrink-0 cursor-pointer"
                      title="Remove unsaved plan items from draft"
                    >
                      Remove Plan
                    </button>
                  ) : (
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-500/15 text-gray-400 border border-gray-500/20 shrink-0 cursor-not-allowed"
                      title="Plan items already saved to quotation. To delete, delete rows individually."
                    >
                      Saved
                    </span>
                  )
                ) : (
                  <button
                    onClick={() => handleDeleteClientPlanData(proposalId)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all duration-200 shrink-0 ${
                      isLight
                        ? "bg-red-100 text-red-700 hover:bg-red-600 hover:text-white border border-red-300 shadow-sm"
                        : "bg-red-500/15 text-red-300 hover:bg-red-500 hover:text-white border border-red-400/25"
                    }`}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right: Data Tables (wider) */}
          <div className="lg:col-span-4 flex flex-col gap-2 min-h-0 overflow-visible lg:overflow-hidden">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.15em] flex-shrink-0">Recent Orders</p>
            <div className="flex-1 overflow-visible lg:overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

              {/* Inline Selected Plan */}
              {selectedPlan && (
                <div className="relative bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-yellow-400/30 rounded-2xl p-4 md:p-6 mb-4 flex flex-col gap-4 md:gap-5 transition-all shadow-[0_0_20px_rgba(52,211,153,0.1)]">
                  <button onClick={() => setSelectedPlan(null)} className="absolute top-3 right-3 text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full p-1.5 z-10"><X className="w-4 h-4" /></button>
                  
                  {/* Top: Header & Action */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start md:items-center gap-4 min-w-0 pr-8">
                      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-r ${selectedPlan.gradient} shadow-lg flex items-center justify-center shrink-0`}>
                        <Star className="w-6 h-6 md:w-7 md:h-7 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                           <h3 className="text-lg md:text-xl font-bold text-white truncate">{selectedPlan.title}</h3>
                           <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r ${selectedPlan.gradient} text-white px-2 py-0.5 rounded-full shrink-0`}>SELECTED PLAN</span>
                        </div>
                        <p className="text-white/60 text-xs md:text-sm leading-relaxed mb-0">{selectedPlan.description}</p>
                      </div>
                    </div>
                    {/* Price and Action */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 shrink-0 pt-3 md:pt-0 border-t border-white/10 md:border-t-0">
                       <div className="text-left md:text-right">
                          <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-0.5">Total Amount</p>
                          <p className="text-xl md:text-2xl font-bold text-white leading-none">₹{selectedPlan.totalAmount.toLocaleString()}</p>
                       </div>
                       <button
                         onClick={() => handleCreateQuotation(selectedPlan)}
                         disabled={loading}
                         className={`w-auto py-2 px-5 md:py-2.5 md:px-6 rounded-xl font-semibold text-white text-xs md:text-sm bg-gradient-to-r ${selectedPlan.gradient} shadow-lg hover:shadow-xl hover:scale-[1.02] transform transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                       >
                         {loading ? "Saving..." : "Create Quotation"}
                         {!loading && <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                       </button>
                    </div>
                  </div>

                  {/* Bottom: Features */}
                  {selectedPlan.features.length > 0 && (
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2.5">Included Features</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                        {selectedPlan.features.map((feature, i) => (
                           <div key={i} className="flex items-start gap-2 text-xs md:text-sm text-white/80 bg-white/[0.03] p-2 md:p-2.5 rounded-xl border border-white/[0.05] hover:bg-white/[0.08] transition-colors">
                             <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gradient-to-r ${selectedPlan.gradient} mt-1.5 shrink-0`}></div>
                             <span className="whitespace-normal leading-relaxed">{feature}</span>
                           </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Graphic & SEO */}
              {((isQuotationMode ? draftItems.some((i) => i._type === "service" && !isCompItem(i)) : getData.length > 0)) && (
                <div className="relative overflow-hidden bg-gradient-to-br from-white/[0.06] to-white/[0.02] rounded-2xl border border-white/10">
                  <div className="h-[2px] w-full bg-gradient-to-r from-slate-500 to-gray-600" />
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                    <span className="text-white font-semibold text-sm flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-slate-400" /> Graphic & SEO
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400 font-bold text-xs bg-yellow-400/10 px-2 py-0.5 rounded-md">₹{grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-xs text-white">
                      <thead className="bg-white/5 text-white/60">
                        <tr>
                          {["#", "Date", "Service", "Category", "Editing Type", "Qty", "Amount", ...(isQuotationMode ? ["Status"] : []), "Action"].map(h => (
                            <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {(isQuotationMode ? draftItems.filter((i) => i._type === "service" && !isCompItem(i)) : getData).map((order, index) => {
                          const isPendingDelete = isQuotationMode && order._status === "pending_delete";
                          return (
                            <tr key={order.id} className={`hover:bg-white/5 transition-colors ${isPendingDelete ? "opacity-50 line-through bg-red-950/20" : ""}`}>
                              <td className="px-3 py-2 whitespace-nowrap">{index + 1}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{order.created_at || (order._status === "pending_add" ? "Just now" : "-")}</td>
                              <td className="px-3 py-2 min-w-[100px]">{order.service_name}</td>
                              <td className="px-3 py-2 min-w-[100px]">
                                <div>{order.category_name || "-"}</div>
                                {(() => {
                                  let orderAddons = [];
                                  if (order.additional_services) {
                                    try {
                                      orderAddons = typeof order.additional_services === "string"
                                        ? JSON.parse(order.additional_services)
                                        : order.additional_services;
                                      if (!Array.isArray(orderAddons)) orderAddons = [];
                                    } catch {
                                      orderAddons = [];
                                    }
                                  }
                                  if (orderAddons.length === 0) return null;
                                  return (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {orderAddons.map((addon, aIdx) => (
                                        <span
                                          key={aIdx}
                                          className="inline-flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded px-1.5 py-0.5 font-medium"
                                        >
                                          ✨ {addon.name || addon.additional_service_name} (+₹{Number(addon.amount || 0).toLocaleString("en-IN")})
                                        </span>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="px-3 py-2 min-w-[100px]">{order.editing_type_name || "-"}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{order.quantity}</td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                {(() => {
                                  const qty = Number(order.quantity) || 1;
                                  let addonsTotal = 0;
                                  if (order.additional_services) {
                                    try {
                                      const addons = typeof order.additional_services === "string" ? JSON.parse(order.additional_services) : order.additional_services;
                                      if (Array.isArray(addons)) {
                                        addonsTotal = addons.reduce((sum, a) => sum + ((Number(a.amount || a.unit_price) || 0) * (Number(a.quantity) || qty)), 0);
                                      }
                                    } catch {}
                                  }
                                  const base = Number(order.editing_type_amount || order.price || order.unit_price || 0);
                                  const baseTotal = base * qty;
                                  const recordedTotal = parseFloat(order.total_amount || order.total_price || 0);
                                  const effectiveTotal = (recordedTotal >= baseTotal + addonsTotal && recordedTotal > 0)
                                    ? recordedTotal
                                    : (recordedTotal > 0 ? recordedTotal : baseTotal) + addonsTotal;
                                  return `₹${effectiveTotal.toLocaleString("en-IN")}`;
                                })()}
                              </td>
                              {isQuotationMode && (
                                <td className="px-3 py-2 whitespace-nowrap">
                                  {order._status === "pending_delete" && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30">Pending Delete</span>
                                  )}
                                  {order._status === "pending_add" && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">Unsaved (New)</span>
                                  )}
                                  {order._status === "pending_edit" && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">Unsaved (Edited)</span>
                                  )}
                                  {(!order._status || order._status === "saved") && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Saved</span>
                                  )}
                                </td>
                              )}
                              <td className="px-3 py-2 whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  {isQuotationMode ? (
                                    isPendingDelete ? (
                                      <button
                                        onClick={() => handleDraftUndoDelete(order)}
                                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-white border border-amber-500/30 transition-all shadow-sm"
                                      >
                                        Undo
                                      </button>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => handleDraftEdit(order)}
                                          className={isLight ? "px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-300 transition-all shadow-sm" : "px-2 py-1 rounded-md text-[10px] font-semibold bg-blue-500/20 text-blue-300 hover:bg-blue-500 hover:text-white border border-blue-500/30 transition-all"}
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleDraftDelete(order)}
                                          className={isLight ? "px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-100 text-red-700 hover:bg-red-600 hover:text-white border border-red-300 transition-all shadow-sm" : "px-2 py-1 rounded-md text-[10px] font-semibold bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white border border-red-500/30 transition-all"}
                                        >
                                          Delete
                                        </button>
                                      </>
                                    )
                                  ) : (
                                    <>
                                      <button className={isLight ? "px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-300 transition-all shadow-sm" : "px-2 py-1 rounded-md text-[10px] font-semibold bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white border border-red-500/30 transition-all"}
                                        onClick={() => {
                                          const navUrl = docTypeFromURL === "proforma"
                                            ? `${basePath}/calculator/${id}/${effectiveProposalId}?doc=proforma`
                                            : `${basePath}/calculator/${id}/${effectiveProposalId}${isQuotationMode ? "?mode=quotation" : ""}`;
                                          const navState = {
                                            servicetype: "paid",
                                            editItem: order,
                                            ...(isQuotationMode ? { mode: "quotation", quotationId } : {}),
                                          };
                                          navigate(navUrl, { state: navState });
                                        }}>Edit</button>
                                      <button onClick={() => handleDelete(order.id)} className={isLight ? "px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-100 text-red-700 hover:bg-red-600 hover:text-white border border-red-300 transition-all shadow-sm" : "px-2 py-1 rounded-md text-[10px] font-semibold bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white border border-red-500/30 transition-all"}>Delete</button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Ads Campaign */}
              {((isQuotationMode ? draftItems.some((i) => i._type === "ads") : getAdsData.length > 0)) && (
                <div className="relative overflow-hidden bg-gradient-to-br from-white/[0.06] to-white/[0.02] rounded-2xl border border-white/10">
                  <div className="h-[2px] w-full bg-gradient-to-r from-red-500 to-slate-600" />
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                    <span className="text-white font-semibold text-sm flex items-center gap-1.5">
                      <Megaphone className="w-4 h-4 text-red-400" /> Campaigns
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400 font-bold text-xs bg-yellow-400/10 px-2 py-0.5 rounded-md">₹{grandAdsTotal.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-xs text-white">
                      <thead className="bg-white/5 text-white/60">
                        <tr>
                          {["#", "Date", "Service", "Amt", "%", "Charge", "Total", ...(isQuotationMode ? ["Status"] : []), "Action"].map(h => (
                            <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {(isQuotationMode ? draftItems.filter((i) => i._type === "ads") : getAdsData).map((order, index) => {
                          const isPendingDelete = isQuotationMode && order._status === "pending_delete";
                          return (
                            <tr key={order.id} className={`hover:bg-white/5 transition-colors ${isPendingDelete ? "opacity-50 line-through bg-red-950/20" : ""}`}>
                              <td className="px-3 py-2">{index + 1}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{order.created_at || (order._status === "pending_add" ? "Just now" : "-")}</td>
                              <td className="px-3 py-2 min-w-[100px]">{order.category || order.category_name}</td>
                              <td className="px-3 py-2 whitespace-nowrap">₹{order.amount ?? order.budget}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{order.percent}%</td>
                              <td className="px-3 py-2 whitespace-nowrap">₹{order.charge}</td>
                              <td className="px-3 py-2 whitespace-nowrap">₹{order.total ?? order.total_amount}</td>
                              {isQuotationMode && (
                                <td className="px-3 py-2 whitespace-nowrap">
                                  {order._status === "pending_delete" && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30">Pending Delete</span>
                                  )}
                                  {order._status === "pending_add" && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">Unsaved (New)</span>
                                  )}
                                  {order._status === "pending_edit" && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">Unsaved (Edited)</span>
                                  )}
                                  {(!order._status || order._status === "saved") && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Saved</span>
                                  )}
                                </td>
                              )}
                              <td className="px-3 py-2 whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  {isQuotationMode ? (
                                    isPendingDelete ? (
                                      <button
                                        onClick={() => handleDraftUndoDelete(order)}
                                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-white border border-amber-500/30 transition-all shadow-sm"
                                      >
                                        Undo
                                      </button>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => handleDraftEdit(order)}
                                          className={isLight ? "px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-300 transition-all shadow-sm" : "px-2 py-1 rounded-md text-[10px] font-semibold bg-blue-500/20 text-blue-300 hover:bg-blue-500 hover:text-white border border-blue-500/30 transition-all"}
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleDraftDelete(order)}
                                          className={isLight ? "px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-100 text-red-700 hover:bg-red-600 hover:text-white border border-red-300 transition-all shadow-sm" : "px-2 py-1 rounded-md text-[10px] font-semibold bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white border border-red-500/30 transition-all"}
                                        >
                                          Delete
                                        </button>
                                      </>
                                    )
                                  ) : (
                                    <>
                                      <button className={isLight ? "px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-300 transition-all shadow-sm" : "px-2 py-1 rounded-md text-[10px] font-semibold bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white border border-red-500/30 transition-all"}
                                        onClick={() => {
                                          const navUrl = docTypeFromURL === "proforma"
                                            ? `${basePath}/Adscalculator/${id}/${effectiveProposalId}?doc=proforma`
                                            : `${basePath}/Adscalculator/${id}/${effectiveProposalId}${isQuotationMode ? "?mode=quotation" : ""}`;
                                          const navState = {
                                            editItem: order,
                                            ...(isQuotationMode ? { mode: "quotation", quotationId } : {}),
                                          };
                                          navigate(navUrl, { state: navState });
                                        }}>Edit</button>
                                      <button onClick={() => handleDeleteads(order.id)} className={isLight ? "px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-100 text-red-700 hover:bg-red-600 hover:text-white border border-red-300 transition-all shadow-sm" : "px-2 py-1 rounded-md text-[10px] font-semibold bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white border border-red-500/30 transition-all"}>Delete</button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Complimentary */}
              {((isQuotationMode ? draftItems.some((i) => i._type === "service" && isCompItem(i)) : getComplimenatryData.length > 0)) && (
                <div className="relative overflow-hidden bg-gradient-to-br from-white/[0.06] to-white/[0.02] rounded-2xl border border-white/10">
                  <div className="h-[2px] w-full bg-gradient-to-r from-yellow-400 to-orange-500" />
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                    <span className="text-white font-semibold text-sm flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-yellow-400" /> Complimentary
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-orange-300 font-bold text-xs bg-orange-400/10 px-2 py-0.5 rounded-md">₹{grandComplimentryTotal.toLocaleString()}</span>
                      <span className="text-yellow-400 font-bold text-xs bg-yellow-400/10 px-2 py-0.5 rounded-md">₹0</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-xs text-white">
                      <thead className="bg-white/5 text-white/60">
                        <tr>
                          {["#", "Date", "Service", "Category", "Editing Type", "Qty", "Amount", ...(isQuotationMode ? ["Status"] : []), "Action"].map(h => (
                            <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {(isQuotationMode ? draftItems.filter((i) => i._type === "service" && isCompItem(i)) : getComplimenatryData).map((order, index) => {
                          const isPendingDelete = isQuotationMode && order._status === "pending_delete";
                          return (
                            <tr key={order.id} className={`hover:bg-white/5 transition-colors ${isPendingDelete ? "opacity-50 line-through bg-red-950/20" : ""}`}>
                              <td className="px-3 py-2">{index + 1}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{order.created_at || (order._status === "pending_add" ? "Just now" : "-")}</td>
                              <td className="px-3 py-2 min-w-[100px]">{order.service_name}</td>
                              <td className="px-3 py-2 min-w-[100px]">{order.category_name}</td>
                              <td className="px-3 py-2 min-w-[100px]">{order.editing_type_name || "-"}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{order.quantity}</td>
                              <td className="px-3 py-2 whitespace-nowrap">₹{order.total_amount || order.total_price || 0}</td>
                              {isQuotationMode && (
                                <td className="px-3 py-2 whitespace-nowrap">
                                  {order._status === "pending_delete" && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30">Pending Delete</span>
                                  )}
                                  {order._status === "pending_add" && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">Unsaved (New)</span>
                                  )}
                                  {order._status === "pending_edit" && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">Unsaved (Edited)</span>
                                  )}
                                  {(!order._status || order._status === "saved") && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Saved</span>
                                  )}
                                </td>
                              )}
                              <td className="px-3 py-2 whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  {isQuotationMode ? (
                                    isPendingDelete ? (
                                      <button
                                        onClick={() => handleDraftUndoDelete(order)}
                                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-white border border-amber-500/30 transition-all shadow-sm"
                                      >
                                        Undo
                                      </button>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => handleDraftEdit(order)}
                                          className={isLight ? "px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-300 transition-all shadow-sm" : "px-2 py-1 rounded-md text-[10px] font-semibold bg-blue-500/20 text-blue-300 hover:bg-blue-500 hover:text-white border border-blue-500/30 transition-all"}
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleDraftDelete(order)}
                                          className={isLight ? "px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-100 text-red-700 hover:bg-red-600 hover:text-white border border-red-300 transition-all shadow-sm" : "px-2 py-1 rounded-md text-[10px] font-semibold bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white border border-red-500/30 transition-all"}
                                        >
                                          Delete
                                        </button>
                                      </>
                                    )
                                  ) : (
                                    <>
                                      <button className={isLight ? "px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-300 transition-all shadow-sm" : "px-2 py-1 rounded-md text-[10px] font-semibold bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white border border-red-500/30 transition-all"}
                                        onClick={() => {
                                          const navUrl = docTypeFromURL === "proforma"
                                            ? `${basePath}/calculator/${id}/${effectiveProposalId}?doc=proforma`
                                            : `${basePath}/calculator/${id}/${effectiveProposalId}${isQuotationMode ? "?mode=quotation" : ""}`;
                                          const navState = {
                                            servicetype: "complimentary",
                                            editItem: order,
                                            ...(isQuotationMode ? { mode: "quotation", quotationId } : {}),
                                          };
                                          navigate(navUrl, { state: navState });
                                        }}>Edit</button>
                                      <button onClick={() => handleDeleteComplimenatry(order.id)} className={isLight ? "px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-100 text-red-700 hover:bg-red-600 hover:text-white border border-red-300 transition-all shadow-sm" : "px-2 py-1 rounded-md text-[10px] font-semibold bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white border border-red-500/30 transition-all"}>Delete</button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Empty state (Replaced with Mini Plans Grid) */}
              {(isQuotationMode
                ? draftItems.filter((i) => i._status !== "pending_delete").length === 0
                : (getData.length === 0 && getAdsData.length === 0 && getComplimenatryData.length === 0)) && !selectedPlan && (
                <div className="flex-1 flex flex-col py-2 px-1">
                  {/* Mobile/Tablet view unchanged */}
                  <div className="lg:hidden">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                      <h3 className="text-white/80 font-semibold text-sm">Select a Plan to get started</h3>
                    </div>

                    {plans.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
                        {plans.map((plan) => (
                          <button
                            key={plan.id}
                            onClick={() => handlePlanSelect(plan)}
                            className="group text-left bg-gradient-to-br from-white/[0.06] to-white/[0.02] hover:bg-white/[0.08] border border-white/10 hover:border-yellow-400/40 rounded-[14px] p-3 md:p-4 transition-all duration-300 flex flex-col gap-2 shadow-sm hover:shadow-[0_4px_20px_rgba(52,211,153,0.15)] relative overflow-hidden"
                          >
                            <div className={`absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r ${plan.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />
                            <div className="flex items-center gap-2 min-w-0 w-full">
                              <Star className="w-4 h-4 text-yellow-400 shrink-0" />
                              <h4 className="text-white font-bold text-[13px] md:text-sm truncate pr-2">{plan.title}</h4>
                            </div>

                            <div className="flex flex-col mt-auto pt-2">
                              <span className="text-white/30 text-[9px] uppercase tracking-[0.15em] font-bold mb-0.5">Total Amount</span>
                              <span className="text-white group-hover:text-yellow-400 font-bold text-[15px] md:text-base transition-colors">₹{plan.totalAmount.toLocaleString()}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center mt-10 mb-8 border border-white/5 rounded-2xl bg-white/[0.02] py-10">
                        <div className="relative mb-4">
                          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <Package className="w-6 h-6 text-white/20" />
                          </div>
                        </div>
                        <h4 className="text-white/50 text-sm font-semibold mb-1">No Plans Found</h4>
                        <p className="text-white/20 text-xs text-center max-w-[200px]">No predefined plans are currently available.</p>
                      </div>
                    )}

                    <div className="w-full h-px bg-white/5 my-4" />

                    {/* Quick action buttons */}
                    <div className="flex items-center gap-3">
                      <span className="text-white/30 text-[10px] font-bold uppercase tracking-wider">Or create manually:</span>
                      <button
                        onClick={() => {
                          const navUrl = docTypeFromURL === "proforma"
                            ? `${basePath}/calculator/${id}/${effectiveProposalId}?doc=proforma`
                            : `${basePath}/calculator/${id}/${effectiveProposalId}${isQuotationMode ? "?mode=quotation" : ""}`;
                          const navState = {
                            servicetype: "paid",
                            ...(isQuotationMode ? { mode: "quotation", quotationId } : {}),
                          };
                          navigate(navUrl, { state: navState });
                        }}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-1.5"
                      >
                        <Palette className="w-3 h-3" /> Add Graphic
                      </button>
                      <button
                        onClick={() => {
                          const navUrl = docTypeFromURL === "proforma"
                            ? `${basePath}/Adscalculator/${id}/${effectiveProposalId}?doc=proforma`
                            : `${basePath}/Adscalculator/${id}/${effectiveProposalId}${isQuotationMode ? "?mode=quotation" : ""}`;
                          const navState = isQuotationMode ? { mode: "quotation", quotationId } : undefined;
                          navigate(navUrl, { state: navState });
                        }}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-1.5"
                      >
                        <Megaphone className="w-3 h-3" /> Add Campaign
                      </button>
                      <button
                        onClick={() => {
                          const navUrl = `${basePath}/complimentary/${id}/${effectiveProposalId}${isQuotationMode ? "?mode=quotation" : ""}`;
                          const navState = {
                            servicetype: "complimentary",
                            ...(isQuotationMode ? { mode: "quotation", quotationId } : {}),
                          };
                          navigate(navUrl, { state: navState });
                        }}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-1.5"
                      >
                        <Gift className="w-3 h-3" /> Add Complimentary
                      </button>
                    </div>
                  </div>

                  {/* Desktop view: show customise service cards instead of plan cards */}
                  <div className="hidden lg:block">
                    <div className="mb-4">
                      <h3 className="text-white font-bold text-2xl">Customise Services</h3>
                      <p className="text-white/45 text-sm mt-1">
                        Select a service category to add to this invoice
                      </p>
                    </div>

                    <div className="flex items-center justify-center xl:grid-cols-3 gap-4 pb-2">
                      {customServicesCards.map((card) => {
                        const IconComponent = card.icon;
                        return (
                          <div
                            key={card.id}
                            className="group rounded-2xl border border-white/15 bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent px-5 py-5 shadow-[0_12px_34px_rgba(3,8,26,0.45)] hover:border-white/25 transition-all duration-300 flex flex-col"
                          >
                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-r ${card.gradient} flex items-center justify-center shadow-lg mb-4`}>
                              <IconComponent className="w-5 h-5 !text-white text-white" />
                            </div>

                            <h4 className="text-white text-2xl font-bold leading-tight">{card.title}</h4>
                            <p className={`text-xs uppercase tracking-[0.16em] font-bold bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent mt-2 mb-4`}>
                              {card.subtitle}
                            </p>

                            <p className="text-white/55 text-[15px] leading-relaxed mb-4 min-h-[74px]">
                              {card.description}
                            </p>

                            <div className="space-y-1.5 mb-5 min-h-[112px]">
                              {card.features.map((feature, idx) => (
                                <div key={`${card.id}-feature-${idx}`} className="flex items-start gap-2 text-white/65 text-sm">
                                  <span className={`mt-[7px] w-1.5 h-1.5 rounded-full bg-gradient-to-r ${card.gradient} shrink-0`} />
                                  <span>{feature}</span>
                                </div>
                              ))}
                            </div>

                            <button
                              onClick={() => handleCustomServiceNavigate(card)}
                              className={`mt-auto w-full rounded-xl py-2.5 text-sm font-semibold !text-white text-white bg-gradient-to-r ${card.buttonGradient} hover:brightness-110 shadow-md transition-all duration-200 flex items-center justify-center gap-2`}
                            >
                              <span className="!text-white text-white font-semibold">Get Started</span>
                              <ArrowRight className="w-4 h-4 !text-white text-white" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Plan Card POPUP ───────────────────────────────────────────────── */}
      {showPlanPopup && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPlanPopup(false); }}>
          <div className="relative bg-gray-900/95 border border-white/20 rounded-3xl shadow-2xl w-full max-w-sm
            animate-[fadeInScale_0.22s_cubic-bezier(.22,1,.36,1)_both]"
            style={{ animation: "fadeInScale 0.22s cubic-bezier(.22,1,.36,1) both" }}>
            <style>{`@keyframes fadeInScale{from{opacity:0;transform:scale(.92) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

            {/* Close */}
            <button onClick={() => setShowPlanPopup(false)}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all">
              <X className="w-4 h-4" />
            </button>

            <div className="p-6">
              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${selectedPlan.gradient} shadow-lg flex items-center justify-center mb-4`}>
                <Star className="w-7 h-7 text-white" />
              </div>

              {/* Title & amount */}
              <h3 className="text-xl font-bold text-white mb-0.5">{selectedPlan.title}</h3>
              <p className={`text-xs font-medium bg-gradient-to-r ${selectedPlan.gradient} bg-clip-text text-transparent mb-1`}>Plan</p>
              <p className="text-2xl font-bold text-white mb-3">₹{selectedPlan.totalAmount.toLocaleString()}</p>

              {/* Description */}
              <p className="text-white/60 text-sm leading-relaxed mb-4">{selectedPlan.description}</p>

              {/* Features */}
              {selectedPlan.features.length > 0 && (
                <div className="space-y-1.5 mb-5 max-h-36 overflow-y-auto pr-1">
                  {selectedPlan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-white/60">
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${selectedPlan.gradient} mt-1 shrink-0`}></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* CTA */}
              <button
                onClick={() => handleCreateQuotation(selectedPlan)}
                disabled={loading}
                className={`w-full py-3 px-6 rounded-2xl font-semibold text-white text-sm bg-gradient-to-r ${selectedPlan.gradient} shadow-lg hover:shadow-xl hover:scale-[1.02] transform transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? "Saving..." : "Create Quotation"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quotation Type Modal ──────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative bg-gray-900 border border-gray-700 p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <button onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700">✕</div>
            </button>
            <div className="text-center mb-8 mt-2">
              <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Notebook className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Select Quotation Type</h2>
              <p className="text-gray-400 text-sm mt-2">Choose how you want to generate this quotation</p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button onClick={() => { navigate(`${basePath}/quotation/${id}/${proposalId}?gst=1${docTypeFromURL === "proforma" ? "&doc=proforma" : ""}`); setShowModal(false); }}
                style={{ color: "#ffffff" }}
                className="flex-1 bg-green-600 hover:bg-green-700 !text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-md">
                With GST (18%)
              </button>
              <button onClick={() => { navigate(`${basePath}/quotation/${id}/${proposalId}?gst=0${docTypeFromURL === "proforma" ? "&doc=proforma" : ""}`); setShowModal(false); }}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                  isLight
                    ? "bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300 shadow-sm"
                    : "bg-gray-700 hover:bg-gray-600 text-white"
                }`}>
                Without GST
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Proposal / Proforma Discount Modal ────────────────────────────── */}
      <ProposalDiscountModal
        show={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        onSubmit={handleApplyDiscount}
        onDelete={discountValue > 0 ? handleRemoveDiscount : null}
        formDataDis={formDataDis}
        handleChangeDis={(e) => {
          const { name, value } = e.target;
          setFormDataDis((prev) => ({ ...prev, [name]: value }));
        }}
        grandTotal={grandTotal}
        discountDataSet={discountSettings[0]}
      />



      {/* ── Phase D: Bottom Floating Action Bar (visible when unsavedChangesCount > 0) ── */}
      {isQuotationMode && unsavedChangesCount > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md border border-emerald-500/40 rounded-2xl px-5 py-3 shadow-[0_10px_35px_rgba(0,0,0,0.6)] flex items-center gap-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-semibold text-white">
              {unsavedChangesCount} unsaved change{unsavedChangesCount > 1 ? "s" : ""}
            </span>
          </div>
          <div className="h-4 w-[1px] bg-white/20" />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDiscardAll}
              disabled={isSavingQuotation}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/15 transition-all active:scale-95 cursor-pointer"
            >
              Discard All
            </button>
            <button
              type="button"
              onClick={handleSaveQuotation}
              disabled={isSavingQuotation}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {isSavingQuotation ? "Saving..." : "Save Quotation"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
