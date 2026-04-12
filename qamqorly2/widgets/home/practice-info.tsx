import CustomSectionTitle from '@/shared/ui/custom-section-title'
import InfoBlock from '@/shared/ui/info-block'
import React from 'react'

const PracticeInfo = () => {
  return (
    <section className="h-screen">
      <CustomSectionTitle
        text="Our Practice Areas"
        constainerClassName="h-1/2 flex flex-col gap-5 items-center justify-center"
        mainTextClassName="text-5xl font-bold text-shadow-lg"
        description="Problems of coordinating care across two vulnerable groups:
          elderly people and pets"
        descriptionClassName="text-lg text-[#737373] w-1/3 text-center"
      />

      <div className="h-1/3 flex items-center justify-center gap-10 ">
        <InfoBlock
          text="Care for Seniors"
          containerClassName="border-none shadow-lg bg-[#f6f4f4]"
          textClassName=""
        />
        <InfoBlock
          text="Animal Care"
          containerClassName="border-none shadow-lg bg-[#D0A144]"
          textClassName="text-white"
        />
        <InfoBlock
          text="Safety & Well-Being"
          containerClassName="border-none shadow-lg bg-[#f6f4f4]"
          textClassName=""
        />
      </div>
    </section>
  )
}

export default PracticeInfo
