import React, { useEffect, useState } from "react";
import { Calendar, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import ReactPaginate from "react-paginate";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../redux/user/userSlice";
import Swal from "sweetalert2";
import API_BASE_URL from "../config/apiBaseUrl";

const AllHistory = () => {
  const baseURL = API_BASE_URL;
  const navigate = useNavigate();
  const [fetchServices, setFetchServices] = useState([]);
  // const [clientData, setClientData] = useState([]);
  const { currentUser, token } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const clientPerPage = 10;
  console.log(currentUser);
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedTxn, setSelectedTxn] = useState(null);

  const fetchAllClientServices = async () => {
    try {
      const res = await axios.get(
        `${baseURL}/auth/api/re_calculator/getClientsTxnByEmployee/${currentUser.name}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data.status === "Success") {
        const uniqueTxnData = [];
        const seenTxnIds = new Set();

        for (const item of res.data.data) {
          // ✅ Skip items with missing/null/empty txn_id
          if (item.txn_id && !seenTxnIds.has(item.txn_id)) {
            seenTxnIds.add(item.txn_id);
            uniqueTxnData.push(item);
          }
        }

        setFetchServices(uniqueTxnData);
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
  console.log(fetchServices);

  //   const fetchClient = async () => {
  //     try {
  //       const res = await axios.get(
  //         `${baseURL}/auth/api/re_calculator/getClientDetailsById/${id}`,
  //         {
  //           headers: {
  //             "Content-Type": "application/json",
  //             Authorization: `Bearer ${token}`,
  //           },
  //         }
  //       );
  //       if (res.data.status === "Success") {
  //         console.log(res.data.data);
  //         setClientData(res.data.data);
  //       }
  //     } catch (error) {
  //       console.log(error);
  //       if (error.response && error.response.status === 401) {
  //         // Token is invalid or expired
  //         Swal.fire({
  //           title: "Session Expired",
  //           text: "Please login again.",
  //           icon: "warning",
  //           confirmButtonText: "OK",
  //         }).then(() => {
  //           dispatch(clearUser());
  //           localStorage.removeItem("token");
  //           navigate("/");
  //         });
  //       }
  //     }
  //   };

  //   console.log(clientData);
  //   const clientName = clientData.client_name;
  //   console.log(clientName);

  useEffect(() => {
    // fetchClient();
    fetchAllClientServices();
  }, []);

  const filteredItems = fetchServices.filter((row) => {
    if (!keyword.trim()) return true; // no filtering if keyword is empty

    const searchTerm = keyword.trim().toLowerCase();
    return (
      (row?.txn_id && row.txn_id.toLowerCase().includes(searchTerm)) ||
      (row?.client_name && row.client_name.toLowerCase().includes(searchTerm))
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

  return (
    <div className="w-full bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 relative overflow-hidden">
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
              History
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
            {/* <div className="relative group">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-hover:text-orange-400 transition-colors" />
              <select className="w-full sm:w-auto pl-10 pr-8 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 backdrop-blur-sm hover:bg-gray-700/50 transition-all text-sm">
                <option>All Activities</option>
                <option>Completed</option>
                <option>Active</option>
              </select>
            </div> */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-hover:text-amber-400 transition-colors" />
              <input
                type="text"
                value={keyword}
                placeholder="Search By Name,Txn Id"
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
            <div
              className="overflow-auto h-[calc(100vh-20rem)] max-h-[35rem]"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
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
                    {/* <th className="text-left py-4 px-6 font-semibold text-gray-200 uppercase tracking-wider text-sm">
                      Service
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-200 uppercase tracking-wider text-sm">
                      Status
                    </th> */}
                    <th className="text-left py-4 px-6 font-semibold text-gray-200 uppercase tracking-wider text-sm">
                      Quotation Preview
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
                              {moment(item.txn_date).format("DD MMMM YYYY")}
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
                        <td className="py-5 px-6">
                          <button
                            onClick={() => {
                              setSelectedClient(item.client_id);
                              setSelectedTxn(item.txn_id);
                              setShowModal(true);
                            }}
                            // onClick={() =>
                            //   navigate(
                            //     `/BD/quotation/${item.client_id}/${item.txn_id}`
                            //   )
                            // }
                            className="inline-block px-4 py-2 rounded-full text-sm font-semibold transform hover:scale-105 transition-all duration-200 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25"
                          >
                            Preview
                          </button>
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
                Select Quotation Type
              </h2>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    navigate(
                      `/BD/quotation/${selectedClient}/${selectedTxn}?gst=1`
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
                      `/BD/quotation/${selectedClient}/${selectedTxn}?gst=0`
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

export default AllHistory;
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
