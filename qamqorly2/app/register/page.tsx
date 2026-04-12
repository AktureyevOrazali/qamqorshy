import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getLangFromCookies } from '@/lib/i18n'
import { redirect } from 'next/navigation'
import RegisterForm from '@/components/auth/register-form'

export default async function RegisterPage() {
  const session = await getCurrentUser()
  const lang = await getLangFromCookies()
  if (session) {
    redirect('/')
  }

  const tx = {
    ru: {
      title: 'Регистрация',
      subtitle: 'Выберите роль: клиент или специалист по уходу.',
      have: 'Уже есть аккаунт?',
      login: 'Войти',
    },
    en: {
      title: 'Registration',
      subtitle: 'Choose your role: client or care specialist.',
      have: 'Already have account?',
      login: 'Login',
    },
    kz: {
      title: 'Тіркелу',
      subtitle: 'Рөлді таңдаңыз: клиент немесе күтім маманы.',
      have: 'Аккаунтыңыз бар ма?',
      login: 'Кіру',
    },
  }[lang]

  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8 md:min-h-[calc(100vh-5rem)] md:py-12">
      <div className="w-full max-w-md rounded-3xl border border-[#e7dbcf] bg-[#fffdfb] p-8 shadow-xl shadow-slate-200/40 md:p-10">
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d0a144]/10">
          <span className="text-2xl">✨</span>
        </div>
        <h1 className="font-serif text-3xl font-semibold text-[#2d3147] md:text-4xl">{tx.title}</h1>
        <p className="mt-2 text-sm text-[#7a7d87] leading-relaxed">{tx.subtitle}</p>
        <div className="mt-6">
          <RegisterForm />
        </div>
        <p className="mt-6 text-center text-sm text-[#7a7d87]">
          {tx.have}{' '}
          <Link href="/login" className="font-semibold text-[#8d6241] hover:text-[#724f35] transition-colors">
            {tx.login}
          </Link>
        </p>
      </div>
    </section>
  )
}
