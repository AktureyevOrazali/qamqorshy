import ChatRoom from '@/components/messages/chat-room'
import { requireUser } from '@/lib/auth'
import { getLangFromCookies } from '@/lib/i18n'

const copy = {
  ru: {
    title: 'Сообщения',
    subtitle: 'Обсуждайте детали заказа и оставайтесь на связи внутри платформы.',
  },
  en: {
    title: 'Messages',
    subtitle: 'Discuss booking details and keep communication inside the platform.',
  },
  kz: {
    title: 'Хабарламалар',
    subtitle: 'Тапсырыс мәліметтерін талқылап, байланысуды платформа ішінде жалғастырыңыз.',
  },
} as const

export default async function MessagesPage() {
  const user = await requireUser()
  const lang = await getLangFromCookies()
  const tx = copy[lang]

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 md:px-10 md:py-10">
      <h1 className="font-serif text-3xl font-semibold text-[#2d3147] sm:text-4xl">{tx.title}</h1>
      <p className="mt-2 text-sm text-[#7a7d87] sm:text-base">{tx.subtitle}</p>
      <div className="mt-5 md:mt-6">
        <ChatRoom currentUserId={user.id} />
      </div>
    </section>
  )
}

