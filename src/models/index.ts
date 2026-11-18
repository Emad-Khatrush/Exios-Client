export type User = {
  username: string
  customerId: string
  firstName: string
  lastName: string
  password: string
  imgUrl: string
  isCanceled: string
  city: string
  phone: number
  isAgreeToTermsOfCompany: boolean
  passportVerification?: PassportVerification
  // Set when staff switched this customer's loyalty points off: the app hides the points
  loyaltyOff?: { at: string }
  roles: {
    isAdmin: boolean
    isEmployee: boolean
    isClient: boolean
  }
}

export type PassportVerification = {
  status: 'pending' | 'verified' | 'rejected'
  imageUrl?: string
  rejectionReason?: string
  wasRejected?: boolean
  submittedAt?: string
  reviewedAt?: string
}

export type OrderActivity = {
  createdAt?: Date,
  country?: string,
  description?: string
}

export type Package = {
  user: User,
  _id: string,
  madeBy: User,
  orderId: string,
  activity: OrderActivity[],
  customerInfo: {
    fullName: string,
    phone: string,
    email: string
  },
  placedAt: string,
  totalInvoice: number,
  receivedUSD: number,
  receivedLYD: number,
  receivedShipmentLYD: number,
  receivedShipmentUSD: number,
  shipment: {
    fromWhere: string,
    toWhere: string,
    method: 'air' | 'sea' | 'unknown',
    estimatedDelivery: Date,
    exiosShipmentPrice: number,
    originShipmentPrice: number,
    weight: number,
    packageCount: number,
    note: string,
  },
  productName: string,
  quantity: string,
  isShipment: boolean,
  isPayment: boolean,
  unsureOrder: boolean,
  orderStatus: number,
  isFinished: boolean,
  netIncome: {
    nameOfIncome: string,
    total: number,
  }[],
  orderNote: string,
  customization?: {
    note?: string,
    theme?: string,
  },
  isCanceled: boolean,
  // Stopped by the office (e.g. prohibited goods), with the reason they wrote for the customer
  shippingBlocked?: boolean,
  shippingBlockReason?: string,
  shippingBlockedAt?: string,
  images: {
    filename: string,
    path: string,
    category: 'invoice' | 'receipts'
  }[],
  debt: {
    currency: string,
    total: number,
  },
  paymentList: PackageDetails[],
  createdAt: Date,
  updatedAt: Date
}

export type PackageDetails = {
  _id?: string
  images: {
    fileType: string
    filename: string
    path: string
    _id: string
  }[]
  settings: {
    visableForClient: boolean
  }
  deliveredPackages: {
    arrivedAt: Date
    exiosPrice: number
    originPrice: number
    receivedShipmentLYD: number
    receivedShipmentUSD: number
    trackingNumber: string
    boxesCount?: string
    deliveredInfo?: {
      deliveredDate?: Date
    }
    weight: {
      total: number, 
      measureUnit: string
    }
    shipmentMethod: 'air' | 'sea' | 'unknown'
  }
  link: string
  note: string
  // The trip (رحلة) the package is loaded on; only present when it is linked to one
  trip?: {
    voyage: string
    arrivalDate?: string // the day the trip reached (or is due to reach) Libya, when the office set it
  }
  status: {
    arrived: boolean
    arrivedLibya: boolean
    paid: boolean
    received: boolean
  }
}

export type Announcement = {
  description: string
  forwardLink: string,
  visibleToAll: boolean
  createdAt: string
  updatedAt: string
  _id: string
}

export type PopupAd = {
  _id: string
  description: string
  imageUrl?: string | null
  icon?: string
  startDate: string
  endDate: string
}

export type ShippingPrice = {
  shippingType: ShippingMethods
  sellingPrice: number
  country: 'china' | 'uae' | 'turkey' | 'usa' | 'uk'
  currency: 'USD'
  priceDescription: string
  createdAt: string
  updatedAt: string
  _id: string
}

export type ExchangeRate = {
  fromCurrency: 'usd' | 'lyd'
  toCurrency: 'usd' | 'lyd'
  rate: number
  createdAt: string
  _id: string
}

export type ShippingMethods = 'air' | 'sea';

export type OrderStatusType = 'all' | 'active' | 'arrivedWarehouse' | 'readyForPickup' | 'finished' | 'blocked' | 'invoiceOrders' | 'shipment' | 'arriving' | 'unpaid' | 'unsure' | 'canceled'
