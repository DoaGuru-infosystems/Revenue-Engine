<table className="w-full print:table print:border-collapse print:h-[100vh]">

        {/* Repeating Header */}
         <thead className="print:table-header-group">
      <tr>
        <td>
          <div className="h-[10vh] print:h-[10%] print:mt-[auto]">
            <img src={img1} alt="Header" className="w-full h-full object-contain" />
          </div>
        </td>
      </tr>
    </thead>

        {/* Repeating Footer */}
       

        {/* Main Content */}
        <tbody className="print:table-row-group">
          <tr>
              <td className="p-0 m-0 align-top">
             <div className="h-[80vh] print:h-[80%] px-6 print:px-4 flex flex-col justify-between">

                {/* Client Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 print:grid-cols-2">
                  <div className="break-words">
                    <h3 className="text-lg font-semibold mb-2">Client Details</h3>
                    <p className="break-words"><strong>Name:</strong> {clientData?.client_name}</p>
                    <p className="break-words"><strong>Organization Name:</strong> {clientData?.client_organization}</p>
                    <p className="break-words"><strong>Contact:</strong> {clientData?.phone}</p>
                    <p className="break-words"><strong>Address:</strong> {clientData?.address}</p>
                  </div>
                  <div className="text-end">
                    <h2 className="text-2xl font-bold">Quotation</h2>
                    <p>{moment().format("DD/MM/YYYY")}</p>
                    <p>Quote #: {txn_id}</p>
                  </div>
                  {/* <div className="text-right text-gray-600 break-words">
                    <p>1815, Wright Town, Jabalpur,</p>
                    <p>Madhya Pradesh 482002</p>
                    <p>Phone: 074409 92424</p>
                  </div> */}
                </div>

                {/* Graphic Services */}
                {graphicData.length > 0 && (
                  <section className="mb-2">
                    <h3 className="text-xl font-semibold mb-3 border-b pb-2 text-orange-700">Graphic Services</h3>
                    {graphicData.map((service, idx) => (
                     
                      
                      
                      <div key={idx} className="mb-3">
                        <h4 className="font-semibold text-lg mb-2">{service.service}</h4>
                        {service.categories.map((cat, cidx) => (
                          <div key={cidx} className="mb-4">
                            <h5 className="font-semibold mb-2">{cat.categoryName}</h5>
                        <table className="w-full border text-sm">
  <thead className="bg-orange-100">
    <tr>
      <th className="border px-3 py-2 text-left">Editing Type</th>
      <th className="border px-3 py-2 text-right">Quantity</th>
      <th className="border px-3 py-2 text-right">Price (₹)</th>
      <th className="border px-3 py-2 text-right">Total (₹)</th>
    </tr>
  </thead>
<tbody>
  {cat.editingTypes.map((edit, eidx) => {
    const qty = Number(edit.quantity || 0);
    const base = Number(edit.price || 0);
    const thumb = Number(edit.include_thumbnail_creation || 0);
    const posting = Number(edit.include_content_posting || 0);

    const totalBase = base * qty;
    const totalThumb = thumb * qty;
    const totalPost = posting * qty;

    return (
      <>
        {/* Base Editing */}
        <tr key={`base-${eidx}`} className="bg-white">
          <td className="border px-3 py-2">{edit.type}</td>
          <td className="border px-3 py-2 text-right">{qty}</td>
          <td className="border px-3 py-2 text-right">₹{base.toLocaleString()}</td>
          <td className="border px-3 py-2 text-right font-semibold">₹{totalBase.toLocaleString()}</td>
        </tr>

        {/* Thumbnail Creation */}
        {thumb > 0 && (
          <tr key={`thumb-${eidx}`} className="bg-gray-50">
            <td className="border px-3 py-2">Thumbnail Creation</td>
            <td className="border px-3 py-2 text-right">{qty}</td>
            <td className="border px-3 py-2 text-right">₹{thumb.toLocaleString()}</td>
            <td className="border px-3 py-2 text-right font-semibold">₹{(thumb * qty).toLocaleString()}</td>
          </tr>
        )}

        {/* Content Posting */}
        {posting > 0 && (
          <tr key={`posting-${eidx}`} className="bg-gray-50">
            <td className="border px-3 py-2">Content Posting</td>
            <td className="border px-3 py-2 text-right">{qty}</td>
            <td className="border px-3 py-2 text-right">₹{posting.toLocaleString()}</td>
            <td className="border px-3 py-2 text-right font-semibold">₹{(posting * qty).toLocaleString()}</td>
          </tr>
        )}
      </>
    );
  })}
</tbody>



</table>

                          </div>
                        ))}
                      </div>
                    ))}
                    <p className="text-right text-lg font-semibold">Graphic Total: ₹{graphicTotal.toLocaleString()}</p>
                  </section>
                )}

                {/* Ads Services */}
                {adsData.length > 0 && (
                  <section className="mb-5">
                    <h3 className="text-xl font-semibold mb-4 border-b pb-2 text-orange-700">Ads Services</h3>
                    <table className="w-full border text-sm">
                      <thead className="bg-orange-100">
                        <tr>
                          <th className="border px-3 py-2 text-left">Category</th>
                          <th className="border px-3 py-2 text-right">Amount (₹)</th>
                          <th className="border px-3 py-2 text-right">Percentage (%)</th>
                          <th className="border px-3 py-2 text-right">Charges (₹)</th>
                          <th className="border px-3 py-2 text-right">Final Total (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adsData.map((ad, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="border px-3 py-2">{ad.category_name}</td>
                            <td className="border px-3 py-2 text-right">{Number(ad.amount || 0).toLocaleString()}</td>
                            <td className="border px-3 py-2 text-right">{ad.percent || 0}</td>
                            <td className="border px-3 py-2 text-right">{Number(ad.charge || 0).toLocaleString()}</td>
                            <td className="border px-3 py-2 text-right font-semibold">{Number(ad.total_amount || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-right text-lg font-semibold mt-1">Ads Total: ₹{adsTotal.toLocaleString()}</p>
                  </section>
                )}

                {/* Grand Total Section */}
                <section className="text-right border-t pt-3">
                  <p className="text-xl text-gray-700">Subtotal: ₹{grandTotal.toLocaleString()}</p>
                  {isGST ? (
                    <>
                      <p className="text-lg text-gray-600 mt-1">GST (18%): ₹{(grandTotal * 0.18).toLocaleString()}</p>
                      <p className="text-2xl font-bold text-orange-700 mt-2">Total with GST: ₹{(grandTotal * 1.18).toLocaleString()}</p>
                    </>
                  ) : (
                    <p className="text-2xl font-bold text-orange-700 mt-2">Grand Total: ₹{grandTotal.toLocaleString()}</p>
                  )}
                </section>

              </div>
            </td>
          </tr>
        </tbody>

    <tfoot className="print:table-footer-group">
          <tr>
            <td className="p-0 m-0">
 <div className="h-[10vh] print:h-[10%] w-full">
  <img
    src={img2}
    alt="Footer"
    className="w-full h-full object-contain"
  />
</div>
        </td>
          </tr>
        </tfoot>
      </table>
