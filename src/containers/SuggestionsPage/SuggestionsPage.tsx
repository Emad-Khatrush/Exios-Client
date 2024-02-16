import Card from "../../components/Card/Card";

const SuggestionsPage = () => {
  
  return (
    <div className="container mx-auto py-10 h-100 px-6">
      <Card className='h-100 text-right'>
        <h1 className=" text-3xl mb-3">تقديم اقتراح</h1>
        <p className="mb-3">يمكنكم الدخول على رابط ادناه وتقديم اقتراحاتكم للتطوير من خدمات الشركة لكم</p>
        <a href="https://forms.gle/Chp9K3QZSUfeccdN9" target="__blank" className=" text-blue-500 text-xl">اضغط هنا لتقديم الاقتراح</a>
        <hr className={`text-gray-500  border-2 mt-5 mb-5`} />

        <h1 className=" text-3xl mb-3">تقديم شكوى</h1>
        <p className="mb-3">يمكنكم الدخول على رابط ادناه وتقديم شكوى الخاصه بكم الى ادارة الشركة لكي تم مراجعتها وحل المشكلة لكم</p>
        <a href="https://forms.gle/DUrhVejKv7LXLwdh8" target="__blank" className=" text-blue-500 text-xl">اضغط هنا لتقديم الشكوى</a>
      </Card>
    </div>
  )
}

export default SuggestionsPage;
