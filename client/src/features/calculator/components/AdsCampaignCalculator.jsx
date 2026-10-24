import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../../../redux/user/userSlice";
import axios from "axios";
import Swal from "sweetalert2";
import { ArrowLeft, Megaphone, Sparkles, Pencil, Trash2, Wallet, Layers } from "lucide-react";
import API_BASE_URL from "../../../config/apiBaseUrl";
import { useTheme } from "../../../context/ThemeContext";
import { getBasePathFromLocation, servicesLandingPath } from "../../../utils/rolePaths";

const AdsCampaignCalculator = ({ hideNotes, onSaveComplete, proposalIdOverride, onServiceAdded, onServiceDeleted, embeddedData }) => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const baseURL = API_BASE_URL;
  const params = useParams();
  const id = params.id || params.clientId;
  const proposalId = proposalIdOverride !== undefined ? proposalIdOverride : params.proposalId;
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const docTypeFromURL = searchParams.get("doc");
  const isQuotationMode =
    location.state?.mode === "quotation" || searchParams.get("mode") === "quotation";
  const { currentUser, token } = useSelector((state) => state.user);

  const userName = currentUser?.name;
  const [adsData, setAdsData] = useState([]);
  const [enteredAmount, setEnteredAmount] = useState({});
  const [adsItems, setAdsItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [getData, setGetData] = useState([]);
  const [editingId, setEditingId] = useState(null); // For proforma edit mode
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (location.state?.editItem) {
      const item = location.state.editItem;
      const cat = item.category || item.category_name;
      const amt = item.amount || item.budget;
      if (cat && amt) {
        setEnteredAmount((prev) => ({ ...prev, [cat]: amt }));
        setEditingId(item.id);
      }
    } else if (docTypeFromURL === "proforma" && getData.length > 0 && Object.keys(enteredAmount).length === 0 && !editingId) {
      const initialAmounts = {};
      getData.forEach((item) => {
        const cat = item.category || item.category_name;
        const amt = item.amount || item.budget;
        if (cat && amt) {
          initialAmounts[cat] = amt;
        }
      });
      if (Object.keys(initialAmounts).length > 0) {
        setEnteredAmount(initialAmounts);
      }
    }
  }, [location.state, getData, docTypeFromURL]);

  // Sync embeddedData
  useEffect(() => {
    if (embeddedData) {
      setAdsItems(embeddedData.map(r => ({
        id: r.id,
        category: r.category_name,
        amount: r.budget,
        percent: r.percent,
        charge: r.charge,
        total: r.total_price || r.total_amount
      })));
    }
  }, [embeddedData]);

  // Fetch ads configuration from API
  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${API_BASE_URL}/auth/api/re_calculator/getAdsServices`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.status === "Success" && response.data.data) {
          setAdsData(response.data.data);
        } else {
          setError("Failed to load ads data");
        }
      } catch (error) {
        setError("Failed to load ads data from server");
        if (error.response && error.response.status === 401) {
          Swal.fire({
            title: "Session Expired",
            text: "Please login again.",
            icon: "warning",
            showConfirmButton: false,
            timer: 1000,
          }).then(() => {
            dispatch(clearUser());
            localStorage.removeItem("token");
            navigate("/");
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [baseURL, token, navigate, dispatch]);

  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const roundCurrency = (amount) => {
    return Math.round(amount);
  };

  const validateAmount = (value) => {
    const amount = parseFloat(value);
    return !isNaN(amount) && amount > 0 ? amount : null;
  };

  const handleAmountChange = (category, value) => {
    setError("");
    setEnteredAmount((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  const resetForm = () => {
    setEnteredAmount({});
    setError("");
  };

  const clearAll = () => {
    resetForm();
    setEditingId(null);
    if (onServiceDeleted) {
      adsItems.forEach(item => onServiceDeleted(item.id));
    } else {
      setAdsItems([]);
    }
  };

  const removeItem = async (itemId) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#4b5563",
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      if (onServiceDeleted) {
        onServiceDeleted(itemId);
        setAdsItems((prev) => prev.filter((item) => item.id !== itemId));
        Swal.fire({
          title: "Deleted!",
          text: "Item has been removed from proposal.",
          icon: "success",
          timer: 1000,
          showConfirmButton: false,
        });
        return;
      }

      try {
        const res = await axios.delete(
          `${baseURL}/auth/api/re_calculator/deleteAdsCampaignEntryById/${itemId}`
        );
        const result = res.data;
        if (result.status === "Success") {
          setAdsItems((prev) => prev.filter((item) => item.id !== itemId));
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Entry has been deleted.",
            timer: 1000,
            showConfirmButton: false,
          });
        }
      } catch (error) {
        console.error("Error deleting entry:", error);
      }
    }
  };

  const handleEdit = (item) => {
    const cat = item.category || item.category_name;
    const amt = item.amount || item.budget;
    setEnteredAmount({ [cat]: amt });
    setEditingId(item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetEditingState = () => {
    setEditingId(null);
    setEnteredAmount({});
    setError("");
  };

  const handleCalculateAndSave = async () => {
    setLoading(true);
    setError("");

    try {
      if (!adsData || adsData.length === 0) {
        setError("No ads data available");
        setLoading(false);
        return;
      }

      const results = [];
      let hasError = false;

      Object.entries(enteredAmount).forEach(([category, amountValue]) => {
        if (!amountValue || amountValue.toString().trim() === "") return;

        const amount = validateAmount(amountValue);
        if (!amount) {
          setError(`Invalid amount entered for ${category}`);
          hasError = true;
          return;
        }

        const matched = adsData
          .filter((ad) => ad.ads_category === category)
          .find((range) => {
            const start = parseInt(range.amt_range_start);
            const end =
              range.amt_range_end === "Above"
                ? Infinity
                : parseInt(range.amt_range_end);

            if (isNaN(start)) return false;
            if (range.amt_range_end !== "Above" && isNaN(end)) return false;

            return amount >= start && amount <= end;
          });

        if (matched) {
          const percent = parseFloat(matched.percentage);
          if (isNaN(percent)) {
            setError(`Invalid percentage for ${category}`);
            hasError = true;
            return;
          }

          const charge = roundCurrency((amount * percent) / 100);
          const total = roundCurrency(amount + charge);

          const existingItem = (editingId && getData.find(item => String(item.id) === String(editingId)))
            || adsItems.find(item => item.category === category)
            || getData.find(item => (item.category || item.category_name) === category);
          
          results.push({
            txn_id: proposalId,
            client_id: id,
            id: existingItem ? existingItem.id : generateUniqueId(),
            category: category,
            amount: roundCurrency(amount),
            percent,
            charge,
            total,
            employee: userName,
          });
        } else {
          setError(
            `No matching range found for ${category} with amount ₹${amount}`
          );
          hasError = true;
        }
      });

      if (hasError) {
        setLoading(false);
        return;
      }

      if (results.length > 0) {
        if (onServiceAdded) {
          results.forEach(newRecord => {
            onServiceAdded({
              id: newRecord.id,
              service_name: 'Ads Campaign',
              category_name: newRecord.category,
              quantity: 1,
              unit_price: newRecord.total,
              total_price: newRecord.total,
              total_amount: newRecord.total,
              include_in_total: true,
              source: 'custom_ads',
              budget: newRecord.amount,
              percent: newRecord.percent,
              charge: newRecord.charge,
            });
          });
          Swal.fire({
            icon: "success",
            title: "Saved!",
            text: "Ads campaign items updated in proposal.",
            showConfirmButton: false,
            timer: 1200,
          });
          resetForm();
          setLoading(false);
          return;
        }

        let response;
        if (docTypeFromURL === "proforma") {
          const proformaItems = results.map(newRecord => ({
            id: newRecord.id,
            service_name: 'Ads Campaign',
            category_name: newRecord.category,
            category: newRecord.category,
            quantity: 1,
            unit_price: newRecord.total,
            total_price: newRecord.total,
            total_amount: newRecord.total,
            total: newRecord.total,
            include_in_total: true,
            source: 'custom_ads',
            budget: newRecord.amount,
            amount: newRecord.amount,
            percent: newRecord.percent,
            charge: newRecord.charge,
          }));

          // If editingId set OR agar category already DB mein hai → update action
          const singleCategory = proformaItems[0]?.category_name || proformaItems[0]?.category;
          const existingInDb = getData.find(d => (d.category || d.category_name) === singleCategory);
          const updateTargetId = editingId || existingInDb?.id;

          if (updateTargetId && proformaItems.length === 1) {
            response = await fetch(
              `${API_BASE_URL}/auth/api/re_calculator/proformas/snapshot`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  proformaId: proposalId,
                  action: "update",
                  editId: String(updateTargetId),
                  item: proformaItems[0],
                  snapshotType: 'ads',
                }),
              }
            );
          } else {
            response = await fetch(
              `${API_BASE_URL}/auth/api/re_calculator/proformas/snapshot`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  proformaId: proposalId,
                  action: "addBulk",
                  item: proformaItems,
                  snapshotType: 'ads',
                }),
              }
            );
          }
        } else if (isQuotationMode) {
          const kept = (getData || []).filter((row) => {
            const cat = row.category || row.category_name;
            return !results.some((r) => r.category === cat);
          });
          const ads = [...kept, ...results].map((row) => ({
            category_name: row.category || row.category_name,
            budget: row.amount || row.budget || 0,
            percent: row.percent || 0,
            charge: row.charge || 0,
            total: row.total || 0,
          }));
          response = await fetch(
            `${API_BASE_URL}/auth/api/re_calculator/quotation/${proposalId}/ads`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ ads }),
            }
          );
        } else {
          response = await fetch(
            `${API_BASE_URL}/auth/api/re_calculator/saveAdsCampaign`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ adsItems: results }),
            }
          );
        }

        const result = await response.json();
        if (result.status === "Success") {
          fetchData();
          if (onSaveComplete) onSaveComplete();
          Swal.fire({
            icon: "success",
            title: editingId ? "Updated!" : "Saved!",
            text: editingId ? "Ads campaign entry updated!" : "Ads campaign saved successfully!",
            showConfirmButton: false,
            timer: 1000,
          });
          resetEditingState();
        } else {
          Swal.fire({
            icon: "error",
            title: "Failed!",
            text: "Failed to save Ads Campaign: " + result.message,
            showConfirmButton: true,
          });
        }
      } else {
        setError("No valid data to save.");
      }
    } catch (err) {
      setError("An error occurred during calculation or saving.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (!id || !proposalId) return;
    try {
      let endpoint = `${baseURL}/auth/api/re_calculator/getByIDAdsCampaignDetails/${proposalId}/${id}`;
      if (isQuotationMode) {
        endpoint = `${baseURL}/auth/api/re_calculator/quotation/${proposalId}`;
      } else if (docTypeFromURL === "proforma") {
        endpoint = `${baseURL}/auth/api/re_calculator/proformas/snapshot/${proposalId}`;
      }
      const res = await axios.get(endpoint, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.data.status === "Success") {
        if (isQuotationMode) {
          const ads = res.data.data?.ads || [];
          setGetData(
            ads.map((item) => ({
              ...item,
              category: item.category || item.category_name,
              amount: item.amount || item.budget,
              total: item.total || item.total_amount || item.budget,
            }))
          );
        } else if (docTypeFromURL === "proforma") {
          // Ads data is now stored in the dedicated ads_snapshot column
          const parsed = JSON.parse(res.data.data.ads_snapshot || "[]");
          const normalized = parsed.map(item => ({
            ...item,
            category: item.category || item.category_name,
            amount: item.amount || item.budget,
            total: item.total || item.total_amount || item.total_price,
          }));
          setGetData(normalized);
        } else {
          setGetData(res.data.data);
        }
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        Swal.fire({
          title: "Session Expired",
          text: "Please login again.",
          icon: "warning",
          confirmButtonText: "OK",
        }).then(() => {
          dispatch(clearUser());
          localStorage.removeItem("token");
          navigate("/");
        });
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, proposalId]);

  const handleDelete = async (entryId) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this entry?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    try {
      let res;
      if (docTypeFromURL === "proforma") {
        res = await axios.put(
          `${baseURL}/auth/api/re_calculator/proformas/snapshot`,
          {
            proformaId: proposalId,
            action: "delete",
            entryId: entryId,
            snapshotType: 'ads',
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        res = await axios.delete(
          `${baseURL}/auth/api/re_calculator/deleteAdsCampaignEntryById/${entryId}`
        );
      }

      const result = res.data;

      if (result.status === "Success") {
        setGetData((prev) => prev.filter((item) => String(item.id) !== String(entryId)));

        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Entry has been deleted.",
          timer: 1000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: result.message || "Failed to delete entry.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while deleting entry.",
      });
    }
  };

  const categories = [...new Set(adsData.map((item) => item.ads_category))].filter(Boolean);
  const totalAdsCost = adsItems.reduce((sum, item) => sum + item.total, 0);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      const base = getBasePathFromLocation(location);
      const fallbackUrl =
        docTypeFromURL === "proforma"
          ? servicesLandingPath(base, id, proposalId, "doc=proforma")
          : servicesLandingPath(base, id, proposalId);
      navigate(fallbackUrl);
    }
  };

  return (
    <>
      <div className={onServiceAdded ? "glass-calculator-container is-embedded" : "glass-calculator-container"}>
        {!onServiceAdded && (
          <>
        <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-rose-400/25 to-pink-300/20 dark:from-rose-600/10 dark:to-pink-600/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-bl from-amber-400/25 to-orange-300/20 dark:from-amber-600/10 dark:to-orange-600/10 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] rounded-full bg-gradient-to-r from-sky-400/15 to-indigo-300/15 dark:from-sky-600/10 dark:to-indigo-600/10 blur-3xl" />
          </>
        )}

        <div className={onServiceAdded ? "glass-calculator-card space-y-5" : "glass-calculator-card space-y-8"}>
          {!onServiceAdded && (
          <div className="relative flex items-center justify-center min-h-[44px]">
            {!onServiceAdded && (
              <button
                type="button"
                onClick={handleBack}
                className="glass-calculator-back absolute left-0"
                title="Go Back"
              >
                <ArrowLeft className="w-4 h-4 text-slate-700 dark:text-gray-300" />
                <span className="text-sm font-semibold hidden sm:inline">Back</span>
              </button>
            )}
            <h3 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 dark:text-white">
              Ads Campaign Budget Calculator
            </h3>
          </div>
          )}

          {loading && (
            <div className="p-4 rounded-xl bg-red-500/10 text-red-600 dark:text-red-300 border border-red-500/30 backdrop-blur-md">
              <div className="flex items-center gap-2 font-medium">
                <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full"></div>
                Loading ads data...
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 text-red-600 dark:text-red-300 border border-red-500/30 backdrop-blur-md">
              <strong>Error:</strong> {error}
            </div>
          )}

          {!loading && adsData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                  Enter Budget Amounts
                </h4>
                {editingId && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 border border-amber-400/50 text-amber-800 dark:text-amber-300 flex items-center gap-1.5 shadow-sm">
                    ✏️ Editing existing entry
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {categories.map((category) => {
                  const isThisEditing = editingId && (
                    (enteredAmount[category] !== undefined && enteredAmount[category] !== "") ||
                    (getData.find(d => String(d.id) === String(editingId))?.category === category)
                  );
                  return (
                    <div
                      key={category}
                      className={`glass-calculator-row flex flex-col items-stretch gap-2 ${
                        isThisEditing ? 'is-editing' : ''
                      }`}
                    >
                      <label className="font-semibold text-slate-900 dark:text-white text-base flex items-center justify-between w-full">
                        <span>{category}</span>
                        {isThisEditing && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400/40">
                            Editing
                          </span>
                        )}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Enter Amount (₹)"
                        value={enteredAmount[category] || ""}
                        onChange={(e) =>
                          handleAmountChange(category, e.target.value)
                        }
                        className="w-full min-h-11 px-4 py-2.5 rounded-xl border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 focus:bg-white text-base font-medium shadow-inner transition-all touch-manipulation"
                        autoFocus={Boolean(isThisEditing)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && adsData.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={handleCalculateAndSave}
                disabled={loading || Object.keys(enteredAmount).length === 0}
                className={`min-h-11 flex-1 px-5 py-3 rounded-xl font-bold transition-all shadow-md touch-manipulation ${
                  (loading || Object.keys(enteredAmount).length === 0)
                    ? "bg-slate-200/80 dark:bg-gray-800 text-slate-400 dark:text-gray-500 border border-slate-300/60 dark:border-transparent cursor-not-allowed"
                    : editingId
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {loading ? "Saving..." : editingId ? "Update entry" : isQuotationMode ? "Save Quotation" : "Calculate & Save"}
              </button>
              {(editingId || Object.keys(enteredAmount).length > 0) && (
                <button
                  type="button"
                  onClick={editingId ? resetEditingState : clearAll}
                  className="min-h-11 px-4 py-3 rounded-xl border border-slate-300 dark:border-white/15 text-slate-700 dark:text-gray-200 font-semibold touch-manipulation"
                >
                  {editingId ? "Cancel" : "Clear"}
                </button>
              )}
            </div>
          )}

          {adsItems.length > 0 && (
            <div className="space-y-4 pt-2">
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                📋 Budget Breakdown
              </h4>
              <div className="space-y-3">
                {adsItems.map((item) => (
                  <div
                    key={item.id}
                    className="glass-calculator-row p-4 rounded-2xl"
                  >
                    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-between sm:items-center gap-2">
                      <h5 className="text-base font-bold text-red-600 dark:text-red-400">
                        {item.category}
                      </h5>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        💼 Budget: <strong className="font-bold text-slate-950 dark:text-white">₹{item.amount.toLocaleString()}</strong>
                      </p>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        📊 Charge ({item.percent}%): <strong className="font-bold text-slate-950 dark:text-white">₹{item.charge.toLocaleString()}</strong>
                      </p>
                      <p className="text-sm font-bold text-emerald-600 dark:text-green-300">
                        🧾 Total: ₹{item.total.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="min-h-11 px-3 rounded-lg bg-blue-600 text-white text-sm font-semibold touch-manipulation"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="min-h-11 px-3 rounded-lg bg-red-600 text-white text-sm font-semibold touch-manipulation"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adsItems.length > 0 && (
            <div className="glass-calculator-total-card">
              <h4 className="text-base font-bold text-emerald-800 dark:text-emerald-300 mb-1 flex items-center justify-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Total Ads Budget
              </h4>
              <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                ₹{totalAdsCost.toLocaleString()}
              </p>
            </div>
          )}

          {getData.length > 0 && (
            <div className="mt-8 space-y-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                🧾 Previously Saved Campaigns
              </h3>
              <div className="space-y-3">
                {getData.map((item, index) => {
                  const isEditingThis = editingId && String(editingId) === String(item.id);
                  return (
                    <div
                      key={item.id || index}
                      className={`p-4 rounded-2xl border transition-all ${
                        isEditingThis
                          ? 'bg-amber-500/15 border-amber-400/50 shadow-md shadow-amber-500/10'
                          : 'glass-calculator-saved-card'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-between sm:items-center gap-2">
                        <p className="font-bold text-slate-900 dark:text-white text-base">
                          {item.category}
                        </p>
                        <p className="text-slate-800 dark:text-slate-200 text-sm font-medium">
                          💰 Budget: <strong className="font-bold text-slate-950 dark:text-white">₹{parseFloat(item.amount || 0).toLocaleString()}</strong>
                        </p>
                        <p className="text-slate-800 dark:text-slate-200 text-sm font-medium">
                          📊 Charge: <strong className="font-bold text-slate-950 dark:text-white">₹{parseFloat(item.charge || 0).toLocaleString()}</strong> ({item.percent}%)
                        </p>
                        <p className="text-slate-900 dark:text-white text-sm font-bold">
                          🧾 Total: ₹{parseFloat(item.total || 0).toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2">
                          {docTypeFromURL === "proforma" && (
                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
                              className={`min-h-11 px-3 rounded-lg text-white text-sm font-semibold touch-manipulation ${isEditingThis ? "bg-amber-500" : "bg-blue-600"}`}
                            >
                              Edit
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="min-h-11 px-3 rounded-lg bg-red-600 text-white text-sm font-semibold touch-manipulation"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdsCampaignCalculator;
