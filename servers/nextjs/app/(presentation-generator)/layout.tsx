'use client'
import React from 'react'
import { ConfigurationInitializer } from '../ConfigurationInitializer'
import { AuthProvider } from '@/components/AuthProvider'
import FirstTimeUserModal from '@/components/FirstTimeUserModal'
import { useFirstTimeUser } from '@/hooks/useFirstTimeUser'

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { showModal, closeModal } = useFirstTimeUser()

  return (
    <div>
      <ConfigurationInitializer>
        <AuthProvider>
          {children}
          <FirstTimeUserModal isOpen={showModal} onClose={closeModal} />
        </AuthProvider>
      </ConfigurationInitializer>
    </div>
  )
}

export default Layout
