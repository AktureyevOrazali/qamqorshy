import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getLangFromCookies } from '@/lib/i18n'
import { redirect } from 'next/navigation'
import LoginForm from '@/components/auth/login-form'

export default async function LoginPage() {
  const session = await getCurrentUser()
  const lang = await getLangFromCookies()
  if (session) {
    redirect('/dashboard')
  }

  const tx = {
    ru: {
      title: 'Вход',
      subtitle: 'Войдите, чтобы заказывать услуги и общаться в чате.',
      newHere: 'Еще нет аккаунта?',
      create: 'Создать аккаунт',
    },
    en: {
      title: 'Login',
      subtitle: 'Sign in to order services and use messaging.',
      newHere: 'New here?',
      create: 'Create account',
    },
    kz: {
      title: 'Кіру',
      subtitle: 'Қызметке тапсырыс беру және чатқа кіру үшін авторизациядан өтіңіз.',
      newHere: 'Тіркелмегенсіз бе?',
      create: 'Аккаунт ашу',
    },
  }[lang]

  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8 md:min-h-[calc(100vh-5rem)] md:py-12">
      <div className="w-full max-w-md rounded-3xl border border-[#e7dbcf] bg-[#fffdfb] p-8 shadow-xl shadow-slate-200/40 md:p-10">
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d0a144]/10">
          <span className="text-2xl">👋</span>
        </div>
        <h1 className="font-serif text-3xl font-semibold text-[#2d3147] md:text-4xl">{tx.title}</h1>
        <p className="mt-2 text-sm text-[#7a7d87] leading-relaxed">{tx.subtitle}</p>
        <div className="mt-6">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-sm text-[#7a7d87]">
          {tx.newHere}{' '}
          <Link href="/register" className="font-semibold text-[#8d6241] hover:text-[#724f35] transition-colors">
            {tx.create}
          </Link>
        </p>
      </div>
    </section>
  )
}
