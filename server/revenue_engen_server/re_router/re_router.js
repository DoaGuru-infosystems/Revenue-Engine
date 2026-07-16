// local code re_router
const express = require("express");
const {
  register,
  login,
  forgotPassword,
  // insertServices,
  // getServices,
  // updateServices,
  insertAdsServices,
  updateAdsServices,
  insertClientDetails,
  getClientDetails,
  getClientsByEmployee,
  addServices,
  addCategories,
  addEditingTypes,
  saveCalculatorData,
  saveAdsCampaign,
  registerBD,
  verifyOtpAndResetPassword,
  saveCalculatorDataOfPlan,
  saveCalculatorDataOfPlanDetail,
  saveClientWithPlan,
  addNotebyplan,
  savePlanClientNotes,
  saveClientIdwiseNotes,
  assignQuotation,
  setDoneQty,
  incrementDoneQty,
  reassignQuotation,
  createTeam,
  addMembersToTeam,
  assignQuotationToTeam,
  saveComplimentaryData,
  generateClientLink,
  submitRequirement,
  saveNotesData,
  saveDiscountData,
  saveInvoiceData,
  saveInvoiceGD,
  saveDirectProforma,
  saveInvoiceAdsCampaign,
  saveInvoiceComplimentaryData,
  saveInvoiceCalculatorData,
  saveInvoiceNotesData,
  saveInvoiceClientIdwiseNotes,
  saveAdditionalData,
  saveRemainingAmountData,
  seoClientsDetails,
  seoWebsiteKeyword,
  saveDiscountSetting,
  saveNotesbydefault,
  sendRegisterAdminOtp,
  registerAdminWithOtp,
} = require("../re_controller/re_controller");
const {
  getAddServices,
  getAddCategories,
  getAddEditingTypes,
  getAllServiceData,
  getAdsServices,
  getAllServiceDatas,
  getCalculatorTransactions,
  getByIDCalculatorTransactions,
  getByIDAdsCampaignDetails,
  getClientDetailsById,
  getClientTxnHistory,
  getClientServiceHistory,
  getClientDetailsEmp,
  getAllClientsTxnHistory,
  getClientsTxnHistoryByEmployee,
  getAllBD,
  optionalServiceAmounts,
  getPlanData,
  getPlanDetails,
  getPlanDetailsById,
  getPlanDataById,
  getPlanNotes,
  getClientNotesbyId,
  retrieveUser,
  getAssignmentByTxn,
  getAssignedQuotations,
  getProgressByTxn,
  getAssignedQuotationsByEmployeeName,
  retrieveTeam,
  retrieveTeamById,
  getAssignmentsSummary,
  getByIDComplimentaryData,
  getRequirementsLink,
  getRequirementsDetail,
  getNoteData,
  getByIDDiscountData,
  getInvoiceByIdData,
  getinInvoiceServiceHistory,
  getAllInvoiceServiceHistory,
  getClientServiceHistoryAssign,
  getComplimentaryInvoiceData,
  getInvoiceClientDetailsById,
  getInvoiceGraphic,
  getInvoiceAdsCampaign,
  getInvoiceNoteData,
  getInvoiceClientNotesbyId,
  getAllInvoice,
  getAdditionByIdData,
  getRemainingAmountByIdData,
  getSeoClientsWithKeywords,
  getDiscountSetting,
} = require("../re_controller/re_getController");
const {
  deleteService,
  deleteCategory,
  deleteEditingType,
  deleteAdsServices,
  deleteAdsCampaignDetails,
  deleteAdsCampaignEntryById,
  deleteGraphicEntryById,
  deleteClientById,
  deleteQuoatationById,
  deletePlanNameDetail,
  deletePlanNotesbyid,
  deletePlanDataByService,
  deletePlanbyChangeNotes,
  deleteClientAllPlanData,
  deletePlanClientNotes,
  removeMemberFromTeam,
  deleteTeam,
  deleteComplimenatryById,
  deleteNoteById,
  deleteRequirementsBundle,
  deleteDiscountById,
  deleteInvoiceById,
  deleteAllInvoiceServiceHistory,
  deleteInvoiceAdsCampaignEntryById,
  deleteInvoiceNoteById,
  deleteInvoiceClientNotes,
  deleteInvoiceComplimenatryById,
  deleteAdditionalById,
  deleteRemainingAmountById,
  deleteSeoClient,
  deleteSeoKeyword,
  deleteDiscountSettingById,
} = require("../re_controller/re_deleteController");
const {
  updateService,
  updateCategory,
  updateEditingType,
  updateCalculatorDataById,
  updateClientDetails,
  updatePlandata,
  updatePlanNameDetail,
  updatePlanNotes,
  updateServiceData,
  updateComplimenatryDataById,
  updateNoteDataById,
  updateClientNoteDataById,
  updateDiscountDataById,
  updateInvoiceDataById,
  updateInvoiceNoteDataById,
  updateInvoiceClientNoteDataById,
  updateInvoiceComplimenatryDataById,

  updateAdditionalDataById,
  updateRemainingDataById,
  updateSeoClient,
  updateSeoKeyword,
  updateDiscountSettingDataById,
  updateQuotationApprovalStatus,
  // reassignQuotation,
} = require("../re_controller/re_updateController");

