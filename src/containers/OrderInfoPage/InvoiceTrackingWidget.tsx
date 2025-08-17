import React from 'react'
import { Package } from '../../models'
import CustomStepper from '../../components/CustomStepper/CustomStepper'
import { FaShippingFast, FaCheckCircle } from 'react-icons/fa'
import Card from '../../components/Card/Card'
import moment from 'moment-timezone'

type Props = {
  announcements: any[]
  order: Package
}

const InvoiceTrackingWidget: React.FC<Props> = ({ order }) => {
  const steps = generateSteps();
  const paymentDone = order?.orderStatus >= 1;

  return (
    <div className="mx-auto space-y-6">
      
      {/* Payment Status Note */}
      {paymentDone && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3 shadow-sm justify-end text-right">
          <p className="text-green-800 font-medium">
            تم الدفع بنجاح. تم تحويل المبلغ إلى البائع / الموقع. يُرجى التواصل معهم للتأكد من تسليم البضاعة في الوقت المحدد.
            عند وصول شحنات الخاصه بكم في مخزننا الخارجي سيتم ادراج طلبية جديده لكل شحنه تدخل
          </p>
          <FaCheckCircle className="text-green-500 text-2xl" />
        </div>
      )}

      {/* Stepper Card */}
      <Card className="rounded-2xl shadow-lg bg-white p-6">
        <CustomStepper 
          acriveStep={order.orderStatus}
          steps={steps}
        />
      </Card>

      {/* Order Summary */}
      <Card className="rounded-2xl shadow-md bg-white p-6 text-right">
        <h2 className="text-xl font-bold mb-6 border-b pb-2 flex justify-between items-center">
          <span className="text-sm text-gray-500">رقم الطلب: {order?.orderId}</span>
          <span>ملخص الطلب</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* الإجمالي */}
          <div className="flex items-center justify-between space-x-3 space-x-reverse bg-gray-50 p-4 rounded-xl hover:shadow transition">
            <div className="bg-green-100 text-green-600 p-3 rounded-full">💰</div>
            <div>
              <p className="text-sm text-gray-500">قيمة الفاتورة</p>
              <p className="text-lg font-semibold">{order?.totalInvoice} دولار</p>
            </div>
          </div>

          {/* حالة الطلب */}
          <div className="flex items-center justify-between space-x-3 space-x-reverse bg-gray-50 p-4 rounded-xl hover:shadow transition">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-full">📦</div>
            <div>
              <p className="text-sm text-gray-500">حالة الطلب</p>
              <p className="text-lg font-semibold">
                {order?.orderStatus >= 1 ? 'مدفوع' : 'قيد التجهيز'}
              </p>
            </div>
          </div>

          {/* تاريخ الإنشاء */}
          <div className="flex items-center justify-between space-x-3 space-x-reverse bg-gray-50 p-4 rounded-xl hover:shadow transition">
            <div className="bg-yellow-100 text-yellow-600 p-3 rounded-full">📅</div>
            <div>
              <p className="text-sm text-gray-500">تاريخ الإنشاء</p>
              <p className="text-lg font-semibold">
                {order?.createdAt ? moment(order.createdAt).format('DD/MM/YYYY') : ''}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Activity Timeline */}
      {order?.activity?.length > 0 && (
        <Card className="rounded-2xl shadow-md bg-white p-6 text-right">
          <h2 className="text-xl font-bold mb-6 border-b pb-2">سجل النشاطات</h2>

          <div className="relative border-r-2 border-gray-200 pr-6 space-y-6">
            {order.activity
              .slice() // copy array
              .reverse() // show latest first
              .map((item, index) => (
              <div key={index} className="relative flex items-start">
                {/* Circle marker */}
                <div className="absolute -right-3 top-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs shadow">
                  {index + 1}
                </div>

                <div className="flex-1 pr-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">{item.country}</span> - {item.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {moment(item.createdAt).format('DD/MM/YYYY HH:mm')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

const generateSteps = () => {
  const steps = [
    {
      label: 'تجهيز الطلبية',
      stepIcon: FaShippingFast
    },
    {
      label: 'تم الدفع',
      stepIcon: FaCheckCircle
    },
  ]
  return steps;
}

export default InvoiceTrackingWidget
