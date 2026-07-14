                      style={ { opacity: loading ? 0.7 : 1 } }
                    >
                      { loading ? (
                        <Loader2 size={ 14 } style={ { animation: "spin 1s linear infinite" } } />
                      ) : (
                        <FilePlus2 size={ 14 } />
                      ) }
                      { loading ? "Generating..." : "Generate Proforma" }
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) }
          {/* ── MODAL: Submit to Admin ────────────────────────────── */ }
          { submitAdminModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Submit to Admin</h2>
                  <button onClick={ () => setSubmitAdminModal(false) } className="text-gray-400 hover:text-gray-600"><X size={ 20 } /></button>
                </div>
                <p className="text-sm text-gray-500 mb-4">This quotation will be sent to the Admin for approval.</p>
                <textarea
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                  rows={ 3 } placeholder="Add a remark (optional)"
                  value={ workflowRemark } onChange={ e => setWorkflowRemark(e.target.value) }
                />
                <button
                  onClick={ handleSubmitToAdmin } disabled={ workflowLoading }
                  className="mt-4 w-full py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  { workflowLoading && <Loader2 size={ 16 } className="animate-spin" /> }
                  Submit to Admin
                </button>
              </div>
            </div>
          ) }

          {/* ── MODAL: Send to Client (Quotation) ─────────────────── */ }
          { sendClientModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Send Quotation to Client</h2>
                  <button onClick={ () => {
                    setSendClientModal(false);
                    setClientSendSuccess(false);
                    setWorkflowRemark("");
                    setSelectedChannel("email");
