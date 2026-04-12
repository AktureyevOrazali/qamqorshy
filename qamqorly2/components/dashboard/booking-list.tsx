'use client'

import { useState } from 'react'

type Booking = {
  id: string
  serviceType: string
  scheduledAt: string
  duration?: number
  status: string
  tasks?: unknown
  notes?: string
  price?: number
  lastPriceProposedBy?: 'CLIENT' | 'CAREGIVER' | 'ADMIN' | null
  priceProposedAt?: string | null
  client: {
    id?: string | null
    fullName: string
    clientProfile?: {
      address?: string | null
      about?: string | null
    }
  }
  caregiver?: { id: string; fullName: string } | null
  reviews: Array<{ id: string; rating: number; text: string }>
}

type Props = {
  initialBookings: Booking[]
  userRole: string
  tx: {
    noBookings: string
    client: string
    specialist: string
    notAssigned: string
  }
}

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
      // fall through to string splitting
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

function getStatusTone(status: string) {
  if (status === 'COMPLETED') return 'bg-emerald-50 text-emerald-600'
  if (status === 'CANCELED') return 'bg-rose-50 text-rose-600'
  if (status === 'ACCEPTED') return 'bg-[#eef4ff] text-[#496184]'
  return 'bg-amber-50 text-amber-700'
}

