import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { clearUser } from "../../../redux/user/userSlice";
import API_BASE_URL from "../../../config/apiBaseUrl";
import { classifyProformaServices } from "../../../utils/proformaPricing";
import {
  fetchClientServiceHistory,
  fetchClientDetailsById,
  fetchClientNotes,
  fetchByIDComplimentaryData,
  fetchDiscountById,
  fetchDiscountSettings,
  fetchInvoiceClientDetails,
  fetchPredefinedNotes as fetchPredefinedNotesApi,
  saveDiscountData,
  updateDiscountData,
  deleteDiscountById,
  saveProformaDiscount,
  saveProformaAdjustment,
  saveClientIdwiseNotes,
  updatePlanClientNoteById,
  deletePlanClientNotes,
  updateBalanceProformaNotes,
  updateProformaNotes,
} from "../api";

export function useQuotationData({
  id,
  txn_id,
  isBalanceProforma = false,
  docTypeFromURL = "quotation",
  sourceFromURL = null,
  isGST = false,
  basePath = "/admin",
  servicesPath = "ServicesLanding",
  token,
  dispatch,
  navigate,
}) {
  const baseURL = API_BASE_URL;

  const [serviceData, setServiceData] = useState([]);
  const [graphicData, setGraphicData] = useState([]);
  const [adsData, setAdsData] = useState([]);
  const [complimentaryData, setComplimentaryData] = useState([]);
  const [selecteddiscount, setSelecteddiscount] = useState(null);
  const [notesData, setNotesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState(null);
  const [clientDataReceived, setClientDataReceived] = useState({});

  // Note modal state
  const [formDataNote, setFormDataNote] = useState({
    note_name: "",
    plan: "Customise",
  });
  const [selectedNotesId, setSelectedNotesId] = useState(null);
  const [showModalNote, setShowModalNote] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);

  // Predefined notes dropdown state
  const [predefinedNotes, setPredefinedNotes] = useState([]);
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [manualNote, setManualNote] = useState("");

  // Discount modal state
  const [showModalDiscount, setShowModalDiscount] = useState(false);
  const [discountDataSet, setDiscountDataSet] = useState(null);
  const [formDataDiscount, setFormDataDiscount] = useState({
    discount_type: "amount",
    discount_per: "",
    discount_amt: "",
  });

  // Adjustment modal state
  const [selectedAdjustment, setSelectedAdjustment] = useState(null);
  const [showModalAdjustment, setShowModalAdjustment] = useState(false);
  const [formDataAdjustment, setFormDataAdjustment] = useState({
    adjustment_amt: "",
  });

  const [showMetaAd, setShowMetaAd] = useState(true);
  const [showGoogleAd, setShowGoogleAd] = useState(true);
  const [proformaMeta, setProformaMeta] = useState(null);

  // Default notes that should appear automatically for regular quotation
  const defaultNotes = [
    {
      id: 1,
      note_name:
        "The client pays for the Meta ad budget, and ad service charges will apply only if the client wants to run the ad.",
    },
    {
      id: 2,
      note_name:
        "All amounts need to be paid in advance. Only the ad budget will be paid upon request of the client or immediately after the service is started.",
    },
    {
      id: 3,
      note_name:
        "Please note that service charges are non-refundable but may be adjusted against another service.",
    },
    {
      id: 4,
      note_name:
        "One dedicated SPOC (single point of contact) is required from the client side to approve the posts, contents, videos changes, etc.",
    },
    {
      id: 5,
      note_name:
        "Required details like credentials and other details are needed to share timely.",
    },
  ];

  useEffect(() => {
    if (!isBalanceProforma && docTypeFromURL !== "proforma") {
      setSelectedNotes(defaultNotes);
    } else {
      setSelectedNotes([]);
    }
  }, [isBalanceProforma, docTypeFromURL]);

  const handleAuthError = useCallback(
    (error) => {
      if (error?.response?.status === 401) {
        Swal.fire({
          title: "Session Expired",
          text: "Please login again.",
          icon: "warning",
        }).then(() => {
          if (dispatch) dispatch(clearUser());
          localStorage.removeItem("token");
          if (navigate) navigate("/");
        });
      }
    },
    [dispatch, navigate]
  );

  const fetchServices = async () => {
    try {
      const res = await fetchClientServiceHistory(id, txn_id, token);
      setServiceData(res.data || []);
    } catch (error) {
      handleAuthError(error);
    }
  };

  const fetchClient = async () => {
    try {
      const res = await fetchClientDetailsById(id, token);
      if (res.status === "Success") {
        setClientData(res.data);
      }
    } catch (error) {
      handleAuthError(error);
    }
  };

  const fetchClientNotesData = async () => {
    try {
      const res = await fetchClientNotes(id, txn_id, token);
      if (res.status === "Success" && res.data && res.data.length > 0) {
        setNotesData(res.data);
      }
    } catch (error) {
      handleAuthError(error);
    }
  };

  const fetchComplimentary = async () => {
    try {
      const data = await fetchByIDComplimentaryData(txn_id, id, token);
      setComplimentaryData(data.data || []);
    } catch (error) {
      handleAuthError(error);
    }
  };

  const fetchDiscount = async () => {
    try {
      const data = await fetchDiscountById(id, txn_id, token);
      if (data.data && data.data.length > 0) {
        let fetched = data.data[0];
        if (fetched && fetched.discount_type) {
          fetched.discount_type = fetched.discount_type.toLowerCase();
          if (fetched.discount_type === "percentage") {
            fetched.discount_type = "percent";
          }
        }
        setSelecteddiscount(fetched);
      } else {
        setSelecteddiscount(null);
      }
    } catch (error) {
      setSelecteddiscount(null);
    }
  };

  const fetchDiscountSetting = async () => {
    try {
      const data = await fetchDiscountSettings(token);
      if (data.data && data.data.length > 0) {
        setDiscountDataSet(data.data[0]);
      }
    } catch (error) {
      console.error("Error fetching discount setting:", error);
    }
  };

  const fetchClientReceived = async () => {
    try {
      const res = await fetchInvoiceClientDetails(id, txn_id, token);
      if (res.status === "Success") {
        setClientDataReceived(res.data);
      }
    } catch (error) {
      handleAuthError(error);
    }
  };

  const fetchPredefinedNotes = async () => {
    try {
      const endpoint = isBalanceProforma
        ? `${baseURL}/auth/api/re_calculator/getNotesbydefault`
        : `${baseURL}/auth/api/re_calculator/getNoteData`;
      const { data } = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPredefinedNotes(data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProformaData = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/re_calculator/proforma/client/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data.status === "Success") {
        const proformas = res.data.data;
        const proforma = proformas.find((p) => p.id === parseInt(txn_id));
        if (proforma) {
          setProformaMeta({
            has_invoice: proforma.has_invoice,
            proposal_id: proforma.proposal_id,
            proforma_number: proforma.proforma_number,
            duration_start_date: proforma.duration_start_date,
            duration_end_date: proforma.duration_end_date,
            previous_balance_amount: Number(proforma.previous_balance_amount || 0),
            is_carried_forward: proforma.is_carried_forward,
            carried_into_proforma_id: proforma.carried_into_proforma_id,
          });

          let clientSnap = null;
          if (proforma.client_instructions_snapshot) {
            try {
              clientSnap =
                typeof proforma.client_instructions_snapshot === "string"
                  ? JSON.parse(proforma.client_instructions_snapshot)
                  : proforma.client_instructions_snapshot;
            } catch (e) {
              clientSnap = null;
            }
          }

          let p = null;
          let propRes = null;
          if (proforma.proposal_id) {
            propRes = await axios.get(
              `${baseURL}/auth/api/re_calculator/proposal/${proforma.proposal_id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            if (propRes.data.status === "Success") {
              p = propRes.data.data;
              try {
                const clientRes = await fetchClientDetailsById(id, token);
                if (clientRes.status === "Success") {
                  const c = clientRes.data;
                  p.phone = clientSnap?.phone || c.phone || p.phone;
                  p.address = clientSnap?.address || c.address || p.address;
                  p.client_name =
                    clientSnap?.client_name || c.client_name || p.client_name;
                  p.client_organization =
                    clientSnap?.client_organization ||
                    c.client_organization ||
                    p.client_organization;
                  p.email = clientSnap?.email || c.email || p.email;
                }
              } catch (e) {
                console.error("Error fetching live client data for proforma fallback", e);
              }
            }
          } else {
            try {
              const clientRes = await fetchClientDetailsById(id, token);
              const c =
                clientRes?.status === "Success" && clientRes.data
                  ? clientRes.data
                  : {};
              p = {
                client_name: clientSnap?.client_name || c.client_name || "",
                company_name:
                  clientSnap?.client_organization ||
                  c.client_organization ||
                  c.company_name ||
                  "",
                email: clientSnap?.email || c.email || "",
                phone: clientSnap?.phone || c.phone || "",
                address: clientSnap?.address || c.address || "",
              };
            } catch (e) {
              if (clientSnap) {
                p = {
                  client_name: clientSnap.client_name || "",
                  company_name: clientSnap.client_organization || "",
                  email: clientSnap.email || "",
                  phone: clientSnap.phone || "",
                  address: clientSnap.address || "",
                };
              }
            }
          }

          if (p) {
            setClientData({
              client_name: clientSnap?.client_name || p.client_name,
              client_organization:
                clientSnap?.client_organization ||
                p.company_name ||
                p.client_organization,
              email: clientSnap?.email || p.email,
              phone: clientSnap?.phone || p.phone,
              address: clientSnap?.address || p.address,
              bill_type: proforma.is_gst ? "GST" : "NON_GST",
              document_type: "proforma",
              created_at: proforma.created_at,
              duration_start_date:
                proforma.duration_start_date || p.billing_start_date,
              duration_end_date:
                proforma.duration_end_date || p.billing_end_date,
              proforma_number: proforma.proforma_number,
            });

            try {
              let liveNotes = [];
              if (proforma.notes_snapshot) {
                try {
                  const parsed = JSON.parse(proforma.notes_snapshot);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    liveNotes = parsed;
                  }
                } catch (e) {
                  liveNotes = [];
                }
              }

              // If proforma notes_snapshot has no notes, fallback to proposal notes
              if (liveNotes.length === 0 && p) {
                try {
                  const propNotesSource = p.notes_json || p.terms_notes_json;
                  const parsedProp = JSON.parse(propNotesSource || "[]");
                  if (Array.isArray(parsedProp) && parsedProp.length > 0) {
                    liveNotes = parsedProp;
                  }
                } catch (e) {}
              }

              const formattedNotes = (Array.isArray(liveNotes) ? liveNotes : []).map(
                (note, idx) => ({
                  id: note.id || idx + 1,
                  note_name:
                    typeof note === "string" ? note : note.note_name || "",
                })
              );
              setNotesData(formattedNotes);
            } catch (e) {
              setNotesData([]);
            }

            try {
              let pricingDiscount = null;
              if (docTypeFromURL === "proforma") {
                if (proforma.discount_snapshot) {
                  try {
                    pricingDiscount =
                      typeof proforma.discount_snapshot === "string"
                        ? JSON.parse(proforma.discount_snapshot)
                        : proforma.discount_snapshot;
                  } catch (e) {
                    pricingDiscount = null;
                  }
                }
              } else {
                const sectionsData =
                  typeof p?.sections_json === "string"
                    ? JSON.parse(p.sections_json)
                    : p?.sections_json;
                pricingDiscount = sectionsData?.pricing_discount;
              }

              if (pricingDiscount) {
                const isPercent =
                  pricingDiscount.type === "Percentage" ||
                  pricingDiscount.discount_type === "percent";
                const discVal = Number(
                  pricingDiscount.value ??
                    (isPercent
                      ? pricingDiscount.discount_per
                      : pricingDiscount.discount_amt) ??
                    0
                );
                if (discVal > 0) {
                  setSelecteddiscount({
                    id: proforma?.id,
                    discount_type: isPercent ? "percent" : "amount",
                    discount_amt: isPercent ? 0 : discVal,
                    discount_per: isPercent ? discVal : 0,
                    value: discVal,
                    type: isPercent ? "Percentage" : "Amount",
                  });
                } else {
                  setSelecteddiscount(null);
                }
              } else {
                setSelecteddiscount(null);
              }
            } catch (e) {
              console.error("Error setting discount in Quotation:", e);
              setSelecteddiscount(null);
            }

            try {
              let adjAmt = Number(proforma.adjustment_amount || 0);
              if (!adjAmt && proforma.adjustment_snapshot) {
                try {
                  const parsedAdj =
                    typeof proforma.adjustment_snapshot === "string"
                      ? JSON.parse(proforma.adjustment_snapshot)
                      : proforma.adjustment_snapshot;
                  adjAmt = Number(
                    parsedAdj?.amount || parsedAdj?.adjustment_amount || 0
                  );
                } catch (e) {
                  adjAmt = 0;
                }
              }
              if (adjAmt > 0) {
                setSelectedAdjustment({
                  id: proforma?.id,
                  amount: adjAmt,
                  adjustment_amount: adjAmt,
                });
              } else {
                setSelectedAdjustment(null);
              }
            } catch (e) {
              console.error("Error setting adjustment in Quotation:", e);
              setSelectedAdjustment(null);
            }
          }

          try {
            const livePricing =
              propRes &&
              propRes.data.status === "Success" &&
              propRes.data.data
                ? propRes.data.data.pricing_table_json
                : null;
            const pricingSource =
              docTypeFromURL === "proforma"
                ? proforma.pricing_snapshot
                : livePricing || proforma.pricing_snapshot;
            const parsed = JSON.parse(pricingSource || "[]");

            let adsParsed = [];
            if (proforma.ads_snapshot) {
              try {
                adsParsed = JSON.parse(proforma.ads_snapshot || "[]");
              } catch (adsErr) {
                console.error("Failed to parse proforma.ads_snapshot", adsErr);
              }
            }

            const combined = [...parsed, ...adsParsed];
            const { dmServices, adsServices } = classifyProformaServices(combined);
            const compServices = parsed
              .filter((item) => {
                if (
                  item.is_complimentary !== undefined &&
                  item.is_complimentary !== null
                ) {
                  return Boolean(item.is_complimentary);
                }
                if (
                  item.source === "custom_complimentary" ||
                  item.source === "complimentary"
                )
                  return true;
                if (item.include_in_total === false) return true;
                const sName = String(
                  item.service_name || item.service || ""
                ).toLowerCase();
                return (
                  sName.includes("(complimentary)") ||
                  sName.includes("(complimntory)") ||
                  sName === "complimentary"
                );
              })
              .map((item) => ({
                ...item,
                is_complimentary: true,
                service_type: item.service_type || "Complimentary",
                editing_type_amount:
                  item.editing_type_amount &&
                  Number(item.editing_type_amount) > 0
                    ? Number(item.editing_type_amount)
                    : item.price && Number(item.price) > 0
                    ? Number(item.price)
                    : item.amount && Number(item.amount) > 0
                    ? Number(item.amount)
                    : item.unit_price && Number(item.unit_price) > 0
                    ? Number(item.unit_price)
                    : 0,
                total_amount: 0,
              }));

            setServiceData([...dmServices, ...adsServices]);
            setComplimentaryData(compServices);
          } catch (e) {
            console.error("Failed to parse proforma.pricing_snapshot", e);
            setServiceData([]);
            setComplimentaryData([]);
          }
          setLoading(false);
        }
      }
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  };

  const fetchBalanceProformaData = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/re_calculator/balance-proforma/${txn_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data.status === "Success") {
        const bp = res.data.data;
        const isGstVal =
          bp.is_gst && typeof bp.is_gst === "object" && bp.is_gst.data
            ? bp.is_gst.data[0] === 1
            : Number(bp.is_gst) === 1;

        setProformaMeta({
          is_balance_proforma: true,
          balance_number: bp.balance_number,
          balance_proforma_number: bp.balance_proforma_number,
          source_proforma_id: bp.source_proforma_id,
          source_proforma_number: bp.source_proforma_number,
          duration_start_date: bp.duration_start_date,
          duration_end_date: bp.duration_end_date,
          total_amount: Number(bp.total_amount || 0),
          received_amount: Number(bp.received_amount || 0),
          current_balance: Number(bp.current_balance || 0),
        });

        setShowGoogleAd(Boolean(bp.show_google_ad));
        setShowMetaAd(Boolean(bp.show_meta_ad));

        setClientData({
          client_name: bp.client_name || "",
          client_organization: bp.client_organization || "",
          email: bp.email || "",
          phone: bp.phone || "",
          address: bp.address || "",
          bill_type: isGstVal ? "GST" : "NON_GST",
          document_type: "balance-proforma",
          created_at: bp.created_at,
          duration_start_date: bp.duration_start_date,
          duration_end_date: bp.duration_end_date,
          proforma_number:
            bp.balance_proforma_number || `BAL-PROF-${bp.balance_number}`,
          source_proforma_number: bp.source_proforma_number,
        });

        try {
          const liveNotes = JSON.parse(bp.notes_snapshot || "[]");
          const formattedNotes = liveNotes.map((note, idx) => ({
            id: idx + 1,
            note_name: typeof note === "string" ? note : note.note_name || "",
          }));
          setNotesData(formattedNotes);
        } catch (e) {
          setNotesData([]);
        }

        try {
          let pricingDiscount = null;
          if (bp.discount_snapshot) {
            pricingDiscount =
              typeof bp.discount_snapshot === "string"
                ? JSON.parse(bp.discount_snapshot)
                : bp.discount_snapshot;
          }
          if (pricingDiscount) {
            const isPercent =
              pricingDiscount.type === "Percentage" ||
              pricingDiscount.discount_type === "percent";
            const discVal = Number(
              pricingDiscount.value ??
                (isPercent
                  ? pricingDiscount.discount_per
                  : pricingDiscount.discount_amt) ??
                0
            );
            if (discVal > 0) {
              setSelecteddiscount({
                id: bp.id,
                discount_type: isPercent ? "percent" : "amount",
                discount_amt: isPercent ? 0 : discVal,
                discount_per: isPercent ? discVal : 0,
                value: discVal,
                type: isPercent ? "Percentage" : "Amount",
              });
            } else {
              setSelecteddiscount(null);
            }
          } else {
            setSelecteddiscount(null);
          }
        } catch (e) {
          setSelecteddiscount(null);
        }

        try {
          const parsed = JSON.parse(bp.pricing_snapshot || "[]");
          let adsParsed = [];
          if (bp.ads_snapshot) {
            try {
              adsParsed = JSON.parse(bp.ads_snapshot || "[]");
            } catch (adsErr) {}
          }
          const combined = [...parsed, ...adsParsed];
          const { dmServices, adsServices } = classifyProformaServices(combined);
          const compServices = parsed
            .filter((item) => {
              if (
                item.is_complimentary !== undefined &&
                item.is_complimentary !== null
              ) {
                return Boolean(item.is_complimentary);
              }
              if (
                item.source === "custom_complimentary" ||
                item.source === "complimentary"
              )
                return true;
              if (item.include_in_total === false) return true;
              const sName = String(
                item.service_name || item.service || ""
              ).toLowerCase();
              return (
                sName.includes("(complimentary)") ||
                sName.includes("(complimntory)") ||
                sName === "complimentary"
              );
            })
            .map((item) => ({
              ...item,
              is_complimentary: true,
              service_type: item.service_type || "Complimentary",
              editing_type_amount:
                item.editing_type_amount &&
                Number(item.editing_type_amount) > 0
                  ? Number(item.editing_type_amount)
                  : item.price && Number(item.price) > 0
                  ? Number(item.price)
                  : item.amount && Number(item.amount) > 0
                  ? Number(item.amount)
                  : item.unit_price && Number(item.unit_price) > 0
                  ? Number(item.unit_price)
                  : 0,
              total_amount: 0,
            }));

          setServiceData([...dmServices, ...adsServices]);
          setComplimentaryData(compServices);
          setAdsData(adsServices);
        } catch (e) {
          setServiceData([]);
          setComplimentaryData([]);
          setAdsData([]);
        }

        setLoading(false);
      }
    } catch (e) {
      console.error("fetchBalanceProformaData error:", e);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isBalanceProforma) {
      fetchBalanceProformaData();
      fetchPredefinedNotes();
      fetchDiscountSetting();
    } else if (docTypeFromURL === "proforma" || sourceFromURL === "proposal") {
      fetchProformaData();
      fetchPredefinedNotes();
      fetchDiscountSetting();
    } else {
      fetchServices();
      fetchClient();
      fetchClientNotesData();
      fetchComplimentary();
      fetchDiscount();
      fetchDiscountSetting();
      fetchClientReceived();
      fetchPredefinedNotes();
    }
  }, [id, txn_id, docTypeFromURL, sourceFromURL, isBalanceProforma]);

  // Group graphic services
  useEffect(() => {
    if (
      serviceData.length === 0 &&
      (!complimentaryData || complimentaryData.length === 0)
    )
      return;

    const graphicRaw = serviceData.filter(
      (item) => item.service_type === "Graphic Service"
    );
    const adsRaw = serviceData.filter(
      (item) => item.service_type === "Ads Campaign"
    );

    const groupedGraphic = [];

    graphicRaw.forEach((item) => {
      let service = groupedGraphic.find((s) => s.service === item.service_name);
      if (!service) {
        service = { service: item.service_name, editingTypes: [] };
        groupedGraphic.push(service);
      }

      let additional_services = [];
      if (item.additional_services) {
        try {
          additional_services =
            typeof item.additional_services === "string"
              ? JSON.parse(item.additional_services)
              : item.additional_services;
          if (!Array.isArray(additional_services)) additional_services = [];
        } catch {
          additional_services = [];
        }
      }

      service.editingTypes.push({
        category: item.category_name,
        type: item.editing_type_name || "N/A",
        quantity: Number(item.quantity) || 1,
        price: Number(item.editing_type_amount) || 0,
        include_content_posting: Number(item.include_content_posting) || 0,
        include_thumbnail_creation:
          Number(item.include_thumbnail_creation) || 0,
        include_youtube_video_posting:
          Number(item.include_youtube_video_posting) || 0,
        additional_services,
        total: Number(item.total_amount) || 0,
      });
    });

    setGraphicData(groupedGraphic);
    setAdsData(adsRaw);
    setLoading(false);
  }, [serviceData, complimentaryData]);

  // ================= CALCULATIONS =================
  const graphicTotal = graphicData.reduce(
    (sum, service) =>
      sum +
      service.editingTypes.reduce((editSum, edit) => {
        const qty = Number(edit.quantity) || 1;
        const base = Number(edit.price || edit.editing_type_amount || 0);
        const baseTotal = base * qty;
        const addons = Array.isArray(edit.additional_services)
          ? edit.additional_services
          : [];
        const addonsTotal = addons.reduce(
          (s, a) =>
            s +
            (Number(a.amount || a.unit_price) || 0) *
              (Number(a.quantity) || qty),
          0
        );
        const recordedTotal = Number(edit.total || 0);
        const effectiveTotal =
          recordedTotal >= baseTotal + addonsTotal && recordedTotal > 0
            ? recordedTotal
            : (recordedTotal > 0 ? recordedTotal : baseTotal) + addonsTotal;
        return editSum + effectiveTotal;
      }, 0),
    0
  );

  const complimentaryTotal = complimentaryData.reduce((sum, service) => {
    const amount =
      service.total_amount !== null && service.total_amount !== undefined
        ? Number(service.total_amount)
        : Number(service.editing_type_amount || 0) *
          Number(service.quantity || 0);
    return sum + amount;
  }, 0);

  const adsTotalBudget = adsData.reduce((sum, ad) => {
    const cat = (ad.category_name || "").toLowerCase();
    const amt = Number(ad.budget || ad.amount || 0);
    if (cat.includes("meta") && !showMetaAd) return sum;
    if (cat.includes("google") && !showGoogleAd) return sum;
    return sum + amt;
  }, 0);

  // Discount applies ONLY on DM Services (graphicTotal)
  const discountAmount = selecteddiscount
    ? selecteddiscount.discount_type === "percent"
      ? (graphicTotal * Number(selecteddiscount.discount_per)) / 100
      : selecteddiscount.discount_type === "amount"
      ? Number(selecteddiscount.discount_amt)
      : 0
    : 0;

  const dmTotalAfterDiscount = Math.max(0, graphicTotal - discountAmount);

  // Adjustment applies strictly to Service Charges after discount (Ads excluded)
  const adjustmentAmount = selectedAdjustment
    ? Number(
        selectedAdjustment.amount || selectedAdjustment.adjustment_amount || 0
      )
    : 0;

  const dmTotalAfterAdjustment = Math.max(
    0,
    dmTotalAfterDiscount - adjustmentAmount
  );

  const previousBalanceAmount = Number(proformaMeta?.previous_balance_amount || 0);
  const dmTotalWithPreviousBalance = dmTotalAfterAdjustment + previousBalanceAmount;

  const dmGstAmount = isGST ? dmTotalWithPreviousBalance * 0.18 : 0;
  const dmSubtotalWithGst = dmTotalWithPreviousBalance + dmGstAmount;
  const adsTotalWithGst = adsTotalBudget;
  const grandTotal = dmSubtotalWithGst + adsTotalWithGst;

  // Ads budgets for Google and Meta
  const googleAdItem = adsData.find((ad) =>
    (ad.category_name || "").toLowerCase().includes("google")
  );
  const googleAdAmount = Number(
    googleAdItem?.amount || googleAdItem?.budget || 0
  );

  const metaAdItem = adsData.find((ad) =>
    (ad.category_name || "").toLowerCase().includes("meta")
  );
  const metaAdAmount = Number(
    metaAdItem?.amount || metaAdItem?.budget || 0
  );

  const activeAdsBudget =
    (showGoogleAd ? googleAdAmount : 0) + (showMetaAd ? metaAdAmount : 0);

  let displayedSubtotal = dmSubtotalWithGst;
  if (isBalanceProforma && proformaMeta?.total_amount !== undefined) {
    const fullAdBudgets = googleAdAmount + metaAdAmount;
    if (fullAdBudgets > 0 && Number(proformaMeta.total_amount) > fullAdBudgets) {
      displayedSubtotal = Math.max(
        0,
        Number(proformaMeta.total_amount) - fullAdBudgets
      );
    }
  }

  const displayedGrandTotal =
    isBalanceProforma && proformaMeta?.total_amount !== undefined
      ? displayedSubtotal + activeAdsBudget
      : grandTotal;

  let displayedTaxable = dmTotalWithPreviousBalance;
  let displayedCgst = dmGstAmount / 2;
  let displayedSgst = dmGstAmount / 2;

  if (isBalanceProforma && Math.abs(dmSubtotalWithGst - displayedSubtotal) > 1) {
    if (isGST) {
      displayedTaxable = Math.round((displayedSubtotal / 1.18) * 100) / 100;
      const gstTotal = displayedSubtotal - displayedTaxable;
      displayedCgst = gstTotal / 2;
      displayedSgst = gstTotal / 2;
    } else {
      displayedTaxable = displayedSubtotal;
      displayedCgst = 0;
      displayedSgst = 0;
    }
  }

  const removedAdsBudget =
    (!showGoogleAd ? googleAdAmount : 0) + (!showMetaAd ? metaAdAmount : 0);
  const baseReceived = Number(proformaMeta?.received_amount || 0);
  const displayedReceived = Math.max(0, baseReceived - removedAdsBudget);
  const displayedCurrentBalance = Math.max(
    0,
    displayedGrandTotal - displayedReceived
  );

  // ================= ACTION HANDLERS =================
  const handlePrintPage = () => {
    const clientOrganization = clientData?.client_organization;
    const clientName = clientData?.client_name;
    const docName = isBalanceProforma
      ? "Balance Proforma Invoice"
      : docTypeFromURL === "proforma"
      ? "Proforma Invoice"
      : "Quotation";
    document.title = clientOrganization
      ? `${clientOrganization} ${docName}`
      : `${clientName} ${docName}`;
    window.print();
  };

  const handleProposalHistory = () => {
    navigate(`${basePath}/client/service/history/${id}`);
  };

  const handleEdit = () => {
    if (docTypeFromURL === "proforma") {
      navigate(`${basePath}/${servicesPath}/${id}/${txn_id}?doc=proforma`);
    } else {
      navigate(`${basePath}/${servicesPath}/${id}/${txn_id}`);
    }
  };

  // ================= DISCOUNT HANDLERS =================
  const handleShowDiscount = () => {
    if (selecteddiscount) {
      const isPercent =
        selecteddiscount.discount_type === "percent" ||
        selecteddiscount.type === "Percentage";
      const val =
        selecteddiscount.value ??
        (isPercent
          ? selecteddiscount.discount_per
          : selecteddiscount.discount_amt) ??
        "";
      setFormDataDiscount({
        discount_type: isPercent ? "percent" : "amount",
        discount_per: isPercent ? String(val) : "",
        discount_amt: !isPercent ? String(val) : "",
      });
    } else {
      setFormDataDiscount({
        discount_type: "amount",
        discount_per: "",
        discount_amt: "",
      });
    }
    setShowModalDiscount(true);
  };

  const handleCloseDiscount = () => {
    setShowModalDiscount(false);
    setFormDataDiscount({
      discount_type: "amount",
      discount_per: "",
      discount_amt: "",
    });
  };

  const handleChangeDiscount = (e) => {
    const { name, value } = e.target;
    setFormDataDiscount((prev) => {
      if (name === "discount_type") {
        return {
          ...prev,
          discount_type: value,
          discount_per: "",
          discount_amt: "",
        };
      }
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleSaveDiscount = async (e) => {
    e.preventDefault();
    setLoading(true);

    const resetAndClose = () => {
      setShowModalDiscount(false);
      setFormDataDiscount({
        discount_type: "amount",
        discount_per: "",
        discount_amt: "",
      });
    };

    try {
      if (grandTotal <= 0) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Total!",
          text: "Grand total should be greater than 0 before setting discount.",
          showConfirmButton: false,
          timer: 1200,
        });
        setLoading(false);
        return;
      }

      const isAmountType = formDataDiscount.discount_type === "amount";
      const enteredValue = isAmountType
        ? Number(formDataDiscount.discount_amt)
        : Number(formDataDiscount.discount_per);

      if (!enteredValue || enteredValue < 0) {
        Swal.fire({
          icon: "warning",
          title: "Required!",
          text: `Please enter a valid discount ${
            isAmountType ? "amount (₹)" : "percentage (%)"
          }`,
          showConfirmButton: false,
          timer: 1000,
        });
        setLoading(false);
        return;
      }

      if (!isAmountType && enteredValue > 100) {
        Swal.fire({
          icon: "warning",
          title: "Invalid!",
          text: "Percentage cannot exceed 100%",
          showConfirmButton: false,
          timer: 1000,
        });
        setLoading(false);
        return;
      }

      if (isAmountType) {
        const maxAmt = discountDataSet?.discount_amt
          ? Number(discountDataSet.discount_amt)
          : grandTotal;
        if (enteredValue > maxAmt) {
          Swal.fire({
            icon: "warning",
            title: "Limit Exceeded!",
            text: `Max discount amount is ₹${maxAmt.toLocaleString()} (set in settings)`,
            showConfirmButton: false,
            timer: 2000,
          });
          setLoading(false);
          return;
        }
      }

      if (!isAmountType) {
        const maxPer = discountDataSet?.discount_per
          ? Number(discountDataSet.discount_per)
          : 100;
        if (enteredValue > maxPer) {
          Swal.fire({
            icon: "warning",
            title: "Limit Exceeded!",
            text: `Max discount percentage is ${maxPer}% (set in settings)`,
            showConfirmButton: false,
            timer: 2000,
          });
          setLoading(false);
          return;
        }

        if (discountDataSet?.discount_amt) {
          const calculatedRupee = (grandTotal * enteredValue) / 100;
          const maxAmt = Number(discountDataSet.discount_amt);
          if (calculatedRupee > maxAmt) {
            Swal.fire({
              icon: "warning",
              title: "Limit Exceeded!",
              text: `This % gives ₹${calculatedRupee.toFixed(
                0
              )} discount which exceeds max ₹${maxAmt.toLocaleString()}`,
              showConfirmButton: false,
              timer: 2000,
            });
            setLoading(false);
            return;
          }
        }
      }

      const payload = isAmountType
        ? {
            discount_type: "amount",
            discount_per: parseFloat(
              ((enteredValue / grandTotal) * 100).toFixed(4)
            ),
            discount_amt: enteredValue,
            client_id: id,
            txn_id: txn_id,
          }
        : {
            discount_type: "percent",
            discount_per: enteredValue,
            discount_amt: parseFloat(
              ((grandTotal * enteredValue) / 100).toFixed(2)
            ),
            client_id: id,
            txn_id: txn_id,
          };

      if (docTypeFromURL === "proforma") {
        const response = await saveProformaDiscount(
          txn_id,
          {
            discount_type: isAmountType ? "amount" : "percent",
            discount_val: enteredValue,
            discount_amt: isAmountType ? enteredValue : 0,
            discount_per: isAmountType ? 0 : enteredValue,
          },
          token
        );

        if (response.status === "Success") {
          Swal.fire({
            icon: "success",
            title: selecteddiscount ? "Updated!" : "Saved!",
            text: "Proforma discount updated successfully",
            showConfirmButton: false,
            timer: 1000,
          });
          fetchProformaData();
          resetAndClose();
        } else {
          Swal.fire({
            icon: "error",
            title: "Failed!",
            text: response.message || "Failed to save discount.",
            showConfirmButton: false,
            timer: 1000,
          });
        }
        return;
      }

      const response = selecteddiscount
        ? await updateDiscountData(selecteddiscount.id, payload, token)
        : await saveDiscountData(payload, token);

      if (response.status === "Success") {
        Swal.fire({
          icon: "success",
          title: selecteddiscount ? "Updated!" : "Saved!",
          text: selecteddiscount
            ? "Discount updated successfully"
            : "Discount saved successfully",
          showConfirmButton: false,
          timer: 1000,
        });
        fetchDiscount();
        resetAndClose();
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: response.message || "Failed to save discount.",
          showConfirmButton: false,
          timer: 1000,
        });
      }
    } catch (err) {
      console.error("Save error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          err.response?.data?.message ||
          "Something went wrong while saving discount.",
        showConfirmButton: false,
        timer: 1500,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDiscount = async () => {
    if (!selecteddiscount && docTypeFromURL !== "proforma") return;

    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this discount?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      if (docTypeFromURL === "proforma") {
        await saveProformaDiscount(
          txn_id,
          {
            discount_type: "amount",
            discount_val: 0,
            discount_amt: 0,
            discount_per: 0,
          },
          token
        );
        setSelecteddiscount(null);
        setShowModalDiscount(false);
        setFormDataDiscount({
          discount_type: "amount",
          discount_per: "",
          discount_amt: "",
        });
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Discount has been deleted.",
          showConfirmButton: false,
          timer: 1000,
        });
        fetchProformaData();
        return;
      }

      await deleteDiscountById(selecteddiscount.id, token);
      setSelecteddiscount(null);
      setShowModalDiscount(false);
      setFormDataDiscount({
        discount_type: "amount",
        discount_per: "",
        discount_amt: "",
      });
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Discount has been deleted.",
        showConfirmButton: false,
        timer: 1000,
      });
      fetchDiscount();
    } catch (err) {
      console.error("Delete error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          err.response?.data?.message ||
          "Something went wrong while deleting discount.",
        showConfirmButton: false,
        timer: 1500,
      });
    } finally {
      setLoading(false);
    }
  };

  // ================= ADJUSTMENT HANDLERS =================
  const handleShowAdjustment = () => {
    if (selectedAdjustment) {
      setFormDataAdjustment({
        adjustment_amt:
          selectedAdjustment.amount ||
          selectedAdjustment.adjustment_amount ||
          "",
      });
    } else {
      setFormDataAdjustment({ adjustment_amt: "" });
    }
    setShowModalAdjustment(true);
  };

  const handleCloseAdjustment = () => {
    setShowModalAdjustment(false);
    setFormDataAdjustment({ adjustment_amt: "" });
  };

  const handleChangeAdjustment = (e) => {
    const { name, value } = e.target;
    setFormDataAdjustment((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    setLoading(true);

    const resetAndClose = () => {
      setShowModalAdjustment(false);
      setFormDataAdjustment({ adjustment_amt: "" });
    };

    try {
      const enteredValue = Number(formDataAdjustment.adjustment_amt);

      if (isNaN(enteredValue) || enteredValue < 0) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Amount!",
          text: "Please enter a valid positive adjustment amount (₹).",
          showConfirmButton: false,
          timer: 1200,
        });
        setLoading(false);
        return;
      }

      if (enteredValue > dmTotalAfterDiscount) {
        Swal.fire({
          icon: "warning",
          title: "Limit Exceeded!",
          text: `Adjustment amount cannot exceed service charge after discount (Max: ₹${dmTotalAfterDiscount.toLocaleString(
            "en-IN"
          )}).`,
          showConfirmButton: false,
          timer: 2000,
        });
        setLoading(false);
        return;
      }

      const response = await saveProformaAdjustment(txn_id, enteredValue, token);

      if (response.status === "Success") {
        Swal.fire({
          icon: "success",
          title: selectedAdjustment ? "Adjustment Updated!" : "Adjustment Saved!",
          text: "Proforma adjustment updated successfully",
          showConfirmButton: false,
          timer: 1000,
        });
        fetchProformaData();
        resetAndClose();
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: response.message || "Failed to save adjustment.",
          showConfirmButton: false,
          timer: 1200,
        });
      }
    } catch (err) {
      console.error("Adjustment save error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          err.response?.data?.message ||
          "Something went wrong while saving adjustment.",
        showConfirmButton: false,
        timer: 1200,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdjustment = async () => {
    const confirmResult = await Swal.fire({
      title: "Are you sure?",
      text: "You want to remove this adjustment amount?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirmResult.isConfirmed) return;

    try {
      setLoading(true);
      const response = await saveProformaAdjustment(txn_id, 0, token);

      if (response.status === "Success") {
        setSelectedAdjustment(null);
        setShowModalAdjustment(false);
        setFormDataAdjustment({ adjustment_amt: "" });
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Adjustment has been removed.",
          showConfirmButton: false,
          timer: 1000,
        });
        fetchProformaData();
      }
    } catch (err) {
      console.error("Delete adjustment error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          err.response?.data?.message ||
          "Something went wrong while deleting adjustment.",
        showConfirmButton: false,
        timer: 1200,
      });
    } finally {
      setLoading(false);
    }
  };

  // ================= NOTES HANDLERS =================
  const handleCloseNoteModal = () => {
    setShowModalNote(false);
    setFormDataNote({
      note_name: "",
      plan: "",
    });
  };

  const handleChangeNoteModal = (e) => {
    const { name, value } = e.target;
    setFormDataNote((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitNoteModal = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isBalanceProforma && isEditingNote && selectedNotesId) {
        const updated = notesData.map((item) =>
          item.id === selectedNotesId.id
            ? { ...item, note_name: formDataNote.note_name }
            : item
        );
        const res = await updateBalanceProformaNotes(
          txn_id,
          updated.map((n) => ({ note_name: n.note_name })),
          token
        );

        if (res.status === "Success") {
          setNotesData(updated);
          setShowModalNote(false);
          Swal.fire({
            icon: "success",
            title: "Success",
            text: "Note updated successfully!",
            showConfirmButton: false,
            timer: 1000,
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: res.message || "Failed to update note",
            showConfirmButton: false,
            timer: 1000,
          });
        }
        return;
      }

      if (docTypeFromURL === "proforma" && isEditingNote && selectedNotesId) {
        const updated = notesData.map((item) =>
          item.id === selectedNotesId.id
            ? { ...item, note_name: formDataNote.note_name }
            : item
        );
        const res = await updateProformaNotes(
          parseInt(txn_id),
          updated.map((n) => ({ id: n.id, note_name: n.note_name })),
          token
        );

        if (res.status === "Success") {
          setNotesData(updated);
          setShowModalNote(false);
          Swal.fire({
            icon: "success",
            title: "Success",
            text: "Note updated successfully!",
            showConfirmButton: false,
            timer: 1000,
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: res.message || "Failed to update note",
            showConfirmButton: false,
            timer: 1000,
          });
        }
        return;
      }

      let response;
      if (isEditingNote && selectedNotesId) {
        response = await updatePlanClientNoteById(
          selectedNotesId.id,
          formDataNote,
          token
        );
      } else {
        response = await axios.post(
          `${baseURL}/auth/api/re_calculator/addNotebyplan`,
          formDataNote,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      }

      if (response.data?.status === "Success" || response.status === "Success") {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: isEditingNote
            ? "Note updated successfully!"
            : "Note added successfully!",
          showConfirmButton: false,
          timer: 1000,
        }).then(() => {
          setShowModalNote(false);
          fetchClientNotesData();
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            response.data?.message ||
            response.message ||
            "Failed to save Note. Please try again.",
          showConfirmButton: false,
          timer: 1000,
        });
      }
    } catch (error) {
      console.error("Error saving Note:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save note. Please try again.",
        showConfirmButton: false,
        timer: 1000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditNoteModal = (note) => {
    setSelectedNotesId(note);
    setFormDataNote({
      note_name: note.note_name,
      plan: note.plan || "Customise",
    });
    setIsEditingNote(true);
    setShowModalNote(true);
  };

  const handleAddPredefinedNote = (note) => {
    if (!selectedNotes.find((n) => n.id === note.id)) {
      setSelectedNotes([
        ...selectedNotes,
        { id: note.id, note_name: note.note_text, type: "predefined" },
      ]);
    }
  };

  const handleSelectPredefinedNote = (note) => {
    handleAddPredefinedNote(note);
  };

  const handleAddManualNote = () => {
    if (manualNote.trim() === "") return;

    setSelectedNotes([
      ...selectedNotes,
      { id: Date.now(), note_name: manualNote.trim(), type: "manual" },
    ]);
    setManualNote("");
  };

  const handleRemoveNote = (noteId) => {
    setSelectedNotes(selectedNotes.filter((note) => note.id !== noteId));
  };

  const handleSaveNotes = async () => {
    if (selectedNotes.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No Notes",
        text: "Please add at least one note before saving.",
        showConfirmButton: false,
        timer: 1000,
      });
      return;
    }

    if (isBalanceProforma) {
      try {
        const combined = [
          ...notesData,
          ...selectedNotes.map((item, idx) => ({
            id: Date.now() + idx,
            note_name: item.note_name,
          })),
        ];

        const res = await updateBalanceProformaNotes(
          txn_id,
          combined.map((n) => ({ note_name: n.note_name })),
          token
        );

        if (res.status === "Success") {
          setNotesData(combined);
          setSelectedNotes([]);
          setManualNote("");
          Swal.fire({
            icon: "success",
            title: "Notes Saved",
            text: "Notes saved to balance proforma successfully!",
            showConfirmButton: false,
            timer: 1000,
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: res.message || "Failed to save notes to balance proforma.",
            showConfirmButton: false,
            timer: 1000,
          });
        }
      } catch (err) {
        console.error("Error saving balance proforma notes:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "An error occurred while saving notes.",
          showConfirmButton: false,
          timer: 1000,
        });
      }
      return;
    }

    if (docTypeFromURL === "proforma") {
      try {
        const combined = [
          ...notesData,
          ...selectedNotes.map((item, idx) => ({
            id: item.id || Date.now() + idx,
            note_name: item.note_name,
          })),
        ];

        const res = await updateProformaNotes(
          parseInt(txn_id),
          combined.map((n) => ({ id: n.id, note_name: n.note_name })),
          token
        );

        if (res.status === "Success") {
          setNotesData(combined);
          setSelectedNotes([]);
          setManualNote("");
          Swal.fire({
            icon: "success",
            title: "Notes Saved",
            text: "Notes saved to proforma successfully!",
            showConfirmButton: false,
            timer: 1000,
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: res.message || "Failed to save notes to proforma.",
            showConfirmButton: false,
            timer: 1000,
          });
        }
      } catch (err) {
        console.error("Error saving proforma notes:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "An error occurred while saving notes.",
          showConfirmButton: false,
          timer: 1000,
        });
      }
      return;
    }

    try {
      const planNotes = selectedNotes.map((item) => ({
        note_name: item.note_name,
      }));

      const payload = {
        txn_id: txn_id,
        client_id: id,
        planNotes,
      };

      const res = await saveClientIdwiseNotes(payload, token);

      if (res.status === "Success") {
        Swal.fire({
          icon: "success",
          title: "Notes Created",
          text: res.message,
          showConfirmButton: false,
          timer: 1000,
        });

        setManualNote("");
        setPredefinedNotes([]);
        setSelectedNotes([]);
        fetchPredefinedNotes();
        fetchClientNotesData();
      } else if (res.status === "Alert") {
        Swal.fire({
          icon: "warning",
          title: "Duplicate Notes",
          text: res.message,
          showConfirmButton: false,
          timer: 1000,
        });
        setManualNote("");
        setPredefinedNotes([]);
        setSelectedNotes([]);
        fetchPredefinedNotes();
        fetchClientNotesData();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: res.message || "Something went wrong while saving the notes.",
          showConfirmButton: false,
          timer: 1000,
        });
      }
    } catch (err) {
      console.error("Save error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while saving the notes.",
        showConfirmButton: false,
        timer: 1000,
      });
    }
  };

  const handleDeleteClientNote = async (noteId) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this note ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    if (isBalanceProforma) {
      const updated = notesData.filter((item) => item.id !== noteId);
      try {
        const res = await updateBalanceProformaNotes(
          txn_id,
          updated.map((n) => ({ note_name: n.note_name })),
          token
        );

        if (res.status === "Success") {
          setNotesData(updated);
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Note has been deleted.",
            timer: 1000,
            showConfirmButton: false,
          });
        }
      } catch (error) {
        console.error("Error deleting note:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "An error occurred while deleting note.",
          showConfirmButton: false,
          timer: 1000,
        });
      }
      return;
    }

    if (docTypeFromURL === "proforma") {
      const updated = notesData.filter((item) => item.id !== noteId);
      try {
        const res = await updateProformaNotes(
          parseInt(txn_id),
          updated.map((n) => ({ id: n.id, note_name: n.note_name })),
          token
        );

        if (res.status === "Success") {
          setNotesData(updated);
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Note has been deleted.",
            timer: 1000,
            showConfirmButton: false,
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: res.message || "Failed to delete note.",
            showConfirmButton: false,
            timer: 1000,
          });
        }
      } catch (error) {
        console.error("Error deleting note:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "An error occurred while deleting note.",
          showConfirmButton: false,
          timer: 1000,
        });
      }
      return;
    }

    try {
      const result = await deletePlanClientNotes(noteId, token);
      if (result.status === "Success") {
        setNotesData((prev) => prev.filter((item) => item.id !== noteId));
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "note has been deleted.",
          timer: 1000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while deleting entry.",
        showConfirmButton: false,
        timer: 1000,
      });
    }
  };

  return {
    loading,
    clientData,
    clientDataReceived,
    proformaMeta,
    graphicData,
    adsData,
    complimentaryData,
    notesData,
    predefinedNotes,
    selectedNotes,
    manualNote,
    setManualNote,
    showMetaAd,
    setShowMetaAd,
    showGoogleAd,
    setShowGoogleAd,
    selecteddiscount,
    discountAmount,
    discountDataSet,
    formDataDiscount,
    showModalDiscount,
    selectedAdjustment,
    adjustmentAmount,
    formDataAdjustment,
    showModalAdjustment,
    dmTotalAfterDiscount,
    previousBalanceAmount,
    graphicTotal,
    complimentaryTotal,
    grandTotal,
    displayedTaxable,
    displayedCgst,
    displayedSgst,
    displayedSubtotal,
    displayedGrandTotal,
    displayedReceived,
    displayedCurrentBalance,
    // Note modal
    showModalNote,
    isEditingNote,
    formDataNote,
    handleCloseNoteModal,
    handleChangeNoteModal,
    handleSubmitNoteModal,
    handleOpenEditNoteModal,
    // Predefined notes
    handleSelectPredefinedNote,
    handleAddManualNote,
    handleRemoveNote,
    handleSaveNotes,
    handleDeleteClientNote,
    // Discount handlers
    handleShowDiscount,
    handleCloseDiscount,
    handleChangeDiscount,
    handleSaveDiscount,
    handleDeleteDiscount,
    // Adjustment handlers
    handleShowAdjustment,
    handleCloseAdjustment,
    handleChangeAdjustment,
    handleSaveAdjustment,
    handleDeleteAdjustment,
    // Action buttons
    handlePrintPage,
    handleProposalHistory,
    handleEdit,
  };
}
