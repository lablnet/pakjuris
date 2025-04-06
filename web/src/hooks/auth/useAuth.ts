import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useUserStore } from '../../stores/userStore';
import { parseErrors } from '../../utils/error';
import { useToast } from '../../components/ToastComp';
import { MeType } from '../../types/api'

const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useUserStore();
  const toast = useToast();

  const login = async (credentials: any) => {
    setLoading(true);

    try {
      const response: MeType = await api.auth.login(credentials);
      setUser(response!.user);
      toast({
        type: 'success',
        message: "Login successfully, redirecting within 3 seconds",
      });
      if (response!.user.isProfileComplete) {
        setTimeout(() => {
          navigate('/explore');
        }, 3000);
        return
      }
      setTimeout(() => {
        navigate('/account-setup');
      }, 3000);
    } catch (error: any) {
      let err = parseErrors(error.response.data)
      console.log("Error occured! ", err)
      err.general && toast({
        type: 'error',
        message: err.general,
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);

    try {
      await api.auth.logout();
      setUser(null);
      navigate('/login');
    } catch (error: any) {
      let err = parseErrors(error.response.data)
      console.log("Error occured! ", err)
      err.general && toast({
        type: 'error',
        message: err.general,
      });
    } finally {
      setLoading(false);
    }
  };

  // const googleSignIn = async (token: any) => {
  //   setLoading(true);
  //   setError(null);
  //   try {
  //     const response = await api.auth.googleSignIn(token);
  //     console.log('Google Sign-In response:', response);
  //     setUser(response.data.user);
  //     console.log('User set in store:', response);
  //     navigate('/dashboard');
  //   } catch (err: any) {
  //     console.error('Google Sign-In error:', err);
  //     setError(err.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return {
    login,
    // logout,
    loading,
    //googleSignIn,
    setLoading,
    logout
  };
};

export default useAuth;
