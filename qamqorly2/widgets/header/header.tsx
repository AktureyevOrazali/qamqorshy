import Link from 'next/link'

import LogoutButton from '@/components/auth/logout-button'
import LanguageSwitcher from '@/components/common/language-switcher'
import { getCurrentUser } from '@/lib/auth'
import { getDictionary, getLangFromCookies } from '@/lib/i18n'
import PrimaryButton from '@/shared/ui/buttons/primary-button'

import MobileMenu from './mobile-menu'
import NavBar from './navbar'

const Header = async () => {
  const session = await getCurrentUser()
  const lang = await getLangFromCookies()
  const dict = getDictionary(lang)

  return (
    <header className="fixed left-0 top-0 z-50 h-16 w-full border-b border-white/60 bg-white/80 px-4 backdrop-blur-xl md:h-20 md:px-10">
      <div className="mx-auto flex h-full max-w-[1240px] items-center justify-between">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d0a144] text-white shadow-lg shadow-[#d0a144]/20 transition-transform duration-300 group-hover:scale-110 md:h-10 md:w-10">
            <span className="font-serif text-xl font-bold italic md:text-2xl">Q</span>
          </div>
          <span className="font-serif text-xl font-semibold tracking-tight text-[#2d3147] transition-colors duration-300 group-hover:text-[#d0a144] md:text-2xl">
            Qamqorshy
          </span>
        </Link>

        <NavBar session={session} labels={dict.nav} />

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher currentLang={lang} />
          {session ? (
            <>
              <PrimaryButton href="/dashboard" text={dict.nav.dashboard} variant="outlined" className="min-w-[8.6rem] justify-center text-xs" />
              <LogoutButton />
            </>
          ) : (
            <>
              <PrimaryButton href="/login" text={dict.nav.login} variant="outlined" className="min-w-[8.2rem] justify-center text-xs" />
              <PrimaryButton href="/register" text={dict.nav.register} className="min-w-[8.2rem] justify-center text-xs" />
            </>
          )}
        </div>

        <MobileMenu
          session={session}
          labels={{ ...dict.nav, quote: dict.nav.register }}
          langSwitcher={<LanguageSwitcher currentLang={lang} />}
          logoutButton={session ? <LogoutButton /> : undefined}
        />
      </div>
    </header>
  )
}

export default Header
