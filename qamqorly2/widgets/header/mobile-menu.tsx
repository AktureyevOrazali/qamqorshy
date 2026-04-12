'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type MobileMenuProps = {
  session: any
  labels: {
    home: string
    product: string
    pricing: string
    contact: string
    specialists: string
    messages: string
    quality: string
    jobs: string
    dashboard: string
    login: string
    register: string
    quote: string
  }
  langSwitcher: React.ReactNode
  logoutButton?: React.ReactNode
}

export default function MobileMenu({ session, labels, langSwitcher, logoutButton }: MobileMenuProps) {
  const [open, setOpen] = useState(false)

  const isAuthed = Boolean(session)
  const isCaregiver = session?.role === 'CAREGIVER'

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const navLink = (href: string, text: string) => (
    <Link
      href={href}
      onClick={() => setOpen(false)}
      className="block rounded-2xl px-4 py-3 text-sm font-semibold text-[#2d3147] transition-colors duration-200 hover:bg-[#faf9f6] hover:text-[#8d6241]"
    >
      {text}
    </Link>
  )

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="relative z-[60] flex h-10 w-10 items-center justify-center rounded-xl border border-[#e7dbcf] bg-white transition-all duration-300 hover:bg-[#faf9f6]"
        aria-label="Toggle menu"
      >
        <div className="flex flex-col items-center justify-center gap-[5px]">
          <span className={`block h-[2px] w-5 rounded-full bg-[#8d6241] transition-all duration-300 ${open ? 'translate-y-[7px] rotate-45' : ''}`} />
          <span className={`block h-[2px] w-5 rounded-full bg-[#8d6241] transition-all duration-300 ${open ? 'opacity-0' : ''}`} />
          <span className={`block h-[2px] w-5 rounded-full bg-[#8d6241] transition-all duration-300 ${open ? '-translate-y-[7px] -rotate-45' : ''}`} />
        </div>
      </button>

      <div className={`mobile-menu-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />

      <div className={`mobile-menu-panel ${open ? 'open' : ''}`}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[#e7dbcf]/50 px-5 py-4 sm:px-6 sm:py-5">
            <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d0a144] text-white">
                <span className="font-serif text-lg font-bold italic">Q</span>
              </div>
              <span className="font-serif text-lg font-semibold text-[#2d3147]">Qamqorshy</span>
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-slate-50 hover:text-[#8d6241]"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
            {navLink('/', labels.home)}

            {!isCaregiver && (
              <>
                {navLink('/#services', labels.product)}
                {navLink('/#pricing', labels.pricing)}
                {navLink('/caregivers', labels.specialists)}
              </>
            )}

            {isCaregiver && navLink('/jobs', labels.jobs)}

            {isAuthed && (
              <>
                <div className="my-3 h-px bg-[#e7dbcf]/50" />
                {navLink('/dashboard', labels.dashboard)}
                {navLink('/messages', labels.messages)}
                {navLink('/quality', labels.quality)}
              </>
            )}
          </nav>

          <div className="space-y-3 border-t border-[#e7dbcf]/50 px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex items-center gap-3">{langSwitcher}</div>
            {isAuthed ? (
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-full border border-[#8d6241] px-4 py-2.5 text-center text-xs font-bold text-[#8d6241] transition-colors duration-200 hover:bg-[#8d6241] hover:text-white"
                >
                  {labels.dashboard}
                </Link>
                {logoutButton}
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-[#8d6241] px-4 py-2.5 text-center text-xs font-bold text-[#8d6241] transition-colors duration-200 hover:bg-[#faf9f6]"
                >
                  {labels.login}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-[#8d6241] px-4 py-2.5 text-center text-xs font-bold text-white transition-colors duration-200 hover:bg-[#724f35]"
                >
                  {labels.register}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
