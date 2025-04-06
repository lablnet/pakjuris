import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { parseErrors } from '../../utils/error';
import { validateEmail } from '../../utils/validator';
import { useToast } from '../../components/ToastComp';
import useOTP from './useOTP';

const useReset = () => {
    const toast = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();
  
  
    const handleEmailSubmit = async (): Promise<void> => {
      if (validateEmail(email)) {
        console.log ("Test")
        toast({
          type:'error',
          message: "Please enter a valid email address",
        });
        return;
      }
      try {
        setLoading(true)
        await api.auth.reset.sendOTP(email);
        setCurrentStep(2);
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
    };
  
    const handleCodeSubmit = async (code: string) => {
      if (!code) {
        toast({
          type:'error',
          message: "Please enter a valid reset code",
        });
        return;
      }
      // Validate code format (assuming it should be 6 digits)
      if (!/^\d{6}$/.test(code)) {
        toast({
          type:'error',
          message: "Please enter a valid 6-digit code",
        });
        return;
      }
      try {
        setLoading(true)
        await api.auth.reset.validateOTP({ email, otp: code });
        setCurrentStep(3);
      } catch (error: any) {
        let err = parseErrors(error.response.data)
        console.log ("Error occured! ", err)
        err.general && toast({
          type:'error',
          message: err.general,
        });
        return;
      } finally {
        setLoading(false)
      }
    };

    const { code, setCode, resendCountdown, handleResendCode } = useOTP(
      handleEmailSubmit,
      handleCodeSubmit,
      loading,
      setLoading
    );
  
    const handlePasswordSubmit = async () => {
      if (!newPassword || !confirmPassword) {
        toast({
          type:'error',
          message: "Please fill in both password fields",
        });
        return;
      }
  
      if (newPassword !== confirmPassword) {
        toast({
          type:'error',
          message: "Password do not match",
        });
        return;
      }
  
      if (newPassword.length < 6) {
        toast({
          type:'error',
          message: "Password must be at least 8 characters long",
        });
        return;
      }
  
      try {
        setLoading(true)
        await api.auth.reset.updatePassword({ email, otp: code, password: newPassword, repeat: confirmPassword });
        navigate(`/reset-password/success`);
      } catch (error: any) {
        let err = parseErrors(error.response.data)
        console.log ("Error occured! ", err)
        err.general && toast({
          type:'error',
          message: err.general,
        });
        return;
      } finally {
        setLoading(false)
      }
    };

    return {
        currentStep,
        loading,
        email,
        setEmail,
        code,
        setCode,
        newPassword,
        setNewPassword,
        confirmPassword,
        setConfirmPassword,
        resendCountdown,
        handleEmailSubmit,
        handleCodeSubmit,
        handleResendCode,
        handlePasswordSubmit,
    };
}

export default useReset;
