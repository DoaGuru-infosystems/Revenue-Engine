import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminInvoice from "../Admin/AdminInvoice";
import API_BASE_URL from "../config/apiBaseUrl";
import img3 from "../assets/DOAGURU IT Solution.png";

export default function PublicInvoice() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const fetchPublicInvoice = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/api/re_calculator/public/invoice/${token}`);
        const result = await response.json();

        if (response.ok && result.status === "Success") {
          setData(result.data);
          setStatus(200);
        } else {
          setError(result.message || "Failed to load invoice");
          setStatus(response.status);
        }
      } catch (err) {
        console.error("Error fetching public invoice:", err);
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchPublicInvoice();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl font-semibold text-gray-600 animate-pulse">Loading Document...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full border border-gray-100">
          <img src={img3} alt="Doaguru" className="w-32 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {status === 404 ? "Document Not Found" : status === 403 ? "Access Denied" : "Error"}
          </h1>
          <p className="text-gray-600 mb-6">
            {status === 404 
              ? "The requested document does not exist." 
              : status === 403 
                ? "This link has expired or been revoked." 
                : error}
          </p>
          <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
            Please contact support or request a new link from your account manager.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <AdminInvoice 
        publicMode={true} 
        publicData={data} 
        publicToken={token} 
      />
    </div>
  );
}
