import axios, { AxiosInstance } from 'axios';
import { User } from '../models';
import { OrderStatusType } from '../models';

const endpoint = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/';

const defaultHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

class APIBase {
  
  public axios: AxiosInstance;
  private filesEndpoint: string;
  private headers: any = {};
  
  constructor(endpoint: string, headers: any = {}) {
    this.filesEndpoint = `${endpoint}/files`;
    this.axios = axios.create({
      baseURL: endpoint,
      headers: { ...defaultHeaders, ...headers },
      // timeout: 10000,
    });
  }
  
  public getFileAckEndpoint(): string {
    return this.filesEndpoint + '/xlsx';
  }
  
  public getFilesEndpoint(): string {
    return this.filesEndpoint;
  }
  
  public post(url: string, body: object): Promise<any> {
    return this.send('post', `${url}`, body);
  }
  
  public put(url: string, body: object): Promise<any> {
    return this.send('put', `${url}`, body);
  }
  
  public delete(url: string, body: object): Promise<any> {
    return this.send('delete', `${url}`, body);
  }
  
  public get(url: string, params?: any): Promise<any> {
    return this.send('get', `${url}`, params);
  }
  
  public send(method: string, url: string, data?: any): Promise<any> {
    
    // join array fields with ',' in query
    const param = method === 'get' ? data : null;
    if (param) {
      Object.keys(param).forEach(key => {
        if (param[key] instanceof Array) {
          param[key] = param[key].join(',');
        }
      });
    }
    
    return this.axios.request({
      data: method !== 'get' ? data : null,
      headers: this.headers,
      method,
      params: method === 'get' ? data : null,
      url: endpoint + url,
    }).catch((error) => {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response);
        
        throw ApiError.decode(error.response);
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
      } else {
        // Something happened in setting up the request that triggered an Error
      }
    });
  }
  
  public async fetchFormData(url: string, method: string, body: any) {        
    const response = await fetch(endpoint + url, {
      method,
      body,
      headers: {
        ...this.headers,
        authorization: "Bearer " + localStorage.getItem('authToken')
      },
    });
    return response;
  }
}

export class ApiError {

  public static decode(json: any): ApiError {
    return Object.assign(Object.create(ApiError.prototype), json);
  }

  public data: any;
  public headers: any;
  public isNetworkError: boolean;

  constructor(isNetworkError: boolean) {
    this.isNetworkError = isNetworkError;
  }

}

export const base = new APIBase(endpoint);

