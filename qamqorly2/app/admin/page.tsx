import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { getLangFromCookies } from '@/lib/i18n'
import CaregiverVerifyTable from '@/components/admin/caregiver-verify-table'
import { getAdminVerificationDocuments, getBackendUrl } from '@/lib/api'
import { cookies } from 'next/headers'

export default async function AdminPage() {
  const user = await requireUser()
  const lang = await getLangFromCookies()
  if (user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const store = await cookies()
  const token = store.get('qamqorshy_session')?.value

  const [statsRes, caregiversRes, verificationDocsRes] = await Promise.all([
    fetch(getBackendUrl('/api/admin/stats'), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }),
    fetch(getBackendUrl('/api/caregivers/admin'), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }),
    getAdminVerificationDocuments(token || ''),
  ])

  if (!statsRes.ok || !caregiversRes.ok) {
    throw new Error('Failed to fetch admin data')
  }

  const { usersCount, bookingsCount, reviewsCount } = await statsRes.json()
  const caregivers = await caregiversRes.json()
  const verificationDocuments = verificationDocsRes.documents

  const tx = {
    ru: {
      title: 'Панель администратора',
      totalUsers: 'Всего пользователей',
      totalBookings: 'Всего заказов',
      totalReviews: 'Всего отзывов',
      specialistVerification: 'Верификация специалистов',
    },
    en: {
      title: 'Admin Panel',
      totalUsers: 'Total users',
      totalBookings: 'Total bookings',
      totalReviews: 'Total reviews',
      specialistVerification: 'Specialist verification',
    },
    kz: {
      title: 'Админ панелі',
      totalUsers: 'Пайдаланушылар саны',
      totalBookings: 'Тапсырыстар саны',
      totalReviews: 'Пікірлер саны',
      specialistVerification: 'Мамандарды тексеру',
    },
  }[lang]

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-10 md:py-10">
      <h1 className="font-serif text-3xl font-semibold text-[#2d3147] sm:text-4xl md:text-5xl">{tx.title}</h1>

      <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-3 sm:gap-6 md:mt-8">
        <div className="rounded-2xl border border-[#e7dbcf] bg-white p-6 shadow-xl shadow-slate-100/40 sm:rounded-[2.5rem] sm:p-8">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{tx.totalUsers}</p>
          <p className="text-3xl font-black text-[#2d3147] sm:text-4xl">{usersCount}</p>
        </div>
        <div className="rounded-2xl border border-[#e7dbcf] bg-white p-6 shadow-xl shadow-slate-100/40 sm:rounded-[2.5rem] sm:p-8">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{tx.totalBookings}</p>
          <p className="text-3xl font-black text-[#2d3147] sm:text-4xl">{bookingsCount}</p>
        </div>
        <div className="rounded-2xl border border-[#e7dbcf] bg-white p-6 shadow-xl shadow-slate-100/40 sm:rounded-[2.5rem] sm:p-8">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{tx.totalReviews}</p>
          <p className="text-3xl font-black text-[#2d3147] sm:text-4xl">{reviewsCount}</p>
        </div>
      </div>

      <h2 className="mt-10 font-serif text-2xl font-semibold text-[#2d3147] sm:text-3xl md:mt-12">{tx.specialistVerification}</h2>
      <div className="mt-4 md:mt-6">
        <CaregiverVerifyTable initial={caregivers} verificationDocuments={verificationDocuments} />
      </div>
    </section>
  )
}
