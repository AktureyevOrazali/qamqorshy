/* eslint-disable @typescript-eslint/no-explicit-any */
import { requireRole } from '@/lib/auth'
import { getLangFromCookies } from '@/lib/i18n'
import { JobCard } from '@/components/jobs/job-card'
import { getBackendUrl } from '@/lib/api'
import { cookies } from 'next/headers'

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  await requireRole(['CAREGIVER', 'ADMIN'])
  const lang = await getLangFromCookies()
  const { type } = await searchParams

  const tx = {
    ru: {
      title: 'Биржа заказов',
      subtitle: 'Найдите заказы, которым нужна ваша профессиональная помощь.',
      all: 'Все',
      child: 'Дети',
      elder: 'Пожилые',
      pet: 'Животные',
      noJobs: 'В данной категории пока нет свободных заказов.',
      accept: 'Принять заказ',
      duration: 'Длительность',
      price: 'Стоимость',
      hours: 'ч',
    },
    en: {
      title: 'Job Marketplace',
      subtitle: 'Find open orders that need your professional assistance.',
      all: 'All',
      child: 'Children',
      elder: 'Seniors',
      pet: 'Pets',
      noJobs: 'No open orders in this category yet.',
      accept: 'Accept Order',
      duration: 'Duration',
      price: 'Payout',
      hours: 'h',
    },
  }[lang === 'kz' ? 'ru' : lang]

  const store = await cookies()
  const token = store.get('qamqorshy_session')?.value

  const res = await fetch(getBackendUrl(`/api/bookings/available${type ? `?service_type=${type}` : ''}`), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error('Failed to fetch jobs')
  }

  const bookings = await res.json()

  return (
    <section className="mx-auto max-w-[1240px] px-4 py-16 md:px-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="max-w-xl">
          <span className="mb-4 inline-block rounded-full bg-[#8d6241]/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#8d6241]">
            Open Opportunities
          </span>
          <h1 className="font-serif text-4xl font-semibold text-[#2d3147] tracking-tight">{tx.title}</h1>
          <p className="mt-4 text-base text-slate-500 font-light leading-relaxed">{tx.subtitle}</p>
        </div>

        <div className="flex bg-[#faf9f6] p-1.5 rounded-2xl border border-[#e7dbcf]/50 self-start md:self-auto overflow-x-auto whitespace-nowrap max-w-full custom-scrollbar">
          {[
            { id: '', label: tx.all },
            { id: 'CHILD', label: tx.child },
            { id: 'ELDER', label: tx.elder },
            { id: 'PET', label: tx.pet },
          ].map((cat) => (
            <a
              key={cat.id}
              href={cat.id ? `/jobs?type=${cat.id}` : '/jobs'}
              className={`rounded-xl px-6 py-2.5 text-xs font-bold transition-all uppercase tracking-widest ${(type === cat.id || (!type && !cat.id)) ? 'bg-[#8d6241] text-white shadow-lg shadow-[#8d6241]/20' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {cat.label}
            </a>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {bookings.length === 0 && (
          <div className="col-span-full rounded-[2.5rem] border-2 border-dashed border-[#e7dbcf] bg-[#faf9f6]/30 p-16 text-center flex flex-col items-center">
            <span className="text-4xl mb-6 grayscale opacity-20">🎯</span>
            <p className="text-lg text-slate-400 font-light italic">{tx.noJobs}</p>
          </div>
        )}
        {bookings.map((booking: any) => (
          <JobCard key={booking.id} booking={booking} tx={tx} />
        ))}
      </div>
    </section>
  )
}
