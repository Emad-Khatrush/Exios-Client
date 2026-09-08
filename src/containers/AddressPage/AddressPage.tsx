import { useSelector } from "react-redux";
import InfoCard from "../../components/InfoCard/InfoCard";

const AddressPage = () => {
  const account = useSelector((state: any) => state.session.account);

  return (
    <div className="container mx-auto py-10 h-64 xl:w-11/12 px-3">
      <h2 className=" text-3xl text-center font-bold mb-16">عناوين الشحن</h2>

      <div className="grid gap-4 xl:grid-cols-3 lg:grid-cols-2 mb-5">
        <InfoCard 
          header="عنوان الصين"
          imgSrc={'https://storage.cloud.google.com/alghad-media/2022/01/ce11f74d-%D8%B5%D9%88%D8%B1-%D8%B9%D9%84%D9%85-%D8%A7%D9%84%D8%B5%D9%8A%D9%86-%D8%B1%D9%85%D8%B2%D9%8A%D8%A7%D8%AA-%D9%88%D8%AE%D9%84%D9%81%D9%8A%D8%A7%D8%AA-%D8%A7%D9%84%D8%B9%D9%84%D9%85-%D8%A7%D9%84%D8%B5%D9%8A%D9%86%D9%8A-1.jpg'}
          description={
            `
(Exios仓）(${account?.customerId}) 广东省佛山市南区里水镇洲村工业区一横路15号之三A </br>
联系人/Contact person: </br>
杨生:19700263771 </br>
备注(请认真阅读):（导航搜索：明都LOFT青年社区） </br>
</br>
送货时间:周一至周六早上9点至下午6点，周日休息，(送货之前一定要提前电话联系)
空运货外箱需要套编织袋并注明“空运/BYAIR”及客户唛头，海运货(重货需套编织袋)并标注“海运/BYSEA”及客户唛头，仓库不提供卸货。
所有货物品牌货不收(如果不如实告知目送至此仓库地址，本公司不承担任何责任后果需供货商自负)，货物如带电需贴电池防火标，随货需装箱单一份(并且需
要发电子版给公司)。
`
          }
          buttonLabel={'ابدا الشحن'}
          disableHoverEffect={true}
          buttonPath={'/start-shipment?shipmentFromWhere=china'}
          textDirection={'ltr'}
          copyTextButton={true}
          showShipmentMethod={true}
        />

        <InfoCard 
          header="عنوان الامارات"
          imgSrc={'https://miro.medium.com/v2/resize:fit:920/1*y14JDmQG9_uLp6gabN8s5Q.jpeg'}
          description={
            `
            Name: Exios </br>
            Last Name: Company </br>
            phone: +971505967929 </br>
            Address: SHED NO.2 RAS AL KHOR
            INDUSTRIAL AREA 2 DUBAI Sq336 Exios39 - ${account?.customerId}
            `
          }
          buttonLabel={'ابدا الشحن'}
          disableHoverEffect={true}
          buttonPath={'/start-shipment?shipmentFromWhere=uae'}
          textDirection={'ltr'}
          copyTextButton={true}
        />

        <InfoCard 
          header="عنوان امريكا"
          imgSrc={'https://d3vt78ic2w6yaz.cloudfront.net/fit-1000-545/blog/4952-%D8%A7%D9%94%D8%B3%D8%A8%D8%A7%D8%A8-%D8%A7%D9%84%D8%AF%D8%B1%D8%A7%D8%B3%D8%A9-%D9%81%D9%8A-%D8%A7%D9%94%D9%85%D8%B1%D9%8A%D9%83%D8%A7-01.webp'}
          description={
            `
            غير متاح الشحن فقط من امريكا </br>
            يوجد فقط عملية الشراء والشحن مع بعضها </br>
            في حالة تريد شراء منتج وشحنه يرجى التواصل مع اقرب مندوب </br>
            `
          }
          disableHoverEffect={true}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3 lg:grid-cols-2 mb-5">
        <InfoCard 
          header="عنوان تركيا"
          imgSrc={'https://www.alkhaleej.ae/sites/default/files/styles/d08_standard/public/2022-10/4539610.jpeg?h=10d202d3&itok=c77mDfCP'}
          description={
            `
            غير متاح الشحن فقط من تركيا </br>
            يوجد فقط عملية الشراء والشحن مع بعضها </br>
            في حالة تريد شراء منتج وشحنه يرجى التواصل مع اقرب مندوب </br>
            `
          }
          disableHoverEffect={true}
        />

        <InfoCard 
          header="عنوان بريطانيا"
          imgSrc={'https://storage.cloud.google.com/alghad-media/2021/05/image-3.jpg'}
          description={
            `
            غير متاح الشحن فقط من بريطانيا </br>
            يوجد فقط عملية الشراء والشحن مع بعضها </br>
            في حالة تريد شراء منتج وشحنه يرجى التواصل مع اقرب مندوب </br>
            `
          }
          disableHoverEffect={true}
        />
      </div>

      <br />
    </div>
  )
}

export default AddressPage;
