'use client'

import React, { useEffect, useRef } from 'react'

export default function ThemeToggle() {
  const darkRef = useRef(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const prefersDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)
    darkRef.current = prefersDark
    document.documentElement.classList.toggle('dark', prefersDark)
  }, [])

  const toggle = () => {
    darkRef.current = !darkRef.current
    document.documentElement.classList.toggle('dark', darkRef.current)
    localStorage.setItem('theme', darkRef.current ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 hidden dark:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 block dark:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    </button>
  )
}
