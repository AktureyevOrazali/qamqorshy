/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getBackendUrl } from '@/lib/api'

export default async function CaregiversPage() {
  const session = await getCurrentUser()
  if (session?.role === 'CAREGIVER') {
    redirect('/jobs')
  }

  const res = await fetch(getBackendUrl('/api/caregivers'), { cache: 'no-store' })
  const caregivers = await res.json()

  const { getDictionary, getLangFromCookies } = await import('@/lib/i18n')
  const lang = await getLangFromCookies()
  const dict = getDictionary(lang)

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-10 md:py-10">
      <h1 className="font-serif text-3xl font-semibold text-[#2d3147] sm:text-4xl md:text-5xl">{dict.nav.specialists}</h1>
      <p className="mt-2 text-sm text-[#7a7d87] sm:text-base">Find child, pet, and elderly caregivers.</p>
      <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 sm:mt-8">
        {caregivers.length === 0 && (
          <p className="rounded-2xl border border-dashed border-[#d7c7b8] bg-[#fffdfb] p-6 text-[#7a7d87] col-span-full">
            No caregivers yet.
          </p>
        )}
        {caregivers.map((caregiver: any) => {
          const avg = caregiver.receivedReviews.length === 0 ? 0 : caregiver.receivedReviews.reduce((sum: number, item: any) => sum + item.rating, 0) / caregiver.receivedReviews.length
          return (
            <article key={caregiver.id} className="group relative rounded-2xl border border-[#e7dbcf] bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-2xl sm:rounded-[2rem] sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex text-sm text-[#d0a144] gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < Math.round(avg) ? 'opacity-100' : 'opacity-20'}>★</span>
                  ))}
                </div>
                <span className="text-xs font-black text-[#8d6241]">{avg.toFixed(1)}</span>
              </div>
              <p className="font-serif text-xl font-semibold text-[#2d3147] sm:text-2xl">{caregiver.fullName}</p>
              <p className="mt-2 text-sm text-slate-500 line-clamp-2 leading-relaxed font-light sm:mt-3">{caregiver.caregiver?.bio || 'No bio yet'}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-50 px-3 py-1 text-[10px] font-bold text-slate-500 border border-slate-100">
                  ✓ {caregiver._count.caregiverJobs} completed
                </span>
                {caregiver.caregiver?.diplomaUrl && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-600 border border-emerald-100">
                    🗂️ Certified
                  </span>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between sm:mt-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Rate</p>
                  <p className="text-lg font-black text-[#8d6241]">{caregiver.caregiver?.hourlyRate || 0} <span className="text-[10px] opacity-40">KZT/h</span></p>
                </div>
                <Link className="rounded-xl bg-[#faf9f6] border border-[#e7dbcf] px-4 py-2 text-xs font-bold text-[#8d6241] hover:bg-[#8d6241] hover:text-white transition-all" href={`/caregivers/${caregiver.id}`}>
                  View Profile
                </Link>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
