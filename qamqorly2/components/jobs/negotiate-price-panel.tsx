'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function NegotiatePricePanel({ booking, tx }: { booking: any; tx: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [counterPrice, setCounterPrice] = useState<number>(Number(booking.price || 1000))
  const [showCounter, setShowCounter] = useState(false)

  const waitingForClient = booking.status === 'PENDING' && booking.lastPriceProposedBy === 'CAREGIVER'
  const clientCountered = booking.status === 'PENDING' && booking.lastPriceProposedBy === 'CLIENT'

  const panelTitle = clientCountered
    ? 'Client sent a new price'
    : waitingForClient
      ? 'Waiting for response'
      : 'Price decision'

  const panelText = clientCountered
    ? 'Accept the client amount or send a new counter offer.'
    : waitingForClient
      ? 'Your price update is sent. You can still revise it.'
      : 'Accept the current amount or send your own price.'

  const accept = async () => {
    setLoading(true)

    try {
      const res = await fetch(`/api/bookings/${booking.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!res.ok) {
        return
      }

      router.refresh()
      router.push('/quality')
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const counter = async () => {
    setLoading(true)

    try {
      const res = await fetch(`/api/bookings/${booking.id}/counter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: Number(counterPrice) }),
      })

      if (!res.ok) {
        return
      }

      setShowCounter(false)
      router.refresh()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-[1.8rem] border border-[#eee2d5] bg-white p-5 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">Negotiation</p>
      <p className="mt-3 text-lg font-semibold text-[#2d3147]">{panelTitle}</p>
      <p className="mt-2 text-sm leading-7 text-slate-500">{panelText}</p>

      {showCounter ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-[1.4rem] bg-[#fcfaf7] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">Counter price</label>
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">step 1000</span>
            </div>
            <div className="mt-2 flex items-end justify-between gap-3">
              <input
                type="number"
                min={1000}
                step={1000}
                value={counterPrice}
                onChange={(event) => setCounterPrice(Number(event.target.value))}
                className="min-w-0 flex-1 bg-transparent text-[2rem] font-serif font-semibold leading-none text-[#8d6241] outline-none [appearance:textfield] [font-variant-numeric:tabular-nums] [&::-webkit-inner-spin-button]:appearance-auto [&::-webkit-outer-spin-button]:appearance-auto"
              />
              <span className="pb-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">KZT</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setShowCounter(false)}
              className="rounded-[1.3rem] border border-[#e7dbcf] px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 transition-all hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={counter}
              disabled={loading}
              className="rounded-[1.3rem] bg-[#2d3147] px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white transition-all hover:bg-[#23273b] disabled:opacity-50"
            >
              {loading ? 'Sending...' : tx.counter}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          <button
            type="button"
            onClick={accept}
            disabled={loading}
            className="rounded-[1.3rem] bg-[#8d6241] px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white transition-all hover:bg-[#724f35] disabled:opacity-50"
          >
            {loading ? 'Loading...' : tx.accept}
          </button>
          <button
            type="button"
            onClick={() => setShowCounter(true)}
            className="rounded-[1.3rem] border border-[#e7dbcf] px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600 transition-all hover:bg-slate-50"
          >
            {waitingForClient ? 'Update counter offer' : tx.counter}
          </button>
        </div>
      )}
    </div>
  )
}
