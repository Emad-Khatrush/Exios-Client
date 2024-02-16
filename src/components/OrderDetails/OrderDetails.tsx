import Card from "../Card/Card";
import { ImLocation2 } from 'react-icons/im';
import { FaFlag } from "react-icons/fa";
import { AiFillEye } from "react-icons/ai";
import { Link } from "react-router-dom";
import { OrderStatusType, Package, PackageDetails } from "../../models";
import moment from "moment-timezone";
import Badge from "../Badge/Badge";
import { getOrderStatusLabels } from "../../utils/methods";

const shipmentMethodsLabels = {
  air: 'جوي',
  sea: 'بحري'
}

type Props = {
  order: Package
  index: number
  activeTab: OrderStatusType
}

const airShipmentImage = 'https://st2.depositphotos.com/1154952/9707/i/600/depositphotos_97075074-stock-photo-ship-loading-container-in-import.jpg';
const seaShipmentImage = 'https://globitexworld.com/wp-content/uploads/2020/08/ocean_freight_feat.jpg';


const OrderDetails = (props: Props) => {
  const { order, index } = props;

  const statusLabel = getOrderStatusLabels(order);

  return (
    <div className="mt-8">
      <Card leaned className="shadow-xl rounded-2xl p-0">
        <div className="flex p-4">
          <div className="w-20 h-20">
            <img className=" w-20 h-20 rounded-xl" src={order.shipment.method === 'air' ? airShipmentImage : seaShipmentImage} alt="" />
            <p className="text-center text-gray-500 mt-1">#{index + 1}</p>
          </div>
          <div className="w-full ml-3 text-sm md:text-base">
            <div className="flex justify-between mb-2">
              <p className=" text-gray-400">{order.orderId}</p>
              <h5 className=" font-bold text-zinc-800">:رقم الطلبية</h5>
            </div>
            <div className="flex justify-between mb-2">
              <p className=" text-gray-400">{order.productName}</p>
              <h5 className=" font-bold text-zinc-800">:نوع البضائع</h5>
            </div>
            <div className="flex justify-between mb-2">
              <p className=" text-gray-400">{shipmentMethodsLabels[order.shipment.method]}</p>
              <h5 className=" font-bold text-zinc-800">:طريقة الشحن</h5>
            </div>
            <div className="flex justify-between mb-2">
              <p className=" text-gray-400">{moment(new Date(order.createdAt)).format('DD/MM/YYYY')}</p>
              <h5 className=" font-bold text-zinc-800">:تاريخ الانشاء</h5>
            </div>
            <div className="flex justify-between mb-2">
              <p className=" text-gray-400"> <Badge color="success" text={statusLabel} /> </p>
              <h5 className=" font-bold text-zinc-800">:الحالة</h5>
            </div>
            {props.activeTab === 'unsure' &&
              <div className="flex justify-between mb-2">
                <div>
                  {order.paymentList?.length > 0 && order.paymentList.map((packageDetails: PackageDetails) => (
                    <>
                      {packageDetails.deliveredPackages.trackingNumber && <p className=" text-gray-400 my-2"> <Badge color="warning" text={packageDetails.deliveredPackages.trackingNumber} /> </p>}
                    </>
                  ))}
                </div>
                <h5 className=" font-bold text-zinc-800">:ارقام التتبع</h5>
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
