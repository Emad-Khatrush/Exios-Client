import { AiOutlineSetting } from "react-icons/ai";
import { TbLogout } from "react-icons/tb";
import { Link } from "react-router-dom";
import { User } from "../../models";
import Logo from "../Logo/Logo";

type Props = {
  account: User
  toggleSidebar: () => void
}

const ResponsiveFooterSidbar = (props: Props) => {
  const { account, toggleSidebar } = props;

  return (
    <div className="w-full">
      <div className="border-t border-gray-300">
        <div className="w-full flex items-center justify-between px-4 pt-1">
          <div className="flex items-center">
            <Logo className="rounded-full h-10 w-10 object-cover" src={account.imgUrl} />
            <p className="md:text-xl text-gray-800 text-base leading-4 ml-2">{`${account.firstName} ${account.lastName}`}</p>
          </div>
          <ul className="flex">
            <li className="cursor-pointer text-white pt-5 pb-3">
              <TbLogout 
                size={25} 
                className=" text-gray-500" 
                onClick={() => {
                  localStorage.removeItem('user');
                  localStorage.removeItem('authToken');
                  window.location.replace('/login');
                  toggleSidebar();
                }}
              />
            </li>
            <li className="cursor-pointer text-white pt-5 pb-3 pl-1">
              <Link 
                to={'/settings'} 
                onClick={() => {
                  toggleSidebar();
                }}
              >
                <AiOutlineSetting 
                  size={25} 
                  className=" text-gray-500"
                />
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ResponsiveFooterSidbar;
