import React, { useEffect, useState } from "react";
import axios from "axios";
import { Plus } from "lucide-react";
import { useSelector } from "react-redux";
import API_BASE_URL from "../../../config/apiBaseUrl";
import QuotationTable from "../components/QuotationTable";
import GenerateProformaModal from "../components/GenerateProformaModal";
import ProformaManagerModal from "../components/ProformaManagerModal";
import CreateQuotationModal from "../components/CreateQuotationModal";

const APPROVED = [
  "approved",
  "client_approved",
  "proforma_generated",
  "proforma_sent",
  "payment_awaited",
  "partially_paid",
];

export default function QuotationHistoryPage() {
  const { token } = useSelector((state) => state.user);
  const [quotations, setQuotations] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedQuotationId, setSelectedQuotationId] = useState(null);
  const [managerOpen, setManagerOpen] = useState(false);
  const [managerTarget, setManagerTarget] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchQuotations = async () => {
    const res = await axios.get(`${API_BASE_URL}/auth/api/re_calculator/quotations/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.status === "Success") setQuotations(res.data.data || []);
  };

  useEffect(() => {
    if (token) fetchQuotations().catch((err) => console.error(err));
  }, [token]);

  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quotation</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{quotations.length} records</p>
        </div>
        <button
          id="create-quotation-btn"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          Create Quotation
        </button>
      </div>

      <QuotationTable
        quotations={quotations}
        keyword={keyword}
        setKeyword={setKeyword}
        fetchQuotations={fetchQuotations}
        handleCreateProformaFromQuotation={(q) => {
          setSelectedQuotationId(q.id);
          setShowModal(true);
        }}
        openProformaManager={(q) => {
          setManagerTarget(q);
          setManagerOpen(true);
        }}
      />
      {showModal && (
        <GenerateProformaModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedQuotationId(null);
          }}
          quotationsList={quotations.filter((q) => APPROVED.includes(q.status))}
          initialSelectedQuotationId={selectedQuotationId}
          proposalsList={[]}
        />
      )}
      <ProformaManagerModal
        isOpen={managerOpen}
        onClose={() => setManagerOpen(false)}
        proposal={managerTarget}
      />
      <CreateQuotationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
