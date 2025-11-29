'use client'

import React from 'react'
import { HelpCircle } from 'lucide-react'
import { useTutorial } from './TutorialProvider'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function TutorialButton() {
    const { startTutorial } = useTutorial()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-[#5146E5] text-[#5146E5] hover:bg-[#E9E8F8]"
                >
                    <HelpCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Help</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                    onClick={() => startTutorial('rewrite')}
                    className="cursor-pointer"
                >
                    <div className="flex flex-col gap-1">
                        <div className="font-medium">Content Rewrite Tutorial</div>
                        <div className="text-xs text-gray-500">
                            Learn how to rewrite presentations
                        </div>
                    </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => startTutorial('create')}
                    className="cursor-pointer"
                >
                    <div className="flex flex-col gap-1">
                        <div className="font-medium">Create Presentation Tutorial</div>
                        <div className="text-xs text-gray-500">
                            Learn how to create from scratch
                        </div>
                    </div>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
