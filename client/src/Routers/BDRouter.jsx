import React, { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
// import { useSelector } from "react-redux";
import styled from "styled-components";
import BDNoteSection from "../BusinessDeveloper/BDNoteSection";
import BDInvoice from "../BusinessDeveloper/BDInvoice";
const QuotationBD = lazy(() => import("../BusinessDeveloper/QuotationBD"));
const AdsCampaignCalciBD = lazy(() =>
  import("../BusinessDeveloper/AdsCampaignCalciBD")
);
const AddService = lazy(() => import("../BusinessDeveloper/AddService"));
const HistoryBD = lazy(() => import("../BusinessDeveloper/HistoryBD"));
const CalculatorBD = lazy(() => import("../BusinessDeveloper/CalculatorBD"));
const ProposalBuilderBD = lazy(() => import("../BusinessDeveloper/ProposalBuilderBD"));

const BusinessDeveloperDashboard = lazy(() =>
  import("../BusinessDeveloper/BusinessDeveloperDashboard")
);
const ReviewRequirements = lazy(() => import("../Admin/ReviewRequirements"));

import InvoiceCalculation from "./../BusinessDeveloper/InvoiceCalculation";
import InvoiceAds from "./../BusinessDeveloper/InvoiceAds";
import InvoiceNoteSection from "./../BusinessDeveloper/InvoiceNoteSection";
import InvoiceHistory from "./../BusinessDeveloper/InvoiceHistory";
import DiscountSetting from "./../BusinessDeveloper/DiscountSetting";
import PremiumLoader from "../Components/PremiumLoader";
const BDRouter = () => {
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
            <Route path="dashboard" element={<BusinessDeveloperDashboard />} />
            <Route path="AddService/:id/:proposalId" element={<AddService />} />
            <Route path="client/service/history/:id" element={<HistoryBD />} />
            <Route path="proposal-builder/:clientId" element={<ProposalBuilderBD />} />
            <Route path="proposal-builder/:clientId/:proposalId" element={<ProposalBuilderBD />} />
            <Route
              path="calculator/:id/:proposalId"
              element={<CalculatorBD />}
            />
            <Route
              path="Adscalculator/:id/:proposalId"
              element={<AdsCampaignCalciBD />}
            />
            <Route path="quotation/:id/:txn_id" element={<QuotationBD />} />
            <Route
              path="note-section/:id/:txn_id"
              element={<BDNoteSection />}
            />
            <Route path="invoice/:id/:txn_id" element={<BDInvoice />} />

            <Route
              path="invoice-calculator/:id/:proposalId"
              element={<InvoiceCalculation />}
            />
            <Route
              path="invoice-Adscalculator/:id/:proposalId"
              element={<InvoiceAds />}
            />

            <Route
              path="invoice-note-section/:id/:txn_id"
              element={<InvoiceNoteSection />}
            />
            <Route
              path="discount-setting/:id/:proposalId"
              element={<DiscountSetting />}
            />
            <Route path="Invoice-history" element={<InvoiceHistory />} />
            <Route path="/review/:linkId" element={<ReviewRequirements />} />
          </Routes>
        </Suspense>
      </Wrapper>
    </>
  );
};

export default BDRouter;
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
