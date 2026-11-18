import { unregisterPush } from './push';

// Logging out from anywhere: the device stops getting this customer's notifications first
export const logout = async () => {
  await unregisterPush();
  localStorage.removeItem('user');
  localStorage.removeItem('authToken');
  window.location.replace('/login');
};
