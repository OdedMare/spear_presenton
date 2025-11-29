'use client'

import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="gap-2 border-white/30 text-white hover:bg-white/20"
            aria-label={theme === 'light' ? 'מצב כהה' : 'מצב בהיר'}
        >
            {theme === 'light' ? (
                <>
                    <Moon className="w-4 h-4" />
                    <span className="hidden sm:inline">מצב כהה</span>
                </>
            ) : (
                <>
                    <Sun className="w-4 h-4" />
                    <span className="hidden sm:inline">מצב בהיר</span>
                </>
            )}
        </Button>
    )
}
