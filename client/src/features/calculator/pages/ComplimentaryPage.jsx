import React from "react";
import ComplimentaryCalculator from "../components/ComplimentaryCalculator";

export default function ComplimentaryPage(props) {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        <ComplimentaryCalculator {...props} />
      </div>
    </div>
  );
}
