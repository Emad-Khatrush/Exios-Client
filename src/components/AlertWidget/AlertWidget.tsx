import Card from "../Card/Card";
import { BiArrowBack } from 'react-icons/bi';
import { Link } from "react-router-dom";

const AlertWidget = () => {
  return (
    <Card
      className="h-auto rounded-lg"
    >
      <div className="flex justify-between items-center flex-col lg:flex-row">
        <div className="md:shrink-0">
          <img 
            src="https://cdn.corporatefinanceinstitute.com/assets/imports-and-exports-1024x684.jpeg" 
            alt=""
            className="h-48 w-full object-cover md:h-full md:w-96 rounded-lg mb-4"
          />
        </div>

        <div className="max-w-xs ml-4">
          <h1 className="font-bold text-xl sm:text-2xl text-gray-800 mb-2 text-end">الشحن عن طريق شركة اكسيوس</h1>
          <ul className="list-disc text-gray-500 text-xl m-6 text-start" style={{ direction: 'rtl' }}>
            <li>شحن الجوي السريع</li>
            <li> شحن بحري مشترك </li>
            <li> شحن حاويات </li>
            <li>تتبع طلبياتك باحترافية</li>
          </ul>

          <Link
            to="/start-shipment"
          >
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-md font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <BiArrowBack className="h-5 w-5 text-green-500 group-hover:text-green-400" aria-hidden="true" />
              </span>
              ابدأ الشحن الان
            </button>
          </Link>
        </div>
        
      </div>
    </Card>
  )
}

export default AlertWidget;