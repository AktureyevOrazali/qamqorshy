import Image from 'next/image'
import { Ref } from 'react'

export const HeroImg = ({
  alt,
  w,
  h,
  img_url,
  ref,
  className,
}: {
  alt: string
  w: number
  h: number
  img_url: string
  ref: Ref<HTMLImageElement> | null
  className: string
}) => {
  return (
    <div ref={ref}>
      <Image
        alt={alt}
        src={img_url}
        width={w}
        height={h}
        className={className}
      />
    </div>
  )
}
