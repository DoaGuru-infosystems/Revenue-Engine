import React, { useEffect, useState } from "react";
import { Calendar, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config/apiBaseUrl";
// import moment from "moment";
import styled from "styled-components";
import ReactPaginate from "react-paginate";

const GenerateLinkHistoryBD = () => {
   const baseURL = API_BASE_URL;
const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  // Fetch API Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `${baseURL}/auth/api/calculator/requirements`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching history:", err);
        if (err.response && err.response.status === 401) {
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
      }
    };
    fetchData();
  }, []);

  // Search Filter
  const filteredData = data.filter((item) =>
    item.client_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination
  const pageCount = Math.ceil(filteredData.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentItems = filteredData.slice(offset, offset + itemsPerPage);

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Generate Link History
          </h2>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-hover:text-amber-400 transition-colors" />
            <input
              type="text"
              placeholder="Search client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 backdrop-blur-sm hover:bg-gray-700/50 transition-all text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
          <div className="p-8">
            <div className="overflow-auto h-[35rem]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="text-left py-4 px-6 text-gray-200 uppercase text-sm">
                    Index
                  </th>
                  {/* <th className="text-left py-4 px-6 text-gray-200 uppercase text-sm">
                    Date
                  </th> */}
                  <th className="text-left py-4 px-6 text-gray-200 uppercase text-sm">
                    Client
                  </th>
                  {/* <th className="text-left py-4 px-6 text-gray-200 uppercase text-sm">
                    Link ID
                  </th> */}
                  <th className="text-left py-4 px-6 text-gray-200 uppercase text-sm">
                    Created By
                  </th>
                  <th className="text-left py-4 px-6 text-gray-200 uppercase text-sm">
                    Total Amount
                  </th>
                  <th className="text-left py-4 px-6 text-gray-200 uppercase text-sm">
                    Show
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((item, index) => (
                    <tr
                      key={item.link_id}
                      className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-all duration-300"
                    >
                      <td className="py-5 px-6 text-white font-semibold">
                        {offset + index + 1}
                      </td>
                      {/* <td className="py-5 px-6 flex items-center gap-2 text-gray-300">
                        <Calendar className="w-4 h-4 text-orange-400" />
                        {moment(item.created_at).format("DD/MM/YYYY")}
                      </td> */}
                      <td className="py-5 px-6 text-white font-medium">
                        {item.client_name}
                      </td>
                      {/* <td className="py-5 px-6 text-yellow-400 font-bold">
                        {item.link_id}
                      </td> */}
                      <td className="py-5 px-6 text-yellow-400 font-bold">
                        {item.created_by}
                      </td>
                      <td className="py-5 px-6 text-amber-400 font-semibold">
                        ₹{item.total_amount}
                      </td>
                      <td className="py-5 px-6">
                        <button
                          onClick={() => navigate(`/BD/review/${item.link_id}`)}
                          className="px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:scale-105 transition"
                        >
                          Show
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-gray-400">
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>

        {/* Pagination */}
        <PaginationContainer>
          {pageCount > 1 && (
            <ReactPaginate
              previousLabel="← Prev"
              nextLabel="Next →"
              pageCount={pageCount}
              onPageChange={handlePageChange}
              containerClassName="flex justify-center items-center space-x-2 mt-6"
              pageClassName="px-3 py-1 rounded-md text-gray-300 bg-gray-800 hover:bg-amber-600 hover:text-white"
              activeClassName="bg-amber-500 text-white"
              previousClassName="px-3 py-1 rounded-md bg-gray-800 text-gray-300 hover:bg-amber-600"
              nextClassName="px-3 py-1 rounded-md bg-gray-800 text-gray-300 hover:bg-amber-600"
              disabledClassName="opacity-50 cursor-not-allowed"
            />
          )}
        </PaginationContainer>
      </div>
    </div>
  );
};

export default GenerateLinkHistoryBD;
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
