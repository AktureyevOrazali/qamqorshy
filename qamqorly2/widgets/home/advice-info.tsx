'use client'

import CustomSectionTitle from '@/shared/ui/custom-section-title'
import InfoBlock from '@/shared/ui/info-block'
import Image from 'next/image'

const AdviceInfo = () => {
  return (
    <section className="relative h-screen shadow-[inset_0_60vh_50px_0_rgba(255,255,255,0.6)]">
      <Image
        src="/advice_section_bg.jpg"
        alt="bg"
        fill
        className="w-full h-full top-0 left-0 -z-10 object-cover opacity-75"
      />
      <CustomSectionTitle
        text="Practice Advice"
        constainerClassName="h-1/2 flex flex-col gap-5 items-center justify-center"
        mainTextClassName="text-5xl font-bold text-shadow-lg"
        description="Problems of coordinating care across two vulnerable groups: elderly people and pets"
        descriptionClassName="text-lg w-1/3 text-center"
      />

      <div className="h-1/3 flex items-start justify-center gap-10 ">
        <InfoBlock
          text="Care"
          containerClassName="border-none w-60 shadow-xl bg-[#D0A144] flex-col gap-5"
          description="At first, it seemed that one approach could fit everyone — but later we learned 
             that seniors and animals 
             need different care"
          descriptionClassName="text-white"
          textClassName="w-full font-medium text-white"
        />
        <InfoBlock
          text="Attention"
          description="They describe a 
             universe consisting of 
             bodies moving"
          descriptionClassName="text-white"
          containerClassName="border-none w-60 shadow-lg bg-[#D0A144] flex-col gap-5"
          textClassName="w-full font-medium text-white"
        />
        <InfoBlock
          text="Traffic Related Crimes"
          description="They finally obtained a consistent description of the behaviour"
          descriptionClassName="text-white"
          containerClassName="border-none w-60 shadow-lg bg-[#D0A144] flex-col gap-5"
          textClassName="w-full font-medium text-white"
        />
      </div>
    </section>
  )
}

export default AdviceInfo
