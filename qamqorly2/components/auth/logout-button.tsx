'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  const onLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={onLogout}
      className="rounded-full border border-[#d7c7b8] px-4 py-2 text-sm font-semibold text-[#8d6241] transition hover:bg-[#f8efe8]"
    >
      Logout
    </button>
  )
}
