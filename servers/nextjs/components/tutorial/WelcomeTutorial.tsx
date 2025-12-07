'use client'

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Wand2, HelpCircle, Languages } from 'lucide-react'
import { useTutorial } from './TutorialProvider'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'

export function WelcomeTutorial() {
    const { hasSeenTutorial, startTutorial, skipTutorial } = useTutorial()
    const [showWelcome, setShowWelcome] = React.useState(false)
    const pathname = usePathname()

    useEffect(() => {
        // Show welcome screen for first-time users after a short delay
        if (!hasSeenTutorial) {
            const timer = setTimeout(() => {
                setShowWelcome(true)
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [hasSeenTutorial])

    // Don't show tutorial on PDF maker page (used by Puppeteer for PDF export)
    if (pathname === '/pdf-maker') return null

    if (!showWelcome || hasSeenTutorial) return null

    const handleStartTutorial = (path: 'rewrite' | 'create' | 'translate') => {
        setShowWelcome(false)
        startTutorial(path)
    }

    const handleSkip = () => {
        setShowWelcome(false)
        skipTutorial()
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden"
                dir="rtl"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#9034EA] to-[#5146E5] px-8 py-12 text-white text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="inline-block mb-4"
                    >
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <Wand2 className="w-10 h-10" />
                        </div>
                    </motion.div>
                    <h1 className="text-4xl font-bold font-instrument_sans mb-3">
                        ברוכים הבאים ל-SpearPresenton!
                    </h1>
                    <p className="text-xl text-white/90 max-w-2xl mx-auto">
                        צור מצגות מרהיבות עם בינה מלאכותית תוך דקות
                    </p>
                </div>

                {/* Content */}
                <div className="p-8 flex flex-col items-center">
                    <p className="text-center text-gray-600 text-lg mb-8">
                        בחר כיצד תרצה להתחיל:
                    </p>

                    <div className="grid md:grid-cols-3 gap-6 mb-8 w-full max-w-6xl">
                        {/* Rewrite Content Card */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleStartTutorial('rewrite')}
                            className="group relative overflow-hidden rounded-xl border-2 border-gray-200 hover:border-[#5146E5] p-8 text-right transition-all bg-white hover:shadow-lg"
                        >
                            <div className="absolute top-0 left-0 w-32 h-32 bg-[#E9E8F8] rounded-full -ml-16 -mt-16 group-hover:scale-150 transition-transform" />

                            <div className="relative">
                                <div className="w-14 h-14 rounded-full bg-[#E9E8F8] flex items-center justify-center text-[#5146E5] mb-4">
                                    <FileText className="w-7 h-7" />
                                </div>

                                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                                    שכתוב תוכן
                                </h3>

                                <p className="text-gray-600 leading-relaxed mb-4">
                                    שמור על עיצוב המצגת שלך, שכתב את התוכן עם בינה מלאכותית. מושלם לעדכון מצגות קיימות.
                                </p>

                                <div className="flex items-center text-[#5146E5] font-medium">
                                    <HelpCircle className="w-4 h-4 mr-2" />
                                    למד כיצד זה עובד
                                </div>
                            </div>
                        </motion.button>

                        {/* Create Presentation Card */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleStartTutorial('create')}
                            className="group relative overflow-hidden rounded-xl border-2 border-gray-200 hover:border-[#5146E5] p-8 text-right transition-all bg-white hover:shadow-lg"
                        >
                            <div className="absolute top-0 left-0 w-32 h-32 bg-[#E9E8F8] rounded-full -ml-16 -mt-16 group-hover:scale-150 transition-transform" />

                            <div className="relative">
                                <div className="w-14 h-14 rounded-full bg-[#E9E8F8] flex items-center justify-center text-[#5146E5] mb-4">
                                    <Wand2 className="w-7 h-7" />
                                </div>

                                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                                    יצירת מצגת
                                </h3>

                                <p className="text-gray-600 leading-relaxed mb-4">
                                    צור מצגת שלמה מאפס באמצעות בינה מלאכותית. פשוט תאר מה אתה צריך.
                                </p>

                                <div className="flex items-center text-[#5146E5] font-medium">
                                    <HelpCircle className="w-4 h-4 mr-2" />
                                    למד כיצד זה עובד
                                </div>
                            </div>
                        </motion.button>

                        {/* Translate Presentation Card */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleStartTutorial('translate')}
                            className="group relative overflow-hidden rounded-xl border-2 border-gray-200 hover:border-[#5146E5] p-8 text-right transition-all bg-white hover:shadow-lg"
                        >
                            <div className="absolute top-0 left-0 w-32 h-32 bg-[#E9E8F8] rounded-full -ml-16 -mt-16 group-hover:scale-150 transition-transform" />

                            <div className="relative">
                                <div className="w-14 h-14 rounded-full bg-[#E9E8F8] flex items-center justify-center text-[#5146E5] mb-4">
                                    <Languages className="w-7 h-7" />
                                </div>

                                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                                    תרגום מצגת
                                </h3>

                                <p className="text-gray-600 leading-relaxed mb-4">
                                    תרגם מצגת עם 3 סוכני AI חכמים. שמור על העיצוב, תוכן מקצועי ותמיכה ב-RTL.
                                </p>

                                <div className="flex items-center text-[#5146E5] font-medium">
                                    <HelpCircle className="w-4 h-4 mr-2" />
                                    למד כיצד זה עובד
                                </div>
                            </div>
                        </motion.button>
                    </div>

                    {/* Skip Button */}
                    <div className="text-center">
                        <Button
                            onClick={handleSkip}
                            variant="ghost"
                            className="text-gray-500 hover:text-gray-700"
                        >
                            דלג על ההדרכה, אני אחקור בעצמי
                        </Button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}
