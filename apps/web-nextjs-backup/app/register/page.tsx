'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signupAction } from '../auth-actions'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [nationality, setNationality] = useState('')
  
  const [errorMsg, setErrorMsg] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match')
      return
    }

    setIsLoading(true)
    
    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('email', email)
      formData.append('password', password)
      formData.append('birthdate', birthdate)
      formData.append('nationality', nationality)

      const result = await signupAction(formData)
      
      if (result?.error) {
        setErrorMsg(result.error)
        setIsLoading(false)
      } else if (result?.success) {
        window.location.href = '/'
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during registration')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Left side - Dynamic Brand Identity */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900 flex-col justify-center">
        {/* Animated Gradient Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        
        {/* Abstract shapes */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-400 rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-pulse delay-1000"></div>

        {/* Branding Content */}
        <div className="relative z-10 w-full max-w-lg px-12 text-white">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 p-10 rounded-3xl shadow-2xl">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/20 text-white mb-8 shadow-inner overflow-hidden border-2 border-white/30 backdrop-blur-md">
              <img src="/logo.jpg" alt="Jemaw Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-4">
              Join the community.
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              Create your account to start coordinating your groups, managing events, and connecting with friends seamlessly on Jemaw.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Registration Form */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center px-8 sm:px-16 xl:px-24 py-8">
        <div className="mx-auto w-full max-w-md">
          
          <div className="mb-8 lg:hidden flex justify-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-xl mb-2 overflow-hidden border border-gray-100 dark:border-gray-800">
              <img src="/logo.jpg" alt="Jemaw Logo" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Create an account</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                Sign in instead
              </Link>
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {errorMsg && (
              <div className="p-4 bg-red-50/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5" htmlFor="name">
                Full Name
              </label>
              <div className="relative">
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-2xl border-0 py-3 pl-4 pr-4 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white dark:bg-slate-900 transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5" htmlFor="birthdate">
                  Date of Birth
                </label>
                <div className="relative">
                  <input
                    id="birthdate"
                    type="date"
                    required
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                    className="block w-full rounded-2xl border-0 py-3 pl-4 pr-4 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-800 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white dark:bg-slate-900 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5" htmlFor="nationality">
                  Nationality
                </label>
                <div className="relative">
                  <input
                    id="nationality"
                    type="text"
                    required
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="block w-full rounded-2xl border-0 py-3 pl-4 pr-4 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white dark:bg-slate-900 transition-all"
                    placeholder="e.g. American"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5" htmlFor="email">
                Email address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M3 4a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2H3zm14 2.207l-7 4.2-7-4.2V6h14v.207zM3 14v-5.793l7 4.2 7-4.2V14H3z" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-2xl border-0 py-3 pl-11 pr-4 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white dark:bg-slate-900 transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-2xl border-0 py-3 pl-11 pr-4 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white dark:bg-slate-900 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-2xl border-0 py-3 pl-11 pr-4 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white dark:bg-slate-900 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-2xl bg-indigo-600 px-3 py-3.5 text-sm font-semibold leading-6 text-white shadow-lg hover:bg-indigo-500 hover:shadow-indigo-500/30 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
