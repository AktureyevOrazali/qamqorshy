/* eslint-disable @typescript-eslint/no-explicit-any */
import { requireUser } from '@/lib/auth'
import { getLangFromCookies } from '@/lib/i18n'
import ReviewForm from '@/components/reviews/review-form'
import { getBackendUrl } from '@/lib/api'
import { cookies } from 'next/headers'

export default async function ReviewsPage() {
  const user = await requireUser()
  const lang = await getLangFromCookies()

  const tx = {
    ru: {
      titleClient: 'Отзывы',
      subtitleClient: 'Оцените специалистов после завершённых заказов.',
      titleCaregiver: 'Мои отзывы',
      noCompleted: 'Пока нет завершённых заказов.',
      noReviews: 'Пока нет отзывов.',
    },
    en: {
      titleClient: 'Reviews',
      subtitleClient: 'Rate care specialists after completed bookings.',
      titleCaregiver: 'My Reviews',
      noCompleted: 'No completed bookings yet.',
      noReviews: 'No reviews yet.',
    },
    kz: {
      titleClient: 'Пікірлер',
      subtitleClient: 'Аяқталған тапсырыстардан кейін мамандарды бағалаңыз.',
      titleCaregiver: 'Менің пікірлерім',
      noCompleted: 'Әзірге аяқталған тапсырыстар жоқ.',
      noReviews: 'Әзірге пікірлер жоқ.',
    },
  }[lang]

  const store = await cookies()
  const token = store.get('qamqorshy_session')?.value

  if (user.role === 'CLIENT') {
    const res = await fetch(getBackendUrl('/api/bookings?status=COMPLETED'), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    const completed = await res.json()

    return (
      <section className="mx-auto max-w-3xl px-4 py-8 md:px-10 md:py-10">
        <h1 className="font-serif text-3xl font-semibold text-[#2d3147] sm:text-4xl">{tx.titleClient}</h1>
        <p className="mt-2 text-sm text-[#7a7d87] sm:text-base">{tx.subtitleClient}</p>
        <div className="mt-6">
          {completed.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#e7dbcf] bg-[#fffdfb] p-10 text-center sm:rounded-[2rem]">
              <span className="text-3xl block mb-3 opacity-30 grayscale">📋</span>
              <p className="text-sm text-slate-400 italic font-light">{tx.noCompleted}</p>
            </div>
          ) : (
            <ReviewForm bookings={completed} />
          )}
        </div>
      </section>
    )
  }

  const res = await fetch(getBackendUrl('/api/reviews'), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  const received = await res.json()

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 md:px-10 md:py-10">
      <h1 className="font-serif text-3xl font-semibold text-[#2d3147] sm:text-4xl">{tx.titleCaregiver}</h1>
      <div className="mt-6 space-y-4">
        {received.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-[#e7dbcf] bg-[#fffdfb] p-10 text-center sm:rounded-[2rem]">
            <span className="text-3xl block mb-3 opacity-30 grayscale">⭐</span>
            <p className="mt-2 text-sm text-slate-500">{tx.noReviews}</p>
          </div>
        )}
        {received.map((review: any) => (
          <article key={review.id} className="rounded-2xl border border-[#e7dbcf] bg-white p-6 shadow-sm hover:shadow-md transition-shadow sm:rounded-[2rem] sm:p-8">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-[#2d3147]">{review.authorFullName}</p>
              <div className="flex gap-0.5 text-sm text-[#d0a144]">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < review.rating ? 'opacity-100' : 'opacity-20'}>★</span>
                ))}
              </div>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed italic font-light">&ldquo;{review.text}&rdquo;</p>
            <p className="mt-3 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              {new Date(review.createdAt).toLocaleDateString()}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
