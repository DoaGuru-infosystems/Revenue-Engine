import React from "react";

export default function DocumentCompanyFrom({ isGST = false, className = "" }) {
  return (
    <div className={ `border p-2 rounded-lg text-xs ${className}` }>
      <p>
        <strong> FROM:</strong>{ " " }
        { isGST ? "DOAGuru InfoSystems" : "DOAGuru IT Solutions" }
      </p>
      <p>
        <strong>Email:</strong> info@doaguru.com
      </p>
      <p>
        <strong>Phone:</strong> +91 74409 92424
      </p>
      { isGST ? (
        <p>
          <strong>GST No:</strong> 23AGLPP2890G1Z7
        </p>
      ) : (
        <p>
          <strong>Pan Card No:</strong> ASTPT3654Q
        </p>
      ) }
      <p>
        <strong>Address:</strong> 1815, Wright Town, Jabalpur
      </p>
    </div>
  );
}
