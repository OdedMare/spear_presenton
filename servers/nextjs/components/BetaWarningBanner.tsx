'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'

export function BetaWarningBanner() {
    const pathname = usePathname()

    // Don't show banner on PDF maker page (used by Puppeteer for PDF/PPTX export)
    if (pathname === '/pdf-maker') return null

    return (
        <div className="bg-amber-50 border-b border-amber-200">
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center justify-center gap-3" dir="rtl">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-800 font-medium text-center">
                        <span className="font-semibold">המערכת כרגע בהרצה ובתצורת בטא</span>
                        {' - '}
                       פניות נוספות ושאלות מוזמנים לפנות לצוות חנית
                    </p>
                </div>
            </div>
        </div>
    )
}
