import { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { FaShippingFast, FaWarehouse } from "react-icons/fa";
import { GrStakeholder } from "react-icons/gr";
import { MdExpandMore } from "react-icons/md";
import Card from "../../components/Card/Card";
import CustomStepper from "../../components/CustomStepper/CustomStepper";
import ImageViewer from "../../components/ImageViewer/ImageViewer";
import InfoDetailsCard from "../../components/InfoDetailsCard/InfoDetailsCard";
import { defaultColumns, generateDataToListType } from "./generateData";
import { Accordion, AccordionDetails, AccordionSummary, Alert, AlertColor, Avatar, AvatarGroup, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Snackbar, Typography } from "@mui/material";
import Badge from "../../components/Badge/Badge";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";
import { Package, PackageDetails } from "../../models";
import moment from "moment-timezone";
import { getStatusOfPackage } from "../../utils/methods";
import AlertInfo from "../../components/AlertInfo/AlertInfo";
import SwipeableTextMobileStepper from "../../components/SwipeableTextMobileStepper/SwipeableTextMobileStepper";
import OrderRatingWidget from "../../components/OrderRatingWidget/OrderRatingWidget";

const currencyLabels: any = {
  USD: '$',
  LYD: 'دينار'
}

const shipmentMethodsLabels = {
  air: 'جوي',
  sea: 'بحري'
}

const OrderInfoPage = () => {
  const [ activeStep, setActiveStep ] = useState(0);
  const [order, setOrder] = useState<Package>();
  const [orderRating, setOrderRating] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [showImages, setShowImages] = useState<any>(undefined);
  const [alert, setAlert] = useState({
    tint: 'success',
    message: ''
  });
  
  let { id: orderId } = useParams();
  const history = useNavigate();

  const fetchOrder = async () => {
    setIsLoading(true);

    const orderRate = await api.getOrderRating(orderId);    
    setOrderRating(orderRate.data);

    const order = await api.getSingleOrder(orderId || '', {
      orderId: 1,
      createdAt: 1,
      orderStatus: 1,
      isPayment: 1,
      isShipment: 1,
      productName: 1,
      customerInfo: 1,
      totalInvoice: 1,
      debt: 1,
      images: 1,
      activity: 1,
      unsureOrder: 1,
      'shipment.method': 1,
      'shipment.fromWhere': 1,
      'shipment.toWhere': 1,
      'paymentList.status': 1,
      'paymentList.images': 1,
      'paymentList.settings': 1,
      'paymentList.deliveredPackages.arrivedAt': 1,
      'paymentList.deliveredPackages.trackingNumber': 1,
      'paymentList.deliveredPackages.shipmentMethod': 1,
    });
    setOrder(order.data);

    const orderStatus = order.data.orderStatus;
    if ((order.data.isPayment && order.data.isShipment) || (order.data.isPayment && !order.data.isShipment)) {
      if (orderStatus === 2 || orderStatus === 3) {
        setActiveStep(2);
      } else if (orderStatus > 3) {
        setActiveStep(orderStatus - 1);
      } else {
        setActiveStep(orderStatus);
      }
    } else if (!order.data.isPayment && order.data.isShipment) {
      if (orderStatus === 1 || orderStatus === 2) {
        setActiveStep(1);
      } else if (orderStatus > 2) {
        setActiveStep(orderStatus - 1);
      } else {
        setActiveStep(orderStatus);
      }
    }
    setIsLoading(false);
  }

  useEffect(() => {
    fetchOrder();
  }, [])

  const deleteUnsureOrder = async () => {
    try {
      setIsLoading(true);
      await api.deleteUnsureOrder(orderId as string);
      setAlert({
        message: 'تم حذف الطلب بنجاح',
        tint: 'success'
      });
      history('/orders');
    } catch (error) {
      console.log(error);
      setAlert({
        message: 'حدث خطا اثناء انشاء العملية',
        tint: 'error'
      });
    }
    setIsLoading(false);
  }

  
  if (isLoading || !order) {
    return (
      <Box className='h-full items-center justify-center' sx={{ display: 'flex' }}>
        <CircularProgress />
      </Box>
    )
  }
  
  const steps = generateSteps(order);
  const columns = [...defaultColumns()];
  const list = generateDataToListType(order.activity).reverse();

  const customerInfo = [
    {
      label: 'رقم الكود',
      value: order.orderId
    },
    {
      label: 'اسم الزبون',
      value: order.customerInfo.fullName
    },
    {
      label: 'رقم الهاتف',
      value: order.customerInfo.phone
    },
    {
      label: 'بريد الاكتروني',
      value: order.customerInfo.email || '-'
    },
  ]

  const packageInfo = [
    {
      label: 'نوع البضائع',
      value: order.productName
    },
    {
      label: 'الشحنه من',
      value: order.shipment.fromWhere
    },
    {
      label: 'عنوان الاستلام',
      value: order.shipment.toWhere
    },
    {
      label: 'نوع الشحن',
      value: shipmentMethodsLabels[order.shipment.method]
    }
  ]

  const otherInfo = [
    {
      label: 'تاريخ انشاء الفاتورة',
      value: moment(order.createdAt).format('DD/MM/YYYY')
    },
    {
      label: 'حجم/وزن',
      value: '-'
    },
    {
      label: 'قيمة الفاتورة',
      value: `${order?.totalInvoice} $`
    },
    {
      label: 'الدين المتبقي',
      value: order?.debt?.total > 0 ? `${order?.debt?.total} ${currencyLabels[order?.debt?.currency]}` : 'لا يوجد',
      tint: 'danger'
    }
  ]

  const relatedImages: any = []; 
  order.images.forEach(img => {
    relatedImages.push(img.path);
  })

  const packages = order.paymentList;
  
  const showRatingWidget = ((order.orderStatus === 4 || order.orderStatus === 5) || !!(packages.find((packageDetail: PackageDetails) => packageDetail.status.received))) && !orderRating;

  return (
    <div className="container mx-auto py-10 h-64 w-11/12 px-6">
      {order.isCanceled &&
        <div className="mb-4">
          <AlertInfo
            tint="danger"
            description={'هذه طلبية قد تم الغاءها من قبل ادارة الشركة، اذا تظن ان حدث خطا يرجى تواصل مع اقرب مندوب للشركة'}
          />
        </div>
      }

      {order.unsureOrder &&
        <Card
          className="rounded-2xl mb-5 text-end"
        >
          <p>
            بعد ادخالك ارقام التتبع تقوم الشركة بالتتبع هذه ارقام وعندى وصوله الى مخزننا سيتم تحديث الطلبية الى الحالة النشطه
          </p>
          <p>
            اذا لم ترسل بضائع الى مخزننا، او انشأت طلب تتبع الطلبية بالخطأ، يمكنك حذف الطلب عبر زر الحذف ادناه 
          </p>
          <button
            className="disabled:bg-slate-400 disabled:text-white-500 group my-1 relative py-2 px-4 mt-2 border border-transparent w-52 md:w-fit text-xs md:text-sm font-bold rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            onClick={deleteUnsureOrder}
            disabled={isLoading}
          >
            حذف هذه الطلبية
          </button>
        </Card>
      }

      {showRatingWidget &&
        <OrderRatingWidget />
      }

      <Card
        className="rounded-2xl mb-5"
      >
        <CustomStepper 
          acriveStep={activeStep}
          steps={steps}
        />
      </Card>

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-3 md:grid-cols-2 mb-5">
        <InfoDetailsCard 
          title="تفاصيل العميل"
          data={customerInfo as any}
        />

        <InfoDetailsCard 
          title="تفاصيل الشحنه"
          data={packageInfo as any}
        />

        <InfoDetailsCard 
          title="تفاصيل اخرى"
          data={otherInfo as any}
        />

        <div>
          <Card
            className="rounded-2xl mb-5"
          >
            <h2 className='text-right text-2xl font-medium mb-7 mt-2'>صور متعلقة بالطلبية</h2>
            <ImageViewer
              images={relatedImages}
            />
          </Card>
        </div>

        <div className="col-span-1 xl:col-span-2 md:col-span-2">
          <Card
            className="rounded-2xl mb-5"
          >
            <h2 className='text-right text-2xl font-medium mb-7 mt-2'>الانشطة العامة</h2>
            <div style={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={list}
                columns={columns}
                pageSize={6}
                rowsPerPageOptions={[5]}
                // checkboxSelection
                disableSelectionOnClick
              />
            </div>
          </Card>
        </div>

        {packages.length > 0 &&
          <div className="col-span-1 xl:col-span-3 md:col-span-2">
            <h3 className="text-lg font-bold text-end mb-1">متابعة طرودي في الطلبية</h3>
            <p className="text-slate-800 text-end mb-5"> لديك {packages.length} طرود يمكن متابعته، يمكن تتبع طرودك اين وصلت ادناه </p>
            {packages.map((packageDetails: PackageDetails, i: number) => {
              const { statusIndex, lastActivity } = getStatusOfPackage(packageDetails);
              const step = linkSteps[statusIndex];
              const trackingNumber = packageDetails.deliveredPackages.trackingNumber;
              return (
                <Card
                  leaned
                  className="mb-5"
                >
                  <Accordion defaultExpanded={statusIndex !== 3}>
                    <AccordionSummary
                      expandIcon={<MdExpandMore />}
                      aria-controls="panel1bh-content"
                      id="panel1bh-header"
                    >
                      <Typography sx={{ width: '30%', flexShrink: 0, fontSize: '16px', fontWeight: 'bold' }}>
                        Package { trackingNumber ? trackingNumber : i + 1}
                      </Typography>
                      <Badge class=" text-sm md:text-base" text={step.label} color={statusIndex === 3 ? 'success' : 'primary'} />
                    </AccordionSummary>
                    <AccordionDetails>
                      <div className="flex items-center justify-end mb-8">
                        <p>{lastActivity}</p>
                        <h3 className=" font-bold ml-5">:اخر نشاط</h3>
                      </div>

                      <div className="flex items-center justify-end mb-8">
                        <p>{trackingNumber || 'لا يوجد'}</p>
                        <h3 className=" font-bold ml-5">:{trackingNumber.length === 4 ? 'اخر 4 ارقام من رقم التتبع' : 'رقم التتبع'}</h3>
                      </div>

                      {packageDetails.status.arrived &&
                        <div className="flex items-center justify-end mb-8">
                          <p>{moment(packageDetails.deliveredPackages.arrivedAt).format('DD/MM/YYYY')}</p>
                          <h3 className=" font-bold ml-5">:تاريخ وصولها في مخازن الخارجية</h3>
                        </div>
                      }

                      {packageDetails.deliveredPackages.shipmentMethod &&
                        <div className="flex items-center justify-end mb-8">
                          <p>{shipmentMethodsLabels[packageDetails.deliveredPackages.shipmentMethod]}</p>
                          <h3 className=" font-bold ml-5">:طريقة الشحن</h3>
                        </div>
                      }

                      {packageDetails.images.length > 0 &&
                        <div className="flex items-center justify-end mb-8">
                          <AvatarGroup sx={{ cursor: 'pointer' }} onClick={() => setShowImages(packageDetails.images)} max={4}>
                            {(packageDetails.images || []).map(image => (
                              <Avatar alt={image.filename} src={image.path} />
                            ))}
                          </AvatarGroup>
                          <h3 className=" font-bold ml-5">:صور البضائع</h3>
                        </div>
                      }
                      
                      <CustomStepper 
                        acriveStep={statusIndex}
                        steps={linkSteps}
                      />
                    </AccordionDetails>
                  </Accordion>
                </Card>
              )
            })}
          </div>
        }
      </div>
      <br />
      <br />
      <br />
      <Snackbar 
        open={!!alert.message} 
        autoHideDuration={1500}
        onClose={() => setAlert({ tint: 'success', message: ''})}
      >
        <Alert 
          severity={alert.tint as AlertColor}
          onClose={() => setAlert({ tint: 'success', message: ''})}
          style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={!!showImages}
        onClose={() => setShowImages(undefined)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title" className='text-end'>
          صور البضائع
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description" className='text-end'>
            <SwipeableTextMobileStepper data={showImages} />
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button>تراجع</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

const generateSteps = (order: Package) => {
  const steps = [
    {
      label: 'تجهيز الطلبية',
      stepIcon: FaShippingFast
    },
    {
      label: 'وصلت الى المخزن',
      stepIcon: FaWarehouse
    },
    {
      label: 'وصلت الى ليبيا',
      stepIcon: FaWarehouse
    },
    {
      label: 'تم التسليم',
      stepIcon: GrStakeholder
    }
  ]

  if (order.isPayment) {
    steps.splice(1, 0, {
      label: 'اتمام الشراء',
      stepIcon: FaWarehouse
    })
  }

  return steps;
}

const linkSteps = [
  {
    label: 'تجهيز الطلبية',
    stepIcon: FaShippingFast
  },
  {
    label: 'وصلت الى المخزن',
    stepIcon: FaWarehouse
  },
  {
    label: 'وصلت الى ليبيا',
    stepIcon: FaWarehouse
  },
  {
    label: 'تم التسليم',
    stepIcon: GrStakeholder
  }
]

export default OrderInfoPage;
