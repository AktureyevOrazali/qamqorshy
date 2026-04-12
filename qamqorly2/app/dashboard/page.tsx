import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { getDictionary, getLangFromCookies } from '@/lib/i18n'
import BookingList from '@/components/dashboard/booking-list'
import { getBackendUrl } from '@/lib/api'
import { cookies } from 'next/headers'

export default async function DashboardPage() {
  const user = await requireUser()
  const lang = await getLangFromCookies()
  const dict = getDictionary(lang)

  const store = await cookies()
  const token = store.get('qamqorshy_session')?.value

  const res = await fetch(getBackendUrl('/api/users/me/dashboard'), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error('Failed to fetch dashboard data')
  }

  const { bookings, messagesCount, reviewsCount } = await res.json()

  const tx = {
    ru: {
      title: 'Кабинет',
      hello: 'Здравствуйте',
      role: 'Роль',
      bookings: 'Заказы',
      messages: 'Сообщения',
      reviews: 'Отзывы',
      givenReviews: 'Оставленные отзывы',
      bookService: 'Заказать услугу',
      openMessages: 'Открыть сообщения',
      profile: 'Профиль',
      adminPanel: 'Админ-панель',
      sectionTitle: 'Ваши услуги',
      noBookings: 'Пока нет заказов.',
      client: 'Клиент',
      specialist: 'Специалист',
      notAssigned: 'Маман тағайындалмады',
    },
    en: {
      title: 'Dashboard',
      hello: 'Hello',
      role: 'Role',
      bookings: 'Bookings',
      messages: 'Messages',
      reviews: 'Reviews',
      givenReviews: 'Given reviews',
      bookService: 'Book service',
      openMessages: 'Open messages',
      profile: 'Profile',
      adminPanel: 'Admin panel',
      sectionTitle: 'Your services',
      noBookings: 'No bookings yet.',
      client: 'Client',
      specialist: 'Specialist',
      notAssigned: 'Not assigned',
    },
    kz: {
      title: 'Кабинет',
      hello: 'Сәлем',
      role: 'Рөл',
      bookings: 'Тапсырыстар',
      messages: 'Хабарламалар',
      reviews: 'Пікірлер',
      givenReviews: 'Жазылған пікірлер',
      bookService: 'Қызметке тапсырыс беру',
      openMessages: 'Хабарламаларды ашу',
      profile: 'Профиль',
      adminPanel: 'Админ панелі',
      sectionTitle: 'Сіздің қызметтеріңіз',
      noBookings: 'Әзірге тапсырыс жоқ.',
      client: 'Клиент',
      specialist: 'Маман',
      notAssigned: 'Тағайындалмады',
    },
  }[lang]

  const roleLabel =
    user.role === 'CLIENT'
      ? dict.common.roleClient
      : user.role === 'CAREGIVER'
        ? dict.common.roleSpecialist
        : dict.common.roleAdmin

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-10 md:py-10">
      <h1 className="font-serif text-3xl font-semibold text-[#2d3147] tracking-tight sm:text-4xl md:text-5xl">{tx.title}</h1>
      <p className="mt-2 text-sm text-[#7a7d87] font-light sm:text-base">
        {tx.hello}, <span className="font-bold text-[#2d3147]">{user.fullName}</span>. {tx.role}: <span className="font-semibold text-[#8d6241]">{roleLabel}</span>
      </p>

      <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-3 sm:gap-6 md:mt-8">
        <div className="rounded-2xl border border-[#e7dbcf] bg-white p-6 shadow-xl shadow-slate-100/40 sm:rounded-[2.5rem] sm:p-8">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{tx.bookings}</p>
          <p className="text-3xl font-black text-[#2d3147] sm:text-4xl">{bookings.length}</p>
        </div>
        <div className="rounded-2xl border border-[#e7dbcf] bg-white p-6 shadow-xl shadow-slate-100/50 sm:rounded-[2.5rem] sm:p-8">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{tx.messages}</p>
          <p className="text-3xl font-black text-[#2d3147] sm:text-4xl">{messagesCount}</p>
        </div>
        <div className="rounded-2xl border border-[#e7dbcf] bg-white p-6 shadow-xl shadow-slate-100/40 sm:rounded-[2.5rem] sm:p-8">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            {user.role === 'CAREGIVER' ? tx.reviews : tx.givenReviews}
          </p>
          <p className="text-3xl font-black text-[#2d3147] sm:text-4xl">{reviewsCount}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 sm:mt-10 sm:gap-4">
        {user.role === 'CLIENT' && (
          <Link href="/book" className="rounded-2xl bg-[#8d6241] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#8d6241]/20 hover:bg-[#724f35] transition-all sm:px-8 sm:py-3">
            {tx.bookService}
          </Link>
        )}
        <Link href="/messages" className="rounded-2xl border border-[#d7c7b8] bg-white px-6 py-2.5 text-sm font-bold text-[#8d6241] hover:bg-slate-50 transition-all sm:px-8 sm:py-3">
          {tx.openMessages}
        </Link>
        <Link href="/profile" className="rounded-2xl border border-[#d7c7b8] bg-white px-6 py-2.5 text-sm font-bold text-[#8d6241] hover:bg-slate-50 transition-all sm:px-8 sm:py-3">
          {tx.profile}
        </Link>
        {user.role === 'ADMIN' && (
          <Link href="/admin" className="rounded-2xl border border-[#d7c7b8] bg-white px-6 py-2.5 text-sm font-bold text-[#8d6241] hover:bg-slate-50 transition-all sm:px-8 sm:py-3">
            {tx.adminPanel}
          </Link>
        )}
      </div>

      <h2 className="mt-12 font-serif text-2xl font-semibold text-[#2d3147] sm:text-3xl md:mt-16">{tx.sectionTitle}</h2>

      <BookingList initialBookings={JSON.parse(JSON.stringify(bookings))} userRole={user.role} tx={tx} />
    </section>
  )
}
