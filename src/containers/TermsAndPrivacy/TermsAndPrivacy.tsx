
import Card from '../../components/Card/Card';
import TermsPdf from '../../../public/terms.pdf';

type Props = {}

const TermsAndPrivacy = (props: Props) => {
  
  return (
    <div className="container mx-auto py-10 h-100 w-11/12 px-6">
      <Card className='h-100'>
        <h2 className='text-end text-3xl my-10'>شروط وسياسات شركة اكسيوس</h2>
        <iframe src={TermsPdf} height="600" width="100%" />
      </Card>
    </div>
  )
}

export default TermsAndPrivacy;
