import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API_BASE_URL from "../config/apiBaseUrl";
import axios from "axios";
import img3 from "../assets/DOAGURU IT Solution.png";

export default function PublicProposal() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchPublicProposal = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/api/re_calculator/public/proposal/${token}`);
        const result = await response.json();

        if (response.ok && result.status === "Success") {
          setData(result.data);
          setStatus(200);
        } else {
          setError(result.message || "Failed to load proposal");
          setStatus(response.status);
        }
      } catch (err) {
        console.error("Error fetching public proposal:", err);
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchPublicProposal();
    }
  }, [token]);

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      
      // Open window immediately to prevent popup blocker
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write("<h2>Generating PDF, please wait...</h2>");
      }
      
      const res = await axios.post(`${API_BASE_URL}/auth/api/re_calculator/public/proposal/${token}/pdf`, {});
      
      if (res.data.status === "Success" && res.data.html) {
        if (printWindow) {
          printWindow.document.open();
          printWindow.document.write(res.data.html);
          printWindow.document.close();
          
          // Extract title to set as PDF filename
          const titleMatch = res.data.html.match(/<title>(.*?)<\/title>/i);
          const docTitle = titleMatch ? titleMatch[1] : "Proposal";
          printWindow.document.title = docTitle;
          
          // Allow base64 images to render before printing
          printWindow.onload = () => {
            printWindow.focus();
            setTimeout(() => {
              printWindow.print();
            }, 500);
          };
        }
      } else {
        if (printWindow) printWindow.close();
        throw new Error(res.data.message || "Failed to generate PDF");
      }
    } catch (err) {
      console.error(err);
      alert("Error downloading PDF: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl font-semibold text-gray-600 animate-pulse">Loading Proposal...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full border border-gray-100">
          <img src={img3} alt="Doaguru" className="w-32 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {status === 404 ? "Proposal Not Found" : status === 403 ? "Access Denied" : "Error"}
          </h1>
          <p className="text-gray-600 mb-6">
            {status === 404 
              ? "The requested proposal does not exist." 
              : status === 403 
                ? "This link has expired or been revoked due to a newer version." 
                : error}
          </p>
          <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
            Please contact support or request a new link from your account manager.
          </div>
        </div>
      </div>
    );
  }

  const parseJson = (str, fallback) => {
    if (typeof str === 'object' && str !== null) return str;
    if (!str) return fallback;
    try { return JSON.parse(str); } catch (e) { return fallback; }
  };

  const sections = parseJson(data.sections_json, {});
  const pricing = parseJson(data.pricing_table_json, []);
  const terms = parseJson(data.terms_notes_json, []);
  
  const clientName = data.client_name || '';
  const organization = data.company_name || '';
  
  const getBillablePricingTotal = (table = []) =>
    table.reduce((sum, row) => {
      if (row?.include_in_total === false) return sum;
      return sum + (Number(row?.total_price) || 0);
    }, 0);

  const subTotal = getBillablePricingTotal(pricing);
  const pricingDiscount = sections.pricing_discount || {};
  const discountVal = Number(pricingDiscount.value) || 0;
  const discountType = pricingDiscount.type || "Amount";
  const discountAmt = discountType === 'Percentage' ? ((subTotal * discountVal) / 100) : discountVal;

  const cover = typeof sections.cover_page === 'object' ? sections.cover_page : {};
  const propType = data.proposal_type === 'digital_marketing' ? 'Digital Marketing Proposal For' : 'Development Proposal For';
  const duration = cover.duration || '1 Month';
  const propDate = cover.proposal_date || new Date(data.created_at || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const validity = cover.proposal_validity || '7 Days';
  const prepBy = cover.prepared_by || 'DOAGuru InfoSystems';
  const web = cover.website || 'www.doaguru.com';
  const approval = sections.approval_acceptance || {};
  const toggles = parseJson(data.optional_toggles, {}) || {};

  const isSectionIncluded = (key) => {
    const optionalKeys = [
      "client_problem",
      "strategy_overview",
      "timeline",
      "expected_results",
      "additional_remarks",
      "client_instructions",
      "why_choose_us"
    ];
    if (optionalKeys.includes(key)) {
      return toggles[key] === true || toggles[key] === 'true';
    }
    return true;
  };

  const renderContent = (content) => {
    if (!content) return null;
    const htmlContent = typeof content === 'object' ? content.content : content;
    if (!htmlContent) return null;
    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
  };

  const hasContent = (content) => {
    if (!content) return false;
    const htmlContent = typeof content === 'object' ? content.content : content;
    return !!htmlContent && htmlContent.trim() !== "";
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center">
        <div></div>
        <button 
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {downloading ? "Generating PDF..." : "Download Full PDF"}
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden border border-slate-100">
        
        <div className="p-8 md:p-16">
          {/* Header Info Table */}
          <div className="mb-16">
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-cyan-600 text-center mb-10 tracking-tight leading-tight">
              {propType} {(organization ? organization : clientName).toUpperCase()}
            </h1>
            
            <div className="max-w-2xl mx-auto bg-slate-50/50 rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm">
              <table className="w-full text-slate-700">
                <tbody className="divide-y divide-slate-100/50">
                  <tr><td className="py-3 font-semibold text-slate-800 w-2/5">Client Name:</td><td className="py-3">{clientName}</td></tr>
                  <tr><td className="py-3 font-semibold text-slate-800">Organization:</td><td className="py-3">{organization}</td></tr>
                  <tr><td className="py-3 font-semibold text-slate-800">Duration:</td><td className="py-3">{duration}</td></tr>
                  <tr><td className="py-3 font-semibold text-slate-800">Proposal Date:</td><td className="py-3">{propDate}</td></tr>
                  <tr><td className="py-3 font-semibold text-slate-800">Proposal Validity:</td><td className="py-3">{validity}</td></tr>
                  <tr><td className="py-3 font-semibold text-slate-800">Prepared By:</td><td className="py-3 text-blue-700 font-medium">{prepBy}</td></tr>
                  <tr><td className="py-3 font-semibold text-slate-800">Website:</td><td className="py-3"><a href={`https://${web}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{web}</a></td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <style>
            {`
              /* Prose styling for injected HTML */
              .prose-custom p { margin-bottom: 1rem; color: #475569; line-height: 1.7; }
              .prose-custom ul { padding-left: 1.5rem; margin-bottom: 1rem; color: #475569; list-style-type: disc; }
              .prose-custom li { margin-bottom: 0.5rem; }
              .prose-custom strong { color: #1e293b; font-weight: 600; }
              .prose-custom h3, .prose-custom h4 { color: #0f172a; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; }
            `}
          </style>

          {/* Section Render Helper */}
          {(() => {
            const SectionTitle = ({ children }) => (
              <h2 className="text-xl font-bold text-blue-900 uppercase tracking-wide border-b-2 border-blue-100 pb-3 mt-14 mb-8 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm shadow-sm border border-blue-100/50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                </span>
                {children}
              </h2>
            );

            return (
              <div className="space-y-4">
                {/* 2. Executive Summary */}
                {isSectionIncluded("executive_summary") && hasContent(sections.executive_summary) && (
                  <div>
                    <SectionTitle>Executive Summary</SectionTitle>
                    <div className="prose-custom">
                      {renderContent(sections.executive_summary || sections.problem_statement)}
                    </div>
                  </div>
                )}

                {/* 3. About Us */}
                {isSectionIncluded("about_us") && hasContent(sections.about_us) && (
                  <div>
                    <SectionTitle>About Us</SectionTitle>
                    <div className="prose-custom">
                      {renderContent(sections.about_us)}
                    </div>
                  </div>
                )}

                {/* 4. Client's Problem */}
                {isSectionIncluded("client_problem") && hasContent(sections.client_problem) && (
                  <div>
                    <SectionTitle>Understanding Client's Problem</SectionTitle>
                    <div className="prose-custom">
                      {renderContent(sections.client_problem)}
                    </div>
                  </div>
                )}

                {/* 5. Proposed Solution */}
                {isSectionIncluded("proposed_solution") && hasContent(sections.proposed_solution) && (
                  <div>
                    <SectionTitle>Proposed Solution</SectionTitle>
                    <div className="prose-custom">
                      {renderContent(sections.proposed_solution)}
                    </div>
                  </div>
                )}

                {/* 6. Scope of Work */}
                {isSectionIncluded("scope_of_work") && (
                  <div>
                    <SectionTitle>Scope of Work</SectionTitle>
                    {pricing && pricing.length > 0 ? (
                      <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                        <table className="w-full text-left text-sm text-slate-600">
                          <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs tracking-wider border-b border-slate-200">
                            <tr>
                              <th className="px-6 py-4">Service Category</th>
                              <th className="px-6 py-4">Service Name</th>
                              <th className="px-6 py-4 text-center w-32">Quantity</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {pricing.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-800">{item.category_name || '-'}</td>
                                <td className="px-6 py-4 text-slate-700">{item.service_name || item.service || '-'}</td>
                                <td className="px-6 py-4 text-center">
                                  <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium text-xs">
                                    {item.quantity || '-'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-slate-500 italic px-4 py-3 bg-slate-50 rounded-lg border border-slate-100">No deliverables added yet.</p>
                    )}
                  </div>
                )}

                {/* 7. Strategy Overview */}
                {isSectionIncluded("strategy_overview") && hasContent(sections.strategy_overview) && (
                  <div>
                    <SectionTitle>Strategy Overview</SectionTitle>
                    <div className="prose-custom">
                      {renderContent(sections.strategy_overview)}
                    </div>
                  </div>
                )}

                {/* 8. Timeline & Milestones */}
                {isSectionIncluded("timeline") && Array.isArray(sections.timeline) && sections.timeline.length > 0 && (
                  <div>
                    <SectionTitle>Timeline & Milestones</SectionTitle>
                    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                      <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4 w-1/3">Milestone Title</th>
                            <th className="px-6 py-4 w-1/4">Duration</th>
                            <th className="px-6 py-4">Deliverables / Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sections.timeline.map((m, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-semibold text-slate-800">{m.title || ''}</td>
                              <td className="px-6 py-4 text-blue-600 font-medium">{m.duration || ''}</td>
                              <td className="px-6 py-4 text-slate-700">{m.deliverables || ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 9. Expected Results */}
                {isSectionIncluded("expected_results") && hasContent(sections.expected_results) && (
                  <div>
                    <SectionTitle>Expected Results</SectionTitle>
                    <div className="prose-custom">
                      {renderContent(sections.expected_results)}
                    </div>
                  </div>
                )}

                {/* 10. Pricing & Investment */}
                {isSectionIncluded("pricing_investment") && pricing && pricing.length > 0 && (
                  <div>
                    <SectionTitle>Pricing & Investment</SectionTitle>
                    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                      <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4">Service / Item</th>
                            <th className="px-6 py-4 text-center w-32">Quantity</th>
                            <th className="px-6 py-4 text-right w-48">Total Price (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {pricing.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-medium text-slate-800">{item.service || ''}</td>
                              <td className="px-6 py-4 text-center text-slate-700">{item.quantity || 1}</td>
                              <td className="px-6 py-4 text-right text-slate-700 font-medium">
                                ₹ {Number(item.total_price || 0).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t border-slate-200">
                          {discountVal > 0 && (
                            <>
                              <tr className="bg-slate-50/50">
                                <td colSpan="2" className="px-6 py-4 text-right font-semibold text-slate-600">Subtotal (Excl. GST)</td>
                                <td className="px-6 py-4 text-right font-bold text-slate-800">₹ {subTotal.toLocaleString('en-IN')}</td>
                              </tr>
                              <tr className="bg-slate-50/50">
                                <td colSpan="2" className="px-6 py-3 text-right font-medium text-rose-500">
                                  Discount ({discountType === 'Percentage' ? `${discountVal}%` : '₹'})
                                </td>
                                <td className="px-6 py-3 text-right font-bold text-rose-500">
                                  - ₹ {discountAmt.toLocaleString('en-IN')}
                                </td>
                              </tr>
                            </>
                          )}
                          <tr className="bg-blue-50/80">
                            <td colSpan="2" className="px-6 py-5 text-right font-bold text-blue-900 text-base uppercase tracking-wide">
                              Grand Total (Excl. GST)
                            </td>
                            <td className="px-6 py-5 text-right font-black text-blue-900 text-lg">
                              ₹ {Number(data.grand_total_excl_gst || (subTotal - discountAmt)).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* 11 & 12. Notes and T&C */}
                {isSectionIncluded("combined_notes_tc") && (
                  <div>
                    {(sections.notes_selection || (terms && terms.length > 0)) && (
                      <>
                        <SectionTitle>Notes & Terms</SectionTitle>
                        <div className="bg-amber-50/50 rounded-xl p-6 md:p-8 border border-amber-100/50">
                          <ul className="space-y-4">
                            {(() => {
                              const rawNotes = sections.notes_selection || terms; 
                              const notesList = (Array.isArray(rawNotes) ? rawNotes : [])
                                .map((note) => note?.note_name || note?.note_text || note?.text || String(note || ""))
                                .filter(Boolean);
                              
                              return notesList.map((text, idx) => {
                                let cleanText = String(text).trim();
                                if (cleanText.startsWith('- ') || cleanText.startsWith('• ')) {
                                  cleanText = cleanText.substring(2).trim();
                                }
                                if (!cleanText) return null;
                                return (
                                  <li key={idx} className="flex gap-4 text-slate-700 leading-relaxed">
                                    <div className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-amber-400"></div>
                                    <div>{cleanText}</div>
                                  </li>
                                );
                              });
                            })()}
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                {/* 13. Additional Remarks */}
                {isSectionIncluded("additional_remarks") && hasContent(sections.additional_remarks) && (
                  <div>
                    <SectionTitle>Additional Remarks</SectionTitle>
                    <div className="prose-custom bg-slate-50/50 p-6 rounded-xl border border-slate-100">
                      {renderContent(sections.additional_remarks)}
                    </div>
                  </div>
                )}

                {/* 14. Client Instructions */}
                {isSectionIncluded("client_instructions") && hasContent(sections.client_instructions) && (
                  <div>
                    <SectionTitle>Client Instructions</SectionTitle>
                    <div className="prose-custom bg-slate-50/50 p-6 rounded-xl border border-slate-100">
                      {renderContent(sections.client_instructions)}
                    </div>
                  </div>
                )}

                {/* 15. Why Choose Us */}
                {isSectionIncluded("why_choose_us") && hasContent(sections.why_choose_us) && (
                  <div>
                    <SectionTitle>Why Choose Us</SectionTitle>
                    <div className="prose-custom">
                      {renderContent(sections.why_choose_us)}
                    </div>
                  </div>
                )}

                {/* Approval Block */}
                <div className="mt-20 pt-12 border-t border-slate-200">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 text-center">Approval & Acceptance</h2>
                  <p className="text-slate-500 text-center mb-16">By signing below, you agree to the terms and scope of work outlined in this proposal.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8">
                    <div className="bg-slate-50/80 p-8 rounded-2xl border border-slate-100">
                      <div className="border-t-2 border-slate-400 w-full mb-6 pt-4 text-lg font-bold text-slate-800 tracking-wide text-center">
                        Authorized Client Signature
                      </div>
                      <div className="space-y-4 text-slate-600">
                        <p className="flex items-center gap-3"><span className="font-semibold text-slate-800 w-24">Name:</span> {approval.client_signatory_name || "______________________"}</p>
                        <p className="flex items-center gap-3"><span className="font-semibold text-slate-800 w-24">Designation:</span> {approval.client_signatory_designation || "______________________"}</p>
                        <p className="flex items-center gap-3"><span className="font-semibold text-slate-800 w-24">Date:</span> ______________________</p>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50/50 p-8 rounded-2xl border border-blue-100/50">
                      <div className="border-t-2 border-blue-400 w-full mb-6 pt-4 text-lg font-bold text-blue-900 tracking-wide text-center">
                        DOAGuru InfoSystems
                      </div>
                      <div className="space-y-4 text-blue-900/80">
                        <p className="flex items-center gap-3"><span className="font-semibold text-blue-900 w-24">Name:</span> {approval.our_signatory_name || "______________________"}</p>
                        <p className="flex items-center gap-3"><span className="font-semibold text-blue-900 w-24">Designation:</span> {approval.our_signatory_designation || "______________________"}</p>
                        <p className="flex items-center gap-3"><span className="font-semibold text-blue-900 w-24">Date:</span> ______________________</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
