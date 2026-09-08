import Card from '../Card/Card';

type Props = {
  title: string
  data: [
    {
      label: string
      value: string
      tint: 'danger'
    }
  ]
}

const InfoDetailsCard = (props: Props) => {
  const { title, data } = props;
  return (
    <Card
      className='rounded-2xl'
    >
      <h2 className='text-right text-2xl font-medium mb-7 mt-2'>{title}</h2>

      {data.map( (info, i) => (
        <div key={i} className=" flex justify-between items-center mb-4">
          <p className={`text-${info.tint === 'danger' ? 'red' : 'stone'}-500 text-md font-semibold`}>{info.value}</p>
          <h4 className='  text-gray-400 text-md'>{info.label}</h4>
        </div>
      ))}
    </Card>
  )
}

export default InfoDetailsCard;
