import React, { useState, useEffect } from 'react';

interface LoadingStateProps {
    statusMessage?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ statusMessage }) => {
    const [currentTipIndex, setCurrentTipIndex] = useState(0);
    const tips = [
        "מכינים לכם מצגת עם קסם של בינה מלאכותית ✨",
        "מנתחים את התוכן שלכם לשקפים מושלמים 📊",
        "מסדרים את המידע להשפעה מקסימלית 🎯",
        "מוסיפים אלמנטים ויזואליים כדי לרתק את הקהל 🎨",
        "כמעט שם! נוגעים נגיעות אחרונות ⚡️",
        "הבינה המלאכותית שלנו שותה קפה ומסדרת את השקפים ☕",
        "בודקים שאין שקופיות עם תמונות של חתולים בטעות... אלא אם ביקשתם 😼",
        "מנסים לא להכניס יותר מדי קליפארט משנות ה-90 💾",
        "האלגוריתמים שלנו רוקדים סלסה בזמן שהם יוצרים את המצגת 💃",
        "רק עוד רגע, אנחנו מלטשים את הפיקסלים האחרונים! ✨"
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTipIndex((prev) => (prev + 1) % tips.length);
        }, 30000);

        return () => clearInterval(interval);
    }, [tips.length]); // Added tips.length to dependency array for completeness

    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mx-auto w-[500px] flex flex-col items-center justify-center p-8">
            <div className="w-full bg-white rounded-xl p-[2px] ">
                <div className="bg-white rounded-xl p-6 w-full">
                    <div className="flex items-center justify-center space-x-4 ">

                        <h2 className="text-2xl font-semibold text-gray-800">יוצרים את המצגת שלך</h2>
                    </div>
                    <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6 mb-4">
                        <div className="min-h-[120px] flex flex-col items-center justify-center gap-4">
                            <p className="text-gray-700 text-lg text-center">
                                {statusMessage || tips[currentTipIndex]}
                            </p>
                            {statusMessage && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                    <span>Processing...</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full max-w-md">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-[#5141e5] rounded-full animate-progress" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoadingState;