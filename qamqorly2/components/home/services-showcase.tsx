'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Baby, HeartPulse, PawPrint, X } from 'lucide-react'

import PrimaryButton from '@/shared/ui/buttons/primary-button'

type CareType = 'CHILD' | 'PET' | 'ELDER'

type ServiceCard = {
  type: CareType
  title: string
  summary: string
  rate: string
  bullets: string[]
}

type ServicesShowcaseProps = {
  eyebrow: string
  title: string
  line: string
  serviceCards: ServiceCard[]
  ctaText: string
  ctaHref: string
}

const iconMap = {
  CHILD: Baby,
  PET: PawPrint,
  ELDER: HeartPulse,
} as const

export default function ServicesShowcase({
  eyebrow,
  title,
  line,
  serviceCards,
  ctaText,
  ctaHref,
}: ServicesShowcaseProps) {
  const [activeType, setActiveType] = useState<CareType | null>(null)

  useEffect(() => {
    if (!activeType) {
      document.body.style.overflow = ''
      return
    }

    document.body.style.overflow = 'hidden'
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveType(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeType])

  const activeCard = serviceCards.find((card) => card.type === activeType) ?? null

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="flex flex-col gap-4 border-b border-[#ecdfd2] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d6241]">{eyebrow}</p>
            <h2 className="mt-3 font-serif text-[1.9rem] font-semibold tracking-[-0.05em] text-[#2d3147] sm:text-[2.8rem]">
              {title}
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-600">{line}</p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {serviceCards.map((item) => {
            const Icon = iconMap[item.type]
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => setActiveType(item.type)}
                className="group flex min-h-[200px] flex-col rounded-[1.45rem] border border-white/85 bg-white/72 p-4 text-left shadow-[0_16px_36px_rgba(96,72,50,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_42px_rgba(96,72,50,0.1)] sm:min-h-[220px] sm:rounded-[1.6rem] sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d6241]">Category</p>
                    <h3 className="mt-3 font-serif text-[1.5rem] font-semibold tracking-[-0.04em] text-[#2d3147] sm:text-[1.6rem]">{item.title}</h3>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4ebe1] text-[#8d6241] transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-4 max-w-[28ch] text-sm leading-6 text-slate-600">{item.summary}</p>
                <div className="mt-auto pt-5">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#eadbcf] bg-[#fffdfa] px-3 py-1.5 text-sm font-medium text-[#8d6241]">
                    Explore details
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div
        className={`fixed inset-0 z-[70] flex items-end bg-[rgba(34,30,27,0.45)] px-3 pb-3 pt-20 transition-all duration-300 sm:items-center sm:px-4 sm:py-4 ${
          activeCard ? 'pointer-events-auto opacity-100 backdrop-blur-sm' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setActiveType(null)}
      >
        <div
          className={`w-full max-w-3xl overflow-y-auto rounded-[1.6rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,252,248,0.98),rgba(245,237,230,0.96))] p-4 shadow-[0_32px_90px_rgba(36,29,22,0.18)] transition-all duration-300 sm:max-h-[85svh] sm:rounded-[2rem] sm:p-6 ${
            activeCard ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-[0.98] opacity-0'
          }`}
          style={{ maxHeight: 'calc(100svh - 1.5rem)' }}
          onClick={(event) => event.stopPropagation()}
        >
          {activeCard && (
            <>
              <div className="flex items-start justify-between gap-4 border-b border-[#eadbcf] pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d6241]">Care details</p>
                  <h3 className="mt-3 font-serif text-[1.85rem] font-semibold tracking-[-0.04em] text-[#2d3147] sm:text-[2.5rem]">
                    {activeCard.title}
                  </h3>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">{activeCard.summary}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveType(null)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#eadbcf] bg-white/80 text-[#8d6241] transition hover:bg-white"
                  aria-label="Close details"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[1.4rem] border border-white/80 bg-white/72 p-4 sm:rounded-[1.6rem] sm:p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d6241]">What this care includes</p>
                  <div className="mt-4 space-y-3">
                    {activeCard.bullets.map((bullet) => (
                      <div key={bullet} className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#8d6241]" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col rounded-[1.4rem] border border-white/80 bg-white/72 p-4 sm:rounded-[1.6rem] sm:p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d6241]">Starting rate</p>
                  <p className="mt-3 font-serif text-[1.7rem] font-semibold tracking-[-0.05em] text-[#2d3147] sm:text-[1.9rem]">{activeCard.rate}</p>
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    Open booking when you are ready, then add timing, visit notes, and household details in one calm flow.
                  </p>
                  <div className="mt-6 sm:mt-auto sm:pt-6">
                    <PrimaryButton href={ctaHref} text={ctaText} className="w-full justify-center px-6 py-3 text-sm font-semibold" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