const {
  submitToAdmin,
  sendQuotationToClient,
  markClientQuotationApproved,
  generateProformaInvoice,
  getPaymentSummary,
  recordPaymentAndGenerateFinalInvoice,
  invoiceSentNotify,
  /* --- FOR FUTURE DEVELOPMENT OK ---
  saveStrategy,
  sendStrategyToAdmin,
  getStrategy,
  sendStrategyToClient,
  markClientStrategyDecision,
  assignTeamLead,
  getSFEmployees,
  getSFTeams,
  getSFTeamLeads,
  assignTaskOwners,
  getTasksByTxn,
  getRemarks,
*/
} = require("../re_controller/re_workflowcontroller.JS");

const {
  getPublicInvoiceData,
  getPublicInvoicePdf,
  getPublicProposalData,
  getPublicProposalPdf,
} = require("../re_controller/re_publicController");

const authenticateToken = require("../re_middleware/re_authenticateToken");
// const {
//   pagespeedReportpdf,
//   // fullSEOReport,
// } = require("../re_controller/re_seoController");

const {
  createProposal,
  updateProposal,
  getProposalById,
  getProposalsByClient,
  deleteProposal,
  updateProposalStatus,
  generateProposalPdf,
  getAllProposals,
  sendProposalToClient,
  createProforma,
  getProformasByClient,
  getAllProformas,
  recordProposalPayment,
  approvePayment,
  getPaymentRecordsByClient,
  getAllPaymentRecords,
  getProformasByProposal,
  markPaymentReceived,
  getProposalPaymentSummary,
  deleteProforma,
  getFinalInvoices,
  generateInvoiceFromProforma,
  getProposalInvoices,
  getRevenueHistory,
} = require("../re_controller/re_proposalController");
const {
  uploadAndConvert: genratecoatetion,
  generateInvoicePdf,
} = require("../re_controller/re_genratecoatetion");
const router = express.Router();

// ---- Public Routes (no auth) ----
router.get("/public/invoice/:token", getPublicInvoiceData);
router.post("/public/invoice/:token/pdf", getPublicInvoicePdf);
router.get("/public/proposal/:token", getPublicProposalData);
router.get("/public/proposal/:token/pdf", getPublicProposalPdf);
router.post("/public/proposal/:token/pdf", getPublicProposalPdf);

//  ? new assignment workflow

router.post("/workflow/submitToAdmin", authenticateToken, submitToAdmin);
router.post(
  "/workflow/sendQuotationToClient",
  authenticateToken,
  sendQuotationToClient,
);
router.put(
  "/workflow/markClientQuotationApproved",
  authenticateToken,
  markClientQuotationApproved,
);
router.post(
  "/workflow/generateProformaInvoice",
  authenticateToken,
  generateProformaInvoice,
);

router.get(
  "/workflow/paymentSummary/:txn_id",
  authenticateToken,
  getPaymentSummary,
);
router.post(
  "/workflow/recordPaymentAndGenerateFinalInvoice",
  authenticateToken,
  recordPaymentAndGenerateFinalInvoice,
);
router.post(
  "/workflow/invoiceSentNotify",
  authenticateToken,
  invoiceSentNotify,
);

