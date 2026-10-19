import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../redux/user/userSlice";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Megaphone, Sparkles, Trash2, Wallet, Layers } from "lucide-react";
import API_BASE_URL from "../config/apiBaseUrl";

const InvoiceAds = () => {
   const baseURL = API_BASE_URL;
const { id, proposalId } = useParams();
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
  console.log(adsItems);
  console.log(id, proposalId);

  // Fetch ads data from API
  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${API_BASE_URL}/auth/api/re_calculator/getAdsServices`,
          // "https://revenueengine.siarasystems.com/auth/api/re_calculator/getAdsServices",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.status === "Success" && response.data.data) {
          setAdsData(response.data.data);
          console.log("Ads data loaded:", response.data.data);
        } else {
          setError("Failed to load ads data");
        }
      } catch (error) {
        console.error("Error fetching ads data:", error);
        setError("Failed to load ads data from server");
        if (error.response && error.response.status === 401) {
          // Token is invalid or expired
          Swal.fire({
            title: "Session Expired",
            text: "Please login again.",
            icon: "warning",
            showConfirmButton: false,
            timer: 1000,
            // timerProgressBar: true,
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
  }, []);
  // useEffect(() => {
  //   const fetchAds = async () => {
  //     try {
  //       setLoading(true);
  //       const response = await fetch(
  //         `https://revenueengine.siarasystems.com/auth/api/re_calculator/getAdsServices`
  //       );
  //       const data = await response.json();

  //       if (data.status === "Success" && data.data) {
  //         setAdsData(data.data);
  //         console.log("Ads data loaded:", data.data);
  //       } else {
  //         setError("Failed to load ads data");
  //       }
  //     } catch (error) {
  //       console.error("Error fetching ads data:", error);
  //       setError("Failed to load ads data from server");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchAds();
  // }, []);

  // Generate unique ID
  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Round to 2 decimal places for currency
  const roundCurrency = (amount) => {
    return Math.round(amount * 100) / 100;
  };

  // Validate input amount
  const validateAmount = (value) => {
    const amount = parseFloat(value);
    return !isNaN(amount) && amount > 0 ? amount : null;
  };

  //   const calculateAllAdsCost = () => {
  //     setLoading(true);
  //     setError("");

  //     try {
  //       // Validate adsData exists
  //       if (!adsData || adsData.length === 0) {
  //         setError("No ads data available");
  //         setLoading(false);
  //         return;
  //       }

  //       const results = [];

  //       Object.entries(enteredAmount).forEach(([category, amountValue]) => {
  //         // Skip empty or invalid amounts
  //         if (!amountValue || amountValue.trim() === "") return;

  //         const amount = validateAmount(amountValue);
  //         if (!amount) {
  //           setError(`Invalid amount entered for ${category}`);
  //           return;
  //         }

  //         // Find matching range for the category
  //         const matched = adsData
  //           .filter((ad) => ad.ads_category === category)
  //           .find((range) => {
  //             const start = parseInt(range.amt_range_start);
  //             const end =
  //               range.amt_range_end === "Above"
  //                 ? Infinity
  //                 : parseInt(range.amt_range_end);

  //             // Validate range values
  //             if (isNaN(start)) return false;
  //             if (range.amt_range_end !== "Above" && isNaN(end)) return false;

  //             return amount >= start && amount <= end;
  //           });

  //         if (matched) {
  //           const percent = parseFloat(matched.percentage);
  //           if (isNaN(percent)) {
  //             setError(`Invalid percentage for ${category}`);
  //             return;
  //           }

  //           const charge = roundCurrency((amount * percent) / 100);
  //           const total = roundCurrency(amount + charge);

  //           results.push({
  //             id: generateUniqueId(),
  //             category,
  //             amount: roundCurrency(amount),
  //             percent,
  //             charge,
  //             total,
  //           });
  //         } else {
  //           setError(
  //             `No matching range found for ${category} with amount ₹${amount}`
  //           );
  //         }
  //       });

  //       setAdsItems(results);
  //     } catch (err) {
  //       setError("An error occurred while calculating ads budget");
  //       console.error("Calculation error:", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  // Handle input change with validation
  const handleAmountChange = (category, value) => {
    setError(""); // Clear previous errors
    setEnteredAmount((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  // Clear all data
  const clearAll = () => {
    setEnteredAmount({});
    setAdsItems([]);
    setError("");
  };

  // Remove specific item
  const removeItem = (itemId) => {
    setAdsItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  // Calculate total
  const totalAdsCost = adsItems.reduce((acc, item) => acc + item.total, 0);

  // Get unique categories
  const categories = [...new Set(adsData.map((item) => item.ads_category))];

  //   Get save Details
  //   const handleSaveToDatabase = async () => {
  //   try {
  //     const response = await fetch("https://revenueengine.siarasystems.com/auth/api/re_calculator/saveAdsCampaign", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ adsItems }),
  //     });

  //     const result = await response.json();
  //     if (result.status === "Success") {
  //       alert("Ads campaign saved successfully!");
  //     } else {
  //       alert("Failed to save: " + result.message);
  //     }
  //   } catch (error) {
  //     console.error("Save error:", error);
  //     alert("An error occurred while saving the campaign.");
  //   }
  // };

  const handleCalculateAndSave = async () => {
    setLoading(true);
    setError("");

    const results = [];

    try {
      if (!adsData || adsData.length === 0) {
        setError("No ads data available");
        setLoading(false);
        return;
      }

      Object.entries(enteredAmount).forEach(([category, amountValue]) => {
        if (!amountValue || amountValue.trim() === "") return;

        const amount = validateAmount(amountValue);
        if (!amount) {
          setError(`Invalid amount entered for ${category}`);
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
            return;
          }

          const charge = roundCurrency((amount * percent) / 100);
          const total = roundCurrency(amount + charge);

          results.push({
            txn_id: proposalId,
            client_id: id,
            id: generateUniqueId(),
            category,
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
        }
      });

      if (results.length > 0) {
        setAdsItems(results); // update state

        // --- Save Ads Campaign only (Quotation) ---
        const response = await fetch(
          `${API_BASE_URL}/auth/api/re_calculator/saveAdsCampaign`,
          // "https://revenueengine.siarasystems.com/auth/api/re_calculator/saveAdsCampaign",
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
          Swal.fire({
            icon: "success",
            title: "Success!",
            text: "Ads campaign saved successfully!",
            showConfirmButton: false,
            timer: 1000,
            // timerProgressBar: true,
          });
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
        `${baseURL}/auth/api/re_calculator/getInvoiceAdsCampaign/${proposalId}/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data.status === "Success") {
        console.log(res.data);
        setGetData(res.data.data);
      }
    } catch (error) {
      console.log(error);
      if (error.response && error.response.status === 401) {
        // Token is invalid or expired
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

  console.log(getData);

  const handleDelete = async (entryId) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this entry?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48", // red
      cancelButtonColor: "#6b7280", // gray
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await axios.delete(
        `${baseURL}/auth/api/re_calculator/deleteInvoiceAdsCampaignEntryById/${entryId}`
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
      console.error("Error deleting entry:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while deleting entry.",
      });
    }
  };

  return (
    <>
      <div className="glass-calculator-container">
        {/* Ambient background glows for realistic glass refraction */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-rose-400/25 to-pink-300/20 dark:from-rose-600/10 dark:to-pink-600/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-bl from-amber-400/25 to-orange-300/20 dark:from-amber-600/10 dark:to-orange-600/10 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] rounded-full bg-gradient-to-r from-sky-400/15 to-indigo-300/15 dark:from-sky-600/10 dark:to-indigo-600/10 blur-3xl" />

        <div className="glass-calculator-card space-y-8">
          <div className="relative flex items-center justify-center min-h-[44px]">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="glass-calculator-back absolute left-0"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-gray-300" />
              <span className="text-sm font-semibold hidden sm:inline">Back</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-red-500/25">
                <Megaphone className="w-5 h-5" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Ads Campaign Budget Calculator
              </h3>
            </div>
          </div>

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
              <h4 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Enter Budget Amounts
              </h4>
              <div className="space-y-3">
                {categories.map((category) => (
                  <div
                    key={category}
                    className="glass-calculator-row flex flex-col sm:flex-row items-center gap-4"
                  >
                    <label className="sm:w-56 font-semibold text-slate-800 dark:text-white text-base flex items-center justify-between w-full">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500/80"></span>
                        {category}
                      </span>
                    </label>
                    <div className="relative w-full">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-semibold text-sm">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Enter Amount"
                        value={enteredAmount[category] || ""}
                        onChange={(e) =>
                          handleAmountChange(category, e.target.value)
                        }
                        className="glass-calculator-input pl-8"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && adsData.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleCalculateAndSave}
                disabled={loading || Object.keys(enteredAmount).length === 0}
                className={`px-7 py-3 rounded-xl font-bold transition-all shadow-md flex items-center gap-2 ${
                  (loading || Object.keys(enteredAmount).length === 0)
                    ? "bg-slate-200/80 dark:bg-gray-800 text-slate-400 dark:text-gray-500 border border-slate-300/60 dark:border-transparent cursor-not-allowed"
                    : "bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:via-rose-500 hover:to-red-500 text-white shadow-red-500/25 hover:shadow-red-500/40 hover:-translate-y-0.5 active:translate-y-0"
                }`}
              >
                <Wallet className="w-4 h-4" />
                {loading ? "Calculating..." : "Calculate & Save"}
              </button>
              <button
                onClick={clearAll}
                className="glass-calculator-btn-secondary"
              >
                Clear All
              </button>
            </div>
          )}

          {adsItems.length > 0 && (
            <div className="space-y-4 pt-2">
              <h4 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-red-500" />
                Budget Breakdown
              </h4>
              <div className="space-y-3">
                {adsItems.map((item) => (
                  <div
                    key={item.id}
                    className="glass-calculator-saved-card"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                        <h5 className="text-base font-bold text-slate-900 dark:text-white">
                          {item.category}
                        </h5>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="px-3 py-1 rounded-lg bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300">
                          Budget: <strong className="text-slate-900 dark:text-white font-bold">₹{item.amount.toLocaleString()}</strong>
                        </span>
                        <span className="px-3 py-1 rounded-lg bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300">
                          Charge ({item.percent}%): <strong className="text-slate-900 dark:text-white font-bold">₹{item.charge.toLocaleString()}</strong>
                        </span>
                        <span className="px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-300 font-bold">
                          Total: ₹{item.total.toLocaleString()}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-500/20 hover:scale-105 active:scale-95 transition-all text-lg leading-none ml-auto sm:ml-2"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-red-500" />
                Previously Saved Campaigns
              </h3>
              <div className="space-y-3">
                {getData.map((item, index) => (
                  <div
                    key={index}
                    className="glass-calculator-saved-card"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded-xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400">
                          <Megaphone className="w-4 h-4" />
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white text-base">
                          {item.category}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm">
                        <span className="px-3 py-1.5 rounded-lg bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 font-medium">
                          💼 Budget: <strong className="text-slate-900 dark:text-white font-bold">₹{parseFloat(item.amount).toLocaleString()}</strong>
                        </span>
                        <span className="px-3 py-1.5 rounded-lg bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 font-medium">
                          📊 Charge: <strong className="text-slate-900 dark:text-white font-bold">₹{parseFloat(item.charge).toLocaleString()}</strong> ({item.percent}%)
                        </span>
                        <span className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-300 font-bold">
                          🧾 Total: ₹{parseFloat(item.total).toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md shadow-red-500/25 hover:scale-105 active:scale-95 transition-all text-lg font-bold ml-auto sm:ml-2"
                          title="Delete this entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  // return (
  //   <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
  //     <div className="bg-white p-6 rounded-lg shadow-lg">
  //       <h3 className="text-3xl font-bold mb-6 text-center text-red-600">
  //         📢 Ads Campaign Budget Calculator
  //       </h3>

  //       {/* Loading State */}
  //       {loading && (
  //         <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
  //           <div className="flex items-center">
  //             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-700 mr-2"></div>
  //             Loading ads data...
  //           </div>
  //         </div>
  //       )}

  //       {/* Error Display */}
  //       {error && (
  //         <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
  //           <strong>Error:</strong> {error}
  //         </div>
  //       )}

  //       {/* Input Section */}
  //       {!loading && adsData.length > 0 && (
  //         <div className="space-y-4 mb-6">
  //           <h4 className="text-xl font-semibold mb-4">Enter Budget Amounts</h4>
  //           {categories.map((category) => (
  //             <div
  //               key={category}
  //               className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gray-50 rounded"
  //             >
  //               <label className="sm:w-48 font-medium text-gray-700">
  //                 {category}
  //               </label>
  //               <div className="flex-1">
  //                 <input
  //                   type="number"
  //                   min="0"
  //                   step="0.01"
  //                   placeholder="Enter Budget Amount (₹)"
  //                   value={enteredAmount[category] || ""}
  //                   onChange={(e) =>
  //                     handleAmountChange(category, e.target.value)
  //                   }
  //                   className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-red-500"
  //                 />
  //               </div>
  //             </div>
  //           ))}
  //         </div>
  //       )}

  //       {/* Action Buttons */}
  //       {!loading && adsData.length > 0 && (
  //         <div className="flex gap-4 mb-6">
  //           <button
  //             onClick={handleCalculateAndSave}
  //             disabled={loading || Object.keys(enteredAmount).length === 0}
  //             className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
  //           >
  //             {loading ? "Calculating..." : "Calculate Ads Budget"}
  //           </button>
  //           <button
  //             onClick={clearAll}
  //             className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
  //           >
  //             Clear All
  //           </button>
  //         </div>
  //       )}

  //       {/* Results Section */}
  //       {adsItems.length > 0 && (
  //         <div className="mt-8 border-t pt-6">
  //           <h4 className="text-xl font-semibold mb-4">Budget Breakdown</h4>
  //           <div className="grid gap-4">
  //             {adsItems.map((item) => (
  //               <div
  //                 key={item.id}
  //                 className="bg-gradient-to-r from-red-50 to-green-50 p-4 rounded-lg border"
  //               >
  //                 <div className="flex justify-between items-start">
  //                   <div className="flex-1">
  //                     <p className="text-lg font-semibold text-red-700 mb-2">
  //                       📢 {item.category}
  //                     </p>
  //                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
  //                       <p>
  //                         💼 Budget:{" "}
  //                         <span className="font-medium">
  //                           ₹{item.amount.toLocaleString()}
  //                         </span>
  //                       </p>
  //                       <p>
  //                         📊 Charge ({item.percent}%):{" "}
  //                         <span className="font-medium">
  //                           ₹{item.charge.toLocaleString()}
  //                         </span>
  //                       </p>
  //                       <p className="font-bold text-green-700">
  //                         🧾 Total: ₹{item.total.toLocaleString()}
  //                       </p>
  //                     </div>
  //                   </div>
  //                   <button
  //                     onClick={() => removeItem(item.id)}
  //                     className="ml-4 text-red-500 hover:text-red-700 text-xl"
  //                     title="Remove this item"
  //                   >
  //                     ×
  //                   </button>
  //                 </div>
  //               </div>
  //             ))}
  //           </div>
  //         </div>
  //       )}

  //       {/* Total Section */}
  //       {adsItems.length > 0 && (
  //         <div className="mt-8 border-t pt-6">
  //           <div className="bg-green-100 p-6 rounded-lg text-center">
  //             <h4 className="text-2xl font-bold text-green-800 mb-2">
  //               💰 Total Ads Budget
  //             </h4>
  //             <p className="text-4xl font-bold text-green-600">
  //               ₹{totalAdsCost.toLocaleString()}
  //             </p>
  //           </div>
  //         </div>
  //       )}

  //       {/* No Results Message */}
  //       {!loading &&
  //         adsItems.length === 0 &&
  //         Object.keys(enteredAmount).length > 0 && (
  //           <div className="mt-8 text-center text-gray-500">
  //             <p>
  //               Enter amounts and click "Calculate Ads Budget" to see results.
  //             </p>
  //           </div>
  //         )}
  //     </div>
  //   </div>
  // );
};

export default InvoiceAds;
