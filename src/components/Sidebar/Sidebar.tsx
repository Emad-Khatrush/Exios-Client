import Logo from '../Logo/Logo'
import image from '../../../public/images/exios-logo.png';
import { routes } from '../PrivateRoute/routes';
import { Link } from 'react-router-dom';
import { User } from '../../models';

type Props = {
  account: User
}

const Sidebar = (props: Props) => {
  const { account } = props;

  return (
    <div className="absolute lg:relative w-80 h-screen shadow bg-gray-100 hidden lg:block">
      <div className="h-16 w-full flex items-center px-8 mt-5 justify-center">
        <img src={image} alt="" width={144} height={30} />
      </div>
      <div className='flex justify-center mt-5'>
        <h5 className="font-bold text-white w-fit text-3xl rounded-lg p-1 bg-slate-400">{account.customerId}</h5>
      </div>
      <ul aria-orientation="vertical" className="py-1">
        {routes.map(route => (
          <li key={route.value} className="mr-4 pl-6 cursor-pointer text-gray-600 text-sm leading-3 tracking-normal mt-4 mb-4 py-2 hover:text-green-700 focus:green-indigo-700 focus:outline-none">
            <div className="flex items-center text-xl justify-end">
              <Link to={route.path} className="ml-2 mr-3">{route.label}</Link>
              <div>
                {route.icon}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Sidebar;
