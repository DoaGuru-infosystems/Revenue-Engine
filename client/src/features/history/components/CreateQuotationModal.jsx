import React from "react";
import ClientSelectorModal from "../../../Components/ClientSelectorModal";
import { FileText } from "lucide-react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import API_BASE_URL from "../../../config/apiBaseUrl";

const CreateQuotationModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith("/BD") ? "/BD" : "/admin";
  const { currentUser, token } = useSelector((state) => state.user);

  const handleProceed = async (client) => {
    const res = await axios.post(
      `${API_BASE_URL}/auth/api/re_calculator/quotation`,
      { client_id: client.id, created_by: currentUser?.name || "Admin" },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.data.status === "Success") {
      const quotationId = res.data.quotationId;
      onClose();
      navigate(`${basePath}/ServicesLanding/${client.id}/${quotationId}?mode=quotation`, {
        state: { mode: "quotation", quotationId },
      });
    } else {
      throw new Error(res.data.message || "Failed to create quotation");
    }
  };

  return (
    <ClientSelectorModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Quotation"
      icon={<FileText className="w-5 h-5 text-amber-500 dark:text-amber-400" />}
      actionText="Proceed to Calculator"
      description="Select an existing client or register a new one to generate a quotation."
      onProceed={handleProceed}
    />
  );
};

export default CreateQuotationModal;