/* --- FOR FUTURE DEVELOPMENT OK ---
// ---- Strategy ----
router.post("/workflow/saveStrategy", authenticateToken, saveStrategy);
router.post(
  "/workflow/sendStrategyToAdmin",
  authenticateToken,
  sendStrategyToAdmin,
);
router.get("/workflow/getStrategy/:txn_id", authenticateToken, getStrategy);
router.post(
  "/workflow/sendStrategyToClient",
  authenticateToken,
  sendStrategyToClient,
);
router.put(
  "/workflow/markClientStrategyDecision",
  authenticateToken,
  markClientStrategyDecision,
);

// ---- Team & Task assignment ----
router.post("/workflow/assignTeamLead", authenticateToken, assignTeamLead);
router.post("/workflow/assignTaskOwners", authenticateToken, assignTaskOwners);
router.get("/workflow/getTasks/:txn_id", authenticateToken, getTasksByTxn);

// ---- Employees/RE_teams (stub — SF removed, future: connect to local DB) ----
router.get("/workflow/sfEmployees", authenticateToken, getSFEmployees);
router.get("/workflow/sfTeams", authenticateToken, getSFTeams);
router.get("/workflow/sfTeamLeads/:teamId", authenticateToken, getSFTeamLeads);

// ---- Remarks ----
router.get("/workflow/getRemarks/:txn_id", authenticateToken, getRemarks);
*/

// ------------------------------------------------------------------------------------------------------------------------------------------

router.post("/register", register);
router.post("/sendRegisterAdminOtp", sendRegisterAdminOtp);
router.post("/registerAdminWithOtp", registerAdminWithOtp);
router.post("/registerBD", authenticateToken, registerBD);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verifyOTP-forgot", verifyOtpAndResetPassword);
// router.post("/insertServices", insertServices);
// router.get("/getServices", getServices);
// router.put("/updateServices/:id", updateServices);
router.post("/insertAdsServices", insertAdsServices);
router.put("/updateAdsServices/:id", updateAdsServices);
router.post("/insertClientDetails", insertClientDetails);
router.get("/getClientDetails", authenticateToken, getClientDetails);
router.get("/getClientsByEmployee/:employee", getClientsByEmployee);
router.post("/addServices", addServices);
router.post("/addCategories", addCategories);
router.post("/addEditingTypes", addEditingTypes);
router.post("/saveCalculatorData", saveCalculatorData);
router.post("/saveAdsCampaign", saveAdsCampaign);
router.post("/saveCalculatorDataofplan", saveCalculatorDataOfPlan);
router.post("/saveClientWithPlan", saveClientWithPlan);
router.post("/addNotebyplan", addNotebyplan);
router.post("/savePlanClientNotes", savePlanClientNotes);
router.post("/saveClientIdwiseNotes", saveClientIdwiseNotes);
router.post("/assignQuotation", assignQuotation);
router.post("/createTeam", createTeam);
router.post("/addMembersToTeam/:id/members", addMembersToTeam);
router.post("/assignQuotationToTeam", assignQuotationToTeam);

router.post("/saveComplimentaryData", saveComplimentaryData);
/**
 *TODO:genratecoatetion
 */
router.post("/genratecoatetion", genratecoatetion);

router.post("/generateClientLink", generateClientLink);
router.post("/submitRequirement", submitRequirement);
router.post("/saveNotesData", saveNotesData);
router.post("/saveNotesbydefault", saveNotesbydefault);
router.post("/saveDiscountData", saveDiscountData);
router.post("/saveInvoiceData", saveInvoiceData);
router.post("/saveInvoiceGD", saveInvoiceGD);
router.post("/saveDirectProforma", saveDirectProforma);
router.post("/saveInvoiceAdsCampaign", saveInvoiceAdsCampaign);
router.post("/saveInvoiceComplimentaryData", saveInvoiceComplimentaryData);
router.post("/saveInvoiceCalculatorData", saveInvoiceCalculatorData);
router.post("/saveInvoiceNotesData", saveInvoiceNotesData);
router.post("/saveInvoiceClientIdwiseNotes", saveInvoiceClientIdwiseNotes);
// router.post("/copyInvoiceByTxnId/:txn_id", copyInvoiceByTxnId);
// router.post("/saveAdditionalData", saveAdditionalData);
router.post("/saveRemainingAmountData", saveRemainingAmountData);
router.post("/saveCalculatorDataofplanDetail", saveCalculatorDataOfPlanDetail);
router.post("/seoClientsDetails", seoClientsDetails);
router.post("/seoWebsiteKeyword/:client_id", seoWebsiteKeyword);
router.post("/saveDiscountSetting", saveDiscountSetting);

