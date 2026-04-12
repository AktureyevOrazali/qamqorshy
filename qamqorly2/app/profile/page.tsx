/* eslint-disable @typescript-eslint/no-explicit-any */
import { requireUser } from '@/lib/auth'
import { getDictionary, getLangFromCookies } from '@/lib/i18n'
import ProfileForm from '@/components/profile/profile-form'
import { getBackendUrl } from '@/lib/api'
import { cookies } from 'next/headers'

export default async function ProfilePage() {
  const user = await requireUser()
  const lang = await getLangFromCookies()
  const dict = getDictionary(lang)

  const store = await cookies()
  const token = store.get('qamqorshy_session')?.value

  const [profileRes, dashboardRes] = await Promise.all([
    fetch(getBackendUrl('/api/profile'), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }),
    fetch(getBackendUrl('/api/users/me/dashboard'), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }),
  ])

  if (!profileRes.ok || !dashboardRes.ok) {
    throw new Error('Failed to fetch profile data')
  }

  const fullUser = await profileRes.json()
  const { bookings } = await dashboardRes.json()

  const tx = {
    ru: {
      title: 'Профиль',
      prevServices: 'Предыдущие услуги',
      noServices: 'Пока нет услуг.',
      client: 'Клиент',
      specialist: 'Специалист',
      status: 'Статус',
      notAssigned: 'Маман тағайындалмады',
    },
    en: {
      title: 'Profile',
      prevServices: 'Previous services',
      noServices: 'No services yet.',
      client: 'Client',
      specialist: 'Specialist',
      status: 'Status',
      notAssigned: 'Not assigned',
    },
    kz: {
      title: 'Профиль',
      prevServices: 'Алдыңғы қызметтер',
      noServices: 'Әзірге қызмет жоқ.',
      client: 'Клиент',
      specialist: 'Маман',
      status: 'Күйі',
      notAssigned: 'Тағайындалмады',
    },
  }[lang]

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-10 md:py-10">
      <h1 className="font-serif text-3xl font-semibold text-[#2d3147] sm:text-4xl md:text-5xl">{tx.title}</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ProfileForm
          lang={lang}
          role={fullUser.role}
          fullName={fullUser.fullName}
          phone={fullUser.phone || ''}
          address={fullUser.clientProfile?.address || ''}
          about={fullUser.clientProfile?.about || ''}
          bio={fullUser.caregiver?.bio || ''}
          experienceYears={fullUser.caregiver?.experienceYears || 0}
          hourlyRate={fullUser.caregiver?.hourlyRate || 0}
          categories={fullUser.caregiver?.categories || ''}
          verificationStatus={fullUser.caregiver?.verificationStatus || 'UNVERIFIED'}
          idCardUrl={fullUser.caregiver?.idCardUrl || ''}
          diplomaUrl={fullUser.caregiver?.diplomaUrl || ''}
          dict={dict}
        />

        <div className="space-y-6">
          <div className="rounded-2xl border border-[#e7dbcf] bg-white p-6 shadow-xl shadow-slate-100/50 h-fit sm:rounded-[2rem] sm:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#2d3147] mb-4 sm:text-2xl sm:mb-6">{tx.prevServices}</h2>
            <div className="space-y-3">
              {bookings.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-slate-50 rounded-2xl sm:py-12">
                  <span className="text-3xl grayscale opacity-30 block mb-2">📋</span>
                  <p className="text-sm text-slate-400 font-light italic">{tx.noServices}</p>
                </div>
              )}
              {bookings.map((booking: any) => (
                <article key={booking.id} className="group rounded-xl border border-slate-50 bg-[#faf9f6]/30 p-4 transition-all hover:bg-white hover:border-[#e7dbcf] hover:shadow-md sm:rounded-[1.5rem] sm:p-5">
                  <div className="flex justify-between items-start mb-2 sm:mb-3">
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#8d6241] border border-[#8d6241]/10 shadow-sm">
                      {booking.serviceType}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {new Date(booking.scheduledAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#2d3147]">
                      {user.role === 'CLIENT' ? `${tx.specialist}: ${booking.caregiver?.fullName || tx.notAssigned || '...'}` : `${tx.client}: ${booking.client.fullName}`}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${booking.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-none">
                        {booking.status}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
