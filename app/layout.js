// If you want to convert to SPA for FTP deploy
'use client'

import { useEffect } from 'react'

export default function RootLayout({ children }) {
  useEffect(() => {
    // Client-side only initialization
  }, [])

  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}