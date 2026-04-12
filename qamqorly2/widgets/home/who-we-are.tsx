import CustomSectionTitle from '@/shared/ui/custom-section-title'
import React from 'react'

const WhoWeAre = () => {
  return (
    <section className="h-screen">
      <CustomSectionTitle
        text="Who we are?"
        constainerClassName="h-1/2 flex flex-col gap-5 items-center justify-center"
        mainTextClassName="text-5xl font-bold text-shadow-lg"
        description="Problems of coordinating care across two vulnerable groups: elderly people and pets"
        descriptionClassName="text-lg text-[#737373] w-1/3 text-center"
      />
    </section>
  )
}

export default WhoWeAre
