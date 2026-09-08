
type Props = {
  tint: 'info' | 'danger' | 'success' | 'warning',
  description: string
  forward?: { link: string, label: string }
}

const colors = [
  {
    tint: 'info',
    color: 'blue',
    title: 'معلومات',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>,
    bgColor: 'bg-blue-50'
  },
  {
    tint: 'danger',
    color: 'red',
    title: 'خطأ',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
</svg>,
    bgColor: 'bg-red-50'
  },
  {
    tint: 'success',
    color: 'green',
    title: 'نجح',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 rounded-full text-green-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
</svg>,
    bgColor: 'bg-green-50'
  },
  {
    tint: 'warning',
    color: 'amber',
    title: 'ملاحظة',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 rounded-full text-amber-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
</svg>,
    bgColor: 'bg-amber-50'
  }
]

const AlertInfo = (props: Props) => {
  const alert = colors.find(color => color.tint === props.tint) || colors[0];

  return (
    <div className={`px-4 ${alert.bgColor} rounded-md`} style={{ direction: 'rtl'}}>
      <div className="flex justify-between py-3">
        <div className="flex">
          <div>
              {alert.icon}
          </div>
            <div className="text-start mr-3">
              <span className={`text-${alert.color}-500 font-bold`}>
                  {alert.title}
              </span>
              <div className={`text-${alert.color}-500`}>
                <div className="mt-1">
                  {props.description}
                </div>
                {props.forward &&
                  <div className="mt-2 w-fit">
                    <a 
                      href={props.forward.link}
                      target="_blank"
                      className="flex items-center text-sm font-medium underline">
                      {props.forward.label}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                      </svg>
                    </a>
                  </div>
                }
              </div>
            </div>
        </div>
        {/* <button className="self-start text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        </button> */}
      </div>
  </div>
  )
}

export default AlertInfo;
