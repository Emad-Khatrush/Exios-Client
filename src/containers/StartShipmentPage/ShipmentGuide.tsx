import QRCode from "qrcode.react"
import { useSelector } from "react-redux"
import { User } from "../../models"
import * as htmlToImage from 'html-to-image';
import { libyanCities } from "../../constants/info";
import { AiOutlineEye } from "react-icons/ai";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Snackbar } from "@mui/material";
import { useState } from "react";
import { Link } from "react-router-dom";
import { BiPhoneCall } from "react-icons/bi";
import ExiosLogo from '../../../public/images/exios-logo.png';

type Props = {
  data: {
    shipmentMethod: string
    shipmentFrom: string
    shipmentTo: string
  }
}

const ShipmentGuide = (props: Props) => {
  const { data } = props;

  const [showDialog, setShowDialog] = useState(false);
  const [dialogContent, setDialogContent] = useState(null);
  const [hasCopiedText, setHasCopiedText] = useState(false);

  const account: User = useSelector((state: any) => state.session.account);

  let content = fromChina(data, account, { showDialog, setShowDialog, hasCopiedText, setHasCopiedText, dialogContent, setDialogContent });
  if (data.shipmentFrom === 'uae' && data.shipmentMethod === 'air') {
    content = fromUAE(data, account, { showDialog, setShowDialog, hasCopiedText, setHasCopiedText });
  } else if (!['china', 'uae'].includes(data.shipmentFrom) || (data.shipmentFrom === 'uae' && data.shipmentMethod === 'sea')) {
    content = notAllowToShip();
  }  

  return (
    <div className="my-9 text-start" style={{ direction: 'rtl' }}>
      {content}

      <Snackbar 
          open={hasCopiedText} 
          autoHideDuration={1500}
          onClose={() => setHasCopiedText(false)}
        >
        <Alert 
          severity={'success'}
          onClose={() => setHasCopiedText(false)}
          style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          تم النسخ
        </Alert>
      </Snackbar>
    </div>
  )
}

const fromChina = (data: any, account: User, state: any) => {

  return (
    <div>
      <p className="text-xl font-bold">خطوات كيفية الشحن بشكل سليم:</p>
      <ol>
        <li className="text-lg my-2 mb-10">
          1- ارسل عنوان الشحن الى تاجر الصيني او المصنع
          <br />
          <button
            className="disabled:bg-slate-400 disabled:text-white-500 group my-1 relative py-2 px-4 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            onClick={() => {
              navigator.clipboard.writeText(`
                Shipment to China
                空运和海运仓库地址：广东省佛山市南海区里水镇旗峰大道2号全顺祥物流基地17仓—2 联系仓库：19128651680 陈小林 19128650950 马强 Exios39 - by ${data.shipmentMethod}(${account?.customerId}-${libyanCities.find(city => city.value === data.shipmentTo)?.code})
              `);
              state.setHasCopiedText(true);
            }}
          >
            انسخ العنوان
          </button>

          <p className="my-3 flex text-end">
            Shipment to China
            <br />
            空运和海运仓库地址：广东省佛山市南海区里水镇旗峰大道2号全顺祥物流基地17仓—2 联系仓库：19128651680 陈小林 19128650950 马强 Exios39 - by {data.shipmentMethod}({account?.customerId}-{libyanCities.find(city => city.value === data.shipmentTo)?.code})
          </p>
        </li>

        <li className="text-lg my-2">
          2- تواصل مع البائع الخاص بك واطلب منها طباعة هذه العلامة ووضعها على الصندوق
          <br />
          <button
            className="disabled:bg-slate-400 disabled:text-white-500 group my-5 relative py-2 px-4 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            onClick={() => {
              const node = document.getElementById('shippingMark');
              htmlToImage.toJpeg(node as any)
                .then(async function (dataUrl) {
                  await require("downloadjs")(dataUrl, 'shipping Label.jpeg');
                })
                .catch(function (error) {
                  console.error('oops, something went wrong!', error);
                });
            }}
          >
            اضغط لتحميل علامة الشحن
          </button>

          <div className="flex w-fit cursor-pointer text-blue-500 gap-2 items-center my-2">
            <AiOutlineEye />
            <p 
              className="text-lg"
              onClick={() => {
                state.setDialogContent(<img src="https://storage.googleapis.com/exios-bucket/code-example.jpg" />);
                state.setShowDialog(true);
              }} 
              >
                شاهد مثال على ذلك 
            </p>
          </div>
          
          <div className="mb-5" style={{ background: 'white', border: '2px solid black', width: '400px' }} id='shippingMark'>
            <div style={{ border: '2px solid black' }} className="p-6 flex justify-center">
              <img src={ExiosLogo} alt="Exios" width={160} height={90} />
            </div>
            <div style={{ border: '2px solid black' }} className="p-6 flex justify-center">
              <QRCode value={`http://exios-admin-frontend.web.app/shouldAllowToAccessApp?id=${account?.customerId}`} />
            </div>
            <div style={{ border: '2px solid black' }} className="p-6 text-center">
              <p className="my-2 text-xl"> <strong>Customer ID:</strong> {`${account?.customerId}-${libyanCities.find(city => city.value === data.shipmentTo)?.code}`} </p>
              <p className="my-2 text-xl"> <strong>Shipment Method:</strong> {data.shipmentMethod} </p>
            </div>
          </div>

          *في حالة عدم استطاعتك من تحميل العلامة ووضعها في صندوق، طلب منها كتابة هذه العبارة على الصندوق
          <br />
          Exios39 - by {data.shipmentMethod}({account?.customerId}-{libyanCities.find(city => city.value === data.shipmentTo)?.code})
          
          <div className="flex w-fit cursor-pointer text-blue-500 gap-2 items-center my-2">
            <AiOutlineEye />
            <p 
              className="text-lg"
              onClick={() => {
                state.setDialogContent(<img src={`https://storage.googleapis.com/exios-bucket/shipping-mark-${data.shipmentMethod}.jpg`} />);
                state.setShowDialog(true);
              }} 
              >
                شاهد مثال على ذلك 
            </p>
          </div>
        </li>

        <li className="text-lg my-10">
          3- عند تجهيز البضائع وارساله الى مخزننا تواصل مع بائع او ابحث في موقع الذي اشتريته منه بضائع لكي تتحصل على ارقام التتبع لشركة الشحن الداخلي وارسلها لنا لكي نتتبعها لك من <a href="/add-tracking-numbers" target="_blank" className="cursor-pointer text-blue-500">هنا</a>
        </li>

        <li className="text-lg my-10">
          4- عند وصول البضائع الى المخزننا في الصين، سيتم تحديث طلبيتك وادخالها في قسم <a href="/orders" target="_blank" className="cursor-pointer text-blue-500">طلبيات</a> الخاص بك
        </li>


        <Dialog
          open={state.showDialog}
          onClose={() => state.setShowDialog(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title" className='text-end'>
            مثال على وضع علامة الشحن على الصندوق
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description" className='text-end'>
              {state.dialogContent}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => state.setShowDialog(false)}>تراجع</Button>
          </DialogActions>
        </Dialog>
      </ol>
    </div>
  )
}

