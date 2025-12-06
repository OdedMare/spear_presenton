import React from "react";
import Header from "@/app/(presentation-generator)/dashboard/components/Header";

export const APIKeyWarning: React.FC = () => {
  return (
    <div className="min-h-screen font-roboto bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <div className="flex items-center justify-center aspect-video mx-auto px-6">
        <div className="text-center space-y-2 my-6 bg-white p-10 rounded-lg shadow-lg">
          <h1 className="text-xl font-bold text-gray-900">
            הגדר את חיבור ה-AI המותאם אישית שלך כדי לאפשר יצירת תבניות.
          </h1>
          <h1 className="text-xl font-bold text-gray-900">
            ספק כתובת URL מותאמת אישית של LLM, מודל ומפתח API (אם נדרש) בהגדרות או
            באמצעות משתני סביבה.
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            מחולל התבניות פועל כעת אך ורק על המודל המותאם אישית שהוגדר על ידך.
            עדכן את האישורים שלך כדי להמשיך.
          </p>
        </div>
      </div>
    </div>
  );
};