// ---->  Get all routes START <----
router.get("/getAddServices", authenticateToken, getAddServices);
router.get("/categories/:service_id", getAddCategories);
router.get("/getAddEditingTypes/:service/:category", getAddEditingTypes);
router.get("/api/services/details/all", authenticateToken, getAllServiceData);
router.get("/getAdsServices", authenticateToken, getAdsServices);
router.get("/services/category/editing", getAllServiceDatas);
router.get("/getCalculatorTransactions", getCalculatorTransactions);
router.get(
  "/getByIDCalculatorTransactions/:txn_id/:client_id",
  authenticateToken,
  getByIDCalculatorTransactions,
);

router.get(
  "/getByIDAdsCampaignDetails/:txn_id/:client_id",
  authenticateToken,
  getByIDAdsCampaignDetails,
);
router.get(
  "/getClientDetailsById/:id",
  authenticateToken,
  getClientDetailsById,
);
router.get(
  "/getClientTxnHistory/:client_id",
  authenticateToken,
  getClientTxnHistory,
);
router.get(
  "/getClientServiceHistory/:client_id/:txn_id",
  authenticateToken,
  getClientServiceHistory,
);

router.get(
  "/getClientServiceHistoryAssign/:client_id/:txn_id",
  authenticateToken,
  getClientServiceHistoryAssign,
);

router.get(
  "/getAllClientsTxnHistory",
  authenticateToken,
  getAllClientsTxnHistory,
);
router.get("/getAllBD", authenticateToken, getAllBD);

router.get("/getAllPlanData", authenticateToken, getPlanData);
router.get("/getAllPlanDataById/:id", getPlanDataById);
router.get("/getAllPlanDetails", authenticateToken, getPlanDetails);
router.get("/getAllPlanDetailsById/:id", authenticateToken, getPlanDetailsById);
router.get("/getPlanNotes", authenticateToken, getPlanNotes);
router.get(
  "/getClientNotesbyId/:client_id/:txn_id",
  authenticateToken,
  getClientNotesbyId,
);
router.get(
  "/getByIDComplimentaryData/:txn_id/:client_id",
  authenticateToken,
  getByIDComplimentaryData,
);

router.get(
  "/getinInvoiceServiceHistory/:client_id/:txn_id",
  authenticateToken,
  getinInvoiceServiceHistory,
);
router.get(
  "/getAllInvoiceServiceHistory/:client_id/:txn_id",
  authenticateToken,
  getAllInvoiceServiceHistory,
);
router.get(
  "/getComplimentaryInvoiceData/:txn_id/:client_id",
  authenticateToken,
  getComplimentaryInvoiceData,
);
// >>>>>>>>>> BD GET API's <<<<<<<<<<<
router.get("/getClientDetailsEmp/:dg_employee", getClientDetailsEmp);

router.get(
  "/getClientsTxnByEmployee/:dg_employee",
  authenticateToken,
  getClientsTxnHistoryByEmployee,
);
//NEW work
router.get("/retrieveUser", authenticateToken, retrieveUser);
router.get("/getAssignmentByTxn/:txn_id", getAssignmentByTxn);
router.get("/getAssignedQuotations", authenticateToken, getAssignedQuotations);
router.get(
  "/assigned-quotations/by-employee/:employee_name",
  authenticateToken,
  getAssignedQuotationsByEmployeeName,
);
router.get("/progress/by-txn/:txn_id", getProgressByTxn);
router.get("/retrieveTeam", retrieveTeam);
router.get("/retrieveTeamById/:id", retrieveTeamById);
router.get("/getAssignmentsSummary/:txn_id", getAssignmentsSummary);
router.get("/requirements", authenticateToken, getRequirementsLink);
router.get("/getRequirementsDetail/:linkId", getRequirementsDetail);
router.get("/getNoteData", authenticateToken, getNoteData);
router.get(
  "/getByIDDiscountData/:client_id/:txn_id",
  authenticateToken,
  getByIDDiscountData,
);
router.get(
  "/getInvoiceByIdData/:client_id/:txn_id",
  authenticateToken,
  getInvoiceByIdData,
);
router.get(
  "/getInvoiceClientDetailsById/:client_id/:txn_id",
  authenticateToken,
  getInvoiceClientDetailsById,
);
router.get(
  "/getInvoiceGraphic/:txn_id/:client_id",
  authenticateToken,
  getInvoiceGraphic,
);
router.get(
  "/getInvoiceAdsCampaign/:txn_id/:client_id",
  authenticateToken,
  getInvoiceAdsCampaign,
);
router.get("/getInvoiceNoteData", authenticateToken, getInvoiceNoteData);
router.get(
  "/getInvoiceClientNotesbyId/:client_id/:txn_id",
  getInvoiceClientNotesbyId,
);
router.get("/getAllInvoice", authenticateToken, getAllInvoice);
router.get("/getAdditionByIdData/:client_id/:txn_id", getAdditionByIdData);
router.get(
  "/getRemainingAmountByIdData/:client_id/:txn_id",
  getRemainingAmountByIdData,
);
router.get(
  "/getSeoClientsWithKeywords",
  authenticateToken,
  getSeoClientsWithKeywords,
);
router.get("/getDiscountSetting", authenticateToken, getDiscountSetting);

