import Card from "../Card/Card";
import { ImLocation2 } from 'react-icons/im';
import { FaFlag } from "react-icons/fa";
import { AiFillEye } from "react-icons/ai";
import { Link } from "react-router-dom";
import { OrderStatusType, Package } from "../../models";
import moment from "moment-timezone";
import Badge from "../Badge/Badge";
import { getOrderStatusLabels } from "../../utils/methods";
import AlertInfo from "../AlertInfo/AlertInfo";

const shipmentMethodsLabels = {
  air: 'جوي',
  sea: 'بحري',
  unknown: 'غير معروف'
}

type Props = {
  order: Package
  index: number
  activeTab: OrderStatusType
}

const airShipmentImage = 'https://st2.depositphotos.com/1154952/9707/i/600/depositphotos_97075074-stock-photo-ship-loading-container-in-import.jpg';
const seaShipmentImage = 'https://storage.googleapis.com/exios-bucket/sea-shipping.jpg';
const unkwownShipmentImage = 'https://storage.googleapis.com/exios-bucket/OdBHRDGTyA5978100.png';
const invoiceImage = 'https://storage.googleapis.com/exios-bucket/JtZ36d8gdpimages.png';

const OrderDetails = (props: Props) => {
  const { order, index } = props;

  const statusLabel = getOrderStatusLabels(order);
  const invoiceOrder = order.isPayment && !order.isShipment;

  let shippingMethodImage = unkwownShipmentImage;
  if (invoiceOrder) {
    shippingMethodImage = invoiceImage;
  } else if (order.shipment.method === 'air') {
    shippingMethodImage = airShipmentImage;
  } else if (order.shipment.method === 'sea') {
    shippingMethodImage = seaShipmentImage;
  }
  const hasTrackingNumber = order.paymentList.find((pkg) => !!pkg.deliveredPackages.trackingNumber)

  return (
    <div className="mt-8">
      <Card leaned className="shadow-xl rounded-2xl p-0">
        {order.shipment.method === 'unknown' &&
          <AlertInfo 
            tint="warning"
            description={`طريقة الشحن غير معروفة، يرجى التواصل مع خدمة العملاء واعلامهم بطريقة الشحن جوي ام بحري.`}
          />
        }

        <div className="flex p-4">
          <div className="w-20 h-20">
            <img className=" w-20 h-20 rounded-xl" src={shippingMethodImage} alt="" />
            <p className="text-center text-gray-500 mt-1">#{index + 1}</p>
          </div>
          <div className="w-full ml-3 text-sm md:text-base">
            <div className="flex justify-between mb-2">
              <p className=" text-gray-400">{order.orderId}</p>
              <h5 className=" font-bold text-zinc-800">:رقم الطلبية</h5>
            </div>
            {invoiceOrder ? 
                <div className="flex justify-between mb-2">
                  <p className=" text-gray-400">{order.totalInvoice} $</p>
                  <h5 className=" font-bold text-zinc-800">:اجمالي الفاتورة</h5>
                </div>
              :
                <>
                  <div className="flex justify-between mb-2">
                    <p className=" text-gray-400">{order.productName}</p>
                    <h5 className=" font-bold text-zinc-800">:نوع البضائع</h5>
                  </div>
                  <div className="flex justify-between mb-2">
                    <p className=" text-gray-400">{shipmentMethodsLabels[order.shipment.method]}</p>
                    <h5 className=" font-bold text-zinc-800">:طريقة الشحن</h5>
                  </div>
                </>
            }
            <div className="flex justify-between mb-2">
              <p className=" text-gray-400">{moment(new Date(order.createdAt)).format('DD/MM/YYYY')}</p>
              <h5 className=" font-bold text-zinc-800">:تاريخ الانشاء</h5>
            </div>
            <div className="flex justify-between mb-2">
              <p className=" text-gray-400"> <Badge color="success" text={statusLabel} /> </p>
              <h5 className=" font-bold text-zinc-800">:الحالة</h5>
            </div>

            {hasTrackingNumber &&
              <div className="mb-2">
                <h5 className="font-bold text-zinc-800 mb-2 text-end">:ارقام التتبعات</h5>
                <div className="flex flex-wrap gap-2">
                  {order.paymentList.map((pkg, index) => (
                    <p key={index} className="text-gray-400">
                      <Badge color="warning" text={pkg.deliveredPackages.trackingNumber} />
                    </p>
                  ))}
                </div>
              </div>
            }
          </div>
        </div>

        <div className="bg-gray-200 rounded-b-xl p-4">
          <div className="flex justify-between">
            <div className="flex items-center text-xs md:text-base">
              <div className="flex">
                <ImLocation2 className=" text-blue-500" />
                <p className=" text-sm ml-1 text-gray-600 font-bold">{order.shipment.fromWhere}</p>  
              </div>
              <div className="mx-2">
                <p className=" text-gray-600">----</p>
              </div>
              <div className="flex">
                <FaFlag className=" text-blue-500" />
                <p className=" text-sm ml-2 text-gray-600 font-bold">{order.shipment.toWhere}</p>  
              </div>
            </div>

            <div className="w-16 md:w-1/4 text-sm">
              <Link
                to={`/order/${order._id}`}
              >
                <button
                  type="submit"
                  className="group relative w-full flex justify-center items-center py-1 border border-transparent text-md font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <AiFillEye className="h-5 w-5 mr-2 text-green-500 group-hover:text-green-400" aria-hidden="true" />
                  عرض
                </button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default OrderDetails;
