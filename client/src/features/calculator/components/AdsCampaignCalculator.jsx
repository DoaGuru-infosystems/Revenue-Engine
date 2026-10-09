import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../../../redux/user/userSlice";
import axios from "axios";
import Swal from "sweetalert2";
import { ArrowLeft } from "lucide-react";
import API_BASE_URL from "../../../config/apiBaseUrl";

const AdsCampaignCalculator = ({
  hideNotes,
  onSaveComplete,
  proposalIdOverride,
  onServiceAdded,
  onServiceDeleted,
  embeddedData,
}) => {
  const baseURL = API_BASE_URL;
  const params = useParams();
  const location = useLocation();
  const id = params.id || params.clientId;
  const proposalId = proposalIdOverride !== undefined ? proposalIdOverride : params.proposalId;
  const searchParams = new URLSearchParams(location.search);
  const docTypeFromURL = searchParams.get("doc");
  const { currentUser, token } = useSelector((state) => state.user);

  const userName = currentUser?.name;
  const [adsData, setAdsData] = useState([]);
  const [enteredAmount, setEnteredAmount] = useState({});
  const [adsItems, setAdsItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [getData, setGetData] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Sync embeddedData
  useEffect(() => {
    if (embeddedData) {
      setAdsItems(
        embeddedData.map((r) => ({
          id: r.id,
          category: r.category_name,
          amount: r.budget,
          percent: r.percent,
          charge: r.charge,
          total: r.total_price || r.total_amount,
        }))
      );
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
      } catch (err) {
        setError("Failed to load ads data from server");
        if (err.response && err.response.status === 401) {
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
      adsItems.forEach((item) => onServiceDeleted(item.id));
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
      } catch (err) {
        console.error("Error deleting entry:", err);
      }
    }
  };

  const handleEdit = (item) => {
    setEnteredAmount((prev) => ({
      ...prev,
      [item.category]: item.amount,
    }));
    if (docTypeFromURL === "proforma") {
      setEditingId(item.id);
    }
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

          const existingItem =
            adsItems.find((item) => item.category === category) ||
            getData.find((item) => (item.category || item.category_name) === category);

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
          setError(`No matching range found for ${category} with amount ₹${amount}`);
          hasError = true;
        }
      });

      if (hasError) {
        setLoading(false);
        return;
      }

      if (results.length > 0) {
        if (onServiceAdded) {
          results.forEach((newRecord) => {
            onServiceAdded({
              id: newRecord.id,
              service_name: "Ads Campaign",
              category_name: newRecord.category,
              quantity: 1,
              unit_price: newRecord.total,
              total_price: newRecord.total,
              total_amount: newRecord.total,
              include_in_total: true,
              source: "custom_ads",
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
          const proformaItems = results.map((newRecord) => ({
            id: newRecord.id,
            service_name: "Ads Campaign",
            category_name: newRecord.category,
            category: newRecord.category,
            quantity: 1,
            unit_price: newRecord.total,
            total_price: newRecord.total,
            total_amount: newRecord.total,
            total: newRecord.total,
            include_in_total: true,
            source: "custom_ads",
            budget: newRecord.amount,
            amount: newRecord.amount,
            percent: newRecord.percent,
            charge: newRecord.charge,
          }));

          const singleCategory =
            proformaItems[0]?.category_name || proformaItems[0]?.category;
          const existingInDb = getData.find(
            (d) => (d.category || d.category_name) === singleCategory
          );
          const updateTargetId = editingId || existingInDb?.id;

          if (updateTargetId && proformaItems.length === 1) {
            response = await fetch(
              `${API_BASE_URL}/auth/api/re_calculator/proformas/snapshot`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  proformaId: proposalId,
                  action: "update",
                  editId: String(updateTargetId),
                  item: proformaItems[0],
                  snapshotType: "ads",
                }),
              }
            );
          } else {
            response = await fetch(
              `${API_BASE_URL}/auth/api/re_calculator/proformas/snapshot`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  proformaId: proposalId,
                  action: "addBulk",
                  item: proformaItems,
                  snapshotType: "ads",
                }),
              }
            );
          }
        } else {
          response = await fetch(`${API_BASE_URL}/auth/api/re_calculator/saveAdsCampaign`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ adsItems: results }),
          });
        }

        const result = await response.json();
        if (result.status === "Success") {
          fetchData();
          if (onSaveComplete) onSaveComplete();
          Swal.fire({
            icon: "success",
            title: editingId ? "Updated!" : "Saved!",
            text: editingId
              ? "Ads campaign entry updated!"
              : "Ads campaign saved successfully!",
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
      if (docTypeFromURL === "proforma") {
        endpoint = `${baseURL}/auth/api/re_calculator/proformas/snapshot/${proposalId}`;
      }
      const res = await axios.get(endpoint, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.data.status === "Success") {
        if (docTypeFromURL === "proforma") {
          const parsed = JSON.parse(res.data.data.ads_snapshot || "[]");
          const normalized = parsed.map((item) => ({
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
    } catch (err) {
      if (err.response && err.response.status === 401) {
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
            snapshotType: "ads",
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
    } catch (err) {
      console.error(err);
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
      const isBd = location.pathname.startsWith("/BD");
      const basePath = isBd ? "/BD" : "/admin";
      const servicesLandingPath = isBd ? "AddService" : "ServicesLanding";
      const fallbackUrl =
        docTypeFromURL === "proforma"
          ? `${basePath}/${servicesLandingPath}/${id}/${proposalId}?doc=proforma`
          : `${basePath}/${servicesLandingPath}/${id}/${proposalId}`;
      navigate(fallbackUrl);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 space-y-8 text-white">
          <div className="relative flex items-center justify-center">
            {!onServiceAdded && (
              <button
                type="button"
                onClick={handleBack}
                className="absolute left-0 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center gap-2 transition-all hover:scale-105 shadow-sm"
                title="Go Back"
              >
                <ArrowLeft className="w-4 h-4 text-gray-200" />
                <span className="text-sm font-medium hidden sm:inline">Back</span>
              </button>
            )}
            <h3 className="text-2xl sm:text-3xl font-bold text-center text-white">
              📢 Ads Campaign Budget Calculator
            </h3>
          </div>

          {loading && (
            <div className="p-4 rounded-lg bg-red-600/20 text-red-300 border border-red-500">
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-t-white rounded-full"></div>
                Loading ads data...
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-red-600/20 text-red-300 border border-red-500">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Form */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-200 border-b pb-2 border-white/20">
              Select Ads Categories & Enter Budget
            </h3>

            {categories.length === 0 && !loading && (
              <p className="text-gray-400">No categories found.</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.map((category) => (
                <div key={category} className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-300">
                    {category} Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={enteredAmount[category] || ""}
                    onChange={(e) => handleAmountChange(category, e.target.value)}
                    placeholder={`Enter ${category} budget`}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-white/20">
              <button
                type="button"
                onClick={clearAll}
                className="px-6 py-2.5 rounded-xl bg-gray-600 hover:bg-gray-700 text-white font-semibold transition"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={handleCalculateAndSave}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-lg transition"
              >
                {loading
                  ? "Processing..."
                  : editingId
                  ? "Update Campaign"
                  : "Calculate & Save"}
              </button>
            </div>
          </div>

          {/* Saved items list */}
          {getData.length > 0 && !onServiceAdded && (
            <div className="mt-8 space-y-4">
              <h4 className="text-xl font-bold text-white border-b pb-2 border-white/20">
                Saved Campaigns
              </h4>
              {getData.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-white/5 rounded-xl border border-white/10"
                >
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <p>
                      📢 <strong>{item.category}</strong>
                    </p>
                    <p>
                      💰 Budget: ₹{parseFloat(item.amount).toLocaleString()}
                    </p>
                    <p>
                      📊 Charge: ₹{parseFloat(item.charge).toLocaleString()} (
                      {item.percent}%)
                    </p>
                    <p>🧾 Total: ₹{parseFloat(item.total).toLocaleString()}</p>
                    <div className="flex items-center gap-2">
                      {docTypeFromURL === "proforma" && (
                        <button
                          onClick={() => handleEdit(item)}
                          className={`text-white text-sm rounded-full w-8 h-8 flex items-center justify-center transition ${
                            editingId && String(editingId) === String(item.id)
                              ? "bg-yellow-500 hover:bg-yellow-600"
                              : "bg-blue-600 hover:bg-blue-700"
                          }`}
                          title="Edit this entry"
                        >
                          ✏️
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="bg-red-600 hover:bg-red-700 text-white text-lg rounded-full w-8 h-8 flex items-center justify-center"
                        title="Delete this entry"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdsCampaignCalculator;
