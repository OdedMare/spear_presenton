import React from 'react'
import ContentRewritePage from './components/ContentRewritePage'
import Header from '../dashboard/components/Header'

export const metadata = {
  title: 'Content Rewrite - SpearPresenton',
  description: 'Rewrite presentation content while keeping your design',
}

const Page = () => {
  return (
    <div className="relative">
      <Header />
      <div className="flex flex-col items-center justify-center py-8">
        <h1 className="text-3xl font-semibold font-instrument_sans">
          שכתוב תוכן עם AI
        </h1>
      </div>
      <ContentRewritePage defaultMode="rewrite" />
    </div>
  )
}

export default Page
