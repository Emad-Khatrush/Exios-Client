import { CircularProgress, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useEffect, useState } from "react";
import { BiPhoneCall } from "react-icons/bi";
import { BsArrowLeft } from "react-icons/bs";
import { Link } from "react-router-dom";
import api from "../../api";
import Badge from "../../components/Badge/Badge";
import Card from "../../components/Card/Card";
import CurrencyInput from "../../components/CurrencyInput/CurrencyInput";
import { ExchangeRate } from "../../models";
import ShipmentPricesText from "./ShipmentPricesText";

const websites = [
  {
    value: 'alibaba',
    label: 'علي بابا',
  },
  {
    value: 'others',
    label: 'مواقع اخرى',
  }
]

const PricesPage = () => {
  const [ totalInvoice, setTotalInvoice ] = useState<number | string | undefined>(undefined);
  const [ isLoading, setIsLoading ] = useState<boolean>(false);
  const [ exchangeRate, setExchangeRate ] = useState<ExchangeRate | undefined>();
  const [ websiteName, setWebsiteName ] = useState<any>({
    value: 'alibaba',
    label: 'علي بابا',
  },);

  useEffect(() => {
    getExchangeRate();
  }, [])

  const getExchangeRate = async () => {
    try {
      setIsLoading(true);
      const res = await api.getExchangeRate();
      setExchangeRate(res.data);
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  }

  const invoiceCommission = Math.ceil(calculateCommission(totalInvoice)); 
  
  return (
    <div className="container mx-auto py-10 h-64 w-11/12 px-6">
      <div className="lg:flex justify-end">
        <Card className="mb-10 lg:w-5/12">
          {isLoading ?
            <CircularProgress />
            :
            <div>
              <h2 className=" text-end text-2xl mb-3 font-bold">سعر التصريف مقابل الدولار</h2>
              <div className="flex p-2 justify-between flex-row-reverse">
                <div className="flex flex-row-reverse">
                  <img className="w-16 h-16 ml-5" src="https://static.thenounproject.com/png/2857854-200.png" alt="" />
                  <div>
                    <h3 className="mb-3 font-bold">دينار الليبي</h3>
                    <h3 className="text-gray-400 font-bold text-end">د.ل</h3>
                  </div>
                </div>

                <div>
                  <p className="mb-3  font-bold">{exchangeRate?.rate}</p>
                  <p className="text-green-500 font-bold ">0%</p>
                </div>
              </div>
            </div>
          }
        </Card>
      </div>

      <Card className="mb-10">
        <div style={{ textAlign: 'end' }}>
          <h1 className="text-2xl mb-10 font-bold">عمولات الشراء</h1>
          
          <div className="flex justify-end items-center mb-4">
            <p className="text-sm lg:text-lg">عمولة ثابته</p>
            <p className="text-sm lg:text-lg ml-1">10$</p>
            <BsArrowLeft className="ml-3 text-md lg:text-4xl" />
            <Badge 
              class="text-sm ml-5 lg:text-2xl"
              text={'200 $'}
              color='primary' 
            />
            <p className="text-sm ml-3 lg:text-lg">الى</p>
            <Badge 
              class="text-sm ml-3 lg:text-2xl"
              text={'1 $'}
              color='primary' 
            />
            <p className="text-sm ml-3 lg:text-lg">من</p>
          </div>

          <div className="flex justify-end items-center mb-4">
            <p className="text-sm lg:text-lg">من قيمة الفاتورة</p>
            <p className="text-sm lg:text-lg ml-1">5%</p>
            <BsArrowLeft className="ml-3 text-md lg:text-4xl" />
            <Badge 
              class="text-sm ml-5 lg:text-2xl"
              text={'500 $'}
              color='primary' 
            />
            <p className="text-sm ml-3 lg:text-lg">الى</p>
            <Badge 
              class="text-sm ml-3 lg:text-2xl"
              text={'201 $'}
              color='primary' 
            />
            <p className="text-sm ml-3 lg:text-lg">من</p>
          </div>

          <div className="flex justify-end items-center mb-4">
            <p className="text-sm lg:text-lg">من قيمة الفاتورة</p>
            <p className="text-sm lg:text-lg ml-1">4%</p>
            <BsArrowLeft className="ml-3 text-md lg:text-4xl" />
            <Badge 
              class="text-sm ml-5 lg:text-2xl"
              text={'3000 $'}
              color='primary' 
            />
            <p className="text-sm ml-3 lg:text-lg">الى</p>
            <Badge 
              class="text-sm ml-3 lg:text-2xl"
              text={'501 $'}
              color='primary' 
            />
            <p className="text-sm ml-3 lg:text-lg">من</p>
          </div>

          <div className="flex justify-end items-center">
            <p className="text-sm lg:text-lg">من قيمة الفاتورة</p>
            <p className="text-sm lg:text-lg ml-1">3%</p>
            <BsArrowLeft className="ml-3 text-md lg:text-4xl" />
            <p className="text-sm lg:text-lg ml-8">فما فوق</p>
            <Badge
              class="text-sm lg:text-2xl ml-3"
              text={'3001 $'}
              color='primary' 
            />
            <p className="text-sm lg:text-lg ml-3">من</p>
          </div>

          <div>
            <p className="text-sm lg:text-lg ml-3 mt-5">اقل فاتورة تحسب 10 دولار</p>
          </div>

          <div className="mt-6" style={{ direction: 'rtl' }}>
            <h1 className="text-2xl mb-3 font-bold text-start">حساب العمولة</h1>
            <p className="text-start mb-3">دخل مجموع فاتورتك</p>

            <div className="flex">
              <CurrencyInput 
                currencies={['USD']}
                onInputChange={(event: any) => setTotalInvoice(event.target.value)}
                value={totalInvoice}
              />

              <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                <InputLabel id="demo-select-small">اختار موقع الشراء</InputLabel>
                <Select
                  labelId="demo-select-small"
                  id="demo-select-small"
                  value={websiteName.value}
                  label={'اختار موقع الشراء'}
                  onChange={(e) => setWebsiteName(websites.find(website => website.value === e.target.value))}
                >
                  {websites.map((website) => (
                    <MenuItem value={website.value}>
                      {website.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </div>

          {totalInvoice && totalInvoice > 0 &&
            <div className="my-5">
              <p className="my-2">قيمة الشراء: ${totalInvoice} </p>
              {websiteName.value === 'alibaba' && <p className="my-2">عمولة موقع علي بابا 3%: ${Math.ceil(Number(totalInvoice) * 0.03)} </p>}
              <p className="my-2">عمولة الشركة: ${invoiceCommission} </p>
              <p className="my-2">مجموع فاتورتك: ${Number(invoiceCommission) + Number(totalInvoice) + (websiteName.value === 'alibaba' ? Math.ceil(Number(totalInvoice) * 0.03) : 0)} </p>
              <p className="my-2"> ملاحظة: اجمالي الفاتورة قيمة تقريبيا من الممكن تواجد فرق شحن داخلي لذلك يرجى مراسلة مندوب الشركة للتفاصيل</p>

              <Link to={'/contact-us'} className="flex justify-end my-5">
                <button
                  type="submit"
                  className="group relative text-end flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <BiPhoneCall className="h-5 w-5 text-green-500 group-hover:text-green-400 mr-2" aria-hidden="true" />
                  اتصل بنا لبدا الاجراءات
                </button>
              </Link>
            </div>
          }
        </div>
      </Card>

      <Card className="mb-10">
        <div style={{ textAlign: 'end' }}>
          <h1 className="text-2xl mb-5 font-bold">اسعار الشحن</h1>
          <ShipmentPricesText />
        </div>
      </Card>
    </div>
  )
}

const calculatePercentage = (number: any, percentage: number) => {
  return Number(number) * (percentage / 100);
}

const calculateCommission = (totalInvoice: any) => {
  if (totalInvoice > 3000) {
    return calculatePercentage(totalInvoice, 3); // 3% commission 
  } else if (totalInvoice >= 501 && totalInvoice <= 3000) {
    return calculatePercentage(totalInvoice, 4); // 4% commission 
  } else if (totalInvoice >= 201 && totalInvoice <= 500) {
    return calculatePercentage(totalInvoice, 5); // 5% commission 
  } else {
    return 10; // min commission 10$
  }
}

export default PricesPage;
