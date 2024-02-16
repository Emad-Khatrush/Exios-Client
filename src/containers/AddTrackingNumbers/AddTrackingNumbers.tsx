import { Alert, AlertColor, CircularProgress, Snackbar } from "@mui/material";
import { useState } from "react";
import api from "../../api";
import Card from "../../components/Card/Card";

const defualtValue = [
  {
    index: Math.round(Math.random() * 5000),
    trackingNumber: ''
  }
];

const AddTrackingNumbers = () => {
  
  const [trackingNumbers, setTrackingNumbers] = useState(defualtValue);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({
    tint: 'success',
    message: ''
  });

  const updateFormState = (value: any, i: number) => {
    const newNumbers = [
      ...trackingNumbers
    ]
    newNumbers[i].trackingNumber = value;
    setTrackingNumbers(newNumbers);
  }

  const addNewInput = () => {
    const newNumbers = [
      ...trackingNumbers
    ]
    newNumbers.push({
      index: Math.round(Math.random() * 5000),
      trackingNumber: ''
    });
    setTrackingNumbers(newNumbers);
  }

  const deleteInput = (i: number) => {
    const newNumbers = trackingNumbers.filter((data => {
      return data.index !== i;
    }));
    setTrackingNumbers(newNumbers);
  }

  const onSubmit = async (event: any) => {
    event.preventDefault();

    let hasTrackingNumbers = true;
    for (let i = 0; i < trackingNumbers.length; i++) {
      const hasData = !!trackingNumbers[i].trackingNumber;      
      if (!hasData) {
        hasTrackingNumbers = false;
        break;
      }
    }
    
    if (!hasTrackingNumbers) {
      setAlert({
        message: 'يرجى تعبية ارقام التتبع',
        tint: 'error'
      });
      return;
    }

    try {
      setIsLoading(true);
      await api.createTrackingNumbers(trackingNumbers);
      setAlert({
        message: 'تم انشاء ارقام التتبع وارسالة للشركة لتتبعها، يمكن تتبع ارقام تتبعك عن طريق صفحة طلبياتي',
        tint: 'success'
      });
      setTrackingNumbers([
        {
          index: Math.round(Math.random() * 5000),
          trackingNumber: ''
        }
      ]);
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
    <div className="container mx-auto py-10 h-64 w-11/1 2 px-6">
      <Card>
        <form className="text-end" onSubmit={onSubmit}>
          <div className="mb-8 mt-4">
            <p className="text-base font-bold">
              يرجى تعبية هذه الخانة في حالة قد ارسلت بضائعك الى مخزننا وقد ارسل لك التاجر او الموقع رقم التتبع الخاص بالشركة الشحن الداخلي
            </p>
            <p className="text-base font-bold">
              هذه تساعد الشركة على تتبع شحنتك ومنعها من الفقدان، في حالة قد اتت شحنتك مجهولة
            </p>
          </div>

          <div className="overflow-hidden shadow sm:rounded-md">
            <div className="bg-white px-4 py-5 sm:p-6">
              <div className="grid grid-cols-6 gap-6">
                {trackingNumbers.map((data, i) => (
                  <div key={data.index} className="col-span-6">
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700"> رقم التتبع </label>
                    <div className="flex">
                      {trackingNumbers.length !== 1 &&
                        <button onClick={() => deleteInput(data.index)} className="inline-flex w-28 justify-center rounded-md border border-transparent bg-red-500 items-center text-sm font-bold text-white shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2">حذف الخانة</button>
                      }
                      <input 
                        required
                        onChange={({ target }) => updateFormState(target.value, i)} 
                        type="text" 
                        name="trackingNumber" 
                        id="trackingNumber" 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={addNewInput} className="inline-flex my-5 justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">اضافة رقم تتبع جديد</button>

            </div>
            <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
              <button disabled={isLoading} type="submit" className="inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                {isLoading ?
                  <CircularProgress size={25} />
                  :
                  <>
                    ارسل
                  </>
                }
              </button>
            </div>
          </div>
        </form>
      </Card>

      <Snackbar 
        open={!!alert.message} 
        autoHideDuration={5000}
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

export default AddTrackingNumbers;
