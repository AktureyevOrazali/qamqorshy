'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

function parseTasks(tasks: unknown): string[] {
  if (Array.isArray(tasks)) {
    return tasks.map((task) => String(task).trim()).filter(Boolean)
  }

  if (typeof tasks === 'string') {
    try {
      const parsed = JSON.parse(tasks)
      if (Array.isArray(parsed)) {
        return parsed.map((task) => String(task).trim()).filter(Boolean)
      }
    } catch {
      // fall through to splitting
    }

    return tasks
      .split(',')
      .map((task) => task.replace(/[\[\]"]+/g, '').trim())
      .filter(Boolean)
  }

  return []
}

function formatTask(task: string) {
  return task
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase())
}

function getServiceLabel(serviceType: string) {
  if (serviceType === 'CHILD') return 'Child care'
  if (serviceType === 'ELDER') return 'Elder care'
  return 'Pet care'
}

export function JobCard({ booking, tx }: { booking: any; tx: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [price, setPrice] = useState<number>(Number(booking.price || 1000))
  const [hidden, setHidden] = useState(false)

  const tasks = parseTasks(booking.tasks)
  const visibleTasks = tasks.slice(0, 3)
  const extraTasks = Math.max(tasks.length - visibleTasks.length, 0)
  const priceChanged = Number(price) !== Number(booking.price)

  const submitDecision = async () => {
    setLoading(true)

    try {
      const endpoint = priceChanged ? `/api/bookings/${booking.id}/counter` : `/api/bookings/${booking.id}/accept`
      const payload = priceChanged ? { price: Number(price) } : {}

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        return
      }

      router.refresh()
      if (!priceChanged) {
        router.push('/quality')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const deny = async () => {
    setHidden(true)

    try {
      const res = await fetch(`/api/bookings/${booking.id}/deny`, { method: 'POST' })
      if (!res.ok) {
        setHidden(false)
        return
      }
      router.refresh()
    } catch (error) {
      console.error(error)
      setHidden(false)
    }
  }

  if (hidden) {
    return null
  }

  const scheduledAt = new Date(booking.scheduledAt).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <article className="relative flex h-full flex-col rounded-[2rem] border border-[#eadbca] bg-white p-5 shadow-[0_18px_45px_rgba(141,98,65,0.07)] transition-all hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(141,98,65,0.12)] md:p-6">
      <button
        type="button"
        onClick={deny}
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-[#fcfaf7] text-sm font-black text-slate-300 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
        aria-label="Dismiss job"
      >
        x
      </button>

      <Link href={`/jobs/${booking.id}`} className="flex flex-1 flex-col">
        <div className="flex items-start gap-3 pr-12">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#ede3d8] bg-[#f8f2eb] font-serif text-lg text-[#8d6241]">
            {booking.client.fullName?.[0] || 'C'}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-lg font-semibold text-[#2d3147]">{booking.client.fullName}</p>
              <span className="rounded-full bg-[#f5ece1] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#8d6241]">
                {getServiceLabel(booking.serviceType)}
              </span>
            </div>
            <p className="mt-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">{scheduledAt}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-1 flex-col gap-4">
          <div className="min-h-[52px] line-clamp-3 text-sm leading-7 text-slate-500">
            {booking.notes || booking.client.clientProfile?.about || 'Open request without extra notes yet.'}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {visibleTasks.length > 0 ? (
              visibleTasks.map((task) => (
                <span
                  key={task}
                  className="rounded-full border border-[#eadfd2] bg-[#fcfaf7] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#5d6477]"
                >
                  {formatTask(task)}
                </span>
              ))
            ) : (
              <span className="text-xs font-medium text-slate-400">No tasks listed</span>
            )}
            {extraTasks > 0 && (
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                +{extraTasks}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="mt-5 border-t border-[#f1e8dd] pt-5">
        <div className="grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
          <div className="rounded-[1.4rem] bg-[#fcfaf7] px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">{tx.duration}</p>
            <p className="mt-2 text-2xl font-serif font-semibold text-[#2d3147]">
              {booking.duration}
              {tx.hours}
            </p>
          </div>

          <div
            className="rounded-[1.4rem] bg-[#fcfaf7] px-4 py-3"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">{tx.price}</p>
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">step 1000</span>
            </div>
            <div className="mt-2 flex items-end justify-between gap-3">
              <input
                aria-label="Offer price"
                type="number"
                min={1000}
                step={1000}
                value={price}
                onChange={(event) => setPrice(Number(event.target.value))}
                className="min-w-0 flex-1 bg-transparent text-[2rem] font-serif font-semibold leading-none text-[#8d6241] outline-none [appearance:textfield] [font-variant-numeric:tabular-nums] [&::-webkit-inner-spin-button]:appearance-auto [&::-webkit-outer-spin-button]:appearance-auto"
              />
              <span className="pb-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">KZT</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={submitDecision}
          disabled={loading}
          className={`mt-4 block w-full rounded-[1.4rem] py-4 text-center text-[11px] font-black uppercase tracking-[0.18em] transition-all disabled:opacity-50 ${
            priceChanged
              ? 'bg-[#2d3147] text-white shadow-[0_12px_24px_rgba(45,49,71,0.16)] hover:bg-[#23273b]'
              : 'bg-[#8d6241] text-white shadow-[0_12px_24px_rgba(141,98,65,0.18)] hover:bg-[#724f35]'
          }`}
        >
          {loading ? '...' : priceChanged ? 'Send Counter Offer' : tx.accept}
        </button>
      </div>
    </article>
  )
}

