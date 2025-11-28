import React from 'react'
import ContentRewritePage from './components/ContentRewritePage'
import Header from '../dashboard/components/Header'

export const metadata = {
  title: 'Content Rewrite - Presenton',
  description: 'Rewrite presentation content while keeping your design',
}

const Page = () => {
  return (
    <div className="min-h-screen bg-[#E9E8F8]">
      <Header />
      <ContentRewritePage />
    </div>
  )
}

export default Page
