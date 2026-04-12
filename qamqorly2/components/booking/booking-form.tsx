'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { ArrowLeft, Baby, Check, PawPrint, Sparkles, Star, UserRound, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Caregiver = {
  id: string
  fullName: string
  bio: string
  hourlyRate: number
  categories: string
  verificationStatus: string
  avgRating: number
}

type ServiceType = 'CHILD' | 'PET' | 'ELDER'

type ServiceOption = {
  id: ServiceType
  Icon: LucideIcon
}

const serviceOptions: ServiceOption[] = [
  { id: 'CHILD', Icon: Baby },
  { id: 'PET', Icon: PawPrint },
  { id: 'ELDER', Icon: UserRound },
]

export default function BookingForm({
  defaultType,
  defaultCaregiverId,
  dict,
  lang,
}: {
  defaultType: ServiceType
  defaultCaregiverId?: string | null
  dict: any
  lang: 'ru' | 'en' | 'kz'
}) {
  const [step, setStep] = useState(1)
  const [serviceType, setServiceType] = useState<ServiceType>(defaultType)
  const [allCaregivers, setAllCaregivers] = useState<Caregiver[]>([])
  const [caregivers, setCaregivers] = useState<Caregiver[]>([])
  const [caregiverId, setCaregiverId] = useState<string | null>(defaultCaregiverId ?? null)
  const [scheduledAt, setScheduledAt] = useState('')
  const [duration, setDuration] = useState(1)
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [customPrice, setCustomPrice] = useState<number | ''>('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const defaultPrice = useMemo(() => {
    const rates: Record<string, number> = { CHILD: 7000, PET: 5000, ELDER: 8000 }
    return (rates[serviceType] || 0) * duration
  }, [serviceType, duration])

  const stepsShort = {
    ru: ['Услуга', 'Специалист', 'Детали', 'Готово'],
    en: ['Service', 'Expert', 'Details', 'Done'],
    kz: ['Қызмет', 'Маман', 'Мәлімет', 'Дайын'],
  }[lang]

  const scheduleLabel =
    lang === 'ru' ? 'Когда ждать?' : lang === 'kz' ? 'Қашан күтеміз?' : 'Schedule time'
  const visitAddressLabel =
    lang === 'ru' ? 'Адрес визита' : lang === 'kz' ? 'Кездесу мекенжайы' : 'Visit address'
  const visitAddressPlaceholder =
    lang === 'ru'
      ? 'Укажите адрес, куда должен приехать caregiver'
      : lang === 'kz'
        ? 'Caregiver баратын мекенжайды жазыңыз'
        : 'Enter the address where the caregiver should arrive'
  const notesLabel =
    lang === 'ru' ? 'Особые примечания' : lang === 'kz' ? 'Қосымша ескертпелер' : 'Special notes'
  const budgetLabel =
    lang === 'ru' ? 'Бюджет (KZT)' : lang === 'kz' ? 'Бюджет (KZT)' : 'Offer Price (KZT)'
  const budgetEstimate = lang === 'ru' ? 'Примерно:' : lang === 'kz' ? 'Шамамен:' : 'Est:'
  const successTitle = lang === 'ru' ? 'Успешно!' : lang === 'kz' ? 'Сәтті!' : 'Success!'

  useEffect(() => {
    let cancelled = false
    const loadCaregivers = async () => {
      try {
        const res = await fetch('/api/caregivers')
        const data = await res.json()
        if (!res.ok || cancelled) {
          return
        }
        const parsed = (data || []).map((item: any) => {
          const avgRating = item.receivedReviews?.length
            ? item.receivedReviews.reduce((sum: number, review: any) => sum + review.rating, 0) / item.receivedReviews.length
            : 0
          return {
            id: item.id,
            fullName: item.fullName,
            bio: item.caregiver?.bio || '',
            hourlyRate: item.caregiver?.hourlyRate || 0,
            categories: item.caregiver?.categories || '',
            verificationStatus: item.caregiver?.verificationStatus || 'UNVERIFIED',
            avgRating,
          }
        })
        setAllCaregivers(parsed)
      } catch {
        if (!cancelled) {
          setMessage('Failed to load caregivers')
        }
      }
    }
    void loadCaregivers()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const filtered = allCaregivers.filter((caregiver) => {
      if (!caregiver.categories) {
        return true
      }
      return caregiver.categories.split(',').map((item) => item.trim()).includes(serviceType)
    })
    setCaregivers(filtered)

    if (caregiverId && !filtered.some((caregiver) => caregiver.id === caregiverId)) {
      setCaregiverId(null)
    }
  }, [allCaregivers, serviceType, caregiverId])

  useEffect(() => {
    if (caregiverId) {
      const cg = caregivers.find((c) => c.id === caregiverId)
      if (cg) {
        setCustomPrice(cg.hourlyRate * duration)
      }
    } else {
      setCustomPrice('')
    }
  }, [caregiverId, duration, caregivers])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caregiverId,
          serviceType,
          scheduledAt: new Date(scheduledAt).toISOString(),
          duration,
          tasks: selectedTasks,
          address,
          notes,
          price: customPrice === '' ? undefined : Number(customPrice),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data.detail || data.error || 'Failed to create booking')
        return
      }
      setStep(4)
    } finally {
      setLoading(false)
    }
  }

  const toggleTask = (taskKey: string) => {
    setSelectedTasks((prev) => (prev.includes(taskKey) ? prev.filter((t) => t !== taskKey) : [...prev, taskKey]))
  }

  const selectedHoursLabel = lang === 'kz' ? `${duration} сағ` : `${duration}h`

  return (
    <div className="mx-auto max-w-2xl px-0 pb-6 sm:px-2">
      <div className="relative mb-8 flex items-center justify-between px-2 before:absolute before:left-6 before:right-6 before:top-[18px] before:z-0 before:h-[1px] before:bg-slate-100 sm:before:left-8 sm:before:right-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="relative z-10 flex flex-col items-center gap-1.5">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full font-serif text-sm font-bold shadow-sm transition-all duration-300 ${
                step === s ? 'scale-110 bg-[#8d6241] text-white' : step > s ? 'bg-emerald-500 text-white' : 'border border-slate-100 bg-white text-slate-400'
              }`}
            >
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
            <span className={`text-[8px] font-bold uppercase tracking-[0.05em] sm:text-[9px] ${step === s ? 'text-[#8d6241]' : 'text-slate-300'}`}>
              {stepsShort[s - 1]}
            </span>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-[#e7dbcf] bg-white p-1 shadow-lg shadow-slate-100/50 sm:rounded-[2rem]">
        <div className="rounded-[1.3rem] bg-[#faf9f6] p-4 md:rounded-[1.8rem] md:p-6">
          {step === 1 && (
            <div className="fade-in space-y-6">
              <div className="text-center">
                <h2 className="font-serif text-2xl font-semibold tracking-tight text-[#2d3147]">{dict.booking.step1}</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {serviceOptions.map(({ id, Icon }) => {
                  const label =
                    id === 'CHILD' ? dict.booking.categoryChild : id === 'PET' ? dict.booking.categoryPet : dict.booking.categoryElder

                  return (
                    <button
                      key={id}
                      onClick={() => {
                        setServiceType(id)
                        setStep(2)
                      }}
                      className={`group flex flex-col items-center justify-center rounded-2xl border bg-white p-6 transition-all hover:bg-white hover:shadow-md ${
                        serviceType === id ? 'border-[#8d6241] ring-1 ring-[#8d6241]' : 'border-slate-100'
                      }`}
                    >
                      <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#faf2e9] text-[#8d6241]">
                        <Icon className="h-6 w-6" />
                      </span>
                      <span className="text-center text-xs font-bold text-[#2d3147]">{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="fade-in space-y-6">
              <div className="text-center">
                <h2 className="font-serif text-2xl font-semibold tracking-tight text-[#2d3147]">{dict.booking.step2}</h2>
              </div>
              <div className="grid max-h-[45svh] gap-3 overflow-y-auto pr-1 md:max-h-[300px]">
                <button
                  onClick={() => {
                    setCaregiverId(null)
                    setStep(3)
                  }}
                  className="flex items-center gap-4 rounded-2xl border border-dashed border-[#8d6241]/40 bg-[#8d6241]/5 p-4 text-left transition-all hover:bg-[#8d6241]/10"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-sm">
                    <Sparkles className="h-5 w-5 text-[#8d6241]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#8d6241]">{dict.booking.skipSpecialist}</p>
                    <p className="text-[10px] text-slate-500">{dict.booking.anySpecialist}</p>
                  </div>
                </button>

                {caregivers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setCaregiverId(c.id)
                      setStep(3)
                    }}
                    className={`group flex items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                      caregiverId === c.id ? 'border-[#8d6241] bg-white ring-1 ring-[#8d6241]' : 'border-slate-100 bg-white hover:border-[#e7dbcf]'
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-serif text-sm text-[#8d6241]">{c.fullName[0]}</div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#2d3147]">{c.fullName}</p>
                      <p className="text-[10px] font-bold text-[#8d6241]">{c.hourlyRate} KZT / h</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-[10px] font-bold">{c.avgRating.toFixed(1)}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-4">
                <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <ArrowLeft className="h-4 w-4" />
                  {dict.booking.back}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={onSubmit} className="fade-in space-y-6">
              <div className="text-center">
                <h2 className="font-serif text-2xl font-semibold tracking-tight text-[#2d3147]">{dict.booking.step3}</h2>
              </div>

              <div className="grid gap-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="pl-1 text-[9px] font-black uppercase tracking-widest text-slate-400">{scheduleLabel}</label>
                    <input
                      type="datetime-local"
                      required
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm outline-none focus:border-[#d0a144]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="pl-1 text-[9px] font-black uppercase tracking-widest text-slate-400">{dict.booking.durationLabel}</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1"
                        max="24"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value))}
                        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-slate-200 accent-[#8d6241]"
                      />
                      <span className="w-12 text-sm font-bold text-[#2d3147]">{selectedHoursLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="pl-1 text-[9px] font-black uppercase tracking-widest text-slate-400">{dict.booking.tasksLabel}</label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Object.entries(dict.booking.tasks).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleTask(key)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all ${
                          selectedTasks.includes(key) ? 'border-[#8d6241] bg-[#8d6241]/5 text-[#8d6241]' : 'border-slate-100 bg-white text-slate-500'
                        }`}
                      >
                        <div className={`flex h-4 w-4 items-center justify-center rounded border ${selectedTasks.includes(key) ? 'border-[#8d6241] bg-[#8d6241]' : 'border-slate-200'}`}>
                          {selectedTasks.includes(key) ? <Check className="h-3 w-3 text-white" /> : null}
                        </div>
                        <span className="text-[11px] font-medium">{label as string}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="pl-1 text-[9px] font-black uppercase tracking-widest text-slate-400">{visitAddressLabel}</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={visitAddressPlaceholder}
                    className="w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm outline-none focus:border-[#d0a144]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="pl-1 text-[9px] font-black uppercase tracking-widest text-slate-400">{notesLabel}</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="..."
                    className="min-h-[60px] w-full resize-none rounded-xl border border-slate-100 bg-white px-4 py-2 text-sm outline-none focus:border-[#d0a144]"
                  />
                </div>

                <div className="space-y-3 rounded-2xl border border-[#8d6241]/10 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{budgetLabel}</span>
                    <span className="text-[10px] italic text-slate-300">{budgetEstimate} {defaultPrice} KZT</span>
                  </div>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={defaultPrice.toString()}
                    className="w-full border-none bg-transparent p-0 font-serif text-2xl font-semibold text-[#8d6241] outline-none focus:ring-0"
                  />
                </div>
              </div>

              {message ? <p className="rounded-lg bg-red-50 p-2 text-center text-[10px] font-bold text-red-500">{message}</p> : null}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={() => setStep(2)} className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {dict.booking.back}
                </button>
                <button type="submit" disabled={loading} className="w-full rounded-full bg-[#8d6241] px-10 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-[#8d6241]/20 sm:w-auto">
                  {loading ? '...' : dict.booking.confirm}
                </button>
              </div>
            </form>
          )}

          {step === 4 && (
            <div className="fade-in space-y-4 py-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="font-serif text-2xl font-semibold text-[#2d3147]">{successTitle}</h2>
              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-center">
                <Link href="/dashboard" className="rounded-full bg-slate-100 px-8 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  {dict.nav.dashboard}
                </Link>
                <Link href="/" className="rounded-full bg-[#8d6241] px-8 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-white">
                  {dict.nav.home}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

