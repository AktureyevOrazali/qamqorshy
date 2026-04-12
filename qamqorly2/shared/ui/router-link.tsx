'use client'

import Link from 'next/link'

const HEADER_OFFSET = 104

const RouterLink = ({
  link,
  text,
  className = '',
}: {
  link: string
  text: string
  className?: string
}) => {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!link.startsWith('/#')) {
      return
    }

    const target = document.querySelector(link.slice(1)) as HTMLElement | null
    if (!target) {
      return
    }

    event.preventDefault()
    const top = window.scrollY + target.getBoundingClientRect().top - HEADER_OFFSET
    window.scrollTo({
      top,
      behavior: 'smooth',
    })
  }

  return (
    <Link
      href={link}
      onClick={handleClick}
      className={`text-xs font-semibold tracking-wide text-slate-500 transition hover:text-[#8d6241] ${className}`}
    >
      {text}
    </Link>
  )
}

export default RouterLink
