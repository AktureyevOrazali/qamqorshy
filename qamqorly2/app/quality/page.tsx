import { requireUser } from '@/lib/auth'
import { getDictionary, getLangFromCookies } from '@/lib/i18n'
import UpdatesPanel from '@/components/quality/updates-panel'

export default async function QualityPage() {
  const user = await requireUser()
  const lang = await getLangFromCookies()
  const dict = getDictionary(lang)

  const tx = {
    ru: {
      title: 'Контроль качества',
      desc: 'Отслеживайте активные сессии ухода с обновлениями в реальном времени.',
    },
    en: {
      title: 'Quality Control',
      desc: 'Track active care sessions with live updates and checklist progress.',
    },
    kz: {
      title: 'Сапаны бақылау',
      desc: 'Нақты уақыттағы жаңартулармен белсенді күтім сессияларын қадағалаңыз.',
    },
  }[lang]

  return (
    <section className="mx-auto max-w-[1240px] px-4 py-8 md:px-10 md:py-16">
      <div className="max-w-3xl mb-8 md:mb-12">
        <h1 className="font-serif text-3xl font-semibold text-[#2d3147] tracking-tight sm:text-4xl md:text-5xl">{tx.title}</h1>
        <p className="mt-3 text-base text-slate-500 leading-relaxed font-light sm:mt-4 sm:text-lg">
          {tx.desc}
        </p>
      </div>
      
      <div className="mt-6 md:mt-8">
        <UpdatesPanel canPost={user.role === 'CAREGIVER'} dict={dict} lang={lang} />
      </div>
    </section>
  )
}
