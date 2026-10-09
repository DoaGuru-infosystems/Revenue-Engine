import { useState, useEffect, useCallback } from "react";
import {
  fetchInvoiceServices,
  fetchInvoiceClientDetails,
  fetchInvoiceClientNotes,
  fetchInvoiceComplimentaryData,
  fetchDiscountByDocument,
  fetchDiscountById,
  fetchDiscountSettings,
  fetchPredefinedNotes as fetchPredefinedNotesApi,
  fetchAdditionalServices,
  fetchRemainingAmountData,
  fetchProformaPayments as fetchProformaPaymentsApi,
  fetchClientProformas,
  fetchProposalById,
  fetchClientDetailsById,
  fetchBalanceProformaById,
} from "../api";
import { classifyProformaServices } from "../../../utils/proformaPricing";
import { parseAmount, getOptionalAmountFromItem } from "./useInvoiceCalculations";

/**
 * Custom hook to manage all Invoice state, data fetching, and lifecycle.
 */
export const useInvoiceData = ({
  id,
  txn_id,
  activeTxnId,
  token,
  isBalanceProforma = false,
  docTypeFromURL = "final",
  sourceFromURL = null,
  txnIdFromURL = null,
  publicMode = false,
  publicData = null,
  onSessionExpired = null,
}) => {
  const [serviceData, setServiceData] = useState([]);
  const [additionalServiceData, setAdditionalServiceData] = useState([]);
  const [remainingAmountData, setRemainingAmountData] = useState([]);
  const [graphicData, setGraphicData] = useState([]);
  const [adsData, setAdsData] = useState([]);
  const [complimentaryData, setComplimentaryData] = useState([]);
  const [selecteddiscount, setSelecteddiscount] = useState(null);
  const [discountDataSet, setDiscountDataSet] = useState(null);
  const [notesData, setNotesData] = useState([]);
  const [predefinedNotes, setPredefinedNotes] = useState([]);
  const [clientData, setClientData] = useState(null);
  const [proformaPayments, setProformaPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMetaAd, setShowMetaAd] = useState(true);
  const [showGoogleAd, setShowGoogleAd] = useState(true);

  const handleAuthError = useCallback((error) => {
    if (error?.response?.status === 401 && typeof onSessionExpired === "function") {
      onSessionExpired();
    }
  }, [onSessionExpired]);

  // 1. Fetch Services
  const fetchServices = useCallback(async () => {
    if (!id || !activeTxnId) return;
    try {
      const res = await fetchInvoiceServices(id, activeTxnId, token);
      if (res.status === "Success" || res.data) {
        const { dmServices, adsServices } = classifyProformaServices(res.data || []);
        setServiceData([...dmServices, ...adsServices]);
      }
    } catch (error) {
      handleAuthError(error);
    }
  }, [id, activeTxnId, token, handleAuthError]);

  // 2. Fetch Client Details
  const fetchClient = useCallback(async () => {
    if (!id || !activeTxnId) return;
    try {
      const res = await fetchInvoiceClientDetails(id, activeTxnId, token);
      if (res.status === "Success") {
        setClientData(res.data);
      }
    } catch (error) {
      handleAuthError(error);
    }
  }, [id, activeTxnId, token, handleAuthError]);

  // 3. Fetch Client Notes
  const fetchClientNotes = useCallback(async () => {
    if (!id || !activeTxnId) return;
    try {
      const res = await fetchInvoiceClientNotes(id, activeTxnId, token);
      if (res.status === "Success" && res.data && res.data.length > 0) {
        setNotesData(res.data);
      }
    } catch (error) {
      handleAuthError(error);
    }
  }, [id, activeTxnId, token, handleAuthError]);

  // 4. Fetch Complimentary Items
  const fetchComplimentaryData = useCallback(async () => {
    if (!id || !activeTxnId) return;
    try {
      const data = await fetchInvoiceComplimentaryData(id, activeTxnId, token);
      setComplimentaryData(data.data || []);
    } catch (error) {
      handleAuthError(error);
    }
  }, [id, activeTxnId, token, handleAuthError]);

  // 5. Fetch Discounts
  const fetchDiscount = useCallback(async () => {
    if (!id || !activeTxnId) return;
    const normalizeDiscount = (fetched) => {
      if (fetched && fetched.discount_type) {
        fetched.discount_type = fetched.discount_type.toLowerCase();
        if (fetched.discount_type === "percentage") {
          fetched.discount_type = "percent";
        }
      }
      return fetched;
    };

    try {
      const data = await fetchDiscountByDocument(id, activeTxnId, token);
      if (data.data && data.data.length > 0) {
        setSelecteddiscount(normalizeDiscount(data.data[0]));
        return;
      }

      try {
        const direct = await fetchDiscountById(id, activeTxnId, token);
        if (direct?.data && direct.data.length > 0) {
          setSelecteddiscount(normalizeDiscount(direct.data[0]));
        } else {
          setSelecteddiscount(null);
        }
      } catch {
        setSelecteddiscount(null);
      }
    } catch (error) {
      console.error("Error fetching discount:", error);
      setSelecteddiscount(null);
    }
  }, [id, activeTxnId, token]);

  // 6. Fetch Discount Global Settings
  const fetchDiscountSetting = useCallback(async () => {
    try {
      const data = await fetchDiscountSettings(token);
      if (data.data && data.data.length > 0) {
        setDiscountDataSet(data.data[0]);
      }
    } catch (error) {
      console.error("Error fetching discount setting:", error);
    }
  }, [token]);

  // 7. Fetch Predefined Notes
  const fetchPredefinedNotes = useCallback(async () => {
    try {
      const data = await fetchPredefinedNotesApi(isBalanceProforma, token);
      setPredefinedNotes(data.data || []);
    } catch (error) {
      console.error("Error fetching predefined notes:", error);
    }
  }, [isBalanceProforma, token]);

  // 8. Fetch Additional Services
  const fetchAdditionservice = useCallback(async () => {
    if (!id || !activeTxnId) return;
    try {
      const res = await fetchAdditionalServices(id, activeTxnId, token);
      if (res.status === "Success") {
        setAdditionalServiceData(res.data || []);
      }
    } catch (error) {
      handleAuthError(error);
    }
  }, [id, activeTxnId, token, handleAuthError]);

  // 9. Fetch Remaining Amount
  const fetchRemainingAmount = useCallback(async () => {
    if (!id || !activeTxnId) return;
    try {
      const res = await fetchRemainingAmountData(id, activeTxnId, token);
      if (res.status === "Success") {
        setRemainingAmountData(res.data || []);
      }
    } catch (error) {
      handleAuthError(error);
    }
  }, [id, activeTxnId, token, handleAuthError]);

  // 10. Fetch Proforma Payments
  const fetchProformaPayments = useCallback(async (proformaId = txn_id, clientId = id) => {
    if (!clientId) return [];
    try {
      const data = await fetchProformaPaymentsApi(clientId, token);
      const rows =
        data.status === "Success"
          ? (data.data || []).filter(
            (payment) => Number(payment.proforma_id) === Number(proformaId)
          )
          : [];
      setProformaPayments(rows);
      return rows;
    } catch (error) {
      console.error("Error fetching proforma payments:", error);
      setProformaPayments([]);
      return [];
    }
  }, [id, txn_id, token]);

  // 11. Fetch Proforma Document Data
  const fetchProformaData = useCallback(async () => {
    if (!id || !txn_id) return;
    try {
      const res = await fetchClientProformas(id, token);
      if (res.status === "Success") {
        const proformas = res.data || [];
        const proforma = proformas.find((p) => p.id === parseInt(txn_id));
        if (proforma) {
          let p = null;
          if (proforma.proposal_id) {
            const propRes = await fetchProposalById(proforma.proposal_id, token);
            if (propRes.status === "Success") {
              p = propRes.data;
            }
          } else {
            const clientRes = await fetchClientDetailsById(id, token);
            if (clientRes.status === "Success") {
              const c = clientRes.data;
              p = {
                client_name: c.client_name,
                company_name: c.client_organization || c.company_name,
                email: c.email,
                phone: c.phone,
                address: c.address,
              };
            }
          }

          const proformaPaymentRows = await fetchProformaPayments(proforma.id, id);
          const totalRecordedReceived = proformaPaymentRows.reduce(
            (sum, payment) => sum + parseAmount(payment.amount),
            0
          );
          const totalRecordedSettled = proformaPaymentRows.reduce(
            (sum, payment) => sum + parseAmount(payment.final_amount || payment.amount),
            0
          );
          const latestPayment = proformaPaymentRows[0];

          if (p) {
            setClientData({
              id: proforma.id,
              client_name: p.client_name,
              client_organization: p.company_name,
              email: p.email,
              phone: p.phone,
              address: p.address,
              bill_type: proforma.bill_type,
              document_type: "proforma",
              bill_number: proforma.proforma_number,
              invoice_number: proforma.proforma_number,
              created_at: proforma.created_at,
              duration_start_date: proforma.duration_start_date,
              duration_end_date: proforma.duration_end_date,
              payment_mode: latestPayment?.payment_mode || "",
              tag_received_amt:
                totalRecordedSettled >= Number(proforma.total_amount || 0) && totalRecordedSettled > 0
                  ? "received"
                  : totalRecordedReceived > 0
                    ? "partial"
                    : "pending",
              received_amt: totalRecordedReceived,
              current_amt: Math.max(Number(proforma.total_amount || 0) - totalRecordedSettled, 0),
              total_amt: Number(proforma.total_amount || 0),
              previous_amt: 0,
              discount_snapshot: proforma.discount_snapshot || null,
              realized_ad_budget: Number(proforma.realized_ad_budget || 0),
              invoice_source: "proposal",
            });
          }

          setShowGoogleAd(Boolean(proforma.show_google_ad));
          setShowMetaAd(Boolean(proforma.show_meta_ad));

          try {
            const parsed = JSON.parse(proforma.pricing_snapshot || "[]");
            let adsParsed = [];
            if (proforma.ads_snapshot) {
              try {
                adsParsed = JSON.parse(proforma.ads_snapshot || "[]");
              } catch (e) {}
            }
            const combined = [...parsed, ...adsParsed];
            const { dmServices, adsServices } = classifyProformaServices(combined);
            setServiceData([...dmServices, ...adsServices]);

            const complimentary = parsed
              .filter(
                (item) =>
                  item.source === "custom_complimentary" ||
                  (item.service_name && item.service_name.toLowerCase() === "complimentary") ||
                  Boolean(item.is_complimentary)
              )
              .map((item) => ({
                service_type: "Complimentary",
                service_name: item.service_name || "Complimentary",
                category_name: item.category_name,
                editing_type_name: item.editing_type_name,
                quantity: item.quantity || 1,
                editing_type_amount:
                  item.editing_type_amount && Number(item.editing_type_amount) > 0
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
            setComplimentaryData(complimentary);
          } catch (e) {
            console.error("Failed to parse proforma.pricing_snapshot", e);
            setServiceData([]);
            setComplimentaryData([]);
          }

          try {
            if (proforma.notes_snapshot) {
              const parsedNotes = JSON.parse(proforma.notes_snapshot || "[]");
              const formattedNotes = parsedNotes.map((note, idx) => ({
                id: note.id || idx + 1,
                note_name: typeof note === "string" ? note : note.note_name || "",
              }));
              setNotesData(formattedNotes);
            } else {
              setNotesData([]);
            }
          } catch (e) {
            setNotesData([]);
          }

          setAdditionalServiceData([]);
          setDiscountDataSet(null);
          fetchDiscount();
          setLoading(false);
        } else {
          setProformaPayments([]);
          setLoading(false);
        }
      }
    } catch (e) {
      console.error("Error in fetchProformaData:", e);
      setLoading(false);
    }
  }, [id, txn_id, token, fetchProformaPayments, fetchDiscount]);

  // 12. Fetch Balance Proforma Data
  const fetchBalanceProformaData = useCallback(async () => {
    if (!txn_id) return;
    try {
      const res = await fetchBalanceProformaById(txn_id, token);
      if (res.status === "Success") {
        const bp = res.data;
        const isGstVal =
          bp.is_gst && typeof bp.is_gst === "object" && bp.is_gst.data
            ? bp.is_gst.data[0] === 1
            : Number(bp.is_gst) === 1;

        setClientData({
          id: bp.id,
          client_name: bp.client_name || "",
          client_organization: bp.client_organization || "",
          email: bp.email || "",
          phone: bp.phone || "",
          address: bp.address || "",
          bill_type: isGstVal ? "GST" : "NON_GST",
          document_type: "balance-proforma",
          bill_number: bp.balance_proforma_number || `BAL-PROF-${bp.balance_number}`,
          source_proforma_number: bp.source_proforma_number,
          duration_start_date: bp.duration_start_date || bp.created_at,
          duration_end_date: bp.duration_end_date || bp.created_at,
          payment_mode: "",
          tag_received_amt:
            Number(bp.current_balance || 0) <= 0
              ? "received"
              : Number(bp.received_amount || 0) > 0
                ? "partial"
                : "pending",
          received_amt: Number(bp.received_amount || 0),
          current_amt: Number(bp.current_balance || 0),
          total_amt: Number(bp.total_amount || 0),
          previous_amt: 0,
          created_at: bp.created_at,
          discount_snapshot: bp.discount_snapshot || null,
        });

        setShowGoogleAd(Boolean(bp.show_google_ad));
        setShowMetaAd(Boolean(bp.show_meta_ad));

        try {
          const parsed = JSON.parse(bp.pricing_snapshot || "[]");
          let adsParsed = [];
          if (bp.ads_snapshot) {
            try {
              adsParsed = JSON.parse(bp.ads_snapshot || "[]");
            } catch (e) {}
          }
          const combined = [...parsed, ...adsParsed];
          const { dmServices, adsServices } = classifyProformaServices(combined);
          setServiceData([...dmServices, ...adsServices]);

          const complimentary = parsed
            .filter(
              (item) =>
                item.source === "custom_complimentary" ||
                (item.service_name && item.service_name.toLowerCase() === "complimentary") ||
                Boolean(item.is_complimentary)
            )
            .map((item) => ({
              service_type: "Complimentary",
              service_name: item.service_name || "Complimentary",
              category_name: item.category_name,
              editing_type_name: item.editing_type_name,
              quantity: item.quantity || 1,
              editing_type_amount:
                item.editing_type_amount && Number(item.editing_type_amount) > 0
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
          setComplimentaryData(complimentary);
        } catch (e) {
          console.error("Failed to parse bp.pricing_snapshot", e);
          setServiceData([]);
          setComplimentaryData([]);
        }

        try {
          if (bp.notes_snapshot) {
            const parsedNotes = JSON.parse(bp.notes_snapshot || "[]");
            const formattedNotes = parsedNotes.map((note, idx) => ({
              id: note.id || idx + 1,
              note_name: typeof note === "string" ? note : note.note_name || "",
            }));
            setNotesData(formattedNotes);
          } else {
            setNotesData([]);
          }
        } catch (e) {
          setNotesData([]);
        }

        setAdditionalServiceData([]);
        setDiscountDataSet(null);
        fetchDiscount();
        setProformaPayments([]);
        setLoading(false);
      }
    } catch (e) {
      console.error("fetchBalanceProformaData error:", e);
      setLoading(false);
    }
  }, [txn_id, token, fetchDiscount]);

  // 13. Fetch Proposal Invoice Data
  const fetchProposalInvoiceData = useCallback(async () => {
    if (!id || !txn_id) return;
    try {
      const res = await fetchInvoiceClientDetails(id, txn_id, token);
      if (res.status === "Success") {
        const client = res.data;
        const received = Number(client.received_amt || 0);
        const total = Number(client.current_amt || 0);
        const current = Math.max(total - received, 0);
        client.current_amt = current;

        if (current <= 0 && received > 0) {
          client.tag_received_amt = "received";
        } else if (received > 0) {
          client.tag_received_amt = "partial";
        } else {
          client.tag_received_amt = "pending";
        }

        setClientData(client);

        try {
          const parsed = JSON.parse(client.pricing_snapshot || "[]");
          let adsParsed = [];
          if (client.ads_snapshot) {
            try {
              adsParsed = JSON.parse(client.ads_snapshot || "[]");
            } catch (e) {}
          }
          const combined = [...parsed, ...adsParsed];
          const { dmServices, adsServices } = classifyProformaServices(combined);
          setServiceData([...dmServices, ...adsServices]);

          const complimentary = parsed
            .filter(
              (item) =>
                item.source === "custom_complimentary" ||
                (item.service_name && item.service_name.toLowerCase() === "complimentary")
            )
            .map((item) => ({
              service_type: "Complimentary",
              service_name: item.service_name || "Complimentary",
              category_name: item.category_name,
              editing_type_name: item.editing_type_name,
              quantity: item.quantity,
              editing_type_amount:
                item.editing_type_amount && Number(item.editing_type_amount) > 0
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
          setComplimentaryData(complimentary);

          if (client.notes_snapshot) {
            const parsedNotes = JSON.parse(client.notes_snapshot || "[]");
            const formattedNotes = parsedNotes.map((note, idx) => ({
              id: note.id || idx + 1,
              note_name: typeof note === "string" ? note : note.note_name || "",
            }));
            setNotesData(formattedNotes);
          } else {
            setNotesData([]);
          }
        } catch (e) {
          console.error("Failed to parse snapshots", e);
          setServiceData([]);
          setComplimentaryData([]);
          setNotesData([]);
        }

        setAdditionalServiceData([]);
        setDiscountDataSet(null);
        fetchDiscount();
        setProformaPayments([]);
        setLoading(false);
      }
    } catch (e) {
      console.error("fetchProposalInvoiceData error:", e);
      setLoading(false);
    }
  }, [id, txn_id, token, fetchDiscount]);

  // Main Initial Load Effect
  useEffect(() => {
    if (publicMode && publicData) {
      setClientData(publicData.clientData || {});

      let parsedServices = [];
      if (publicData.clientData?.pricing_snapshot) {
        try {
          const parsed = JSON.parse(publicData.clientData.pricing_snapshot || "[]");
          let adsParsed = [];
          if (publicData.clientData?.ads_snapshot) {
            try {
              adsParsed = JSON.parse(publicData.clientData.ads_snapshot || "[]");
            } catch (e) {}
          }
          const combined = [...parsed, ...adsParsed];
          const { dmServices, adsServices } = classifyProformaServices(combined);
          parsedServices = [...dmServices, ...adsServices];
        } catch (e) {
          console.error("Failed to parse publicData pricing_snapshot", e);
        }
      }

      if (parsedServices.length === 0) {
        const { dmServices, adsServices } = classifyProformaServices(publicData.serviceData || []);
        const mappedGraphicData = (publicData.graphicData || []).map((item) => ({
          ...item,
          service_type: "Graphic Service",
          category_name: item.category_name || item.service_name || "",
          editing_type_name:
            item.editing_type_name &&
            item.editing_type_name !== "N/A" &&
            item.editing_type_name !== "null" &&
            item.editing_type_name !== ""
              ? item.editing_type_name
              : item.category_name || item.service_name || "N/A",
        }));
        const mappedAdsData = (publicData.adsData || []).map((item) => ({
          ...item,
          service_type: "Ads Campaign",
        }));
        parsedServices = [...dmServices, ...adsServices, ...mappedGraphicData, ...mappedAdsData];
      }

      setServiceData(parsedServices);
      setComplimentaryData(publicData.complimentaryData || []);
      setDiscountDataSet(publicData.discountDataSet || null);
      setAdditionalServiceData(publicData.additionalServiceData || []);
      setRemainingAmountData(publicData.remainingAmountData || []);
      setNotesData(publicData.notesData || []);
      setProformaPayments(publicData.proformaPayments || []);
      setPredefinedNotes([]);
      setLoading(false);
      return;
    }

    if (isBalanceProforma) {
      fetchBalanceProformaData();
      fetchPredefinedNotes();
    } else if (docTypeFromURL === "proforma" || sourceFromURL === "proposal") {
      fetchProformaData();
      fetchPredefinedNotes();
    } else if (sourceFromURL === "proposal_invoice") {
      fetchProposalInvoiceData();
      fetchPredefinedNotes();
    } else {
      if (txnIdFromURL) {
        fetchProformaPayments(txn_id, id);
      } else {
        setProformaPayments([]);
      }
      fetchServices();
      fetchClient();
      fetchClientNotes();
      fetchComplimentaryData();
      fetchDiscount();
      fetchDiscountSetting();
      fetchPredefinedNotes();
      fetchRemainingAmount();
      fetchAdditionservice();
    }
  }, [
    id,
    txn_id,
    docTypeFromURL,
    sourceFromURL,
    txnIdFromURL,
    isBalanceProforma,
    publicMode,
    publicData,
    fetchBalanceProformaData,
    fetchPredefinedNotes,
    fetchProformaData,
    fetchProposalInvoiceData,
    fetchProformaPayments,
    fetchServices,
    fetchClient,
    fetchClientNotes,
    fetchComplimentaryData,
    fetchDiscount,
    fetchDiscountSetting,
    fetchRemainingAmount,
    fetchAdditionservice,
  ]);

  // Group Graphic and Ads whenever serviceData updates
  useEffect(() => {
    if (!Array.isArray(serviceData) || serviceData.length === 0) {
      setLoading(false);
      return;
    }

    const graphicRaw = serviceData.filter((item) => item.service_type === "Graphic Service");
    const adsRaw = serviceData.filter((item) => item.service_type === "Ads Campaign");

    const groupedGraphic = [];

    graphicRaw.forEach((item) => {
      let service = groupedGraphic.find((s) => s.service === item.service_name);
      if (!service) {
        service = { service: item.service_name, editingTypes: [] };
        groupedGraphic.push(service);
      }

      const quantity = parseAmount(item.quantity) || 1;
      const price = parseAmount(item.editing_type_amount);
      const include_content_posting = getOptionalAmountFromItem(item, [
        "include_content_posting",
        "include_meta_growth_&_content_management",
      ]);
      const include_thumbnail_creation = getOptionalAmountFromItem(item, [
        "include_thumbnail_creation",
      ]);

      let include_youtube_video_posting = getOptionalAmountFromItem(item, [
        "include_youtube_video_posting",
        "include_youtube_channel_growth_&_optimization",
      ]);

      if (include_youtube_video_posting <= 0) {
        const rowTotal = parseAmount(item.total_amount);
        const knownTotal =
          quantity * (price + include_content_posting + include_thumbnail_creation);
        const inferredYoutube = rowTotal - knownTotal;
        if (inferredYoutube > 0) {
          include_youtube_video_posting = Number((inferredYoutube / quantity).toFixed(2));
        }
      }

      const catName = item.category_name || item.service_name || "N/A";
      const typeName =
        item.editing_type_name &&
        item.editing_type_name !== "N/A" &&
        item.editing_type_name !== "null" &&
        item.editing_type_name.trim() !== ""
          ? item.editing_type_name
          : catName;

      service.editingTypes.push({
        category: catName,
        type: typeName,
        quantity,
        price,
        include_content_posting,
        include_thumbnail_creation,
        include_youtube_video_posting,
        total: parseAmount(item.total_amount),
      });
    });

    setGraphicData(groupedGraphic);
    setAdsData(adsRaw);
    setLoading(false);
  }, [serviceData]);

  return {
    serviceData,
    setServiceData,
    additionalServiceData,
    setAdditionalServiceData,
    remainingAmountData,
    setRemainingAmountData,
    graphicData,
    setGraphicData,
    adsData,
    setAdsData,
    complimentaryData,
    setComplimentaryData,
    selecteddiscount,
    setSelecteddiscount,
    discountDataSet,
    setDiscountDataSet,
    notesData,
    setNotesData,
    predefinedNotes,
    setPredefinedNotes,
    clientData,
    setClientData,
    proformaPayments,
    setProformaPayments,
    loading,
    setLoading,
    showMetaAd,
    setShowMetaAd,
    showGoogleAd,
    setShowGoogleAd,
    // Fetchers
    fetchServices,
    fetchClient,
    fetchClientNotes,
    fetchComplimentaryData,
    fetchDiscount,
    fetchDiscountSetting,
    fetchPredefinedNotes,
    fetchAdditionservice,
    fetchRemainingAmount,
    fetchProformaPayments,
    fetchProformaData,
    fetchBalanceProformaData,
    fetchProposalInvoiceData,
  };
};
