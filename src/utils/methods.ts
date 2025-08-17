import { Package, PackageDetails } from "../models";

export const getOrderStatusLabels = (order: Package) => {
  const orderStatusIndex = order.orderStatus;
  let orderStatusText = 'تحت التجهيز';
  if (order.isPayment && !order.isShipment && orderStatusIndex >= 1) {
    return 'تم شراء بنجاح';
  }
  switch (orderStatusIndex) {
    case 1:
      if (order.isPayment) {
        return orderStatusText = 'في طريقها الى مخزن';
      } else {
        return orderStatusText = 'وصلت الى مخزن';
      }
    case 2:
      if (order.isPayment) {
        return orderStatusText = 'وصلت الى مخزن';
      } else {
        return orderStatusText = 'شحنت الى ليبيا';
      }
    case 3:
      if (order.isPayment) {
        return orderStatusText = 'شحنت الى ليبيا';
      } else {
        return orderStatusText = 'جاهزه للاستلام';
      }
    case 3:
      if (order.isPayment) {
        return orderStatusText = 'جاهزه للاستلام';
      } else {
        return orderStatusText = 'تم التسليم';
      }
    case 4:
      if (order.isPayment) {
        return orderStatusText = 'جاهزه للاستلام';
      } else {
        return orderStatusText = 'تم التسليم';
      }

    case 5:
      return orderStatusText = 'تم التسليم';

    default:
     return orderStatusText;
  }
}

export const getStatusOfPackage = (packageDetails: PackageDetails) => {
  const status = packageDetails.status;
  if (status.received) {
    return {
      statusIndex: 3,
      lastActivity: 'تم تسليم الطرد الى العميل، شكرا لكم'
    }
  }
  if (status.arrivedLibya) {
    return {
      statusIndex: 2,
      lastActivity: 'وصلت البضائع الى مخزننا في ليبيا، يرجى زيارة الشركة للاستلام'
    }
  }
  if (status.arrived) {
    return {
      statusIndex: 1,
      // lastActivity: generateMessageOfDeliveredPackage(packageDetails)
      lastActivity: 'وصلت البضائع الى مخزننا الخارجية، والان في طريقها الى ليبيا'
    }
  }
  return {
    statusIndex: 0,
    lastActivity: 'في مرحلة انتظار البضائع لارساله الى مخزننا الخارجية'
  }
}

// const generateMessageOfDeliveredPackage = (packageDetails: PackageDetails) => {
//   const { deliveredPackages } = packageDetails;
//   const shippingMethod = deliveredPackages.shipmentMethod;
//   if (shippingMethod) {
//     const arrivedDate = new Date(deliveredPackages.arrivedAt);
//     const todayDate = new Date();
//     // Calculate the time difference in milliseconds
//     const timeDifference = todayDate.getTime() - arrivedDate.getTime();
//     // Convert the time difference to days
//     const passedDays = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

//     if (shippingMethod === 'air') {
//       return generateMessageForAirShipping(passedDays);
//     } else if (shippingMethod === 'sea') {
//       return generateMessageForSeaShipping(passedDays);
//     }
//   }
//   return 'وصلت البضائع الى مخزننا الخارجية، والان في طريقها الى ليبيا';
// }