// ---->  Get all routes END <----

// ---->  DELETE all routes START <----
router.delete("/deleteService/:service_id", deleteService);
router.delete("/deleteCategory/:category_id", deleteCategory);
router.delete("/deleteEditingType/:editing_type_id", deleteEditingType);
router.delete("/ads/delete/:id", deleteAdsServices);
router.delete(
  "/deleteAdsCampaignDetails/:txn_id/:client_id",
  deleteAdsCampaignDetails,
);
router.delete("/deleteAdsCampaignEntryById/:id", deleteAdsCampaignEntryById);
router.delete("/deleteGraphicEntryById/:id", deleteGraphicEntryById);

router.delete("/deleteClientById/:id", deleteClientById);

router.delete("/deleteQuotationById/:txn_id", deleteQuoatationById);

router.delete("/deletePlanNameDetail/:id", deletePlanNameDetail);

router.delete("/deletePlanNotesbyid/:id", deletePlanNotesbyid);

router.delete("/deletePlanDataByService/:id", deletePlanDataByService);

router.delete("/deletePlanbyChangeNotes/:txn_id", deletePlanbyChangeNotes);

router.delete("/deleteClientAllPlanData/:txn_id", deleteClientAllPlanData);

router.delete("/deletePlanClientNotes/:id", deletePlanClientNotes);

router.delete(
  "/removeMemberFromTeam/:teamId/members/:memberId",
  removeMemberFromTeam,
);

router.delete("/deleteTeam/:id", deleteTeam);

router.delete("/deleteComplimenatryById/:id", deleteComplimenatryById);
router.delete("/deleteNoteById/:id", deleteNoteById);
router.delete("/deleteDiscountById/:id", deleteDiscountById);
router.delete("/deleteInvoiceById/:id", deleteInvoiceById);
router.delete(
  "/deleteAllInvoiceServiceHistory/:client_id/:txn_id",
  deleteAllInvoiceServiceHistory,
);
router.delete(
  "/deleteInvoiceAdsCampaignEntryById/:id",
  deleteInvoiceAdsCampaignEntryById,
);
router.delete("/deleteInvoiceNoteById/:id", deleteInvoiceNoteById);
router.delete("/deleteInvoiceClientNotes/:id", deleteInvoiceClientNotes);
router.delete(
  "/deleteInvoiceComplimenatryById/:id",
  deleteInvoiceComplimenatryById,
);
router.delete("/deleteAdditionalById/:id", deleteAdditionalById);
router.delete("/deleteRemainingAmountById/:id", deleteRemainingAmountById);
router.delete("/deleteDiscountSettingById/:id", deleteDiscountSettingById);

router.delete("/deleteRequirementsBundle/:linkId", deleteRequirementsBundle);
router.delete("/deleteSeoClient/:clientId", deleteSeoClient);
router.delete("/deleteSeoKeyword/:keywordId", deleteSeoKeyword);

// ---->  DELETE all routes END <----

