import React, { useEffect, useState } from "react";
import {
  Calendar,
  Search,
  ArrowLeft,
  Trash,
  ChevronDown,
  EyeClosed,
  EyeIcon,
  Copy,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import ReactPaginate from "react-paginate";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../redux/user/userSlice";
import Swal from "sweetalert2";
import API_BASE_URL from "../config/apiBaseUrl";

const InvoiceHistory = () => {
   const baseURL = API_BASE_URL;
const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState(null); // track which row is open
  const [fetchServices, setFetchServices] = useState([]);
  // const [clientData, setClientData] = useState([]);
  const { id } = useParams();
  const { currentUser, token } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const clientPerPage = 10;
  console.log(id);
  console.log(currentUser);
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [filterType, setFilterType] = useState("All");

  const fetchAllClientServices = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/calculator/getAllInvoice`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.status === "Success") {
        setFetchServices(res.data.data.reverse());

        console.log(fetchServices);
      }
    } catch (error) {
      console.log(error);
      if (error.response && error.response.status === 401) {
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
    }
  };

  console.log(fetchServices);

  useEffect(() => {
    fetchAllClientServices();
  }, []);

  // Closes dropdown when clicking anywhere outside it
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If the user didn't click inside any element with the 'action-dropdown-container' class, close the dropdown
      if (!event.target.closest(".action-dropdown-container")) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredItems = fetchServices.filter((row) => {
    // ✅ Bill type filter
    if (filterType !== "All" && row.bill_type !== filterType) {
      return false;
    }

    // ✅ Keyword search filter
    if (!keyword.trim()) return true;

    const searchTerm = keyword.trim().toLowerCase();
    return (
      (row?.txn_id && row.txn_id.toLowerCase().includes(searchTerm)) ||
      (row?.client_name &&
        row.client_name.toLowerCase().includes(searchTerm)) ||
      (row?.client_organization &&
        row.client_organization.toLowerCase().includes(searchTerm))
    );
  });

  console.log("Filtered:", filteredItems.length, filteredItems);

  const totalPages = Math.ceil(filteredItems.length / clientPerPage);

  const filterPagination = () => {
    const startIndex = currentPage * clientPerPage;
    const endIndex = startIndex + clientPerPage;
    return filteredItems?.slice(startIndex, endIndex);
  };

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  const showApiData = filterPagination();
  const handleDeleteInvoice = async (txnId, id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this invoice permanently?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    try {
      const response = await axios.delete(
        `${baseURL}/auth/api/calculator/deleteAllInvoiceServiceHistory/${id}/${txnId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status === "Success") {
        setFetchServices((prev) =>
          prev.filter((item) => item.txn_id !== txnId)
        );
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Invoice deleted successfully.",
          showConfirmButton: false,
          timer: 1000,
          // timerProgressBar: true,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: response.data.message || "Unable to delete invoice.",
          showConfirmButton: false,
          timer: 1000,
          // timerProgressBar: true,
        });
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while deleting invoice.",
        showConfirmButton: false,
        timer: 1000,
        // timerProgressBar: true,
      });
    }
  };
  // ✅ Copy Invoice Function
  const handleCopyInvoice = async (txnId) => {
    try {
      const confirm = await Swal.fire({
        title: "Copy Invoice?",
        text: "Do you want to create a copy of this invoice?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, copy it!",
      });

      if (!confirm.isConfirmed) return;

      const response = await axios.post(
        `${baseURL}/auth/api/calculator/copyInvoiceByTxnId/${txnId}`,
        {}, // no body needed
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status === "Success") {
        Swal.fire({
          icon: "success",
          title: "Copied!",
          text: "Invoice copied successfully.",
          showConfirmButton: false,
          timer: 1000,
          // timerProgressBar: true,
        });

        // ✅ Refresh list after copying
        fetchAllClientServices();
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: response.data.message || "Unable to copy invoice.",
          showConfirmButton: false,
          timer: 1000,
          // timerProgressBar: true,
        });
      }
    } catch (error) {
      console.error("Error copying invoice:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while copying invoice.",
        showConfirmButton: false,
        timer: 1000,
        // timerProgressBar: true,
      });
    }
  };

  const handleNavigateInovice = (selectedTxn, selectedClient, billType) => {
    const isGST = billType === "GST";
    navigate(
      `/BD/invoice/${selectedClient}/${selectedTxn}?gst=${isGST ? 1 : 0}`
    );
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 p-6 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-0">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Invoice History
            </h2>
            {/* <button
              onClick={() => navigate(-1)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transform hover:scale-105 transition-all duration-200 bg-gradient-to-r from-yellow-500 to-green-500 text-white shadow-lg shadow-yellow-500/25"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button> */}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Bill Type Filter */}
            <div className="relative group">
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(0);
                }}
                className="w-full sm:w-auto px-4 pr-8 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 backdrop-blur-sm hover:bg-gray-700/50 transition-all text-sm"
              >
                <option value="All">All</option>
                <option value="GST">GST</option>
                <option value="NON_GST">Non-GST</option>
              </select>
            </div>

            {/* Search Box */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-hover:text-amber-400 transition-colors" />
              <input
                type="text"
                value={keyword}
                placeholder="Search history..."
                className="w-full sm:w-auto pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 backdrop-blur-sm hover:bg-gray-700/50 transition-all text-sm"
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setCurrentPage(0);
                }}
              />
            </div>
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
          <div className="p-8">
            <div className="overflow-auto h-[40rem]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700/50">
                    <th className="text-left py-4 px-6 font-semibold text-gray-200 uppercase tracking-wider text-sm">
                      INDEX
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-200 uppercase tracking-wider text-sm">
                      Date
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-200 uppercase tracking-wider text-sm">
                      Client
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-200 uppercase tracking-wider text-sm">
                      TXN ID
                    </th>
                    <th className="text-left py-4  font-semibold text-gray-200 uppercase tracking-wider text-sm">
                      Bill Number
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-200 uppercase tracking-wider text-sm">
                      Action
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-200 uppercase tracking-wider text-sm">
                      Amount Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {showApiData.length > 0 ? (
                    showApiData.map((item, index) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-all duration-300 group"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <td className="py-5 px-6">
                          <div className="font-semibold text-white text-lg group-hover:text-amber-300 transition-colors">
                            {index + 1}
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-3 text-gray-300 group-hover:text-white transition-colors">
                            <Calendar className="w-4 h-4 text-orange-400" />
                            <span className="font-medium">
                              {moment(item.created_at).format("DD MMMM YYYY")}
                            </span>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="font-semibold text-white text-lg group-hover:text-amber-300 transition-colors">
                            {item.client_name}
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="font-bold text-xl bg-gradient-to-r from-green-400 to-yellow-400 bg-clip-text text-transparent">
                            {item.txn_id ? item.txn_id : "N/A"}
                          </div>
                        </td>

                        <td className="py-5 ">
                          <div
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                              item.bill_type === "GST"
                                ? `bg-green-500/20 text-green-400`
                                : "bg-gray-500/20 text-gray-300"
                            }`}
                          >
                            {item.bill_type === "GST"
                              ? `GST-${item.bill_number}`
                              : `N-GST-${item.bill_number}`}
                          </div>
                        </td>

                        {/* Actions Dropdown */}
                        <td className="py-5 px-6 relative action-dropdown-container">
                          <button
                            onClick={() =>
                              setOpenDropdown(
                                openDropdown === index ? null : index
                              )
                            }
                            className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25"
                          >
                            Actions <ChevronDown size={16} className="ml-2" />
                          </button>

                          {openDropdown === index && (
                            <div className="absolute mt-2 right-0 w-40 bg-white rounded-lg shadow-lg border z-50">
                              <ul className="text-sm text-gray-700">
                                <li>
                                  <button
                                    onClick={() => {
                                      handleNavigateInovice(
                                        item.txn_id,
                                        item.client_id,
                                        item.bill_type
                                      );

                                      setShowModal(true);
                                      setOpenDropdown(null);
                                    }}
                                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                                  >
                                    <EyeIcon
                                      size={14}
                                      className="inline mr-2"
                                    />{" "}
                                    Preview
                                  </button>
                                </li>

                                <li>
                                  <button
                                    onClick={() => {
                                      handleCopyInvoice(item.txn_id);
                                      setOpenDropdown(null);
                                    }}
                                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                                  >
                                    <Copy size={14} className="inline mr-2" />{" "}
                                    Copy
                                  </button>
                                </li>
                              </ul>
                            </div>
                          )}
                        </td>
                        <td className="py-5 px-6">
                          {item.tag_received_amt === "received" ? (
                            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-red-500 to-red-500 text-white shadow-lg shadow-orange-500/25">
                              {item.tag_received_amt}
                            </div>
                          ) : (
                            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-red-500 to-red-500 text-white shadow-lg shadow-red-500/25">
                              {item.tag_received_amt}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="py-10 text-center text-gray-400"
                      >
                        No service history found for this client.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="relative bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-2 right-3 text-red-600 hover:text-gray-500 text-xl font-bold"
                aria-label="Close"
              >
                ×
              </button>
              <h2 className="text-lg font-semibold mb-4 text-center">
                Select Invoice Type
              </h2>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    navigate(
                      `/BD/invoice/${selectedClient}/${selectedTxn}?gst=1`
                    );
                    setShowModal(false);
                  }}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  With GST (18%)
                </button>
                <button
                  onClick={() => {
                    navigate(
                      `/BD/invoice/${selectedClient}/${selectedTxn}?gst=0`
                    );
                    setShowModal(false);
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Without GST
                </button>
              </div>
            </div>
          </div>
        )}

        <PaginationContainer>
          <ReactPaginate
            previousLabel={"Previous"}
            nextLabel={"Next"}
            breakLabel={"..."}
            pageCount={totalPages}
            marginPagesDisplayed={2}
            pageRangeDisplayed={5}
            onPageChange={handlePageChange}
            containerClassName={"pagination"}
            activeClassName={"active"}
            forcePage={currentPage}
          />
        </PaginationContainer>
      </div>
    </div>
  );
};
export default InvoiceHistory;
const PaginationContainer = styled.div`
  .pagination {
    display: flex;
    justify-content: center;
    padding: 10px;
    list-style: none;
    border-radius: 5px;
    margin-bottom: 1.5rem;
  }

  .pagination li {
    margin: 0 5px;
  }

  .pagination li a {
    display: block;
    padding: 8px 16px;
    border: 1px solid #e6ecf1;
    color: #a73418;
    cursor: pointer;
    text-decoration: none;
    border-radius: 5px;
    box-shadow: 0px 0px 1px #000;
    font-size: 14px; /* Default font size */
  }

  .pagination li.active a {
    background-color: #fef9c3;
    color: #d7a548;
    border: 1px solid #fef9c3;
  }

  .pagination li.disabled a {
    color: #166556;
    cursor: not-allowed;
    background-color: #dcfce7;
    border: 1px solid #dcfce7;
  }

  .pagination li a:hover:not(.active) {
    background-color: #dcfce7;
    color: #166556;
  }

  /* Responsive adjustments for smaller screens */
  @media (max-width: 768px) {
    .pagination {
      padding: 5px;
      flex-wrap: wrap;
    }

    .pagination li {
      margin: 2px;
    }

    .pagination li a {
      padding: 6px 10px;
      font-size: 12px;
    }
  }

  @media (max-width: 480px) {
    .pagination {
      padding: 5px;
    }

    .pagination li {
      margin: 2px;
    }

    .pagination li a {
      padding: 4px 8px;
      font-size: 10px;
    }

    /* Hide the previous and next labels for extra-small screens */
    .pagination li:first-child a::before {
      content: "«";
      margin-right: 5px;
    }

    .pagination li:last-child a::after {
      content: "»";
      margin-left: 5px;
    }
  }
`;
