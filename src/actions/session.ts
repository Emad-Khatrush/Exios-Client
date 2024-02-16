import api from "../api";
import { STATUS_ERROR, STATUS_SUCCESS, UPDATE_USER } from "../constants/actions";
import { User } from "../models";


export const updateUser = async (user: User, session: any, dispatch: any) => {
  
  try {
    const data = (await api.updateAccount(user))?.data;
    dispatch({
      type: UPDATE_USER,
      status: STATUS_SUCCESS,
      payload: {
        account: data
      }
    })
    localStorage.setItem('user', JSON.stringify({
      ...session,
      account: data
    }));
    
  } catch (error) {
    dispatch({
      type: UPDATE_USER,
      status: STATUS_ERROR
    })
  }
}
