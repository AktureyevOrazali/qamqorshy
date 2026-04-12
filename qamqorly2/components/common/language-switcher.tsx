'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Lang = 'ru' | 'en' | 'kz'

export default function LanguageSwitcher({ currentLang }: { currentLang: Lang }) {
  const [lang, setLang] = useState<Lang>(currentLang)
  const router = useRouter()

  const onChange = async (nextLang: Lang) => {
    setLang(nextLang)
    await fetch('/api/lang', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: nextLang }),
    })
    router.refresh()
  }

  return (
    <select
      value={lang}
      onChange={(e) => onChange(e.target.value as Lang)}
      className="q-select w-auto min-w-[60px] py-1.5 px-3 text-xs font-bold text-[#8d6241] rounded-full"
      aria-label="Language"
    >
      <option value="ru">RU</option>
      <option value="en">EN</option>
      <option value="kz">KZ</option>
    </select>
  )
}
