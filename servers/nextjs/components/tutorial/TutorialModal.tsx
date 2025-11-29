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
        title: 'Upload Your Template',
        description: 'Start by uploading a PowerPoint (.pptx) file with the design you want to keep. We\'ll extract all the text placeholders.',
        icon: <FileText className="w-8 h-8" />,
    },
    {
        title: 'Extract Structure',
        description: 'Our AI analyzes your presentation and identifies all text elements, preserving your layout and design.',
        icon: <Sparkles className="w-8 h-8" />,
    },
    {
        title: 'Provide Instructions',
        description: 'Tell us what content you want. Be specific! You can describe the topic, tone, and key points to include.',
        icon: <Wand2 className="w-8 h-8" />,
    },
    {
        title: 'Choose Your Mode',
        description: 'Strict Mode keeps exact structure. Flexible Mode allows AI to adjust slides and add new content.',
        icon: <Sparkles className="w-8 h-8" />,
    },
    {
        title: 'Review & Download',
        description: 'Preview your rewritten presentation, make any edits, and download the final result!',
        icon: <FileText className="w-8 h-8" />,
    },
]

const createSteps: TutorialStep[] = [
    {
        title: 'Choose a Template',
        description: 'Browse our collection of professional templates or upload your own custom design.',
        icon: <FileText className="w-8 h-8" />,
    },
    {
        title: 'Describe Your Presentation',
        description: 'Write a detailed prompt about what you want to present. Include topics, audience, and key messages.',
        icon: <Wand2 className="w-8 h-8" />,
    },
    {
        title: 'AI Generates Outline',
        description: 'Our AI creates a structured outline with slides, titles, and content based on your requirements.',
        icon: <Sparkles className="w-8 h-8" />,
    },
    {
        title: 'Customize Slides',
        description: 'Edit any slide content, add images, adjust layouts, and make it perfect for your needs.',
        icon: <Wand2 className="w-8 h-8" />,
    },
    {
        title: 'Export & Present',
        description: 'Download your presentation as PowerPoint or PDF and you\'re ready to present!',
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
                        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-[#9034EA] to-[#5146E5] px-6 py-4 text-white">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-semibold font-instrument_sans">
                                        {tutorialPath === 'rewrite' ? 'Content Rewrite Tutorial' : 'Create Presentation Tutorial'}
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
                                                Step {currentStep + 1} of {steps.length}
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
                                    <ChevronLeft className="w-4 h-4 mr-2" />
                                    Previous
                                </Button>

                                <div className="text-sm text-gray-500">
                                    {currentStep + 1} / {steps.length}
                                </div>

                                {isLastStep ? (
                                    <Button
                                        onClick={completeTutorial}
                                        className="bg-[#5146E5] hover:bg-[#4136D5] text-white"
                                    >
                                        Get Started
                                        <Sparkles className="w-4 h-4 ml-2" />
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={nextStep}
                                        className="bg-[#5146E5] hover:bg-[#4136D5] text-white"
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4 ml-2" />
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
