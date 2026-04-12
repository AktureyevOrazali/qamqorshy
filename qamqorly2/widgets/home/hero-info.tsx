'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { HeroImg } from '@/shared/ui/hero-img'
import HeroText from './hero-text'
import PrimaryButton from '@/shared/ui/buttons/primary-button'

const HeroInfo = () => {
  const animalsImgRef = useRef<HTMLImageElement>(null)
  const oldWomanImgRef = useRef<HTMLImageElement>(null)
  const oldManImgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    gsap.fromTo(
      animalsImgRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1.5, ease: 'power3.out' }
    )

    gsap.fromTo(
      oldWomanImgRef.current,
      { opacity: 0, x: -100 },
      { opacity: 1, x: 0, duration: 2, ease: 'power3.out', delay: 0.3 }
    )

    gsap.fromTo(
      oldManImgRef.current,
      { opacity: 0, x: 100 },
      { opacity: 1, x: 0, duration: 2, ease: 'power3.out', delay: 0.5 }
    )
  }, [])

  return (
    <section
      className="relative h-screen overflow-hidden"
      style={{
        backgroundImage: "url('/background-img1.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <HeroImg
        alt="old-woman"
        w={700}
        h={700}
        img_url="/old-woman.png"
        ref={oldWomanImgRef}
        className="absolute top-0 left-1/12 z-0 translate-y-1/4 translate-x-1/2"
      />
      <HeroImg
        alt="old-man"
        w={600}
        h={600}
        img_url="/old-man.png"
        ref={oldManImgRef}
        className="absolute top-0 left-1/3 translate-x-1/2 z-0"
      />
      <HeroImg
        alt="animals"
        w={600}
        h={600}
        img_url="/animals.png"
        ref={animalsImgRef}
        className="absolute top-0 left-1/4 translate-x-1/4 translate-y-1/4 z-10"
      />

      <div className="h-full w-fit flex flex-col justify-center px-20 text-[#252B42] gap-5">
        <HeroText />
        <div className="flex gap-5">
          <PrimaryButton text={'Get Quote Now'} />
          <PrimaryButton text={'Learn more'} variant="outlined" />
        </div>
      </div>
    </section>
  )
}

export default HeroInfo
