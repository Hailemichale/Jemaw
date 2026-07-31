'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

interface OnboardingFormProps {
  userId: string
  email: string
}

export default function OnboardingForm({ userId, email }: OnboardingFormProps) {
  const [name, setName] = useState('')
  const [gender, setGender] = useState('Prefer not to say')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthDay, setBirthDay] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const { error } = await supabase
        .from('users')
        .insert({
          id: userId,
          name: name,
          phone_or_email: email,
          gender: gender,
          birthday_month: birthMonth ? parseInt(birthMonth) : null,
          birthday_day: birthDay ? parseInt(birthDay) : null,
          birthday_year_private: birthYear ? parseInt(birthYear) : null
        })

      if (error) {
        throw error
      }

      // Success, redirect to dashboard
      router.push('/')
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' },
    { value: '3', label: 'March' }, { value: '4', label: 'April' },
    { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' },
    { value: '9', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' }
  ]

  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i)

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Full Name
        </label>
        <div className="mt-1">
          <input
            id="name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
            placeholder="John Doe"
          />
        </div>
      </div>

      {/* Gender */}
      <div>
        <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Gender
        </label>
        <div className="mt-1">
          <select
            id="gender"
            name="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
          >
            <option>Male</option>
            <option>Female</option>
            <option>Prefer not to say</option>
            <option>Custom</option>
          </select>
        </div>
      </div>

      {/* Birthday */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Birthday
        </label>
        <div className="mt-1 grid grid-cols-3 gap-3">
          <select
            value={birthMonth}
            onChange={(e) => setBirthMonth(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
          >
            <option value="">Month</option>
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select
            value={birthDay}
            onChange={(e) => setBirthDay(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
          >
            <option value="">Day</option>
            {days.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
          >
            <option value="">Year</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Year is completely optional and private.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                {errorMsg}
              </h3>
            </div>
          </div>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={loading || !name}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving...' : 'Complete Profile'}
        </button>
      </div>
    </form>
  )
}
