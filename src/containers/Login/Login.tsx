import Card from '../../components/Card/Card'
import image from '../../../public/images/exios-logo.png';
import { FaLock } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import api from '../../api';
import AlertInfo from '../../components/AlertInfo/AlertInfo';
import { apiErrorsTypes } from '../../constants/errorTypes';
import { LOGIN, STATUS_SUCCESS } from '../../constants/actions';
import { addAuthInterceptor } from '../../utils/AuthInterceptor';
import { CircularProgress } from '@mui/material';

const Login = () => {
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  
  const [errorMessage, setErrorMessage] = useState<{ type: 'info' | 'danger' | 'success' | 'warning', message: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const history = useNavigate();
  const dispatch = useDispatch()

  const login = async (e: any) => {
    e.preventDefault();
    const { username } = formData;
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await api.login({ ...formData, username: username.toLocaleLowerCase().trim() }, 'client');
      const data = res.data;      
      addAuthInterceptor(data.token);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      dispatch({
        payload: data,
        status: STATUS_SUCCESS,
        type: LOGIN,
      });
      history('/home');
    } catch (error: any) {
      console.log(error);
      setErrorMessage({
        type: 'danger',
        message: apiErrorsTypes[error?.data?.message] || 'حدث خطا، الرجاء المحاولة مرة اخرى لاحقا'
      })
    }
    setIsLoading(false);
  }

  return (
    <div className="min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-200">
      <Card>
        <div className="max-w-md w-full space-y-8 lg:w-[100rem] p-5">
          <div>
            <img
              className="mx-auto h-24 w-auto"
              src={image}
              alt="Workflow"
            />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">تسجيل الدخول</h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              او{' '}
              <Link
                to={'/signup'}
                className="font-medium text-green-600 hover:text-green-500"
              >
              انشاء حساب جديد الان  
              </Link>
            </p>
          </div>
          <form 
            className="mt-8 space-y-6" 
            onSubmit={(e) => {
              e.preventDefault();
              login(e);
            }}
          >
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                {errorMessage &&
                  <AlertInfo 
                    tint={errorMessage.type}
                    description={errorMessage.message}
                  />
                }
                <label htmlFor="email-address" className="sr-only">
                  البريد الاكتروني"
                </label>
                <input
                  id="email-address"
                  name="username"
                  type="email"
                  autoComplete="email"
                  required
                  className="mb-3 mt-2"
                  placeholder="البريد الاكتروني"
                  onChange={(e) => setFormData((prevState) => ({
                    ...prevState,
                    [e.target.name]: e.target.value
                  }))}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  الرمز السري
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="الرمز السري"
                  onChange={(e) => setFormData((prevState) => ({
                    ...prevState,
                    [e.target.name]: e.target.value
                  }))}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <div className="text-sm">
                <Link to="/reset-password" className="font-medium text-green-600 hover:text-green-500">
                  هل نسيت كلمة المرور؟
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                disabled={isLoading}
              >
                {isLoading ?
                  <CircularProgress size={25} />
                  :
                  <>
                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <FaLock className="h-5 w-5 text-green-500 group-hover:text-green-400" aria-hidden="true" />
                    </span>
                    تسجيل دخول
                  </>
                }
                </button>
            </div>
          </form>
        </div>
      </Card>
      </div>
  )
}

export default Login;
