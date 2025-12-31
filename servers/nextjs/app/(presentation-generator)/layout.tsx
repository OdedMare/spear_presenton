'use client'
import React from 'react'
import { ConfigurationInitializer } from '../ConfigurationInitializer'
import { AuthProvider } from '@/components/AuthProvider'

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <ConfigurationInitializer>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ConfigurationInitializer>
    </div>
  )
}

export default Layout
