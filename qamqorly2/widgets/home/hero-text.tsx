'use client'

import { useEffect, useRef } from 'react'
import SplitType from 'split-type'
import gsap from 'gsap'

const HeroText = () => {
  const textH1Ref = useRef<HTMLHeadingElement>(null)
  const textH4Ref = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!textH1Ref.current || !textH4Ref.current) {
      return
    }
    const textH1 = new SplitType(textH1Ref.current, {
      types: 'chars',
    })

    const textH4 = new SplitType(textH4Ref.current, {
      types: 'chars',
    })

    gsap.from(textH1.chars, {
      opacity: 0,
      y: 20,
      duration: 0.6,
      stagger: 0.03,
      ease: 'power2.out',
    })

    gsap.from(textH4.chars, {
      opacity: 0,
      y: 20,
      duration: 0.6,
      stagger: 0.03,
      delay: 1,
      ease: 'power2.out',
    })
  }, [])

  return (
    <div className="flex flex-col gap-2">
      <h1
        ref={textH1Ref}
        className="text-[58px] text-[#252B42] leading-16.25 font-black tracking-[0.2px] text-start "
      >
        Care that supports
        <br /> everyday life
      </h1>

      <h4
        ref={textH4Ref}
        className="text-[#737373] font-medium text-xl leading-5 tracking-[0.2px]"
      >
        Thoughtful support that helps
        <br />
        you live independently
      </h4>
    </div>
  )
}

export default HeroText
