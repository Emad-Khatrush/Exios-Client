import { Avatar } from "@mui/material";

type Props = {
  src: string
  className?: string
}

const Logo = (props: Props) => {
  return (
    <div className={`h-16 w-full flex items-center justify-center ${props.className}`}>
      <Avatar alt="avatar" src={props.src} />
    </div>
  )
}

export default Logo;