const fromUAE = (data: any, account: User, state: any) => {

  return (
    <div>
      <p className="text-xl font-bold">خطوات كيفية الشحن بشكل سليم:</p>
      
      <div className="text-lg my-2 mb-10">
        <p>1- ارسل عنوان الشحن الى تاجر الصيني او المصنع او اكتبه في خانة العنوان</p>
        <br />
        <button
          className="disabled:bg-slate-400 disabled:text-white-500 group my-1 relative py-2 px-4 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          onClick={() => {
            navigator.clipboard.writeText(`
            Name: Exios
            Last Name: Company
            phone: +971505967929
            Address: Al ghazal building Office room no : 301 (3rd floor) 
            Opposite Arabic chair Al buteen Deira,Dubai Sq336
            ${data.shipmentMethod}(${account?.customerId})-${libyanCities.find(city => city.value === data.shipmentTo)?.code}
            `);
            state.setHasCopiedText(true);
          }}
        >
          انسخ العنوان
        </button>

        <div className="flex w-fit cursor-pointer text-blue-500 gap-2 items-center my-2">
          <AiOutlineEye />
          <p 
            className="text-lg"
            onClick={() => {
              state.setShowDialog(true);
            }} 
            >
              شاهد مثال على ذلك 
          </p>
        </div>

        <p className="my-3 flex text-end">
          Name: Exios
          <br />
          Last Name: Company
          <br />
          phone: +971505967929
          <br />
          Address: Al ghazal building Office room no : 301 (3rd floor) 
          <br />
          Opposite Arabic chair Al buteen Deira,Dubai Sq336
          <br />
          {data.shipmentMethod}({account?.customerId})-{libyanCities.find(city => city.value === data.shipmentTo)?.code}
        </p>
      </div>

      <div className="text-lg my-10">
        2- عند تجهيز البضائع وارساله الى مخزننا تواصل مع بائع او ابحث في موقع الذي اشتريته منه بضائع لكي تتحصل على ارقام التتبع لشركة الشحن الداخلي وارسلها لنا لكي نتتبعها لك من <a href="/add-tracking-numbers" target="_blank" className="cursor-pointer text-blue-500">هنا</a>
      </div>

      <div className="text-lg my-2 mb-10">
        <p> 3- عند وصول البضائع الى المخزن الخارجي، سيتم تحديث طلبيتك وادخالها في قسم <a href="/orders" target="_blank" className="cursor-pointer text-blue-500">طلبيات</a> الخاص بك </p>
        <br />
      </div>

    <Dialog
        open={state.showDialog}
        onClose={() => state.setShowDialog(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title" className='text-end'>
          مثال كتابة العنوان في مواقع الشراء
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description" className='text-end'>
            <img src="https://storage.googleapis.com/exios-bucket/uae-address.png" alt="" />
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => state.setShowDialog(false)}>تراجع</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

const notAllowToShip = () => {
  return (
    <div>
      <p className="text-xl font-bold">
        لا يمكن الشحن فقط من هذه الدولة، يجب فقط الشراء والشحن في نفس الوقت
       </p>
       <p className="text-xl font-bold">
        يرجى التواصل مع مندوبين الشركة لبدأ لك الاجراءات
       </p>
       <Link to={'/contact-us'} className="flex my-5">
          <button
            type="submit"
            className="group relative text-end flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            اتصل بنا لبدا الاجراءات
            <BiPhoneCall className="h-5 w-5 text-green-500 group-hover:text-green-400 mr-2" aria-hidden="true" />
          </button>
       </Link>
    </div>
  )
}

export default ShipmentGuide;
