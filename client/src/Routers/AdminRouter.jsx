import React, { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
// import { useSelector } from "react-redux";
import styled from "styled-components";
import Quotation from "../Admin/Quotation";
import AdminAddPlan from "../Admin/AdminAddPlan";
import AdminPlanHistory from "../Admin/AdminPlanHistory";
import AdminComplimentaryData from "../Admin/AdminComplimentaryData";
import NoteSection from "../Admin/NoteSection";
import AdminInvoice from "../Admin/AdminInvoice";

import InvoiceCalculation from "../Admin/InvoiceCalculation";
import InvoiceAds from "../Admin/InvoiceAds";
import InvoiceNoteSection from "../Admin/InvoiceNoteSection";
import InvoiceHistory from "../Admin/InvoiceHistory";
import HistoryHub from "../Admin/HistoryHub";
import ProformaServices from "../Components/InvoiceServices";
import DiscountSetting from "../Admin/DiscountSetting";

const AdminDashboard = lazy(() => import("../Admin/AdminDashboard"));
const AdminCalculator = lazy(() => import("../Admin/AdminCalculator"));
const AdsCampaignCalculator = lazy(() =>
  import("../Admin/AdsCampaignCalculator")
);
const ServicesLanding = lazy(() => import("../Admin/ServicesLanding"));
const History = lazy(() => import("../Admin/History"));
const ReviewRequirements = lazy(() => import("../Admin/ReviewRequirements"));
const ProposalBuilder = lazy(() => import("../Admin/ProposalBuilder"));
import PremiumLoader from "../Components/PremiumLoader";
const AdminRouter = () => {
  // const { currentUser } = useSelector((state) => state.user);
  return (
    <>
      <Wrapper>
        <Suspense
          fallback={
            <div className="loading-container">
              <div className="spinner-wrapper">
                <div className="spinner-ring"></div>
                <PremiumLoader />
              </div>
            </div>
          }
        >
          <Routes>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route
              path="calculator/:id/:proposalId"
              element={<AdminCalculator />}
            />
            <Route path="add-plan" element={<AdminAddPlan />} />
            <Route
              path="Adscalculator/:id/:proposalId"
              element={<AdsCampaignCalculator />}
            />
            <Route
              path="ServicesLanding/:id/:proposalId"
              element={<ServicesLanding />}
            />
            <Route path="history/:id" element={<History />} />
            <Route path="client/service/history/:id" element={<History />} />
            
            <Route path="proposal-builder/:clientId" element={<ProposalBuilder />} />
            <Route path="proposal-builder/:clientId/:proposalId" element={<ProposalBuilder />} />
            
            <Route path="quotation/:id/:txn_id" element={<Quotation />} />

            <Route path="plan-details/:id" element={<AdminPlanHistory />} />
            <Route
              path="complimentary/:id/:proposalId"
              element={<AdminComplimentaryData />}
            />
            <Route path="note-section/:id/:txn_id" element={<NoteSection />} />
            <Route path="invoice/:id/:txn_id" element={<AdminInvoice />} />
            <Route path="invoice-services" element={<ProformaServices />} />

            <Route
              path="invoice-calculator/:id/:proposalId"
              element={<InvoiceCalculation />}
            />
            <Route
              path="invoice-Adscalculator/:id/:proposalId"
              element={<InvoiceAds />}
            />
            <Route
              path="invoice-Adscalculator/:id/:proposalId"
              element={<InvoiceAds />}
            />
            <Route
              path="invoice-note-section/:id/:txn_id"
              element={<InvoiceNoteSection />}
            />
            <Route path="Invoice-history" element={<InvoiceHistory />} />
            <Route
              path="discount-setting/:id/:txn_id"
              element={<DiscountSetting />}
            />
            <Route path="/review/:linkId" element={<ReviewRequirements />} />
          </Routes>
        </Suspense>
      </Wrapper>
    </>
  );
};

export default AdminRouter;
const Wrapper = styled.div`
  .spinner-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 9999;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, #e3f2fd, #fce4ec);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .spinner-ring {
    width: 150px;
    height: 150px;
    border: 8px solid transparent;
    border-top: 8px solid #dc620b;
    border-right: 8px solid #dc620b;
    border-radius: 50%;
    animation: spin 1.2s linear infinite;
    box-shadow: 0 0 8px rgba(238, 101, 3, 0.6);
    position: absolute;
  }

  .spinner-center {
    font-size: 20px;
    font-weight: bold;
    color: #dc620b;
    z-index: 1;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
      opacity: 0.8;
    }
    50% {
      transform: scale(1.2);
      opacity: 1;
    }
  }
`;
