import type { Metadata } from 'next'
import './globals.css'
import './tinymce-content.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import AuthErrorHandler from '@/components/AuthErrorHandler'
import { orgConfig } from '@/config/organization'

export const metadata: Metadata = {
  title: orgConfig.name,
  description: `${orgConfig.description} - Join our team of certified ${orgConfig.labels.referees.toLowerCase()}`,
  keywords: `${orgConfig.labels.referee.toLowerCase()}, ${orgConfig.labels.officials.toLowerCase()}, officiating, sports`,
  icons: {
    icon: [
      {
        url: '/images/icons/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        url: '/images/icons/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/images/icons/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      }
    ],
    apple: {
      url: '/images/icons/apple-touch-icon.png',
      sizes: '180x180',
      type: 'image/png',
    },
    other: [
      {
        rel: 'android-chrome',
        url: '/images/icons/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        rel: 'android-chrome',
        url: '/images/icons/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      }
    ]
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/icons/favicon-16x16.png" />
        <link rel="manifest" href="/images/icons/site.webmanifest" />
        <link rel="shortcut icon" href="/images/icons/favicon.ico" />
      </head>
      <body className="min-h-screen flex flex-col">
        <AuthErrorHandler />
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
