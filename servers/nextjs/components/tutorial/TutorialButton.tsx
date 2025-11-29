'use client'

import React, { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { useTutorial } from './TutorialProvider'
import { Button } from '@/components/ui/button'

export function TutorialButton() {
    const { startTutorial } = useTutorial()
    const [isOpen, setIsOpen] = useState(false)

    const handleStartTutorial = (path: 'rewrite' | 'create') => {
        startTutorial(path)
        setIsOpen(false)
    }

    return (
        <div className="relative">
            <Button
                variant="outline"
                size="sm"
                className="gap-2 border-[#5146E5] text-[#5146E5] hover:bg-[#E9E8F8]"
                onClick={() => setIsOpen(!isOpen)}
            >
                <HelpCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Help</span>
            </Button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown Menu */}
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        <div
                            onClick={() => handleStartTutorial('rewrite')}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                            <div className="font-medium text-gray-900">Content Rewrite Tutorial</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Learn how to rewrite presentations
                            </div>
                        </div>
                        <div className="border-t border-gray-100" />
                        <div
                            onClick={() => handleStartTutorial('create')}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                            <div className="font-medium text-gray-900">Create Presentation Tutorial</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Learn how to create from scratch
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
