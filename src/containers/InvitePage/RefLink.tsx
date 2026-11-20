import { Navigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { saveCode } from './referralText';

/* A shared invite link (/r/CODE): keeps the code for the sign-up page and opens it. Someone already
   signed in is shown their own invite page instead. */
const RefLink = () => {
  const { code = '' } = useParams();
  const isLoggedIn = useSelector((state: any) => state.session.isLoggedIn);
  if (!isLoggedIn) saveCode(code);
  return <Navigate to={isLoggedIn ? '/invite' : '/signup'} replace />;
};

export default RefLink;
