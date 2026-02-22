'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { IconMail, IconLock, IconLoader2, IconAlertCircle, IconCheck } from '@tabler/icons-react'
import PasswordChangeModal from '@/components/PasswordChangeModal'

function LoginForm() {
  const { login, isAuthenticated, isLoading: authLoading, supabaseUser } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false)
  const [isMigratedUserFlow, setIsMigratedUserFlow] = useState(false) // true when showing modal for non-logged-in migrated user

  // Get redirect URL from query params
  const redirectTo = searchParams.get('redirect') || '/portal'

  // Check for messages from URL params (e.g., after password reset email sent)
  useEffect(() => {
    const messageParam = searchParams.get('message')
    if (messageParam) {
      setMessage(messageParam)
    }
  }, [searchParams])

  // Check if user needs to change password after authentication
  useEffect(() => {
    if (isAuthenticated && !authLoading && supabaseUser) {
      const needsPasswordChange = supabaseUser.user_metadata?.needs_password_change
      if (needsPasswordChange) {
        setShowPasswordChangeModal(true)
      } else {
        router.push(redirectTo)
      }
    }
  }, [isAuthenticated, authLoading, supabaseUser, router, redirectTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await login(email, password)

      if (result.error) {
        // Check if this is a migrated user who needs to set their password
        if (result.error.includes('Invalid login credentials')) {
          const isMigrated = await checkIfMigratedUser(email)
          if (isMigrated) {
            // Show password setup modal for migrated users
            setIsMigratedUserFlow(true)
            setShowPasswordChangeModal(true)
            setIsLoading(false)
            return
          }
        }
        setError(result.error)
      }
      // Password change check and redirect handled by useEffect above
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Check if email belongs to a migrated user without password
  const checkIfMigratedUser = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch(`/.netlify/functions/check-migrated-user?email=${encodeURIComponent(email)}`)
      if (response.ok) {
        const data = await response.json()
        return data.isMigrated === true
      }
      return false
    } catch {
      return false
    }
  }

  const handlePasswordChangeSuccess = async () => {
    setShowPasswordChangeModal(false)

    if (isMigratedUserFlow) {
      // For migrated users, prompt them to log in with new password
      setMessage('Password set successfully! Please log in with your new password.')
      setPassword('') // Clear password field so they enter the new one
      setIsMigratedUserFlow(false)
    } else {
      setMessage('Password updated successfully!')
      router.push(redirectTo)
    }
  }

  const handlePasswordChangeClose = () => {
    // Allow skipping but remind them
    setShowPasswordChangeModal(false)
    router.push(redirectTo)
  }

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <IconLoader2 className="h-12 w-12 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Image
            src="/images/logos/logo.png"
            alt="Logo"
            width={120}
            height={120}
            className="mx-auto mb-4"
            priority
          />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Portal
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Sign in to access the officials portal
          </p>
        </div>

        {message && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <IconCheck size={20} />
              <p>{message}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <IconAlertCircle size={20} />
              <p>{error}</p>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IconMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IconLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-500"
            >
              Forgot your password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? (
              <>
                <IconLoader2 className="h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <div className="text-center">
          <Link href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
            &larr; Back to home
          </Link>
        </div>
      </div>

      <PasswordChangeModal
        isOpen={showPasswordChangeModal}
        onClose={handlePasswordChangeClose}
        onSuccess={handlePasswordChangeSuccess}
        userEmail={supabaseUser?.email || email}
        isLoggedIn={!isMigratedUserFlow}
      />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <IconLoader2 className="h-12 w-12 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
