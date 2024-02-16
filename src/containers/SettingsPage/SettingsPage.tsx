import { Alert, AlertColor, Snackbar } from '@mui/material';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../../actions/session';
import Card from '../../components/Card/Card';
import { libyanCities } from '../../constants/info';
import { User } from '../../models';

const SettingsPage = () => {
  const account: User = useSelector((state: any) => state.session.account);
  const session: any = useSelector((state: any) => state.session);

  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>(account)
  const [alert, setAlert] = useState({
    tint: 'success',
    message: ''
  });

  const dispatch = useDispatch();
  
  const updateFormState = (name: string, value: any) => {
    setCurrentUser((prevState: any) => ({
      ...prevState,
      [name]: value
    }))
  }

  const updateUserData = async (event: any) => {
    event.preventDefault();
    try {
      setIsLoading(true);
      await updateUser(currentUser, session, dispatch);
      setAlert({
        message: 'تم تحديث معلومات بنجاح',
        tint: 'success'
      });
    } catch (error) {
      console.log(error);
      setAlert({
        message: 'حدث خطا اثناء انشاء العملية',
        tint: 'error'
      });
    }
    setIsLoading(false);
  }
  
  return (
    <div className="container mx-auto py-10 h-64 w-11/12 px-6">
      <Card>
        <div className="mt-10 sm:mt-0 text-start" style={{ direction: 'rtl' }}>
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <div className="px-4 sm:px-0">
                <h3 className="text-lg font-medium leading-6 text-gray-900">معلومات الشخصية</h3>
                <p className="mt-1 text-sm text-gray-600">هذه المعلومات التي سيتم التواصل معه لاجراءات الاستلام</p>
              </div>
            </div>
            <div className="mt-5 md:col-span-2 md:mt-0">
              <form onSubmit={updateUserData}>
                <div className="overflow-hidden shadow sm:rounded-md">
                  <div className="bg-white px-4 py-5 sm:p-6">
                    <div className="grid grid-cols-6 gap-6">
                      <div className="col-span-6 sm:col-span-3">
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">اسم الاول</label>
                        <input required onChange={({ target }) => updateFormState(target.name, target.value)} type="text" value={currentUser.firstName} name="firstName" id="firstName" autoComplete="given-name" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm" />
                      </div>

                      <div className="col-span-6 sm:col-span-3">
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">اسم الثاني</label>
                        <input required onChange={({ target }) => updateFormState(target.name, target.value)} type="text" value={currentUser.lastName} name="lastName" id="last-name" autoComplete="family-name" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm" />
                      </div>

                      <div className="col-span-6 sm:col-span-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">البريد الاكتروني</label>
                        <input required onChange={({ target }) => updateFormState(target.name, target.value)} type="email" value={currentUser.username} disabled name="email" id="email" autoComplete="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm disabled:bg-slate-200 hover:cursor-not-allowed" />
                      </div>

                      <div className="col-span-6 sm:col-span-2">
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700">مدينة</label>
                        <select 
                          name="city" 
                          id="city"
                          className="mb-3"
                          value={currentUser.city}
                          onChange={({ target }) => updateFormState(target.name, target.value)}
                          required
                        >
                          {libyanCities.map((city) => (
                            <option key={city.code} value={city.value} className='mr-96'>{city.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-6 sm:col-span-3">
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">رقم الهاتف</label>
                        <input required onChange={({ target }) => updateFormState(target.name, target.value)} type="number" value={currentUser.phone} name="phone" id="phone" autoComplete="phone" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm" />
                      </div>

                      {/* Profile Pic Soon */}
                      {/* <div className="col-span-6">
                        <label className="block text-sm font-medium text-gray-700 mr-1 mb-3">صورة شخصية</label>
                        <div className="mt-1 flex">
                          <span className="inline-block h-12 w-12 overflow-hidden rounded-full bg-gray-100">
                            <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                          </span>
                          <button className="mr-5 rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">تغيير</button>
                        </div>
                      </div> */}
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
                    <button disabled={isLoading} type="submit" className="inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">حفظ</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Card>

      <Snackbar 
        open={!!alert.message} 
        autoHideDuration={1500}
        onClose={() => setAlert({ tint: 'success', message: ''})}
      >
        <Alert 
          severity={alert.tint as AlertColor}
          onClose={() => setAlert({ tint: 'success', message: ''})}
          style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </div>
  )
}

export default SettingsPage;
