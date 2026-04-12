'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useState } from 'react'

type Booking = {
  id: string
  serviceType: string
  scheduledAt: string
  status: string
  caregiverId?: string
  reviews: any[]
}

type Update = {
  id: string
  text: string
  checklist?: string
  createdAt: string
}

const PRESET_MESSAGES = {
  ru: ['Уход начат', 'Обед завершен', 'Прогулка завершена', 'Лекарства приняты', 'Гигиенические процедуры выполнены'],
  en: ['Care started', 'Lunch finished', 'Walk finished', 'Medication taken', 'Hygiene procedures done'],
  kz: ['Күтім басталды', 'Түскі ас аяқталды', 'Серуендеу аяқталды', 'Дәрі қабылданды', 'Гигиеналық процедуралар орындалды'],
}

export default function UpdatesPanel({ canPost, dict, lang = 'ru' }: { canPost: boolean; dict: any; lang?: 'ru' | 'en' | 'kz' }) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [bookingId, setBookingId] = useState('')
  const [updates, setUpdates] = useState<Update[]>([])
  const [text, setText] = useState('')
  const [checklist, setChecklist] = useState('')
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  // lang is now passed as a prop to avoid SSR issues with 'document'

  const presets = PRESET_MESSAGES[lang] || PRESET_MESSAGES.ru

  const loadBookings = useCallback(async () => {
    const res = await fetch('/api/bookings')
    const data = await res.json()
    const bookingsList = Array.isArray(data) ? data : (data.bookings || [])
    setBookings(bookingsList)
    if (!bookingId && bookingsList[0]?.id) {
      setBookingId(bookingsList[0].id)
    }
  }, [bookingId])

  const loadUpdates = useCallback(async (id: string) => {
    if (!id) {
      setUpdates([])
      return
    }
    const res = await fetch(`/api/quality-updates?bookingId=${id}`)
    const data = await res.json()
    setUpdates(Array.isArray(data) ? data : (data.updates || []))
  }, [])

  useEffect(() => {
    void loadBookings()
  }, [loadBookings])

  useEffect(() => {
    if (!bookingId) {
      return
    }
    void loadUpdates(bookingId)
  }, [bookingId, loadUpdates])

  const submitUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingId || !text.trim()) {
      return
    }
    const res = await fetch('/api/quality-updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId,
        text,
        checklist,
      }),
    })
    if (!res.ok) {
      return
    }
    setText('')
    setChecklist('')
    loadUpdates(bookingId)
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const caregiverId = selectedBooking?.caregiverId
    if (!bookingId || !caregiverId || !reviewText.trim()) return
    setSubmittingReview(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          caregiverId,
          rating,
          text: reviewText,
        }),
      })
      if (res.ok) {
        setReviewText('')
        await loadBookings()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingReview(false)
    }
  }

  const finishCare = async () => {
    if (!bookingId) return
    
    const confirmed = window.confirm(
      lang === 'ru' 
        ? 'Вы уверены, что хотите завершить уход? Это действие нельзя отменить.' 
        : 'Are you sure you want to finish the care session? This action cannot be undone.'
    )
    
    if (!confirmed) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })
      if (res.ok) {
        await loadBookings()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const selectedBooking = bookings.find((b) => b.id === bookingId)
  
  const filteredBookings = bookings.filter(b => 
    b.serviceType.toLowerCase().includes(search.toLowerCase()) ||
    new Date(b.scheduledAt).toLocaleString().toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="grid gap-4 md:gap-6 md:grid-cols-[340px_1fr] h-auto md:h-[80vh]">
      <aside className="flex flex-col rounded-2xl border border-[#e7dbcf] bg-white p-4 shadow-sm overflow-hidden max-h-[50vh] md:max-h-none md:rounded-[2.5rem] md:p-6">
        <div className="mb-4">
          <h2 className="font-serif text-2xl font-semibold text-[#2d3147] mb-4">{lang === 'ru' ? 'Сессии' : 'Sessions'}</h2>
          <div className="relative">
            <input
              type="text"
              placeholder={lang === 'ru' ? 'Поиск сессий...' : 'Search sessions...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-100 bg-[#faf9f6] px-4 py-2 text-xs outline-none focus:border-[#8d6241] transition-all"
            />
            <span className="absolute right-3 top-2 opacity-30 text-xs">🔍</span>
          </div>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
          {filteredBookings.map((item) => (
            <button
              key={item.id}
              onClick={() => setBookingId(item.id)}
              className={`w-full rounded-2xl border px-4 py-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
                bookingId === item.id ? 'border-[#8d6241] bg-[#faf7f5] shadow-md' : 'border-slate-50 bg-white hover:border-[#e7dbcf]'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm text-[#2d3147]">{item.serviceType}</p>
                <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${
                  item.status === 'COMPLETED' ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                }`}>
                  {item.status}
                </span>
              </div>
              <p className="text-[10px] mt-2 text-slate-400 font-medium">{new Date(item.scheduledAt).toLocaleString()}</p>
            </button>
          ))}
          {filteredBookings.length === 0 && (
            <div className="text-center py-20 opacity-40">
              <span className="text-3xl block mb-2">🎈</span>
              <p className="text-xs italic">{lang === 'ru' ? 'Ничего не найдено' : 'No results found'}</p>
            </div>
          )}
        </div>
      </aside>

      <section className="flex flex-col rounded-[2.5rem] border border-[#e7dbcf] bg-white shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-8 pb-4 border-b border-slate-50">
          <div className="flex justify-between items-center">
            <h2 className="font-serif text-3xl font-semibold text-[#2d3147]">
              {lang === 'ru' ? 'Обновления' : 'Updates'} {selectedBooking && <span className="text-[#8d6241]/60"> — {selectedBooking.serviceType}</span>}
            </h2>
            {selectedBooking && selectedBooking.status !== 'COMPLETED' && canPost && (
              <button 
                onClick={finishCare}
                disabled={loading}
                className="rounded-full bg-red-50 px-4 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-100 transition uppercase tracking-widest border border-red-100"
              >
                {loading ? '...' : (lang === 'ru' ? 'Завершить уход' : 'Finish Care')}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {canPost && selectedBooking?.status !== 'COMPLETED' && (
            <form onSubmit={submitUpdate} className="grid grid-cols-1 gap-4 mb-10 bg-[#faf9f6]/50 p-6 rounded-[2rem] border border-slate-50">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                  {lang === 'ru' ? 'Быстрый ответ' : 'Quick reply'}
                </label>
                <select 
                  onChange={(e) => setText(e.target.value)}
                  className="q-select text-sm"
                  value=""
                >
                  <option value="" disabled>{lang === 'ru' ? 'Выбрать готовый ответ...' : 'Choose preset...'}</option>
                  {presets.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                  {lang === 'ru' ? 'Прогресс задач' : 'Task progress'}
                </label>
                <input
                  value={checklist}
                  onChange={(e) => setChecklist(e.target.value)}
                  placeholder="..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-[#8d6241]"
                />
              </div>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="..."
              className="min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#8d6241]"
            />
            
            <button 
              type="submit"
              className="rounded-xl bg-[#8d6241] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#724f35] transition shadow-lg shadow-[#8d6241]/20"
              disabled={!text.trim()}
            >
              {lang === 'ru' ? 'Отправить' : 'Send'}
            </button>
          </form>
        )}
        
        {selectedBooking?.status === 'COMPLETED' && (
          <div className="mb-8 rounded-2xl bg-emerald-50 p-6 border border-emerald-100 flex items-center gap-4">
            <span className="text-3xl">🌿</span>
            <div>
              <p className="font-bold text-emerald-900">{lang === 'ru' ? 'Успешно завершено' : 'Successfully completed'}</p>
              <p className="text-emerald-700 text-sm opacity-80">{lang === 'ru' ? 'Обновления больше не принимаются.' : 'No more updates accepted.'}</p>
            </div>
          </div>
        )}

        {!canPost && selectedBooking?.status === 'COMPLETED' && selectedBooking.reviews.length === 0 && (
          <div className="mb-10 rounded-[2rem] border border-[#e7dbcf] bg-[#fffdfb] p-8 shadow-lg shadow-[#8d6241]/5">
            <h3 className="font-serif text-2xl font-semibold text-[#2d3147] mb-4">
              {lang === 'ru' ? 'Оставить отзыв' : 'Leave a review'}
            </h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
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
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder={lang === 'ru' ? 'Поделитесь вашим впечатлением...' : 'Share your experience...'}
                className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#d0a144]"
              />
              <button
                type="submit"
                disabled={submittingReview || !reviewText.trim()}
                className="rounded-xl bg-[#d0a144] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#b88d3a] transition shadow-lg shadow-[#d0a144]/20"
              >
                {submittingReview ? '...' : (lang === 'ru' ? 'Опубликовать отзыв' : 'Post review')}
              </button>
            </form>
          </div>
        )}

        {!canPost && selectedBooking?.status === 'COMPLETED' && selectedBooking.reviews.length > 0 && (
          <div className="mb-10 rounded-[2rem] border border-slate-100 bg-slate-50/50 p-8">
             <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{lang === 'ru' ? 'Ваш отзыв' : 'Your review'}</h3>
             <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={`text-sm ${star <= selectedBooking.reviews[0].rating ? 'text-[#d0a144]' : 'text-slate-200'}`}>★</span>
                ))}
             </div>
             <p className="text-sm text-slate-600 italic">&ldquo;{selectedBooking.reviews[0].text}&rdquo;</p>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{lang === 'ru' ? 'История' : 'Timeline'}</h3>
          <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100 pl-8">
            {updates.map((update) => (
              <article key={update.id} className="relative">
                <div className="absolute -left-[25px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-[#8d6241] shadow-sm"></div>
                <div className="rounded-2xl border border-slate-100 p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-sm text-slate-600 leading-relaxed font-sans">{update.text}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#8d6241]/40 uppercase tracking-widest">{update.checklist}</span>
                    <span className="text-[9px] text-slate-400 font-medium">🕒 {new Date(update.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </article>
            ))}
            {updates.length === 0 && (
              <p className="text-sm text-slate-300 italic py-6">Здесь пока пусто...</p>
            )}
          </div>
          </div>
        </div>
      </section>
    </div>
  )
}
