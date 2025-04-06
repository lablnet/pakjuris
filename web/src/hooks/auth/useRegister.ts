import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { parseErrors } from '../../utils/error';
import { useToast } from '../../components/ui/ToastComp';
import useOTP from './useOTP';
import { useRegisterStore } from '../../stores/registerStore';

const useRegister = () => {
  const {
    loading,
    setLoading,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    password,
    setPassword,
    passwordConfirm,
    setPasswordConfirm,
    step,
    setStep,
    agreeToTerms,
    setAgreeToTerms,
  } = useRegisterStore();

  const navigate = useNavigate();
  const toast = useToast();


  const register = async () => {
    // validate inputs
    if (!email || !password || !passwordConfirm) {
      return toast({
        type: 'error',
        message: 'All fields are required',
      });
    }
    // agrees to terms.
    if (!agreeToTerms) {
      return toast({
        type: 'error',
        message: 'Please agree to terms and conditions',
      });
    }
    try {
      setLoading(true);
      await api.auth.register.signup({
        full_name: `${firstName} ${lastName}`,
        email,
        password,
      });
      setStep(2);
    } catch (error: any) {
      let err = parseErrors(error.response.data)
      console.log ("Error occured! ", err)
      err.general && toast({
        type:'error',
        message: err.general,
      });
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    try {
      setLoading(true);
      await api.auth.register.resendOTP({ email });
      toast({type: "info", message: "OTP resent successfully" });
    } catch (error: any) {
        let err = parseErrors(error.response.data)
        console.log ("Error occured! ", err)
        err.general && toast({
          type:'error',
          message: err.general,
        });
    } finally {
      setLoading(false);
    }
  }

  const validateOTP = async (otp: string) => {
    try {
      setLoading(true);
      await api.auth.register.validateOTP({ otp, email });
      toast({type: "success", message: "OTP verified successfully, redirected to account setup" });
      navigate('/login');
    } catch (error: any) {
      let err = parseErrors(error.response.data)
        console.log ("Error occured! ", err)
        err.general && toast({
          type:'error',
          message: err.general,
        });
    } finally {
      setLoading(false)
    }
  }

  const { code, setCode, resendCountdown, handleResendCode } = useOTP(
    resendOTP,
    validateOTP,
    loading,
    setLoading
  );

  const next = async (): Promise<void> => {
    if (step === 1) {
      await register();
    }
  }

  const prev = (): void => {}

  return {
    register,
    resendOTP,
    validateOTP,
    loading,
    setLoading,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    password,
    setPassword,
    passwordConfirm,
    setPasswordConfirm,
    step,
    setStep,
    next,
    prev,
    code,
    setCode,
    handleResendCode,
    resendCountdown,
    agreeToTerms,
    setAgreeToTerms
  };
};

export default useRegister;
