import React from "react";
import ClientSelectorModal from "../../../Components/ClientSelectorModal";
import { FileText } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const CreateProposalModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith("/BD") ? "/BD" : "/admin";

  const handleProceed = (client) => {
    onClose();
    navigate(`${basePath}/proposal-builder/${client.id}`);
  };

  return (
    <ClientSelectorModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Proposal"
      icon={<FileText className="w-5 h-5 text-amber-500 dark:text-amber-400" />}
      actionText="Proceed to Builder"
      description="Select an existing client or register a new one to generate a proposal."
      onProceed={handleProceed}
    />
  );
};

export default CreateProposalModal;
