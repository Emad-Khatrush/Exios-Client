import React from 'react'
import { AiOutlineClose } from 'react-icons/ai';
import image from '../../../public/images/exios-logo.png';
import { routes } from '../PrivateRoute/routes';
import ResponsiveFooterSidbar from './ResponsiveFooterSidbar';
import { Link } from 'react-router-dom';
import { User } from '../../models';

type Props = {
  show: boolean
  account: User
  setShow: React.Dispatch<React.SetStateAction<boolean>>
}

const ResponsiveSidebar = (props: Props) => {
  const { show, setShow, account } = props;

  return (
    <div className={show ? "w-full h-full absolute z-40  transform  translate-x-0" : "   w-full h-full absolute z-40  transform -translate-x-full"} id="mobile-nav">
      <div className="bg-gray-800 opacity-50 absolute h-full w-full lg:hidden" onClick={() => setShow(!show)} />
        <div className="absolute z-40 sm:relative w-64 md:w-96 shadow pb-4 bg-gray-100 lg:hidden transition duration-150 ease-in-out h-full">
          <div className="flex flex-col justify-between h-full w-full">
            <div>
              <div className="flex items-center justify-between px-3">
                <div className="h-16 w-full flex items-center">
                  <div className="h-16 w-full flex items-center px-8 mt-5 justify-center">
                    <img src={image} alt="" width={144} height={30} />
                  </div>
                </div>
                <div id="closeSideBar" className="flex items-center justify-center h-10 w-10 cursor-pointer" onClick={() => setShow(!show)}>
                  <AiOutlineClose size='24' />
                </div>
              </div>

              <div className='flex justify-center mt-5'>
                <h5 className="font-bold text-white w-fit text-3xl rounded-lg p-1 bg-slate-400">{account.customerId}</h5>
              </div>

              <ul aria-orientation="vertical" className=" py-1">
                {routes.map(route => (
                  <li 
                    key={route.value} 
                    className="w-10/12 mr-4 pl-6 cursor-pointer text-gray-600 text-sm leading-3 tracking-normal mt-4 mb-4 py-2 hover:text-green-700 focus:green-indigo-700 focus:outline-none"
                    onClick={() => setShow(!show)}
                  >
                    <div className="flex items-center text-2xl justify-end">
                      <Link to={route.path} className="ml-2 mr-3 flex-none">{route.label}</Link>
                      <div>
                        {route.icon}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {/* Footer */}
            <ResponsiveFooterSidbar account={account} toggleSidebar={() => setShow((prevState => !prevState))} />
        </div>
      </div>
    </div>
  )
}

export default ResponsiveSidebar;
