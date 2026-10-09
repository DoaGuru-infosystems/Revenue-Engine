import React, { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import styled from "styled-components";
import Quotation from "../features/invoices/pages/QuotationPage";
import BalanceProforma from "../features/invoices/pages/BalanceProformaPage";
import AdminAddPlan from "../features/admin/pages/AdminAddPlanPage";
import AdminPlanHistory from "../features/admin/pages/AdminPlanHistoryPage";
import AdminComplimentaryData from "../features/calculator/pages/ComplimentaryPage";
import NoteSection from "../shared/NoteSection";
import Invoice from "../features/invoices/pages/InvoicePage";
import InvoiceCalculation from "../shared/InvoiceCalculation";
import InvoiceAds from "../shared/InvoiceAds";
import InvoiceNoteSection from "../shared/InvoiceNoteSection";
import InvoiceHistory from "../features/history/pages/InvoiceHistoryPage";
import HistoryHub from "../features/history/pages/HistoryHubPage";
import ProformaServices from "../Components/InvoiceServices";
import DiscountSetting from "../shared/DiscountSetting";
import PremiumLoader from "../Components/PremiumLoader";

const AdminDashboard = lazy(() => import("../features/admin/pages/AdminDashboardPage"));
const Calculator = lazy(() => import("../features/calculator/pages/CalculatorPage"));
const AdsCampaignCalculator = lazy(() =>
  import("../features/calculator/pages/AdsCampaignCalculatorPage")
);
const ServicesLanding = lazy(() => import("../features/calculator/pages/ServicesLandingPage"));
const History = lazy(() => import("../features/history/pages/ClientServiceHistoryPage"));
const ReviewRequirements = lazy(() => import("../features/admin/pages/ReviewRequirementsPage"));
const ProposalBuilder = lazy(() => import("../features/proposals/pages/ProposalBuilderPage"));
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
              element={<Calculator />}
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
            <Route path="balance-proforma/:id/:txn_id" element={<BalanceProforma />} />

            <Route path="plan-details/:id" element={<AdminPlanHistory />} />
            <Route
              path="complimentary/:id/:proposalId"
              element={<AdminComplimentaryData />}
            />
            <Route path="note-section/:id/:txn_id" element={<NoteSection />} />
            <Route path="invoice/:id/:txn_id" element={<Invoice />} />
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