// ---->  UPDATE all routes START <----
router.put("/updateService/:service_id", updateService);
router.put("/updateCategory/:category_id", updateCategory);
router.put("/updateEditingType/:editing_type_id", updateEditingType);
router.put("/updateGraphicEntryById/:id", updateCalculatorDataById);
router.put("/updateClientDetails/:id", updateClientDetails);
router.put("/updatePlanData/:id", updatePlandata);
router.put("/updatePlanName/:id", updatePlanNameDetail);
router.put("/updatePlanNotes/:id", updatePlanNotes);
router.put("/updateServiceData/:editing_type_id", updateServiceData);
router.put("/reassignQuotation", reassignQuotation);
router.put("/updateComplimenatryDataById/:id", updateComplimenatryDataById);
router.put("/updateNoteDataById/:id", updateNoteDataById);
router.put("/updateClientNoteDataById/:id", updateClientNoteDataById);
router.put("/updateDiscountDataById/:id", updateDiscountDataById);
router.put("/updateInvoiceDataById/:id", updateInvoiceDataById);
router.put("/updateInvoiceNoteDataById/:id", updateInvoiceNoteDataById);
router.put(
  "/updateInvoiceClientNoteDataById/:id",
  updateInvoiceClientNoteDataById,
);
router.put(
  "/updateInvoiceComplimenatryDataById/:id",
  updateInvoiceComplimenatryDataById,
);

// router.put("/updateAdditionalDataById/:id", updateAdditionalDataById);
router.put("/updateRemainingDataById/:id", updateRemainingDataById);
router.put("/updateDiscountSettingDataById/:id", updateDiscountSettingDataById);

// ? quotation approval status update

router.put(
  "/updateQuotationApprovalStatus",
  authenticateToken,
  updateQuotationApprovalStatus,
);

// router.put("/reassignQuotation", reassignQuotation);
router.put("/updateSeoClient/:clientId", updateSeoClient);
router.put("/updateSeoKeyword/:keywordId", updateSeoKeyword);
// ---->  UPDATE all routes END <----

router.get("/optional-service-amounts", optionalServiceAmounts);

router.patch("/progress/set-done", setDoneQty);
router.patch("/progress/increment", incrementDoneQty);

// ---- Proposal Routes ----
router.post("/proposal", authenticateToken, createProposal);
router.put("/proposal/:id", authenticateToken, updateProposal);
router.get("/proposal/:id", authenticateToken, getProposalById);
router.get("/proposals/all", authenticateToken, getAllProposals);
router.get(
  "/proposals/client/:clientId",
  authenticateToken,
  getProposalsByClient,
);
router.delete("/proposal/:id", authenticateToken, deleteProposal);
router.put("/proposal/:id/status", authenticateToken, updateProposalStatus);
router.post("/proposal/:id/pdf", authenticateToken, generateProposalPdf);
router.post("/proposal/:id/send", authenticateToken, sendProposalToClient);
router.put(
  "/proposal/:id/mark-payment-received",
  authenticateToken,
  markPaymentReceived,
);
router.get(
  "/proposal/:id/payment-summary",
  authenticateToken,
  getProposalPaymentSummary,
);

// ---- Proforma Routes ----
router.post("/proforma", authenticateToken, createProforma);
router.get("/revenue/history", authenticateToken, getRevenueHistory);
router.get("/proforma/final-invoices", authenticateToken, getFinalInvoices);
router.post(
  "/proforma/:proforma_id/generate-invoice",
  authenticateToken,
  generateInvoiceFromProforma,
);
router.get(
  "/proforma/client/:clientId",
  authenticateToken,
  getProformasByClient,
);
router.get(
  "/proforma/proposal/:proposalId",
  authenticateToken,
  getProformasByProposal,
);
router.get("/proforma/all", authenticateToken, getAllProformas);
router.delete("/proforma/:id", authenticateToken, deleteProforma);

// ---- Proposal Invoices ----
router.get("/proposal-invoices", authenticateToken, getProposalInvoices);
router.post("/generate-invoice", generateInvoicePdf);

// ---- Payment Routes ----
router.post("/proposal-payment", authenticateToken, recordProposalPayment);
router.put("/proposal-payment/approve/:id", authenticateToken, approvePayment);
router.put("/proposal-payment/:id/approve", authenticateToken, approvePayment);
router.get(
  "/proposal-payments/client/:clientId",
  authenticateToken,
  getPaymentRecordsByClient,
);
router.get("/proposal-payments/all", authenticateToken, getAllPaymentRecords);

// router.get("/pagespeedReportpdf", pagespeedReportpdf);
// router.get("/pagespeedReportpdf", fullSEOReport);

module.exports = router;
