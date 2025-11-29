'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Sparkles, FileText, Wand2 } from 'lucide-react'
import { useTutorial } from './TutorialProvider'
import { Button } from '@/components/ui/button'

interface TutorialStep {
    title: string
    description: string
    icon: React.ReactNode
    highlightElement?: string
}

const rewriteSteps: TutorialStep[] = [
    {
        title: 'העלאת התבנית שלך',
        description: 'התחל בהעלאת קובץ PowerPoint (.pptx) עם העיצוב שברצונך לשמור. נחלץ את כל מקומות הטקסט.',
        icon: <FileText className="w-8 h-8" />,
    },
    {
        title: 'חילוץ המבנה',
        description: 'הבינה המלאכותית שלנו מנתחת את המצגת ומזהה את כל אלמנטי הטקסט, תוך שמירה על הפריסה והעיצוב.',
        icon: <Sparkles className="w-8 h-8" />,
    },
    {
        title: 'הוספת הוראות',
        description: 'ספר לנו איזה תוכן אתה רוצה. היה ספציפי! תוכל לתאר את הנושא, הטון ונקודות המפתח לכלול.',
        icon: <Wand2 className="w-8 h-8" />,
    },
    {
        title: 'בחירת המצב',
        description: 'מצב קפדני שומר על המבנה המדויק. מצב גמיש מאפשר לבינה המלאכותית להתאים שקופיות ולהוסיף תוכן חדש.',
        icon: <Sparkles className="w-8 h-8" />,
    },
    {
        title: 'סקירה והורדה',
        description: 'צפה במצגת המשוכתבת, בצע עריכות לפי הצורך, והורד את התוצאה הסופית!',
        icon: <FileText className="w-8 h-8" />,
    },
]

const createSteps: TutorialStep[] = [
    {
        title: 'בחירת תבנית',
        description: 'עיין באוסף התבניות המקצועיות שלנו או העלה עיצוב מותאם אישית משלך.',
        icon: <FileText className="w-8 h-8" />,
    },
    {
        title: 'תיאור המצגת',
        description: 'כתוב הנחיה מפורטת על מה שברצונך להציג. כלול נושאים, קהל יעד והמסרים העיקריים.',
        icon: <Wand2 className="w-8 h-8" />,
    },
    {
        title: 'הבינה המלאכותית יוצרת מתווה',
        description: 'הבינה המלאכותית שלנו יוצרת מתווה מובנה עם שקופיות, כותרות ותוכן על בסיס הדרישות שלך.',
        icon: <Sparkles className="w-8 h-8" />,
    },
    {
        title: 'התאמת השקופיות',
        description: 'ערוך את תוכן השקופיות, הוסף תמונות, התאם פריסות והפוך אותה למושלמת עבור הצרכים שלך.',
        icon: <Wand2 className="w-8 h-8" />,
    },
    {
        title: 'ייצוא והצגה',
        description: 'הורד את המצגת שלך כ-PowerPoint או PDF ואתה מוכן להציג!',
        icon: <FileText className="w-8 h-8" />,
    },
]

export function TutorialModal() {
    const { isActive, currentStep, tutorialPath, nextStep, previousStep, skipTutorial, completeTutorial } = useTutorial()

    if (!isActive || !tutorialPath) return null

    const steps = tutorialPath === 'rewrite' ? rewriteSteps : createSteps
    const currentStepData = steps[currentStep]
    const isLastStep = currentStep === steps.length - 1

    return (
        <AnimatePresence>
            {isActive && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={skipTutorial}
                    />

                    {/* Tutorial Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl mx-4"
                    >
                        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden" dir="rtl">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-[#9034EA] to-[#5146E5] px-6 py-4 text-white">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-semibold font-instrument_sans">
                                        {tutorialPath === 'rewrite' ? 'הדרכה - שכתוב תוכן' : 'הדרכה - יצירת מצגת'}
                                    </h2>
                                    <button
                                        onClick={skipTutorial}
                                        className="text-white/80 hover:text-white transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Progress Bar */}
                                <div className="mt-4 flex gap-2">
                                    {steps.map((_, index) => (
                                        <div
                                            key={index}
                                            className={`h-1 flex-1 rounded-full transition-all ${index <= currentStep ? 'bg-white' : 'bg-white/30'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentStep}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-6"
                                    >
                                        {/* Icon */}
                                        <div className="flex items-center justify-center">
                                            <div className="w-20 h-20 rounded-full bg-[#E9E8F8] flex items-center justify-center text-[#5146E5]">
                                                {currentStepData.icon}
                                            </div>
                                        </div>

                                        {/* Step Info */}
                                        <div className="text-center space-y-3">
                                            <div className="text-sm font-medium text-[#5146E5]">
                                                שלב {currentStep + 1} מתוך {steps.length}
                                            </div>
                                            <h3 className="text-2xl font-semibold text-gray-900">
                                                {currentStepData.title}
                                            </h3>
                                            <p className="text-gray-600 text-lg leading-relaxed max-w-xl mx-auto">
                                                {currentStepData.description}
                                            </p>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Footer */}
                            <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                                <Button
                                    onClick={previousStep}
                                    disabled={currentStep === 0}
                                    variant="outline"
                                    className="border-gray-300"
                                >
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                    הקודם
                                </Button>

                                <div className="text-sm text-gray-500">
                                    {currentStep + 1} / {steps.length}
                                </div>

                                {isLastStep ? (
                                    <Button
                                        onClick={completeTutorial}
                                        className="bg-[#5146E5] hover:bg-[#4136D5] text-white"
                                    >
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        בואו נתחיל
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={nextStep}
                                        className="bg-[#5146E5] hover:bg-[#4136D5] text-white"
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-2" />
                                        הבא
                                    </Button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
