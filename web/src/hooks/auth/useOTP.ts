import { useState, useRef, useEffect } from 'react';

const useOTP = (
  sendOTP: () => Promise<void>,
  validateOTP: (otp: string) => Promise<void>,
  loading: boolean,
  setLoading: (loading: boolean) => void
) => {
  const [code, setCode] = useState('');
  const [resendCountdown, setResendCountdown] = useState(30);
  const timerRef = useRef<number | null>(null);

  // Function to trigger OTP sending with countdown
  const handleSendOTP = async () => {
    setLoading(true);
    try {
      await sendOTP();
      // Reset countdown on sending OTP
      setResendCountdown(resendCountdown+30);
    } finally {
      setLoading(false);
    }
  };

  // Function to trigger OTP validation
  const handleValidateOTP = async () => {
    setLoading(true);
    try {
      return await validateOTP(code);
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer for resending OTP
  useEffect(() => {
    if (resendCountdown > 0) {
      timerRef.current = window.setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [resendCountdown]);

  // Handle resend code logic
  const handleResendCode = () => {
    handleSendOTP();
  };

  useEffect(() => {
    if ((/^\d{6}$/.test(code))) {
      handleValidateOTP();
    }
  }, [code])

  return {
    code,
    setCode,
    resendCountdown,
    loading,
    handleSendOTP,
    handleValidateOTP,
    handleResendCode,
  };
};

export default useOTP;
