'use client'

import { useState } from 'react'

type Booking = {
  id: string
  serviceType: string
  caregiverId: string
  caregiverFullName: string
}

export default function ReviewForm({ bookings }: { bookings: Booking[] }) {
  const [bookingId, setBookingId] = useState(bookings[0]?.id || '')
  
  // Find the caregiverId for the selected booking
  const selectedBooking = bookings.find(b => b.id === bookingId)
  const caregiverId = selectedBooking?.caregiverId || ''

  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!caregiverId) return
    
    setLoading(true)
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, caregiverId, rating, text }),
    })
    const data = await res.json()
    setMessage(res.ok ? 'Review submitted' : data.error || 'Failed')
    setLoading(false)
  }

  return (
    <form onSubmit={submit} className="space-y-6 rounded-2xl border border-[#e7dbcf] bg-white p-6 shadow-sm sm:rounded-[2rem] sm:p-8">
      <h2 className="font-serif text-2xl font-semibold text-[#2d3147]">Leave a review</h2>
      
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Select booking</label>
        <select
          value={bookingId}
          onChange={(e) => setBookingId(e.target.value)}
          className="q-select"
        >
          {bookings.map((booking) => (
            <option key={booking.id} value={booking.id}>
              {booking.serviceType} — {booking.caregiverFullName}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-2xl transition-all hover:scale-125 ${star <= rating ? 'text-[#d0a144]' : 'text-slate-200'}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Your experience</label>
        <textarea
          value={text}
          required
          onChange={(e) => setText(e.target.value)}
          className="q-input min-h-28 resize-none"
          placeholder="Share your experience"
        />
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
          message === 'Review submitted' 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
            : 'bg-rose-50 text-rose-600 border border-rose-100'
        }`}>
          {message}
        </div>
      )}
      <button 
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-[#8d6241] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#8d6241]/20 transition-all hover:bg-[#724f35] hover:-translate-y-0.5 disabled:opacity-50 sm:w-auto sm:px-8"
      >
        {loading ? '...' : 'Submit review'}
      </button>
    </form>
  )
}
