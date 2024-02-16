import { Box, CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';
import { AiOutlineSearch } from 'react-icons/ai';
import { Link } from 'react-router-dom';
import api from '../../api';
import Card from '../../components/Card/Card';
import OrderDetails from '../../components/OrderDetails/OrderDetails';
import Tabs from '../../components/Tabs/Tabs';
import TextInput from '../../components/TextInput/TextInput';
import { OrderStatusType, Package } from '../../models';

const ClientOrders = () => {
  const [activeTab, setActiveTab] = useState<OrderStatusType>('active');
  const [quickSearchDelayTimer, setQuickSearchDelayTimer] = useState();
  const [orders, setOrders] = useState<Package[]>([]);
  const [countList, setCountList] = useState({
    finishedOrders: 0,
    readyForReceivement: 0,
    warehouseArrived: 0,
    activeOrders: 0,
    unsureOrders: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const tabOnChange = async (tab: OrderStatusType) => {
    setIsLoading(true);
    setActiveTab(tab);
    try {
      const response = await api.getOrdersForUser(tab, {
        orderId: 1,
        createdAt: 1,
        orderStatus: 1,
        isPayment: 1,
        isShipment: 1,
        productName: 1,
        'shipment.method': 1,
        'shipment.fromWhere': 1,
        'shipment.toWhere': 1
      });
      const orders = response.data.results.orders;
      setOrders(orders);
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  }

  const getOrders = async () => {
    try {
      setIsLoading(true);
      const response = await api.getOrdersForUser('active', {
        orderId: 1,
        createdAt: 1,
        orderStatus: 1,
        isPayment: 1,
        isShipment: 1,
        productName: 1,
        'shipment.method': 1,
        'shipment.fromWhere': 1,
        'shipment.toWhere': 1
      });
      const orders = response.data.results.orders;
      const list = response.data.results.countList;
      setOrders(orders);
      setCountList(list || countList);
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  }

  const searchInputChange = (event: any) => {
    const value = event.target.value;
    try {
      let promise: Promise<any>;
      if (!value) {
        promise = api.getOrdersForUser(activeTab, {
          orderId: 1,
          createdAt: 1,
          orderStatus: 1,
          isPayment: 1,
          isShipment: 1,
          productName: 1,
          'shipment.method': 1,
          'shipment.fromWhere': 1,
          'shipment.toWhere': 1
        });
      } else {
        promise = api.getOrdersBySearch(value, {
          orderId: 1,
          createdAt: 1,
          orderStatus: 1,
          isPayment: 1,
          isShipment: 1,
          productName: 1,
          'shipment.method': 1,
          'shipment.fromWhere': 1,
          'shipment.toWhere': 1
        });
      }
      clearTimeout(quickSearchDelayTimer);
      setQuickSearchDelayTimer((): any => {
        setIsLoading(true);
        return setTimeout(async () => {
          const response = await promise;
          const orders = response.data.results.orders;      
          setOrders(orders);
          setIsLoading(false);
        }, 750)
      })
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    getOrders();
  }, [])

  const hasOrders = orders.length > 0;

  const data = [
    {
      label: 'طلبياتي',
      value: 'active',
      count: countList.activeOrders
    },
    {
      label: 'وصلت المخزن',
      value: 'arrivedWarehouse',
      count: countList.warehouseArrived
    },
    {
      label: 'جاهزه للتسليم',
      value: 'readyForPickup',
      count: countList.readyForReceivement
    },
    {
      label: 'تم التسليم',
      value: 'finished',
      count: countList.finishedOrders
    },
    {
      label: 'ارقام التتبع',
      value: 'unsure',
      count: countList.unsureOrders
    }
  ]

  return (
    <div className="container mx-auto py-10 h-64 px-3">
      <div className='text-end'>
        <Link to="/add-tracking-numbers">
          <button
            className="disabled:bg-slate-400 disabled:text-white-500 group my-1 relative py-2 px-4 border border-transparent w-52 md:w-fit text-xs md:text-sm font-bold rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            هل ارسلت بضائع الى مخزننا؟ ارسل ارقام التتبع للشركة
          </button>
        </Link>
      </div>
      <Card>
        <Tabs
          data={data as any}
          activeTab={activeTab}
          tabOnChange={tabOnChange}
        />

        <div className='flex justify-end'>
          <div className='grid w-full lg:w-1/3 my-5 mb-1'>
            <TextInput 
              type='search'
              buttonLabel={'ابحث'}
              placeholder="ابحث عن طلبيتك بواسطه رقم التتبع"
              icon={<AiOutlineSearch className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
              onChange={searchInputChange}
            />
          </div>
        </div>
        
        {activeTab === 'unsure' &&
          <div className='flex justify-end'>
            <div className='grid w-full my-5 mb-1 text-end'>
              <p> في هذا القسم تستطيع متابعة ارقام التتبع التي ارسلتها الى شركة لكي يتم متابعتها </p>
              <p> في حالة لديك شحنات قد ارسلتها الى عناوننا ارسل ارقام التتبع من <a className='text-blue-500' href="/add-tracking-numbers" target="_blank">هنا</a> </p>
              <p> في حالة قد تراجعت عن طلب متابعه طلبك او اخطأت في كتابة رقم التتبع، يرجى الدخول الى طلبية الخاصه به وحذفها </p>
            </div>
          </div>
        }

        {!isLoading ?
          <div className={`${hasOrders && 'grid grid-cols-1 2xl:grid-cols-3 xl:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 gap-5'}`}>
            {hasOrders ? orders.map((order: Package, i) => (
              <OrderDetails 
                key={order._id}
                order={order}
                index={i}
                activeTab={activeTab}
              />
              ))
              :
              <h3 className=' text-xl text-center my-10'> لا توجد اي طلبيات   </h3>
            }
          </div>
          :
          <Box className='h-full items-center justify-center' sx={{ display: 'flex' }}>
            <CircularProgress />
          </Box>
        }
      </Card>
    </div>
  )
}

export default ClientOrders;