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

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  // region common
  post: (url: string, body: object) => base.post(url, body),

  get: (url: string, body?: object) => base.get(url, body),

  update: (url: string, body: object) => base.put(url, body),

  delete: (url: string, body: object) => base.delete(url, body),

  fetchFormData: (url: string, method: string, body: any) => base.fetchFormData(url, method, body),

  // App Endpoints

  createClientAccount: (formData: User) => base.post(`account/create`, formData),

  updateAccount: (formData: User) => base.put(`account/update`, formData),

  // Auth Endpoints
  login: (body: { username: string, password: string }, loginType: 'admin' | 'client') => base.post(`/login`, { ...body, loginType }),

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

  // Settings Endpoints
  getAnnouncements: () => base.get(`announcements`),

  getShippingPrices: () => base.get(`shipmentPrices`),

  getExchangeRate: () => base.get(`exchangeRate`),

}
