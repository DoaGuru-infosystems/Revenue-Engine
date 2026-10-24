import React from "react";
import ComplimentaryCalculator from "../components/ComplimentaryCalculator";

export default function ComplimentaryPage(props) {
  return (
    <div className="min-h-screen min-h-dvh bg-gray-900 overflow-x-hidden overflow-y-auto">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 pt-4 sm:pt-8 pb-32 sm:pb-8 space-y-5">
        <ComplimentaryCalculator {...props} />
      </div>
    </div>
  );
}
