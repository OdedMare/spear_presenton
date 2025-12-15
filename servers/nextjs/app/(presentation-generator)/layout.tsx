import React from 'react'
import { ConfigurationInitializer } from '../ConfigurationInitializer'
import { AuthProvider } from '@/components/AuthProvider'

const layout = ({ children }: { children: React.ReactNode }) => {
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

export default layout
