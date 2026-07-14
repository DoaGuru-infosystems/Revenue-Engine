            <div
              style={ {
                position: "fixed",
                inset: 0,
                zIndex: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                // background: "rgba(0,0,0,0.85)",
                // backdropFilter: "blur(16px)",
              } }
              onClick={ handleCloseInvoiceClient }
            >
              <div
                style={ {
                  position: "relative",
                  width: "100%",
                  maxWidth: 980,
                  background: "#0a0b14",
                  border: "1px solid rgba(99,102,241,0.25)",
                  borderRadius: 24,
                  overflow: "hidden",
                  maxHeight: "92vh",
                  boxShadow:
                    "0 40px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04)",
                  animation: "fadeUp 0.3s ease both",
                } }
                onClick={ (e) => e.stopPropagation() }
              >
                {/* Modal Header */ }
                <div
                  style={ {
                    padding: "1.25rem 1.5rem",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "rgba(99,102,241,0.05)",
                  } }
                >
                  <div style={ { display: "flex", alignItems: "center", gap: 12 } }>
                    <div
                      style={ {
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: "rgba(99,102,241,0.15)",
                        border: "1px solid rgba(99,102,241,0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      } }
                    >
                      <FilePlus2 size={ 18 } style={ { color: "#a5b4fc" } } />
                    </div>
                    <div>
                      <div style={ { fontSize: 16, fontWeight: 700, color: "#fff" } }>Generate Proforma Invoice</div>
                      <div style={ { fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 } }>
                        For:{ " " }
                        <span style={ { color: "#a5b4fc", fontWeight: 600 } }>
                          { clientData?.client_name }
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={ handleCloseInvoiceClient }
                    style={ {
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 8,
                      padding: 6,
                      color: "rgba(255,255,255,0.4)",
                      cursor: "pointer",
                      display: "flex",
                      transition: "all 0.2s",
                    } }
                  >
                    <X size={ 18 } />
                  </button>
                </div>

                {/* Client Info Strip */ }
                <div
                  style={ {
                    padding: "12px 24px",
                    background: "rgba(52,211,153,0.05)",
                    borderBottom: "1px solid rgba(52,211,153,0.1)",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    flexWrap: "wrap",
                  } }
                >
                  <div style={ { display: "flex", alignItems: "center", gap: 6, fontSize: 12 } }>
                    <Hash size={ 12 } style={ { color: "rgba(52,211,153,0.6)" } } />
                    <span
                      style={ {
                        color: "rgba(255,255,255,0.35)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        fontSize: 10,
                      } }
                    >
                      { selectedProposalForProforma ? 'PROPOSAL:' : 'TXN:' }
                    </span>
                    <span
                      style={ {
                        color: "#6ee7b7",
                        fontFamily: "monospace",
                        fontWeight: 700,
                        fontSize: 11,
                      } }
                    >
                      { selectedProposalForProforma ? `PRP-${selectedProposalForProforma.id}` : selectedTxn }
                    </span>
                  </div>
                  { clientData?.client_organization && (
                    <div style={ { display: "flex", alignItems: "center", gap: 6, fontSize: 12 } }>
                      <Building2 size={ 12 } style={ { color: "rgba(184,150,46,0.5)" } } />
                      <span style={ { color: "rgba(255,255,255,0.45)" } }>
                        { clientData?.client_organization }
                      </span>
                    </div>
                  ) }
                  { clientData?.phone && (
                    <div style={ { display: "flex", alignItems: "center", gap: 6, fontSize: 12 } }>
                      <Phone size={ 12 } style={ { color: "rgba(184,150,46,0.5)" } } />
                      <span style={ { color: "rgba(255,255,255,0.45)" } }>{ clientData?.phone }</span>
                    </div>
                  ) }
                </div>

                {/* Form */ }
                <form
                  onSubmit={ handleCreateInvoice }
                  style={ {
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    maxHeight: "78vh",
                    overflowY: "auto",
                  } }
                  className="ci-scroll"
                >
                  {/* Select Proposal Dropdown (Only for Proposals) */ }
                  { selectedProposalForProforma && (
                    <div style={ { marginBottom: 16 } }>
                      <label className="ci-label">Select Proposal</label>
                      <div className="ci-input-icon">
                        <select
                          className="ci-input"
                          value={ selectedProposalForProforma?.id || "" }
                          onChange={ (e) => {
                            const prop = proposals.find(p => p.id === parseInt(e.target.value));
                            if (prop) handleCreateProformaFromProposal(prop);
                          } }
                        >
                          { proposals.map(p => (
                            <option key={ p.id } value={ p.id }>Proposal #{ p.id } - { p.grand_total_excl_gst } INR ({ p.proposal_type })</option>
                          )) }
                        </select>
                        <ChevronDown className="chevron" />
                      </div>
                    </div>
                  ) }

                  {/* Bill Type + Payment Mode */ }
                  <div className="ci-grid-2">
                    <div>
                      <label className="ci-label">Bill Type</label>
                      <div className="ci-input-icon">
                        <select
                          name="bill_type"
                          value={ formData.bill_type }
                          onChange={ handleChange }
                          className="ci-input"
                          required
                        >
                          <option value="NON_GST">Non-GST Bill</option>
                          <option value="GST">GST Bill</option>
                        </select>
                        <ChevronDown className="chevron" />
                      </div>
                    </div>
                    <div>
                      <label className="ci-label">Payment Mode</label>
                      <div className="ci-input-icon">
                        <CreditCard className="icon" />
                        <select
                          name="payment_mode"
                          value={ formData.payment_mode }
                          onChange={ handleChange }
                          className="ci-input"
                          required
                        >
                          <option value="">Select mode</option>
                          { ["Payment Cheque", "Net Banking", "UPI", "Cash"].map((m) => (
                            <option key={ m } value={ m }>
                              { m }
                            </option>
                          )) }
                        </select>
                        <ChevronDown className="chevron" />
                      </div>
                    </div>
                  </div>

                  {/* Duration */ }
                  <div className="ci-grid-2">
                    <div>
                      <label className="ci-label">
                        <CalendarDays size={ 14 } style={ { marginRight: 4, verticalAlign: "middle", opacity: 0.6 } } />
                        Duration Start
                      </label>
                      <div style={ { position: "relative" } }>
                        <input
                          ref={ qtStartRef }
                          type="date"
                          name="duration_start_date"
                          value={ formData.duration_start_date }
                          onChange={ handleChange }
                          className="ci-input ci-date-input"
                          style={ { colorScheme: "dark", paddingRight: 42 } }
                          required
                        />
                        <button
                          type="button"
                          onClick={ () => openDatePicker(qtStartRef) }
                          className="ci-date-btn"
                        >
                          <CalendarDays size={ 14 } />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="ci-label">
                        <CalendarDays size={ 14 } style={ { marginRight: 4, verticalAlign: "middle", opacity: 0.6 } } />
                        Duration End
                      </label>
                      <div style={ { position: "relative" } }>
                        <input
                          ref={ qtEndRef }
                          type="date"
                          name="duration_end_date"
                          value={ formData.duration_end_date }
                          min={ formData.duration_start_date || undefined }
                          onChange={ handleChange }
                          className="ci-input ci-date-input"
                          style={ { colorScheme: "dark", paddingRight: 42 } }
                          required
                        />
                        <button
                          type="button"
                          onClick={ () => openDatePicker(qtEndRef) }
                          className="ci-date-btn"
                        >
                          <CalendarDays size={ 14 } />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* GST / PAN */ }
                  { formData.bill_type === "GST" && (
                    <div>
                      <label className="ci-label">Client GST Number</label>
                      <input
                        name="client_gst_no"
                        value={ formData.client_gst_no }
                        onChange={ handleChange }
                        placeholder="Enter GST number"
                        maxLength={ 15 }
                        required
                        className="ci-input"
                      />
                    </div>
                  ) }
                  { formData.bill_type === "NON_GST" && (
                    <div>
                      <label className="ci-label">
                        Client PAN Number{ " " }
                        <span
                          style={ {
                            fontSize: 10,
                            color: "rgba(255,255,255,0.2)",
                            fontWeight: 400,
                            textTransform: "none",
                          } }
                        >
                          (optional)
                        </span>
                      </label>
                      <input
                        name="client_pan_no"
                        value={ formData.client_pan_no }
                        onChange={ handleChange }
                        placeholder="Enter PAN number"
                        maxLength={ 10 }
                        className="ci-input"
                      />
                    </div>
                  ) }

                  {/* Quotation Services Preview */ }
                  <div>
                    <label className="ci-label">Quotation Services Preview</label>
                    { quotationPreviewLoading && (
                      <div style={ { textAlign: "center", color: "rgba(255,255,255,0.5)", padding: "1rem 0" } }>
                        Loading services...
                      </div>
                    ) }
                    { !quotationPreviewLoading && quotationServicesPreview.length === 0 && (
                      <div style={ { textAlign: "center", color: "rgba(255,255,255,0.5)", padding: "1rem 0" } }>
                        No services found for this quotation.
                      </div>
                    ) }
                    { !quotationPreviewLoading && quotationServicesPreview.length > 0 && (() => {
                      const dmServices = quotationServicesPreview.filter(
                        (s) => s.service_type !== "Ads Campaign" &&
                          !s.is_complimentary &&
                          String(s.service_name || "").toLowerCase() !== "complimentary" &&
                          String(s.category_name || "").toLowerCase() !== "complimentary"
                      );
                      const adsServices = quotationServicesPreview.filter(
                        (s) => s.service_type === "Ads Campaign"
                      );
                      const complimentaryServices = quotationServicesPreview.filter(
                        (s) =>
                          s.is_complimentary ||
                          String(s.service_name || "").toLowerCase() === "complimentary" ||
                          String(s.category_name || "").toLowerCase() === "complimentary"
                      );

                      const dmTotal = dmServices.reduce((sum, svc) => {
                        const qty = Number(svc.quantity || 1);
                        const basePrice = Number(svc.editing_type_amount || svc.amount || 0);
                        const cp = Number(svc.include_content_posting || 0);
                        const th = Number(svc.include_thumbnail_creation || 0);
                        const yt = Number(svc.include_youtube_video_posting || 0);
                        return sum + (basePrice * qty) + (cp * qty) + (th * qty) + (yt * qty);
                      }, 0);

                      const isProposalSource = !!selectedProposalForProforma;
                      const adsTotal = adsServices.reduce((sum, svc) => sum + calcAdsRowTotal(svc, isProposalSource), 0);

                      // Extract discount from proposal's sections_json.pricing_discount
                      let discountAmt = 0;
                      if (selectedProposalForProforma) {
                        try {
                          const sectionsData = typeof selectedProposalForProforma.sections_json === 'string'
                            ? JSON.parse(selectedProposalForProforma.sections_json)
                            : selectedProposalForProforma.sections_json;
                          const pd = sectionsData?.pricing_discount;
                          if (pd && Number(pd.value) > 0) {
                            if (pd.type === 'Percentage') {
                              discountAmt = (dmTotal * Number(pd.value)) / 100;
                            } else {
                              discountAmt = Number(pd.value);
                            }
                          }
                        } catch (e) { /* ignore */ }
                      }

                      const isGST = formData.bill_type === "GST";
                      const dmTotalAfterDiscount = Math.max(0, dmTotal - discountAmt);
                      const dmGstAmount = isGST ? dmTotalAfterDiscount * 0.18 : 0;
                      const dmSubtotalWithGst = dmTotalAfterDiscount + dmGstAmount;

                      const grandTotal = dmSubtotalWithGst + adsTotal;

                      const thBase = { textAlign: "left", padding: "9px 12px", fontSize: 11, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.08)" };
                      const thR = { ...thBase, textAlign: "right" };
                      const tdL = { padding: "8px 12px", fontSize: 12, borderBottom: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.85)" };
                      const tdR = { ...tdL, textAlign: "right" };
                      const tdR2 = { ...tdL, textAlign: "right", color: "#e8e8f0" };

                      return (
                        <div style={ { display: "flex", flexDirection: "column", gap: 14 } }>

                          {/* ── DM Service Table ── */ }
                          { dmServices.length > 0 && (
                            <div style={ { border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden", background: "rgba(255,255,255,0.02)" } }>
                              <div style={ { maxHeight: 220, overflow: "auto" } } className="ci-scroll">
                                <table style={ { width: "100%", borderCollapse: "collapse", fontSize: 12 } }>
                                  <thead>
                                    <tr style={ { background: "rgba(99,102,241,0.12)" } }>
                                      <th style={ { ...thBase, color: "#c7d2fe" } }>DM Service</th>
                                      <th style={ { ...thBase, color: "#c7d2fe" } }>Service Name</th>
                                      <th style={ { ...thR, color: "#c7d2fe" } }>Qty</th>
                                      <th style={ { ...thR, color: "#c7d2fe" } }>Price (₹)</th>
                                      <th style={ { ...thR, color: "#c7d2fe" } }>Total (₹)</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    { dmServices.map((svc, idx) => {
                                      const qty = Number(svc.quantity || 1);
                                      const basePrice = Number(svc.editing_type_amount || svc.amount || 0);
                                      const cp = Number(svc.include_content_posting || 0);
                                      const th2 = Number(svc.include_thumbnail_creation || 0);
                                      const yt2 = Number(svc.include_youtube_video_posting || 0);
                                      return (
                                        <React.Fragment key={ `dm-${idx}` }>
                                          <tr>
                                            <td style={ { ...tdL, color: "#f97316", fontWeight: 500 } }>{ (svc.service_name && svc.service_name.toLowerCase() === "proposal item") ? (svc.category_name || svc.service_name) : (svc.service_name || "N/A") }</td>
                                            <td style={ tdL }>{ getServiceDisplayName((svc.editing_type_name && svc.editing_type_name.toLowerCase() === "proposal item") ? (svc.service || svc.category_name || svc.editing_type_name) : (svc.editing_type_name || svc.category_name || "N/A")) }</td>
                                            <td style={ tdR2 }>{ qty }</td>
                                            <td style={ tdR2 }>₹{ basePrice.toLocaleString("en-IN") }</td>
                                            <td style={ tdR2 }>₹{ (basePrice * qty).toLocaleString("en-IN") }</td>
                                          </tr>
                                          { th2 > 0 && (
                                            <tr style={ { background: "rgba(103, 11, 11, 0.02)" } }>
                                              <td style={ { ...tdL, color: "#f97316", fontWeight: 500 } }>Thumbnail Creation Total</td>
                                              <td style={ tdL }></td>
                                              <td style={ tdR2 }>{ qty }</td>
                                              <td style={ tdR2 }>₹{ th2.toLocaleString("en-IN") }</td>
                                              <td style={ tdR2 }>₹{ (th2 * qty).toLocaleString("en-IN") }</td>
                                            </tr>
                                          ) }
                                          { cp > 0 && (
                                            <tr style={ { background: "rgba(255,255,255,0.02)" } }>
                                              <td style={ { ...tdL, color: "#f97316", fontWeight: 500 } }>Meta Growth & Content Management Total</td>
                                              <td style={ tdL }></td>
                                              <td style={ tdR2 }>{ qty }</td>
                                              <td style={ tdR2 }>₹{ cp.toLocaleString("en-IN") }</td>
                                              <td style={ tdR2 }>₹{ (cp * qty).toLocaleString("en-IN") }</td>
                                            </tr>
                                          ) }
                                          { yt2 > 0 && (
                                            <tr style={ { background: "rgba(255,255,255,0.02)" } }>
                                              <td style={ { ...tdL, color: "#f97316", fontWeight: 500 } }>YouTube Channel Growth & Optimization Total</td>
                                              <td style={ tdL }></td>
                                              <td style={ tdR2 }>{ qty }</td>
                                              <td style={ tdR2 }>₹{ yt2.toLocaleString("en-IN") }</td>
                                              <td style={ tdR2 }>₹{ (yt2 * qty).toLocaleString("en-IN") }</td>
                                            </tr>
                                          ) }
                                        </React.Fragment>
                                      );
                                    }) }
                                  </tbody>
                                  <tfoot>
                                    <tr style={ { background: "rgba(99,102,241,0.08)" } }>
                                      <td colSpan={ 4 } style={ { ...tdR, fontWeight: 700, color: "#c7d2fe", borderTop: "1px solid rgba(99,102,241,0.2)" } }>DM Service Total</td>
                                      <td style={ { ...tdR, fontWeight: 700, color: "#f0f5ff", borderTop: "1px solid rgba(99,102,241,0.2)" } }>₹{ dmTotal.toLocaleString("en-IN") }</td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>
                          ) }

                          {/* ── Ads Services Table ── */ }
                          { adsServices.length > 0 && (
                            <div style={ { border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden", background: "rgba(255,255,255,0.02)" } }>
                              <div style={ { maxHeight: 220, overflow: "auto" } } className="ci-scroll">
                                <table style={ { width: "100%", borderCollapse: "collapse", fontSize: 12 } }>
                                  <thead>
                                    <tr style={ { background: "rgba(168,85,247,0.12)" } }>
                                      <th style={ { ...thBase, color: "#d8b4fe" } }>Ads Services</th>
                                      <th style={ { ...thR, color: "#d8b4fe" } }>Budget (₹)</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    { adsServices.map((svc, idx) => {
                                      const adsCategoryName = getServiceDisplayName(svc.category || svc.category_name || svc.service_name || "N/A");
                                      const amount = Number(svc.amount || svc.budget || 0);
                                      return (
                                        <tr key={ `ads-${idx}` }>
                                          <td style={ { ...tdL, color: "#60a5fa", fontWeight: 500 } }>{ adsCategoryName }</td>
                                          <td style={ tdR2 }>₹{ amount.toLocaleString("en-IN") }</td>
                                        </tr>
                                      );
                                    }) }
                                  </tbody>
                                  <tfoot>
                                    <tr style={ { background: "rgba(168,85,247,0.08)" } }>
                                      <td colSpan={ 1 } style={ { ...tdR, fontWeight: 700, color: "#d8b4fe", borderTop: "1px solid rgba(168,85,247,0.2)" } }>Ads Total</td>
                                      <td style={ { ...tdR, fontWeight: 700, color: "#f0f5ff", borderTop: "1px solid rgba(168,85,247,0.2)" } }>₹{ adsTotal.toLocaleString("en-IN") }</td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>
                          ) }

                          {/* ── Complimentary Service Table ── */ }
                          { complimentaryServices.length > 0 && (() => {
                            const compRawTotal = complimentaryServices.reduce((sum, svc) => {
                              return sum + (Number(svc.editing_type_amount || svc.amount || 0) * Number(svc.quantity || 1));
                            }, 0);
                            return (
                              <div style={ { border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden", background: "rgba(255,255,255,0.02)" } }>
                                <div style={ { maxHeight: 180, overflow: "auto" } } className="ci-scroll">
                                  <table style={ { width: "100%", borderCollapse: "collapse", fontSize: 12 } }>
                                    <thead>
                                      <tr style={ { background: "rgba(34,197,94,0.12)" } }>
                                        <th style={ { ...thBase, color: "#86efac" } }>Complimentary Service</th>
                                        <th style={ { ...thBase, color: "#86efac" } }>Service Name</th>
                                        <th style={ { ...thR, color: "#86efac" } }>Qty</th>
                                        <th style={ { ...thR, color: "#86efac" } }>Price (₹)</th>
                                        <th style={ { ...thR, color: "#86efac" } }>Total (₹)</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      { complimentaryServices.map((svc, idx) => {
                                        const qty = Number(svc.quantity || 1);
                                        const price = Number(svc.editing_type_amount || svc.amount || 0);
                                        return (
                                          <tr key={ `comp-${idx}` }>
                                            <td style={ { ...tdL, color: "#60a5fa" } }>{ getServiceDisplayName((svc.service_name && svc.service_name.toLowerCase() === "proposal item") ? (svc.category_name || svc.service_name) : (svc.service_name || svc.category_name || "N/A")) }</td>
                                            <td style={ tdL }>{ (svc.editing_type_name && svc.editing_type_name.toLowerCase() === "proposal item") ? (svc.service || svc.category_name || svc.editing_type_name) : (svc.editing_type_name || svc.service_type || "N/A") }</td>
                                            <td style={ tdR2 }>{ qty }</td>
                                            <td style={ tdR2 }>₹{ price.toLocaleString("en-IN") }</td>
                                            <td style={ tdR2 }>₹{ (price * qty).toLocaleString("en-IN") }</td>
                                          </tr>
                                        );
                                      }) }
                                    </tbody>
                                    <tfoot>
                                      <tr>
                                        <td colSpan={ 4 } style={ { ...tdR, fontWeight: 600, borderTop: "1px solid rgba(255,255,255,0.08)" } }>Total</td>
                                        <td style={ { ...tdR, fontWeight: 600, borderTop: "1px solid rgba(255,255,255,0.08)" } }>₹{ compRawTotal.toLocaleString("en-IN") }</td>
                                      </tr>
                                      <tr style={ { background: "rgba(34,197,94,0.08)" } }>
                                        <td colSpan={ 4 } style={ { ...tdR, fontWeight: 700, color: "#86efac", borderTop: "1px solid rgba(34,197,94,0.2)" } }>Complimentary Total</td>
                                        <td style={ { ...tdR, fontWeight: 700, color: "#f0f5ff", borderTop: "1px solid rgba(34,197,94,0.2)" } }>₹0</td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              </div>
                            );
                          })() }

                          {/* ── Grand Total ── */ }
                          <div style={ { textAlign: "right", paddingTop: 4 } }>
                            { discountAmt > 0 && (
                              <>
                                <div style={ { fontSize: 12, color: "#93c5fd", marginBottom: 2 } }>
                                  Subtotal: ₹{ dmTotal.toLocaleString("en-IN") }
                                </div>
                                <div style={ { fontSize: 12, color: "#f87171", marginBottom: 2 } }>
                                  Discount: -₹{ discountAmt.toLocaleString("en-IN") }
                                </div>
                              </>
                            ) }
                            <div style={ { fontSize: 12, color: "#c7d2fe", marginBottom: 2 } }>
                              Taxable Amount: ₹{ dmTotalAfterDiscount.toLocaleString("en-IN") }
                            </div>
                            { isGST && (
                              <div style={ { fontSize: 12, color: "#c7d2fe", marginBottom: 2 } }>
                                GST @18%: ₹{ dmGstAmount.toLocaleString("en-IN") }
                              </div>
                            ) }
                            <div style={ { fontSize: 13, fontWeight: 600, color: "#c7d2fe", marginBottom: 6 } }>
                              Subtotal: ₹{ dmSubtotalWithGst.toLocaleString("en-IN") }
                            </div>
                            { adsTotal > 0 && (
                              <div style={ { fontSize: 13, fontWeight: 600, color: "#c7d2fe", marginBottom: 6 } }>
                                Ads Services Total: ₹{ adsTotal.toLocaleString("en-IN") }
                              </div>
                            ) }
                            <div style={ { fontSize: 14, fontWeight: 700, color: "#c7d2fe" } }>
                              Grand Total: ₹{ grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
                            </div>
                          </div>
                        </div>
                      );
                    })() }
                  </div>

                  {/* Actions */ }
                  <div
                    style={ {
                      display: "flex",
                      gap: 10,
                      justifyContent: "flex-end",
                      paddingTop: 8,
                      borderTop: "1px solid rgba(255,255,255,0.05)",
                      marginTop: 4,
                    } }
                  >
                    <button type="button" onClick={ handleCloseInvoiceClient } className="ci-btn-secondary">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="ci-btn-primary"
                      disabled={ loading }
