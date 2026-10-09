import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import { clearUser } from "../../../redux/user/userSlice";
import { getAllProposals, deleteProposal } from "../services/proposalService";

export function useProposalHistory(clientPerPage = 10) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.user);

  const [fetchServices, setFetchServices] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showCreateProposalModal, setShowCreateProposalModal] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const fetchAllClientServices = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await getAllProposals(token);

      if (res.status === "Success") {
        const uniqueTxnData = [];
        const seenTxnIds = new Set();

        for (const item of res.data || []) {
          if (item.id && !seenTxnIds.has(item.id)) {
            seenTxnIds.add(item.id);
            uniqueTxnData.push(item);
          }
        }

        setFetchServices(uniqueTxnData);
      }
    } catch (error) {
      console.error(error);
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

  useEffect(() => {
    fetchAllClientServices();
  }, []);

  const handleDeleteProposal = async (item) => {
    if (item.status !== "client_approved") {
      Swal.fire({
        icon: "warning",
        title: "Cannot Delete",
        text: "A proforma has already been created for this proposal. You must delete the proforma first before you can delete this proposal.",
      });
      return;
    }

    const confirm = await Swal.fire({
      title: "Delete Proposal?",
      text: "Are you sure you want to delete this proposal?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#4B5563",
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        await deleteProposal(item.id, token);
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Proposal deleted successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchAllClientServices();
      } catch (error) {
        console.error("Delete proposal error:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error?.response?.data?.message || "Failed to delete proposal.",
        });
      }
    }
  };

  const filteredItems = useMemo(() => {
    return fetchServices.filter((row) => {
      if (["draft", "sent", "changes", "rejected"].includes(row?.status)) return false;

      if (!keyword.trim()) return true;

      const q = keyword.toLowerCase();
      const clientName = (row.client_name || "").toLowerCase();
      const orgName = (row.company_name || row.client_organization || "").toLowerCase();
      const idMatch = String(row.id || "").toLowerCase();
      const txnMatch = String(row.txn_id || "").toLowerCase();

      return clientName.includes(q) || orgName.includes(q) || idMatch.includes(q) || txnMatch.includes(q);
    });
  }, [fetchServices, keyword]);

  const pageCount = Math.ceil(filteredItems.length / clientPerPage);
  const offset = currentPage * clientPerPage;
  const currentItems = filteredItems.slice(offset, offset + clientPerPage);

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  return {
    fetchServices,
    filteredItems,
    currentItems,
    pageCount,
    currentPage,
    setCurrentPage,
    handlePageClick,
    keyword,
    setKeyword,
    loading,
    fetchAllClientServices,
    handleDeleteProposal,
    showCreateProposalModal,
    setShowCreateProposalModal,
    openDropdownId,
    setOpenDropdownId,
  };
}
