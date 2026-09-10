import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../redux/user/userSlice";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/apiBaseUrl";

const AdsCampaignCalculator = ({ hideNotes, onSaveComplete, proposalIdOverride, onServiceAdded, onServiceDeleted, embeddedData }) => {
  const baseURL = API_BASE_URL;
  const params = useParams();
  const id = params.id || params.clientId;
  const proposalId = proposalIdOverride !== undefined ? proposalIdOverride : params.proposalId;
  const { currentUser, token } = useSelector((state) => state.user);

  const userName = currentUser?.name;
  const [adsData, setAdsData] = useState([]);
  const [enteredAmount, setEnteredAmount] = useState({});
  const [adsItems, setAdsItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [getData, setGetData] = useState([]);
  const navigate = useNavigate();
  const dispatch = useDispatch();

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
    setEnteredAmount((prev) => ({
      ...prev,
      [item.category]: item.amount,
    }));
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

          const existingItem = adsItems.find(item => item.category === category);
          
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

        const response = await fetch(
          `${API_BASE_URL}/auth/api/re_calculator/saveAdsCampaign`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ adsItems: results }),
          }
        );

        const result = await response.json();
        if (result.status === "Success") {
          fetchData();
          if (onSaveComplete) onSaveComplete();
          Swal.fire({
            icon: "success",
            title: "Success!",
            text: "Ads campaign saved successfully!",
            showConfirmButton: false,
            timer: 1000,
          });
          resetForm();
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
      const res = await axios.get(
        `${baseURL}/auth/api/re_calculator/getByIDAdsCampaignDetails/${proposalId}/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data.status === "Success") {
        setGetData(res.data.data);
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
      const res = await axios.delete(
        `${baseURL}/auth/api/re_calculator/deleteAdsCampaignEntryById/${entryId}`
      );

      const result = res.data;

      if (result.status === "Success") {
        setGetData((prev) => prev.filter((item) => item.id !== entryId));

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

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 space-y-8 text-white">
          <h3 className="text-3xl font-bold text-center text-white">
            📢 Ads Campaign Budget Calculator
          </h3>

          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition"
          >
            ← Go Back
          </button>

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

          {!loading && adsData.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-xl font-semibold">Enter Budget Amounts</h4>
              {categories.map((category) => (
                <div
                  key={category}
                  className="bg-white/10 backdrop-blur rounded-lg p-4 flex flex-col sm:flex-row items-center gap-4"
                >
                  <label className="sm:w-48 font-medium">{category}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter Amount (₹)"
                    value={enteredAmount[category] || ""}
                    onChange={(e) =>
                      handleAmountChange(category, e.target.value)
                    }
                    className="w-full px-4 py-2 rounded-lg border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                </div>
              ))}
            </div>
          )}

          {!loading && adsData.length > 0 && (
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleCalculateAndSave}
                disabled={loading || Object.keys(enteredAmount).length === 0}
                className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition disabled:bg-gray-400"
              >
                {loading ? "Calculating..." : "Calculate & Save"}
              </button>
              <button
                onClick={clearAll}
                className="px-6 py-3 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-semibold transition"
              >
                Clear All
              </button>
            </div>
          )}

          {adsItems.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-xl font-semibold">📋 Budget Breakdown</h4>
              {adsItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-gradient-to-r from-red-900/30 to-green-900/30 border border-white/10 p-4 rounded-lg"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="text-lg font-semibold text-red-300">
                          📢 {item.category}
                        </h5>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-400 hover:text-blue-600 transition"
                            title="Edit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-400 hover:text-red-600 transition text-xl leading-none"
                            title="Delete"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                        <p>
                          💼 Budget:{" "}
                          <span className="font-medium text-white">
                            ₹{item.amount.toLocaleString()}
                          </span>
                        </p>
                        <p>
                          📊 Charge ({item.percent}%):{" "}
                          <span className="font-medium text-white">
                            ₹{item.charge.toLocaleString()}
                          </span>
                        </p>
                        <p className="font-bold text-green-300">
                          🧾 Total: ₹{item.total.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {adsItems.length > 0 && (
            <div className="text-center bg-green-800/30 p-6 rounded-lg border border-green-600">
              <h4 className="text-xl font-bold text-green-300 mb-2">
                💰 Total Ads Budget
              </h4>
              <p className="text-4xl font-extrabold text-green-400">
                ₹{totalAdsCost.toLocaleString()}
              </p>
            </div>
          )}

          {getData.length > 0 && (
            <div className="mt-10 space-y-4">
              <h3 className="text-xl font-bold text-white">
                🧾 Previously Saved Campaigns
              </h3>
              {getData.map((item, index) => (
                <div
                  key={index}
                  className="p-4 bg-white/10 border border-white/10 rounded-xl text-white"
                >
                  <div className="flex flex-wrap justify-between">
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
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="bg-red-600 hover:bg-red-700 text-white text-lg rounded-full w-8 h-8 flex items-center justify-center"
                    >
                      ×
                    </button>
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