// fetchFormData returns the raw Response (unlike the axios-based `send`), so multipart
// callers parse the body themselves and normalize errors into the shape `error.data.message`
// that the rest of the app already reads (see ApiError / apiErrorsTypes usage).
const sendMultipart = async (url: string, method: string, body: FormData): Promise<{ data: any }> => {
  const response = await base.fetchFormData(url, method, body);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error: any = new Error(data?.message || 'request-failed');
    error.data = data;
    throw error;
  }
  return { data };
}

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  // region common
  post: (url: string, body: object) => base.post(url, body),

  get: (url: string, body?: object) => base.get(url, body),

  update: (url: string, body: object) => base.put(url, body),

  delete: (url: string, body: object) => base.delete(url, body),

  fetchFormData: (url: string, method: string, body: any) => base.fetchFormData(url, method, body),

  // App Endpoints

  createClientAccount: (formData: FormData) => sendMultipart(`account/create`, 'POST', formData),

  // Whether an email or phone already has an account, asked on the first sign-up step
  checkSignupAvailability: (body: { email: string, phone: string }) => base.post(`account/check`, body),

  updateAccount: (formData: User) => base.put(`account/update`, formData),

  getMyAccount: () => base.get(`account/me`),

  // Agree to the terms version this app shows; the server answers with the account (as account/me)
  acceptTerms: (version: string) => base.post(`account/terms/accept`, { version }),

  uploadPassport: (file: File) => {
    const body = new FormData();
    body.append('passportImage', file);
    return sendMultipart(`account/passport/upload`, 'POST', body);
  },

  // Auth Endpoints
  login: (body: { username: string, password: string, loginMethod: string }, loginType: 'admin' | 'client') => base.post(`/login`, { ...body, loginType }),

  getPasswordToken: (body: { email: string }) => base.post(`get-token-password`, { ...body }),

  resetNewPassword: (body: { userId: string, password: string, token: string }) => base.post(`reset-password`, { ...body }),

  verifyToken: (token: string) => base.post(`verifyToken`, { token }),

  // Orders Endpoints
  getHomeData: () => base.get(`client/home`),

  getOrdersForUser: (orderType: OrderStatusType, query: any = {}) => base.get(`client/orders/${orderType}`, query),

  getOrdersBySearch: (value: string, query: any = {}) => base.get(`client/orders/search/${value}`, query),

  getSingleOrder: (orderId: string, query: any = {}) => base.get(`client/order/${orderId}`, query),

  createTrackingNumbers: (trackingNumbers: any[]) => base.post(`client/create/trackingNumber`, trackingNumbers),

  deleteUnsureOrder: (id: string) => base.delete(`client/unsureOrder/${id}/delete`, {}),

  createRatingForOrder: (orderId: any, query: any = {}) => base.post(`client/order/${orderId}/rating`, query),

  getOrderRating: (orderId: any) => base.get(`client/order/${orderId}/rating`, {}),

  updateOrderCustomization: (orderId: string, body: { note?: string, theme?: string }) => base.put(`client/order/${orderId}/customization`, body),

  // Loyalty points (read-only: staff are the only ones who redeem)
  getLoyalty: () => base.get(`client/loyalty`),

  getLoyaltyHistory: (page: number, type = 'all') => base.get(`client/loyalty/history`, { page, type }),

  getOrderLoyalty: (id: string) => base.get(`client/order/${id}/loyalty`),

  // { [orderId]: { earned, pending } } for the orders list badges
  getLoyaltyOrders: () => base.get(`client/loyalty/orders`),

  // Loyalty levels: every level with its perks, and "the app celebrated my new level"
  getLoyaltyTiers: () => base.get(`client/loyalty/tiers`),

  markLevelSeen: () => base.post(`client/loyalty/level/seen`, {}),

  // Rating rewards: the orders received and not rated yet, and one rating for several (3 points each)
  getPendingRatings: () => base.get(`client/ratings/pending`),

  rateOrders: (orderIds: string[], questions: any[]) => base.post(`client/ratings`, { orderIds, questions }),

  // Invite a friend: the customer's code, rewards and friends; and the sign-up page's check of a code
  getReferrals: () => base.get(`client/referrals`),

  checkReferralCode: (code: string) => base.get(`referrals/check/${encodeURIComponent(code)}`),

  // Points offers running or about to start (orders created during one earn ×N)
  getLoyaltyPromotions: () => base.get(`client/loyalty/promotions`),

  // The customer's wallet: balances, debts, packages on the way, and the movements of one currency
  getWallet: () => base.get(`client/wallet`),

  getWalletStatement: (currency: 'USD' | 'LYD') => base.get(`client/wallet/statement`, { currency }),

  // Phone notifications: this device's Firebase token, saved when turned on, removed on logout
  savePushToken: (token: string) => base.post(`client/push/token`, { token }),

  removePushToken: (token: string) => base.delete(`client/push/token`, { token }),

  // The notifications page: a page of messages (older ones with `before`), the unread count, and
  // "the page was opened" (everything shown is read)
  getNotifications: (before?: string) => base.get(`client/notifications`, before ? { before } : {}),

  getUnreadNotifications: () => base.get(`client/notifications/unread`),

  markNotificationsSeen: () => base.post(`client/notifications/seen`, {}),

  // Settings Endpoints
  getAnnouncements: () => base.get(`announcements`),

  getShippingPrices: () => base.get(`shipmentPrices`),

  getExchangeRate: () => base.get(`exchangeRate`),

  // Everything the Prices page shows (admin: Settings > Customer prices)
  getPricing: (parts?: string[]) => base.get(`pricing`, parts?.length ? { parts: parts.join(',') } : undefined),

  getActivePopupAds: () => base.get(`popupAds/active`),

  acknowledgePopupAd: (id: string) => base.post(`popupAds/${id}/acknowledge`, {}),

  trackVisit: (body: { sessionId: string, path: string, referrer?: string, app?: boolean }) => base.post(`analytics/visit`, body),

  // This device: installed (opened from the home screen) or not, notifications on or not
  pingAppDevice: (body: { deviceId: string, standalone: boolean, push: boolean, platform: string }) => base.post(`client/app/ping`, body),

}
