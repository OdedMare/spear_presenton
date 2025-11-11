import React from "react";
import Header from "@/app/(presentation-generator)/dashboard/components/Header";

export const APIKeyWarning: React.FC = () => {
  return (
    <div className="min-h-screen font-roboto bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <div className="flex items-center justify-center aspect-video mx-auto px-6">
        <div className="text-center space-y-2 my-6 bg-white p-10 rounded-lg shadow-lg">
          <h1 className="text-xl font-bold text-gray-900">
            Configure your custom AI connection to enable template creation.
          </h1>
          <h1 className="text-xl font-bold text-gray-900">
            Provide a Custom LLM URL, Model, and API Key (if required) in Settings or
            via environment variables.
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            The template generator now runs solely on your configured custom model.
            Update your credentials to continue.
          </p>
        </div>
      </div>
    </div>
  );
};
