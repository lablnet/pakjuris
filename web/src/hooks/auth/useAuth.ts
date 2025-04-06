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

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      await api.auth.reset.sendOTP(email);
      toast({
        type: 'success',
        message: "Password reset OTP sent to your email",
      });
      return true;
    } catch (error: any) {
      let err = parseErrors(error.response.data)
      console.log("Error occured! ", err)
      err.general && toast({
        type: 'error',
        message: err.general,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const validateResetOTP = async (data: { email: string; otp: string }) => {
    setLoading(true);
    try {
      const response = await api.auth.reset.validateOTP(data);
      return response.valid;
    } catch (error: any) {
      let err = parseErrors(error.response.data)
      console.log("Error occured! ", err)
      err.general && toast({
        type: 'error',
        message: err.general,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (data: { email: string; otp: string; password: string, repeat: string }) => {
    setLoading(true);
    try {
      await api.auth.reset.updatePassword(data);
      toast({
        type: 'success',
        message: "Password updated successfully",
      });
      return true;
    } catch (error: any) {
      let err = parseErrors(error.response.data)
      console.log("Error occured! ", err)
      err.general && toast({
        type: 'error',
        message: err.general,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    logout,
    loading,
    setLoading,
    resetPassword,
    validateResetOTP,
    updatePassword
  };
};

export default useAuth;
