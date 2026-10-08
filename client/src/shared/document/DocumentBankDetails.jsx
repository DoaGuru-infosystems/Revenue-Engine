import React from "react";
import img3 from "../../assets/DOAGURU IT Solution.png";
import img4 from "../../assets/DOAGURU Infosystyem.png";

export default function DocumentBankDetails({
  isGST = false,
  variant = "invoice",
  className = "",
}) {
  if (variant === "quotation") {
    return (
      <div className={ `w-1/2 pr-3 ${className}` }>
        <h2 className="font-bold mb-0.5 text-gray-800">Bank Details:</h2>
        { isGST ? (
          <ul className="space-y-0.5 text-gray-700 text-xs">
            <li><span className="font-semibold">Name:</span> DOAGuru InfoSystems</li>
            <li><span className="font-semibold">IFSC:</span> SBIN0004677</li>
            <li><span className="font-semibold">Account No:</span> 38666325192</li>
            <li><span className="font-semibold">Bank:</span> SBI Bank, Jabalpur</li>
          </ul>
        ) : (
          <ul className="space-y-0.5 text-gray-700 text-xs">
            <li><span className="font-semibold">Name:</span> DOAGuru IT Solutions</li>
            <li><span className="font-semibold">IFSC:</span> HDFC0000224</li>
            <li><span className="font-semibold">Account No:</span> 50200074931981</li>
            <li><span className="font-semibold">Bank:</span> HDFC Bank, Jabalpur</li>
          </ul>
        ) }

        {/* Signature */ }
        <div className="mt-3 text-center border border-gray-400 rounded-md p-0.5 inline-block">
          <img
            src={ isGST ? img4 : img3 }
            alt="Authorized Signature"
            className="mx-auto h-[40px] w-[100px] min-w-[30px] max-w-none object-contain"
          />
          <p className="text-xs font-semibold text-gray-800">Signature</p>
          <p className="text-xs text-gray-700">
            { isGST ? "DOAGuru InfoSystems" : "DOAGuru IT Solutions" }
          </p>
        </div>
      </div>
    );
  }

  // Default: Invoice layout
  return (
    <div className={ `w-[45%] flex flex-col p-2.5 border-r border-gray-300 bg-white ${className}` }>
      <div>
        <h2 className="text-[13px] font-bold text-[#1e3a8a] mb-1.5">Bank Details:</h2>
        { isGST ? (
          <div className="text-[11px] space-y-1 text-gray-800">
            <p className="flex"><span className="font-bold text-[#1e3a8a] w-[80px]">Name:</span> <span>DOAGuru InfoSystems</span></p>
            <p className="flex"><span className="font-bold text-[#1e3a8a] w-[80px]">IFSC:</span> <span>SBIN0004677</span></p>
            <p className="flex"><span className="font-bold text-[#1e3a8a] w-[80px]">Account No:</span> <span>38666325192</span></p>
            <p className="flex"><span className="font-bold text-[#1e3a8a] w-[80px]">Bank:</span> <span>SBI Bank, Jabalpur</span></p>
          </div>
        ) : (
          <div className="text-[11px] space-y-1 text-gray-800">
            <p className="flex"><span className="font-bold text-[#1e3a8a] w-[80px]">Name:</span> <span>DOAGuru IT Solutions</span></p>
            <p className="flex"><span className="font-bold text-[#1e3a8a] w-[80px]">IFSC:</span> <span>HDFC0000224</span></p>
            <p className="flex"><span className="font-bold text-[#1e3a8a] w-[80px]">Account No:</span> <span>50200074931981</span></p>
            <p className="flex"><span className="font-bold text-[#1e3a8a] w-[80px]">Bank:</span> <span>HDFC Bank, Jabalpur</span></p>
          </div>
        ) }
      </div>

      {/* Signature */ }
      <div className="mt-3 border border-gray-300 rounded-lg p-2 w-[160px] bg-white">
        <img
          src={ isGST ? img4 : img3 }
          alt="Authorized Signature"
          className="w-auto object-contain mx-auto mb-1"
        />
        <p className="text-[10px] font-bold text-gray-800">Signature</p>
        <p className="text-[9px] text-gray-500">
          { isGST ? "DOAGuru InfoSystems" : "DOAGuru IT Solutions" }
        </p>
      </div>
    </div>
  );
}
