/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getBackendUrl } from '@/lib/api'

export default async function CaregiverProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getCurrentUser()

  const res = await fetch(getBackendUrl(`/api/caregivers/${id}`), { cache: 'no-store' })
  if (!res.ok) {
    if (res.status === 404) notFound()
    throw new Error('Failed to fetch caregiver')
  }
  const caregiver = await res.json()

  const avg = caregiver.receivedReviews.length === 0 ? 0 : caregiver.receivedReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / caregiver.receivedReviews.length

  return (
    <section className="mx-auto max-w-4xl px-4 py-8 md:px-10 md:py-10">
      <div className="rounded-2xl border border-[#e7dbcf] bg-white p-6 shadow-xl shadow-slate-100/50 sm:rounded-[2.5rem] sm:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <h1 className="font-serif text-3xl font-semibold text-[#2d3147] tracking-tight sm:text-4xl md:text-5xl">{caregiver.fullName}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex text-[#d0a144]">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < Math.round(avg) ? 'opacity-100' : 'opacity-20'}>★</span>
                ))}
              </div>
              <span className="text-sm font-bold text-[#8d6241]">{avg.toFixed(1)} ({caregiver.receivedReviews.length} reviews)</span>
              <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${caregiver.caregiver?.verificationStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                {caregiver.caregiver?.verificationStatus}
              </span>
            </div>
            <p className="mt-6 text-lg text-slate-500 leading-relaxed font-light">{caregiver.caregiver?.bio || 'No bio yet'}</p>
          </div>
          <div className="rounded-2xl bg-[#faf9f6] border border-[#e7dbcf] p-6 sm:rounded-3xl sm:p-8 lg:min-w-[260px]">
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-4">Pricing & Info</p>
            <p className="text-3xl font-black text-[#8d6241]">{caregiver.caregiver?.hourlyRate || 0} <span className="text-sm font-bold opacity-60">KZT/h</span></p>
            <div className="mt-6 space-y-3">
              <p className="text-sm text-slate-600 flex items-center gap-2">
                <span className="opacity-40">📅</span> <b>{caregiver.caregiver?.experienceYears || 0}</b> years of experience
              </p>
              <p className="text-sm text-slate-600 flex items-center gap-2">
                <span className="opacity-40">🏷️</span> {caregiver.caregiver?.categories || 'General Care'}
              </p>
              {caregiver.caregiver?.diplomaUrl && (
                <a href={caregiver.caregiver.diplomaUrl} target="_blank" rel="noopener noreferrer" className="mt-4 block rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50 transition-all flex items-center justify-between">
                  <span>🗂️ View Diploma / Certificate</span>
                  <span>↗</span>
                </a>
              )}
            </div>
            <Link href={session?.role === 'CLIENT' ? `/book?caregiverId=${caregiver.id}` : '/login'} className="mt-8 block w-full rounded-2xl bg-[#8d6241] py-4 text-center text-sm font-bold text-white shadow-xl shadow-[#8d6241]/20 hover:bg-[#724f35] transition-all">
              Book Service
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="font-serif text-2xl font-semibold text-[#2d3147] mb-6 sm:text-3xl sm:mb-8">Client Testimonials</h2>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {caregiver.receivedReviews.length === 0 && (
            <div className="md:col-span-2 rounded-[2rem] border-2 border-dashed border-slate-100 p-16 text-center">
              <p className="text-slate-300 italic">No reviews yet. Be the first to share your experience!</p>
            </div>
          )}
          {caregiver.receivedReviews.map((review: any) => (
            <article key={review.id} className="rounded-[2rem] border border-[#e7dbcf] bg-white p-8 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-[#2d3147]">{review.author.fullName}</span>
                <div className="flex text-[10px] text-[#d0a144]">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < review.rating ? 'opacity-100' : 'opacity-20'}>★</span>
                  ))}
                </div>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed italic">&ldquo;{review.text}&rdquo;</p>
              <p className="mt-4 text-[9px] font-bold text-slate-300 uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString()}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-12">
        <h2 className="font-serif text-2xl font-semibold text-[#2d3147] mb-6 sm:text-3xl sm:mb-8">Service History</h2>
        <div className="grid gap-3">
          {caregiver.caregiverJobs.length === 0 && <p className="text-sm text-slate-500">No history yet.</p>}
          {caregiver.caregiverJobs.map((booking: any) => (
            <p key={booking.id} className="rounded-xl border border-[#e7dbcf] p-3 text-sm">
              {booking.serviceType} | {new Date(booking.scheduledAt).toLocaleDateString()} | {booking.status}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}
