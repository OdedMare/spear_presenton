import React from 'react'
import ContentRewritePage from '../content-rewrite/components/ContentRewritePage'
import Header from '../dashboard/components/Header'

export const metadata = {
  title: 'AI Translation - SpearPresenton',
  description: 'Translate presentation content while keeping your design',
}

export default function TranslatePage() {
  return (
    <div className="relative">
      <Header />
      <div className="flex flex-col items-center justify-center py-8">
        <h1 className="text-3xl font-semibold font-instrument_sans">
          תרגום בעזרת בינה מלאכותית
        </h1>
      </div>
      <ContentRewritePage defaultMode="translate" />
    </div>
  )
}
