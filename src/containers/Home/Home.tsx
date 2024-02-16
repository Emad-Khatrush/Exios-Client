import InfoWidget from "../../components/InfoWidget/InfoWidget";
import { FiPackage } from 'react-icons/fi';
import { FaCheck, FaFileInvoiceDollar, FaWarehouse } from "react-icons/fa";
import AlertWidget from "../../components/AlertWidget/AlertWidget";
import ShortcutInfoWidget from "../../components/ShortcutInfoWidget/ShortcutInfoWidget";

import OrderImage from "../../../public/images/box.png";
import Address from "../../../public/images/online-shop.png";
import Prices from "../../../public/images/cash.png";
import Terms from "../../../public/images/placeholder.png";
import Contact from "../../../public/images/24-hours.png";
import Card from "../../components/Card/Card";
import { Link } from "react-router-dom";
import AlertInfo from "../../components/AlertInfo/AlertInfo";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import api from "../../api";
import { Announcement } from "../../models";

const Home = () => {
  const account = useSelector((state: any) => state.session.account);
  
  const [countList, setCountList] = useState({
    activeOrders: 0,
    readyForReceivement: 0,
    receivedOrders: 0,
    totalPaidInvoices: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    getHomeData();
  }, [])
  
  const getHomeData = async () => {
    try {
      setIsLoading(true);
      const response = await api.getHomeData();
      const data = response.data.results;

      const announcements = (await api.getAnnouncements())?.data; 
      setAnnouncements(announcements);
      setCountList(data.countList);
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  }

  return (
    <div className="container mx-auto py-10 h-64 w-11/12 px-6">
      {announcements && announcements.length > 0 && announcements.map((announcement: Announcement) => (
        <div className="mb-5">
          <AlertInfo 
            tint="info"
            description={announcement.description}
          />
        </div>
      ))}
      
      <div className="grid gap-4 xl:grid-cols-4 lg:grid-cols-2 mb-5">
        <InfoWidget
          icon={<FiPackage color="#3d3d3d" size={'46px'} />}
          description={'طلبيات النشطه'}
          total={String(countList?.activeOrders)}
          bgColor={'bg-yellow-200'}
          isLoading={isLoading}
        />
        <InfoWidget 
          icon={<FaFileInvoiceDollar color="#3d3d3d" size={'40px'} />}
          description={'اجمالي الفواتير'}
          total={String(countList?.totalPaidInvoices) + '$'}
          bgColor={'bg-gray-200'}
          isLoading={isLoading}
        />
        <InfoWidget 
          icon={<FaWarehouse color="#3d3d3d" size={'40px'} />}
          description={'جاهزه للتسليم'}
          total={String(countList?.readyForReceivement)}
          bgColor={'bg-sky-100'}
          isLoading={isLoading}
        />
        <InfoWidget 
          icon={<FaCheck color="#3d3d3d" size={'40px'} />}
          description={'تم التسليم'}
          total={String(countList?.receivedOrders)}
          bgColor={'bg-emerald-100'}
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-4 grid-cols-12 mb-4">
        <div className="col-span-12 2xl:col-span-8 xl:col-span-8">
          <AlertWidget />
        </div>

        <div className="col-span-12 2xl:col-span-4 xl:col-span-4">
          <Card>
            <div className="relative h-full overflow-hidden bg-cover rounded-xl" style={{ backgroundImage: `url('https://storage.googleapis.com/exios-bucket/customer-shipping.jpg')` }}>
              <span className="absolute top-0 left-0 w-full h-full bg-center bg-cover bg-gradient-to-tl from-gray-900 to-slate-800 opacity-80"></span>
              <div className="relative z-10 flex flex-col flex-auto h-full p-4 text-end">
                <h5 className="pt-2 mb-2 font-bold text-white text-end">كود الشحن الخاص بك هو</h5>
                <div className="flex justify-end">
                  <h5 className="mb-4 font-bold text-white w-fit text-4xl rounded-lg p-1 bg-slate-400">{account.customerId}</h5>
                </div>
                <p className="text-white text-end mb-5">يمكنك استعمال هذا الكود عند ارسال البضائع الى عناويننا، يعتبر هذا الكود ثابت ومخزون عليه جميع معلوماتك ماعليك الا ان تكتبه في العنوان و على صندوق</p>
                <div className="flex justify-end">
                  <Link className=" w-fit rounded-lg p-1 mt-auto bg-slate-500 mb-0 font-semibold leading-normal text-white group text-sm text-end" to={'/start-shipment'}>
                    عرض التعليمات
                    <i className="fas fa-arrow-right ease-bounce text-sm group-hover:translate-x-1.25 ml-1 leading-normal transition-all duration-200" aria-hidden="true"></i>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 2xl:gap-10 2xl:grid-cols-9 xl:grid-cols-6">
        <div className="col-span-1 2xl:col-span-3 xl:col-span-3">
          <ShortcutInfoWidget 
            title={'طلبياتي'}
            description={'عرض جميع طلباتك التي وصلت الى مخزننا الخارجية'}
            buttonLabel={'عرض'}
            imgSrc={OrderImage}
            path={"/orders"}
          />
        </div>
        <div className="col-span-1 2xl:col-span-3 xl:col-span-3">
          <ShortcutInfoWidget 
            title={'عناوننا'}
            description={'عرض جميع العناوين الخاصه بالشركة للشحن منه'}
            buttonLabel={'عرض'}
            imgSrc={Address}
            path={"/address"}
          />
        </div>
        <div className="col-span-1 2xl:col-span-3 xl:col-span-3">
          <ShortcutInfoWidget 
            title={'الاسعار'}
            description={'اسعار الشراء والشحن من جميع الدول التي نتعامل معه'}
            buttonLabel={'عرض'}
            imgSrc={Prices}
            path={"/prices"}
          />
        </div>
        <div className="col-span-1 2xl:col-span-3 xl:col-span-3">
          <ShortcutInfoWidget 
            title={'الشروط'}
            description={'شروط الشركة للشراء والشحن من عن طريقنا ونقاط مهمه في تفاصيل الشحن'}
            buttonLabel={'عرض'}
            imgSrc={Terms}
            path={'/terms-privacy'}
          />
        </div>
        <div className="col-span-1 2xl:col-span-3 xl:col-span-3">
          <ShortcutInfoWidget 
            title={'التواصل'}
            description={'موجودين في خدمتكم على مدار 24 ساعة متواصله خلال 7 ايام'}
            buttonLabel={'عرض'}
            imgSrc={Contact}
            path={'/contact-us'}
          />
        </div>
      </div>
      
      <br />
    </div>
  )
}

export default Home;
