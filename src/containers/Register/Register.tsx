import { useState } from 'react';
import Card from '../../components/Card/Card'
import image from '../../../public/images/exios-logo.png';
import { Link, useNavigate } from 'react-router-dom';
import { AiOutlineUserAdd } from 'react-icons/ai';
import { User } from '../../models';
import api from '../../api';
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import TermsPdf from '../../../public/terms.pdf';
import AlertInfo from '../../components/AlertInfo/AlertInfo';
import { apiErrorsTypes } from '../../constants/errorTypes';
import { libyanCities } from '../../constants/info';
import { addAuthInterceptor } from '../../utils/AuthInterceptor';
import { LOGIN, STATUS_SUCCESS } from '../../constants/actions';
import { useDispatch } from 'react-redux';

const Register = () => {
  const [formData, setFormData] = useState<User | any>({
    city: 'tripoli'
  });
  
  const [openTermsModal, setOpenTermsModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<{ type: 'info' | 'danger' | 'success' | 'warning', message: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const history = useNavigate();
  const dispatch = useDispatch()
  
  const updateFormState = (name: string, value: any) => {
    setFormData((prevState: any) => ({
      ...prevState,
      [name]: value
    }))
  }

  const createAccount = async () => {
    if (formData?.password !== formData?.repeatedPassword) {
      return setErrorMessage({
        type: 'warning',
        message: 'كلمة المرور لا تطابق كلمة مرور المكرره، الرجاء اعادة كتابته'
      });
    }
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await api.createClientAccount(formData);
      const res = await api.login({ username: formData.email, password: formData.password }, 'client');
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
      setErrorMessage({
        type: 'danger',
        message: apiErrorsTypes[error?.data?.message] || 'حدث خطا اثناء انشاء الحساب'
      });
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
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">انشاء حساب</h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              لديك حساب بالفعل؟{' '}
              <Link
                to={'/login'}
                className="font-medium text-green-600 hover:text-green-500"
              >
                سجل دخولك من هنا
              </Link>
            </p>
          </div>
          <form 
            className="mt-8 space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              createAccount();
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
                <h5 className='mb-2 mt-2 text-right'>معلومات الشخصية</h5>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="mb-3"
                  placeholder="البريد الاكتروني"
                  onChange={(e) => updateFormState(e.target.name, e.target.value)}
                  disabled={isLoading}
                />
                <input
                  name="firstName"
                  type="text"
                  required
                  className="mb-3"
                  placeholder="الاسم الاول"
                  onChange={(e) => updateFormState(e.target.name, e.target.value)}
                  disabled={isLoading}
                />
                <input
                  name="lastName"
                  type="text"
                  required
                  className="mb-3"
                  placeholder="اسم العائلة"
                  onChange={(e) => updateFormState(e.target.name, e.target.value)}
                  disabled={isLoading}
                />
                <input
                  name="phone"
                  type="number"
                  required
                  className="mb-3"
                  placeholder="رقم الهاتف"
                  onChange={(e) => updateFormState(e.target.name, e.target.value)}
                  disabled={isLoading}
                />
                <select
                  required
                  name="city" 
                  id="city"
                  className="mb-3"
                  onChange={(e) => updateFormState(e.target.name, e.target.value)}
                  disabled={isLoading}
                >
                  {libyanCities.map((city) => (
                    <option key={city.code} value={city.value} className='mr-96'>{city.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <h5 className='mb-2 text-right'>معلومات الدخول</h5>
                <input
                  minLength={6}
                  maxLength={16}
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="mb-3"
                  placeholder="الرمز السري"
                  onChange={(e) => updateFormState(e.target.name, e.target.value)}
                  disabled={isLoading}
                />
                <input
                  minLength={6}
                  maxLength={16}
                  id="repeatedPassword"
                  name="repeatedPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="mb-3"
                  placeholder="اعادة الرمز السري"
                  onChange={(e) => updateFormState(e.target.name, e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <div className="flex items-center">
                <label className="mr-2 block text-sm text-gray-900">
                  انا اوافق على <span className='text-green-600 cursor-pointer'>شروط</span> التسجيل
                </label>
                <input
                  required
                  id="isAgreeToTermsOfCompany"
                  name="isAgreeToTermsOfCompany"
                  type="checkbox"
                  checked={formData?.isAgreeToTermsOfCompany || false}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setOpenTermsModal(true);
                    } else {
                      // thats mean user uncheck terms
                      updateFormState(e.target.name, false);
                    }
                  }}
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
                      <AiOutlineUserAdd className="h-5 w-5 text-green-500 group-hover:text-green-400" aria-hidden="true" />
                    </span>
                    انشاء حساب
                  </>
                }
              </button>
            </div>
          </form>
        </div>

        <Dialog
          open={openTermsModal}
          onClose={() => {
            setOpenTermsModal(false);
            setFormData((prevState: any) => ({
              ...prevState,
              isAgreeToTermsOfCompany: false
            }))
          }}
          scroll={'paper'}
          aria-labelledby="scroll-dialog-title"
          aria-describedby="scroll-dialog-description"
          fullWidth
        >
          <DialogTitle id="scroll-dialog-title">شروط وسياسيات شركة اكسيوس</DialogTitle>
          <DialogContent dividers={true}>
            <DialogContentText
              id="scroll-dialog-description"
              tabIndex={-1}
            >
              <iframe src={TermsPdf} height="600" width="100%" />
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setOpenTermsModal(false);
                setFormData((prevState: any) => ({
                  ...prevState,
                  isAgreeToTermsOfCompany: false
                }))
              }}
            >
              تراجع
            </Button>
            <Button
              variant="contained"
              color='success'
              onClick={() => {
                setFormData((prevState: any) => ({
                  ...prevState,
                  isAgreeToTermsOfCompany: true
                }))
                setOpenTermsModal(false);
              }}
            >
              اوافق على شروط
            </Button>
          </DialogActions>
        </Dialog>
      </Card>
      </div>
  )
}

export default Register;
