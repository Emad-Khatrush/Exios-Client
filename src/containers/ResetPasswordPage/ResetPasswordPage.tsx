import Card from '../../components/Card/Card'
import image from '../../../public/images/exios-logo.png';
import { FaLock } from 'react-icons/fa';
import AlertInfo from '../../components/AlertInfo/AlertInfo';
import { useState } from 'react';
import api from '../../api';
import { Link, useSearchParams } from 'react-router-dom';
import { apiErrorsTypes } from '../../constants/errorTypes';
import { CircularProgress } from '@mui/material';

const ResetPasswordPage = () => {

  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');
  const userId = searchParams.get('id');

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>();
  const [reapetPassword, setReapetPassword] = useState<string>();
  const [alertMessage, setAlertMessage] = useState<{ type: 'info' | 'danger' | 'success' | 'warning', message: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const resetNewPassword = async (event: MouseEvent) => {
    event.preventDefault();
    if (password !== reapetPassword) {
      return setAlertMessage({
        type: 'danger',
        message: 'كلمة المرور غير متشابة بعض'
      })
    }

    if (!userId || !password || !token) {
      return setAlertMessage({
        type: 'danger',
        message: 'يرجى تاكد من معلوماتك'
      })
    }

    try {
      await api.resetNewPassword({ userId, password, token });
      setAlertMessage({
        type: 'success',
        message: 'تم تغيير كلمة المرور بنجاح'
      });
      setTimeout(() => {
        window.location.replace('/login');
      }, 2000);
    } catch (error: any) {
      return setAlertMessage({
        type: 'danger',
        message: apiErrorsTypes[error?.data?.message]
      })
    }
  }

  const resetPassword = async (event: MouseEvent) => {
    event.preventDefault();
    if (!email) {
      return setAlertMessage({
        type: 'danger',
        message: 'يرجى كتابة بريدك الاكتروني'
      });
    }
    try {
      setIsLoading(true);
      await api.getPasswordToken({ email });
      setAlertMessage({
        type: 'success',
        message: 'تم ارسال رابط تغيير كلمة المرور على بريدك الاكتروني'
      });
    } catch (error: any) {
      return setAlertMessage({
        type: 'danger',
        message: apiErrorsTypes[error?.data?.message]
      })
    } finally {
      setIsLoading(false);
    }
  }

  if (userId && token) {
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
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">اعادة رقم السري</h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                الرجاء كتابة بريدك الاكتروني
              </p>
              <div className='flex justify-center my-1 text-sm text-green-600 gap-2'>
                <Link to="/login" className='hover:text-green-500'>
                  تسجيل الدخول
                </Link>
                .
                <Link to="/signup" className='hover:text-green-500'>
                  تسجيل حساب
                </Link>
              </div>
            </div>
            <form 
              className="mt-8 space-y-6" 
              onSubmit={resetNewPassword as any}
            >
              <div className="rounded-md shadow-sm -space-y-px">
                <div>
                  {alertMessage &&
                    <AlertInfo 
                      tint={alertMessage.type}
                      description={alertMessage.message}
                    />
                  }
                  <label htmlFor="email-address" className="sr-only">
                    كلمة المرور
                  </label>
                  <input
                    minLength={6}
                    maxLength={16}
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="password"
                    required
                    className="mb-3 mt-2"
                    placeholder="كلمة المرور الجديده"
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <input
                    minLength={6}
                    maxLength={16}
                    id="reapetPassword"
                    name="reapetPassword"
                    type="password"
                    autoComplete="reapetPassword"
                    required
                    className="mb-3 mt-2"
                    placeholder="اعادة كلمة المرور الجديده"
                    onChange={(e) => setReapetPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  disabled={isLoading}
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <FaLock className="h-5 w-5 text-green-500 group-hover:text-green-400" aria-hidden="true" />
                  </span>
                  انشاء كلمة مرور جديده
                </button>
              </div>
            </form>
          </div>
        </Card>
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
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">اعادة رقم السري</h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              الرجاء كتابة بريدك الاكتروني
            </p>
            <div className='flex justify-center my-1 text-sm text-green-600 gap-2'>
              <Link to="/login" className='hover:text-green-500'>
                تسجيل الدخول
              </Link>
              .
              <Link to="/signup" className='hover:text-green-500'>
                تسجيل حساب
              </Link>
            </div>
          </div>
          <form 
            className="mt-8 space-y-6" 
            onSubmit={resetPassword as any}
          >
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                {alertMessage &&
                  <AlertInfo 
                    tint={alertMessage.type}
                    description={alertMessage.message}
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
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
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
                    اعادة كلمة المرور
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

export default ResetPasswordPage;
