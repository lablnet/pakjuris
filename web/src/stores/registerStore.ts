import { create } from 'zustand';

interface RegisterState {
  loading: boolean;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirm: string;
  step: number;
  agreeToTerms: boolean;
  
  setLoading: (loading: boolean) => void;
  setFirstName: (firstName: string) => void;
  setLastName: (lastName: string) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setPasswordConfirm: (passwordConfirm: string) => void;
  setStep: (step: number) => void;
  setAgreeToTerms: (agreeToTerms: boolean) => void;
  reset: () => void;
}

export const useRegisterStore = create<RegisterState>((set) => ({
  loading: false,
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  passwordConfirm: '',
  step: 1,
  agreeToTerms: false,
  
  setLoading: (loading) => set({ loading }),
  setFirstName: (firstName) => set({ firstName }),
  setLastName: (lastName) => set({ lastName }),
  setEmail: (email) => set({ email }),
  setPassword: (password) => set({ password }),
  setPasswordConfirm: (passwordConfirm) => set({ passwordConfirm }),
  setStep: (step) => set({ step }),
  setAgreeToTerms: (agreeToTerms) => set({ agreeToTerms }),
  reset: () => set({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    passwordConfirm: '',
    step: 1,
    agreeToTerms: false
  })
})); 