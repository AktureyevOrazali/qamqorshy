import Link from 'next/link'
import clsx from 'clsx'

interface PrimaryButtonProps {
  text: string
  variant?: 'filled' | 'outlined'
  className?: string
  href?: string
  type?: 'button' | 'submit'
  onClick?: () => void
}

const baseClass =
  'inline-flex w-fit items-center justify-center rounded-full px-7 py-2 font-medium transition-all duration-300 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d0a144]/50 focus-visible:ring-offset-2 active:translate-y-0'

const PrimaryButton = ({
  text,
  variant = 'filled',
  className,
  href,
  type = 'button',
  onClick,
}: PrimaryButtonProps) => {
  const classes = clsx(
    baseClass,
    variant === 'outlined'
      ? 'border border-[#8d6241] bg-white/80 text-[#8d6241] hover:bg-white'
      : 'border-none bg-[#8d6241] text-white shadow-lg shadow-[#8d6241]/25 hover:bg-[#765037]',
    className
  )

  if (href) {
    return (
      <Link href={href} className={classes}>
        {text}
      </Link>
    )
  }

  return (
    <button type={type} className={classes} onClick={onClick}>
      {text}
    </button>
  )
}

export default PrimaryButton