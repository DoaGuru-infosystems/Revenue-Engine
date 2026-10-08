import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../redux/user/userSlice";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
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
                    <div>
                      <h5 className="text-lg font-semibold text-red-300 mb-2">
                        📢 {item.category}
                      </h5>
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
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-400 hover:text-red-600 text-xl"
                    >
                      ×
                    </button>
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

          {!loading &&
            adsItems.length === 0 &&
            Object.keys(enteredAmount).length > 0 && (
              <div className="text-center text-gray-400">
                Enter amounts and click "Calculate & Save" to see results.
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
                    {/* <p className="text-sm text-white/60">
                      🕒 {new Date(item.created_at).toLocaleString("en-IN")}
                    </p> */}
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
