const CustomSectionTitle = ({
  text,
  constainerClassName,
  description,
  mainTextClassName,
  descriptionClassName,
}: {
  text: string
  constainerClassName?: string
  description?: string
  mainTextClassName?: string
  descriptionClassName?: string
}) => {
  return (
    <div className={constainerClassName}>
      <h1 className={mainTextClassName}>{text}</h1>
      <h2 className={descriptionClassName}>{description}</h2>
    </div>
  )
}

export default CustomSectionTitle
