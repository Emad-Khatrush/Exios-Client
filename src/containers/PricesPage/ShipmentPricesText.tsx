import { useEffect, useState } from "react";
import api from "../../api";
import InfoCard from "../../components/InfoCard/InfoCard";
import { ShippingPrice } from "../../models";

const ShipmentPricesText = () => {
  const [shippingPrices, setShippingPrices] = useState<ShippingPrice[] | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);


  useEffect(() => {
    getShippingPrices();
  }, [])

  const getShippingPrices = async () => {
    setIsLoading(true);
    try {
      const prices = (await api.getShippingPrices())?.data;
      setShippingPrices(prices);
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  }

  let chinaAirPrice;
  let chinaseaPrice;
  let uaeAirPrice;
  let usaAirPrice;
  let ukAirPrice;
  let turkeyAirPrice;

  shippingPrices?.forEach(price => {
    if (price.country === 'china' && price.shippingType === 'air') {
      chinaAirPrice = price.sellingPrice;
    } else if (price.country === 'china' && price.shippingType === 'sea') {
      chinaseaPrice = price.sellingPrice;
    } else if (price.country === 'uae') {
      uaeAirPrice = price.sellingPrice;
    } else if (price.country === 'usa') {
      usaAirPrice = price.sellingPrice;
    } else if (price.country === 'uk') {
      ukAirPrice = price.sellingPrice;
    } else if (price.country === 'turkey') {
      turkeyAirPrice = price.sellingPrice;
    }
  })
  
  return (
    <div className="grid gap-4 xl:grid-cols-2 lg:grid-cols-2 mb-5 place-items-center">
      <InfoCard 
        header="اسعار الشحن من الصين"
        imgSrc={'https://storage.googleapis.com/alghad-media/2022/01/ce11f74d-%D8%B5%D9%88%D8%B1-%D8%B9%D9%84%D9%85-%D8%A7%D9%84%D8%B5%D9%8A%D9%86-%D8%B1%D9%85%D8%B2%D9%8A%D8%A7%D8%AA-%D9%88%D8%AE%D9%84%D9%81%D9%8A%D8%A7%D8%AA-%D8%A7%D9%84%D8%B9%D9%84%D9%85-%D8%A7%D9%84%D8%B5%D9%8A%D9%86%D9%8A-1.jpg'}
        infoList={[`شحن الجوي ${chinaAirPrice} دولار للكيلو الواحد`, 'المده من 17-27 يوم من تاريخ وصوله الى مخزن الصين الى ليبيا', `الشحن البحري ${chinaseaPrice}$ للمتر المكعب (CBM)`, 'المده من 50-65 يوم من تاريخ وصوله الى مخزن الصين الى ليبيا']}
        buttonLabel={'ابدا الشحن'}
        disableHoverEffect={true}
        buttonPath={'/start-shipment?shipmentFromWhere=china'}
        isLoading={isLoading}
      />

      <InfoCard 
        header="اسعار الشحن من الامارات"
        imgSrc={'https://www.albayan.ae/polopoly_fs/1.4456431.1655240227!/image/image.jpg'}
        infoList={[`شحن الجوي ${uaeAirPrice} دولار للكيلو الواحد`, 'المده من 7-15 يوم من تاريخ وصوله الى مخزن الامارات الى ليبيا']}
        buttonLabel={'ابدا الشحن'}
        disableHoverEffect={true}
        buttonPath={'/start-shipment?shipmentFromWhere=uae'}
        isLoading={isLoading}
      />

      <InfoCard 
        header="اسعار الشحن من امريكا"
        imgSrc={'https://d3vt78ic2w6yaz.cloudfront.net/fit-1000-545/blog/4952-%D8%A7%D9%94%D8%B3%D8%A8%D8%A7%D8%A8-%D8%A7%D9%84%D8%AF%D8%B1%D8%A7%D8%B3%D8%A9-%D9%81%D9%8A-%D8%A7%D9%94%D9%85%D8%B1%D9%8A%D9%83%D8%A7-01.webp'}
        infoList={[`شحن الجوي ${usaAirPrice} دولار للكيلو الواحد`, 'المده من 18-32 يوم من تاريخ وصوله الى مخزن امريكا الى ليبيا']}
        buttonLabel={'ابدا الشحن'}
        disableHoverEffect={true}
        buttonPath={'/start-shipment?shipmentFromWhere=usa'}
        isLoading={isLoading}
      />

      <InfoCard 
        header="اسعار الشحن من بريطانيا"
        imgSrc={'https://storage.googleapis.com/alghad-media/2021/05/image-3.jpg'}
        infoList={[`شحن الجوي ${ukAirPrice} دولار للكيلو الواحد`, 'المده من 18-32 يوم من تاريخ وصوله الى مخزن بريطانيا الى ليبيا']}
        buttonLabel={'ابدا الشحن'}
        disableHoverEffect={true}
        buttonPath={'/start-shipment?shipmentFromWhere=usa'}
        isLoading={isLoading}
      />

      {/* Turkey Text */}
      <InfoCard 
        header="اسعار الشحن من تركيا"
        imgSrc={'https://www.alkhaleej.ae/sites/default/files/styles/d08_standard/public/2022-10/4539610.jpeg?h=10d202d3&itok=c77mDfCP'}
        infoList={[`شحن الجوي ${turkeyAirPrice} دولار للكيلو الواحد`, 'المده من 5-10 يوم من تاريخ وصوله الى مخزن الامارات الى ليبيا']}
        buttonLabel={'ابدا الشحن'}
        disableHoverEffect={true}
        buttonPath={'/start-shipment?shipmentFromWhere=turkey'}
        isLoading={isLoading}
      />
    </div>
  )
}

export default ShipmentPricesText;
