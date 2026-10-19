import React from "react";
import img1 from "../../assets/Dg 1copy.png";
import img5 from "../../assets/dghead.jpeg";

export default function DocumentHeaderBanner({ isGST = false, className = "" }) {
  return (
    <thead className={`print:table-header-group w-full ${className}`}>
      <tr>
        <td className="p-0 m-0 w-full" style={{ padding: 0, margin: 0 }}>
          <div className="w-full" style={{ margin: 0, padding: 0, lineHeight: 0 }}>
            <img
              src={isGST ? img1 : img5}
              alt="Official Header"
              className="w-full h-auto block"
              style={{ display: "block", width: "100%", height: "auto", margin: 0, padding: 0 }}
            />
          </div>
        </td>
      </tr>
    </thead>
  );
}
