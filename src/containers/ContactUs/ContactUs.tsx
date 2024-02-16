import Card from "../../components/Card/Card";
import { HiOfficeBuilding } from 'react-icons/hi';

type Props = {}

const ContactUs = (props: Props) => {

  return (
    <div className="container mx-auto py-10 h-64 w-11/12 px-6">
      <Card className="mb-10">
        <h1 className=" text-3xl text-end my-10 mt-5">تواصل معنا</h1>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 place-items-center mb-8">
          <div className=" bg-green-100 p-4 pb-9 rounded-xl text-start w-fit" style={{ direction: 'rtl' }}>
            <div className=" bg-green-600 w-fit p-2 rounded-xl mb-8">
              <HiOfficeBuilding size={35} color="#fff" />
            </div>
            <h1 className=" text-xl font-bold mb-2">مكتب طرابلس</h1>
            <p className=" text-slate-600 mb-1">باب بن غشير زنقه ميدان مدرسه اقرأ خلي محلات مواد الزينه للجملة</p>
            <p className=" text-slate-600 mb-1">علي يسارك أول زنقه بعدهم على اليسار بعدها أول زنقه على اليمين</p>
            <p className=" text-slate-600 mb-1">رقم الهاتف: 0915643265</p>
            <p className=" text-slate-600 mb-1">رقم الهاتف: 0912068211</p>
            <p className=" text-slate-600">البريد الاكتروني: emad.khatrush@exioslibya.com</p>
          </div>

          <div className=" bg-green-100 p-4 pb-9 rounded-xl text-start w-fit" style={{ direction: 'rtl' }}>
            <div className=" bg-green-600 w-fit p-2 rounded-xl mb-8">
              <HiOfficeBuilding size={35} color="#fff" />
            </div>
            <h1 className=" text-xl font-bold mb-2">مكتب بنغازي</h1>
            <p className=" text-slate-600 mb-1">مكتب بنغازي سيدي حسين بالقرب من مول حياة شارع بوذن</p>
            <p className=" text-slate-600 mb-1">رقم الهاتف: 0919078031</p>
            <p className=" text-slate-600 mb-1">رقم الهاتف: 0919734019</p>
            <p className=" text-slate-600">البريد الاكتروني: emad.khatrush@exioslibya.com</p>
          </div>
        </div>

        <hr />

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 place-items-center my-8">
          <h2 className="font-bold text-3xl bg-green-100 p-5 rounded-xl">مكتب طرابلس</h2>
          <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3351.111901251624!2d13.205703015546595!3d32.868758586608415!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x13a89344ae74c95d%3A0xaa1f074a1e5c2548!2z2LTYsdmD2Kkg2KfZg9iz2YrZiNizINmE2YTYp9iz2KrZitix2KfYryDZiNin2YTYqti12K_Zitix!5e0!3m2!1str!2str!4v1668264403979!5m2!1str!2str" width="100%" height="400" loading="lazy" />
          
          <h2 className="font-bold text-3xl bg-green-100 p-5 rounded-xl">مكتب بنغازي</h2>
          <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6976713.190836714!2d17.71335029024947!3d31.37006417132124!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x13831dd3277be3bd%3A0x70064feeb0e8c73c!2z2LTYsdmD2Kkg2KfZg9iz2YrZiNizINmE2YTYp9iz2KrZitix2KfYryDZiNin2YTYqti12K_Zitix!5e0!3m2!1str!2str!4v1668264519873!5m2!1str!2str" width="100%" height="400" loading="lazy" />
        </div>
      </Card>
    </div>
  )
}

export default ContactUs;
