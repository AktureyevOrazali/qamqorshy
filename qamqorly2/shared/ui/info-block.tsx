import clsx from 'clsx'
import React from 'react'

const InfoBlock = ({
  text,
  description,
  textClassName,
  descriptionClassName,
  containerClassName,
}: {
  text: string
  description?: string
  textClassName: string
  descriptionClassName?: string
  containerClassName: string
}) => {
  return (
    <div
      className={clsx(
        'p-4 w-52 h-fit rounded-md border flex items-center justify-center duration-300 hover:-translate-y-5',
        containerClassName
      )}
    >
      <h1 className={clsx(textClassName)}>{text}</h1>
      <h4
        className={clsx(
          descriptionClassName,
          'font-normal text-sm text-[#737373]'
        )}
      >
        {description}
      </h4>
    </div>
  )
}

export default InfoBlock
