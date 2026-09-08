import { Box, CircularProgress } from '@mui/material';
import Card from '../Card/Card';

type Props = {
  icon: any
  description: string
  total: string
  bgColor?: string
  isLoading?: boolean
}

const InfoWidget = (props: Props) => {
  const { description, total, bgColor, isLoading } = props;
  if (isLoading) {
    return <Card
      className="h-32 rounded-lg"
    >
      <Box className='h-full items-center justify-center' sx={{ display: 'flex' }}>
      <CircularProgress />
    </Box>
      </Card>
  }
  return (
    <Card
      className="h-32 rounded-lg text-end"
    >
      <div className='flex h-full justify-end items-center'>
        <div className="mr-5">
          <p className='text-xl text-gray-500 mb-2'>{description}</p>
          <h3 className='font-bold text-2xl'>{total}</h3>
        </div>

        <div className={`${bgColor} w-20 h-20 self-center flex justify-center items-center rounded-lg flex-2`}>
          {props.icon}
        </div>
      </div>
    </Card>
  )
}

export default InfoWidget;
