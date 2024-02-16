import React from 'react'

type Props = {
  children: React.ReactNode
  className?: string
  style?: any
  leaned?: boolean
}

const Card = (props: Props) => {
  return (
    <div style={props.style} className={`h-fit w-auto rounded-md shadow-sm border bg-white overflow-auto ${props.className} ${props.leaned ? 'p-0 m-0' : 'p-4'}`}>
      {props.children}
    </div>
  )
}

export default Card;
