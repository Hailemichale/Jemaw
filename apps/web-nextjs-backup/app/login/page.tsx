'use client'

import { useState } from 'react'
import Link from 'next/link'
import { loginAction, resetPasswordAction } from '../auth-actions'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')
    
    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('password', password)

      const result = await loginAction(formData)
      if (result?.error) {
        setErrorMsg(result.error)
        setLoading(false)
      } else if (result?.success) {
        // Hard navigate to ensure Next.js router cache is blown away and cookies are re-read
        window.location.href = '/'
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred')
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')
    
    try {
      const formData = new FormData()
      formData.append('email', email)

      const result = await resetPasswordAction(formData)
      if (result?.error) {
        setErrorMsg(result.error)
      } else if (result?.success) {
        setSuccessMsg('Check your email for the password reset link.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900">
      
      {/* Left side - Decorative/Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 animate-gradient-x"></div>
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-white/10 blur-3xl mix-blend-overlay"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-indigo-900/30 blur-3xl mix-blend-overlay"></div>
        
        <div className="relative z-10 w-full max-w-lg px-12 text-white">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 p-10 rounded-3xl shadow-2xl">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/20 text-white mb-8 shadow-inner overflow-hidden border-2 border-white/30 backdrop-blur-md">
              <img src="/logo.jpg" alt="Jemaw Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-4">
              Bring your groups together.
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              Jemaw makes it effortless to coordinate meetups, share memories, and stay connected with your favorite people—all powered by intelligent AI assistance.
            </p>
            
            <div className="mt-10 flex items-center space-x-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-purple-500 bg-white/20 flex items-center justify-center backdrop-blur-md overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="avatar" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <p className="text-sm font-medium text-white/90">
                Join thousands of friend groups
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center px-8 sm:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          
          <div className="mb-10 lg:hidden flex justify-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-xl mb-2 overflow-hidden border border-gray-100 dark:border-gray-800">
              <img src="/logo.jpg" alt="Jemaw Logo" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="text-left mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {isForgotPassword ? 'Reset password' : 'Welcome back'}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {isForgotPassword 
                ? "Enter your email and we'll send you a link to reset your password."
                : "Enter your credentials to access your account."}
            </p>
          </div>

          <form className="space-y-6" onSubmit={isForgotPassword ? handleResetPassword : handleLogin}>
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all duration-200 shadow-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {!isForgotPassword && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password
                    </label>
                    <button type="button" onClick={() => setIsForgotPassword(true)} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={!isForgotPassword}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all duration-200 shadow-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="animate-fade-in flex items-center gap-3 p-4 text-sm text-red-800 border border-red-200 rounded-xl bg-red-50 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30">
                <svg className="h-5 w-5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p>{errorMsg}</p>
              </div>
            )}

            {successMsg && (
              <div className="animate-fade-in flex items-center gap-3 p-4 text-sm text-green-800 border border-green-200 rounded-xl bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30">
                <svg className="h-5 w-5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <p>{successMsg}</p>
              </div>
            )}

            <div className="pt-2 flex flex-col items-center space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-2xl bg-indigo-600 px-3 py-3.5 text-sm font-semibold leading-6 text-white shadow-lg hover:bg-indigo-500 hover:shadow-indigo-500/30 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isForgotPassword ? 'Sending...' : 'Signing in...'}
                  </div>
                ) : (
                  isForgotPassword ? 'Send Reset Link' : 'Sign In'
                )}
              </button>
              
              <div className="text-sm text-center">
                {isForgotPassword ? (
                  <button type="button" onClick={() => {setIsForgotPassword(false); setErrorMsg(''); setSuccessMsg('');}} className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                    Back to login
                  </button>
                ) : (
                  <>
                    <span className="text-gray-500 dark:text-gray-400">Don't have an account? </span>
                    <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                      Create an account
                    </Link>
                  </>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
