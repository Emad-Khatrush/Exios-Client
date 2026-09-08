import Card from '../../components/Card/Card'
import image from '../../../public/images/exios-logo.png';
import { FaExchangeAlt, FaLock } from 'react-icons/fa';
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
  const [loginType, setLoginType] = useState<{ type: string, label: string }>({ type: 'email', label: 'الدخول بواسطة رقم الهاتف ' });
  
  const history = useNavigate();
  const dispatch = useDispatch()

  const login = async (e: any) => {
    e.preventDefault();
    const { username } = formData;
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await api.login({ ...formData, username: username.toLocaleLowerCase().trim(), loginMethod: loginType.type }, 'client');
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

  const LoginInput = (loginType: any) => {
    if (loginType.type === 'phone') {
      return (
        <div className="flex items-center">
          <button type='button' className="rounded-l-md flex-shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium text-center text-gray-900 bg-gray-100 border border-gray-300 rounded-s-lg hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700 dark:text-white dark:border-gray-600">
            <img src="https://static.xx.fbcdn.net/images/emoji.php/v9/t10/1/16/1f1f1_1f1fe.png" alt="" />
            <span className='ml-2'>+218</span>
          </button>
          <label htmlFor="phone-input" className="mb-2 text-sm font-medium sr-only dark:text-white">Phone number:</label>
          <div className="relative w-full">
            <input
              id="phone-input" 
              name='username'
              placeholder="رقم الهاتف المسجل" 
              type="number" 
              onWheel={(event: any) => event.target.blur()}
              className=" text-left placeholder:text-right rounded-r-md rounded-l-none block p-2.5 w-full z-20 text-sm bg-gray-50 rounded-e-lg border-s-0 border border-gray-300  dark:bg-gray-700 dark:border-s-gray-700  dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-blue-500" 
              required 
              onChange={(e) => setFormData((prevState) => ({
                ...prevState,
                [e.target.name]: e.target.value
              }))}
            />
          </div>
        </div>
      )
    }
  
    return (
      <div>
        <label htmlFor="email-address" className="sr-only">
          البريد الاكتروني"
        </label>
        <input
          id="email-address"
          name="username"
          type="email"
          required
          className="mt-2"
          placeholder="البريد الاكتروني"
          onChange={(e) => {
            setFormData((prevState) => ({
              ...prevState,
              [e.target.name]: e.target.value
            }))
          }}
          disabled={isLoading}
          defaultValue={formData.username}
        />
      </div>
    )
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

                {LoginInput(loginType)}

                <div className='flex items-center justify-end m-0 mb-3 mt-1 cursor-pointer' onClick={() => setLoginType({ type: loginType.type === 'email' ? 'phone' : 'email', label: loginType.type === 'phone' ? 'الدخول بواسطة رقم الهاتف' : 'الدخول بواسطة البريد الاكتروني'  })}>
                  <FaExchangeAlt className='text-green-700 mr-2 ' />
                  <p className='text-right text-sm text-green-700 font-bold'>{loginType.label}</p>
                </div>
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