export default function BookingList({ initialBookings, userRole, tx }: Props) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELED'>('ALL')
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [loadingReview, setLoadingReview] = useState(false)
  const [counterBookingId, setCounterBookingId] = useState<string | null>(null)
  const [counterValues, setCounterValues] = useState<Record<string, string>>({})
  const [actionBookingId, setActionBookingId] = useState<string | null>(null)

  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'ALL') return true
    return booking.status === filter
  })

  const updateBooking = (nextBooking: Booking) => {
    setBookings((prev) => prev.map((booking) => (booking.id === nextBooking.id ? nextBooking : booking)))
  }

  const markCanceled = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === bookingId
          ? { ...booking, status: 'CANCELED', lastPriceProposedBy: null, priceProposedAt: null }
          : booking
      )
    )
  }

  const getCounterValue = (booking: Booking) => counterValues[booking.id] ?? String(booking.price ?? '')

  const handleSubmitReview = async (event: React.FormEvent, bookingId: string) => {
    event.preventDefault()
    if (!reviewText.trim()) return

    setLoadingReview(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, rating, text: reviewText }),
      })

      if (!res.ok) {
        return
      }

      const data = await res.json()
      setBookings((prev) => prev.map((booking) => (booking.id === bookingId ? { ...booking, reviews: [data] } : booking)))
      setReviewBookingId(null)
      setReviewText('')
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingReview(false)
    }
  }

  const decideAsClient = async (booking: Booking, action: 'accept' | 'counter' | 'cancel') => {
    setActionBookingId(booking.id)

    try {
      const payload: { action: 'accept' | 'counter' | 'cancel'; price?: number } = { action }
      if (action === 'counter') {
        payload.price = Number(getCounterValue(booking) || booking.price || 0)
      }

      const res = await fetch(`/api/bookings/${booking.id}/client-decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        return
      }

      const updated = await res.json()
      updateBooking(updated)
      setCounterBookingId(null)
    } catch (error) {
      console.error(error)
    } finally {
      setActionBookingId(null)
    }
  }

  const decideAsCaregiver = async (booking: Booking, action: 'accept' | 'counter' | 'cancel') => {
    setActionBookingId(booking.id)

    try {
      if (action === 'cancel') {
        const res = await fetch(`/api/bookings/${booking.id}/deny`, { method: 'POST' })
        if (res.ok) {
          markCanceled(booking.id)
        }
        return
      }

      const endpoint = action === 'accept' ? `/api/bookings/${booking.id}/accept` : `/api/bookings/${booking.id}/counter`
      const body = action === 'accept' ? {} : { price: Number(getCounterValue(booking) || booking.price || 0) }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        return
      }

      const updated = await res.json()
      updateBooking(updated)
      setCounterBookingId(null)
    } catch (error) {
      console.error(error)
    } finally {
      setActionBookingId(null)
    }
  }

  return (
    <div className="mt-10">
      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-slate-100 pb-4">
        {['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELED'].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value as typeof filter)}
            className={`rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] transition-all ${
              filter === value ? 'bg-[#8d6241] text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredBookings.length === 0 && (
          <p className="rounded-[2rem] border border-dashed border-[#d7c7b8] bg-[#fffdfb] p-10 text-center text-slate-400 italic">
            {tx.noBookings}
          </p>
        )}

        {filteredBookings.map((booking) => {
          const tasks = parseTasks(booking.tasks)
          const isClientNotification = userRole === 'CLIENT' && booking.status === 'PENDING' && booking.lastPriceProposedBy === 'CAREGIVER'
          const isCaregiverNotification = userRole === 'CAREGIVER' && booking.status === 'PENDING' && booking.lastPriceProposedBy === 'CLIENT'
          const waitingForClient = userRole === 'CAREGIVER' && booking.status === 'PENDING' && booking.lastPriceProposedBy === 'CAREGIVER'
          const waitingForCaregiver = userRole === 'CLIENT' && booking.status === 'PENDING' && booking.lastPriceProposedBy === 'CLIENT'
          const isExpanded = expandedId === booking.id
          const allowCounterInput = isClientNotification || isCaregiverNotification || counterBookingId === booking.id

          return (
            <article
              key={booking.id}
              className={`rounded-[2rem] border border-[#e7dbcf] bg-white p-6 shadow-sm transition-all hover:shadow-md ${
                isExpanded ? 'ring-2 ring-[#d0a144]/10' : ''
              }`}
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setExpandedId(isExpanded ? null : booking.id)}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#8d6241]">
                        {getServiceLabel(booking.serviceType)}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">
                        {new Date(booking.scheduledAt).toLocaleString()}
                      </span>
                      {booking.lastPriceProposedBy && booking.status === 'PENDING' && (
                        <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-amber-700">
                          Price update
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-[#2d3147]">
                      {tx.client}: <span className="font-normal text-slate-600">{booking.client.fullName}</span>
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#2d3147]">
                      {tx.specialist}: <span className="font-normal text-slate-600">{booking.caregiver?.fullName || tx.notAssigned}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-start md:self-center">
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${getStatusTone(booking.status)}`}>
                      {booking.status}
                    </span>
                    {userRole === 'CLIENT' && booking.status === 'COMPLETED' && booking.reviews.length === 0 && (
                      <span className="rounded-xl border border-[#d0a144] px-4 py-1.5 text-[11px] font-black text-[#d0a144]">
                        Add review
                      </span>
                    )}
                    <span className={`text-sm font-black text-[#d0a144] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      v
                    </span>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="mt-6 grid gap-6 border-t border-slate-50 pt-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-5">
                    <div className="rounded-[1.8rem] border border-[#efe4d7] bg-[#fffdfa] p-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">Tasks</p>
                        <span className="rounded-full bg-[#fbf5ee] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                          {tasks.length || 0}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2.5">
                        {tasks.length === 0 ? (
                          <span className="text-sm text-slate-400">No specific tasks mentioned.</span>
                        ) : (
                          tasks.map((task) => (
                            <span
                              key={task}
                              className="rounded-full border border-[#e7dbcf] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#5d6477]"
                            >
                              {formatTask(task)}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="rounded-[1.8rem] border border-[#efe4d7] bg-[#fffdfa] p-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">Notes</p>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{booking.notes || 'No extra notes.'}</p>
                    </div>

                    {isClientNotification && (
                      <div className="rounded-[1.8rem] border border-amber-100 bg-amber-50 p-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">Notification</p>
                        <p className="mt-2 text-sm font-semibold text-[#2d3147]">Your caregiver proposed a new price.</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          Review the updated amount. You can accept it, send another price, or cancel the booking.
                        </p>
                      </div>
                    )}

                    {isCaregiverNotification && (
                      <div className="rounded-[1.8rem] border border-[#e7dbcf] bg-[#faf8f4] p-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8d6241]">Client response</p>
                        <p className="mt-2 text-sm font-semibold text-[#2d3147]">The client answered with another price.</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          Accept the client amount or send a new counter proposal with the same 1000 KZT step.
                        </p>
                      </div>
                    )}

                    {waitingForClient && (
                      <div className="rounded-[1.8rem] border border-slate-100 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
                        You already sent a counter offer. The booking stays reserved for you while the client decides.
                      </div>
                    )}

                    {waitingForCaregiver && (
                      <div className="rounded-[1.8rem] border border-slate-100 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
                        Your counter offer was sent. Waiting for the caregiver to accept, counter, or cancel.
                      </div>
                    )}
                  </div>

                  <aside className="h-fit rounded-[1.8rem] border border-[#e7dbcf] bg-[#faf9f6] p-5">
                    <div className="rounded-[1.5rem] border border-white bg-white p-4 shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">Current amount</p>
                      <p className="mt-2 text-3xl font-serif font-semibold text-[#8d6241]">
                        {Number(booking.price || 0).toLocaleString()} KZT
                      </p>
                      {booking.priceProposedAt && (
                        <p className="mt-2 text-[11px] text-slate-400">
                          Updated: {new Date(booking.priceProposedAt).toLocaleString()}
                        </p>
                      )}
                    </div>

                    {allowCounterInput && (
                      <div className="mt-4 rounded-[1.5rem] border border-white bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Counter price</label>
                          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">step 1000</span>
                        </div>
                        <div className="relative mt-3">
                          <input
                            type="number"
                            min={1000}
                            step={1000}
                            value={getCounterValue(booking)}
                            onChange={(event) =>
                              setCounterValues((prev) => ({
                                ...prev,
                                [booking.id]: event.target.value,
                              }))
                            }
                            className="w-full rounded-[1.2rem] border border-[#e7dbcf] bg-[#faf9f6] px-4 py-3 pr-16 text-xl font-serif font-semibold text-[#8d6241] outline-none"
                          />
                          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                            KZT
                          </span>
                        </div>
                      </div>
                    )}

                    {!isClientNotification && !isCaregiverNotification && booking.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => setCounterBookingId(counterBookingId === booking.id ? null : booking.id)}
                        className="mt-4 w-full rounded-[1.4rem] border border-[#d7c7b8] py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#8d6241] transition-all hover:bg-white"
                      >
                        {counterBookingId === booking.id ? 'Hide counter box' : 'Prepare counter offer'}
                      </button>
                    )}

                    {isClientNotification && (
                      <div className="mt-4 grid gap-2">
                        <button
                          type="button"
                          onClick={() => decideAsClient(booking, 'accept')}
                          disabled={actionBookingId === booking.id}
                          className="rounded-[1.4rem] bg-[#8d6241] px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white disabled:opacity-50"
                        >
                          {actionBookingId === booking.id ? '...' : 'Accept offer'}
                        </button>
                        <button
                          type="button"
                          onClick={() => decideAsClient(booking, 'counter')}
                          disabled={actionBookingId === booking.id}
                          className="rounded-[1.4rem] border border-[#2d3147] px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#2d3147] disabled:opacity-50"
                        >
                          {actionBookingId === booking.id ? '...' : 'Counter again'}
                        </button>
                        <button
                          type="button"
                          onClick={() => decideAsClient(booking, 'cancel')}
                          disabled={actionBookingId === booking.id}
                          className="rounded-[1.4rem] border border-rose-100 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-rose-600 disabled:opacity-50"
                        >
                          {actionBookingId === booking.id ? '...' : 'Cancel booking'}
                        </button>
                      </div>
                    )}

                    {isCaregiverNotification && (
                      <div className="mt-4 grid gap-2">
                        <button
                          type="button"
                          onClick={() => decideAsCaregiver(booking, 'accept')}
                          disabled={actionBookingId === booking.id}
                          className="rounded-[1.4rem] bg-[#8d6241] px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white disabled:opacity-50"
                        >
                          {actionBookingId === booking.id ? '...' : 'Accept client price'}
                        </button>
                        <button
                          type="button"
                          onClick={() => decideAsCaregiver(booking, 'counter')}
                          disabled={actionBookingId === booking.id}
                          className="rounded-[1.4rem] border border-[#2d3147] px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#2d3147] disabled:opacity-50"
                        >
                          {actionBookingId === booking.id ? '...' : 'Send new counter'}
                        </button>
                        <button
                          type="button"
                          onClick={() => decideAsCaregiver(booking, 'cancel')}
                          disabled={actionBookingId === booking.id}
                          className="rounded-[1.4rem] border border-rose-100 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-rose-600 disabled:opacity-50"
                        >
                          {actionBookingId === booking.id ? '...' : 'Cancel booking'}
                        </button>
                      </div>
                    )}

                    {counterBookingId === booking.id && !isClientNotification && !isCaregiverNotification && booking.status === 'PENDING' && (
                      <div className="mt-4 grid gap-2">
                        {userRole === 'CLIENT' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => decideAsClient(booking, 'counter')}
                              disabled={actionBookingId === booking.id}
                              className="rounded-[1.4rem] bg-[#2d3147] px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white disabled:opacity-50"
                            >
                              {actionBookingId === booking.id ? '...' : 'Send counter'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setCounterBookingId(null)}
                              className="rounded-[1.4rem] border border-slate-100 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400"
                            >
                              Close
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => decideAsCaregiver(booking, 'counter')}
                              disabled={actionBookingId === booking.id}
                              className="rounded-[1.4rem] bg-[#2d3147] px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white disabled:opacity-50"
                            >
                              {actionBookingId === booking.id ? '...' : 'Send counter'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setCounterBookingId(null)}
                              className="rounded-[1.4rem] border border-slate-100 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400"
                            >
                              Close
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </aside>
                </div>
              )}

              {userRole === 'CLIENT' && booking.status === 'COMPLETED' && booking.reviews.length === 0 && isExpanded && (
                <div className="mt-6 border-t border-slate-50 pt-6">
                  <button
                    type="button"
                    onClick={() => setReviewBookingId(reviewBookingId === booking.id ? null : booking.id)}
                    className="rounded-xl border border-[#d0a144] px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#d0a144] transition-all hover:bg-[#d0a144] hover:text-white"
                  >
                    {reviewBookingId === booking.id ? 'Close review form' : 'Add review'}
                  </button>
                </div>
              )}

              {reviewBookingId === booking.id && (
                <form onSubmit={(event) => handleSubmitReview(event, booking.id)} className="mt-6 border-t border-slate-50 pt-6">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">Rate your specialist</p>
                  <div className="mb-4 flex gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setRating(score)}
                        className={`text-2xl transition-transform hover:scale-110 ${score <= rating ? 'text-[#d0a144]' : 'text-slate-200'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewText}
                    onChange={(event) => setReviewText(event.target.value)}
                    placeholder="Tell us about the service..."
                    className="min-h-24 w-full rounded-[1.6rem] border border-slate-200 bg-[#faf9f6]/40 px-4 py-3 text-sm outline-none transition-colors focus:border-[#d0a144]"
                  />
                  <button
                    type="submit"
                    disabled={loadingReview || !reviewText.trim()}
                    className="mt-4 rounded-xl bg-[#d0a144] px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-[#d0a144]/20 transition-all hover:bg-[#b88d3a] disabled:opacity-50"
                  >
                    {loadingReview ? '...' : 'Post review'}
                  </button>
                </form>
              )}

              {booking.reviews.length > 0 && (
                <div className="mt-6 border-t border-slate-50 pt-4 opacity-70">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">
                    {userRole === 'CAREGIVER' ? 'Client review' : 'My review'}
                  </p>
                  <div className="mb-1 flex gap-1 text-[12px] text-[#d0a144]">
                    {[...Array(5)].map((_, index) => (
                      <span key={index} className={index < booking.reviews[0].rating ? 'opacity-100' : 'opacity-20'}>
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-xs italic leading-6 text-slate-500">&ldquo;{booking.reviews[0].text}&rdquo;</p>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}

