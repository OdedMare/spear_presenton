'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface TutorialContextType {
    isActive: boolean
    currentStep: number
    tutorialPath: 'rewrite' | 'create' | null
    startTutorial: (path: 'rewrite' | 'create') => void
    nextStep: () => void
    previousStep: () => void
    skipTutorial: () => void
    completeTutorial: () => void
    hasSeenTutorial: boolean
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined)

export function TutorialProvider({ children }: { children: React.ReactNode }) {
    const [isActive, setIsActive] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [tutorialPath, setTutorialPath] = useState<'rewrite' | 'create' | null>(null)
    const [hasSeenTutorial, setHasSeenTutorial] = useState(true)

    useEffect(() => {
        // Check if user has seen tutorial before
        const seen = localStorage.getItem('tutorial_completed')
        setHasSeenTutorial(seen === 'true')
    }, [])

    const startTutorial = (path: 'rewrite' | 'create') => {
        setTutorialPath(path)
        setCurrentStep(0)
        setIsActive(true)
    }

    const nextStep = () => {
        setCurrentStep(prev => prev + 1)
    }

    const previousStep = () => {
        setCurrentStep(prev => Math.max(0, prev - 1))
    }

    const skipTutorial = () => {
        setIsActive(false)
        setCurrentStep(0)
        setTutorialPath(null)
        localStorage.setItem('tutorial_completed', 'true')
        setHasSeenTutorial(true)
    }

    const completeTutorial = () => {
        setIsActive(false)
        setCurrentStep(0)
        setTutorialPath(null)
        localStorage.setItem('tutorial_completed', 'true')
        setHasSeenTutorial(true)
    }

    return (
        <TutorialContext.Provider
            value={{
                isActive,
                currentStep,
                tutorialPath,
                startTutorial,
                nextStep,
                previousStep,
                skipTutorial,
                completeTutorial,
                hasSeenTutorial,
            }}
        >
            {children}
        </TutorialContext.Provider>
    )
}

export function useTutorial() {
    const context = useContext(TutorialContext)
    if (context === undefined) {
        throw new Error('useTutorial must be used within a TutorialProvider')
    }
    return context
}
