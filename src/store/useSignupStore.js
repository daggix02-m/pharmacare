import { create } from 'zustand';
import { signupManager } from '@/api/auth.api';

export const useSignupStore = create((set, get) => ({
  currentStep: 1,
  managerInfo: {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  },
  branchInfo: {
    pharmacyName: '',
    branchName: '',
    phone: '',
    branchEmail: '',
  },
  errors: {},
  isLoading: false,
  isSuccess: false,
  error: null,

  setManagerInfo: (name, value) =>
    set((state) => ({
      managerInfo: { ...state.managerInfo, [name]: value },
      errors: { ...state.errors, [name]: '' },
    })),

  setBranchInfo: (name, value) =>
    set((state) => ({
      branchInfo: { ...state.branchInfo, [name]: value },
      errors: { ...state.errors, [name]: '' },
    })),

  goToNextStep: () => {
    const { currentStep, validateCurrentStep } = get();
    if (validateCurrentStep(currentStep, true)) {
      set({ currentStep: Math.min(currentStep + 1, 3) });
    }
  },

  goToPreviousStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 1),
    })),

  validateCurrentStep: (step, shouldSetErrors = true) => {
    const { managerInfo, branchInfo } = get();
    const newErrors = {};

    if (step === 1) {
      if (!managerInfo.fullName) newErrors.fullName = 'Full name is required';
      if (!managerInfo.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(managerInfo.email)) {
        newErrors.email = 'Email is invalid';
      }
      if (!managerInfo.password) {
        newErrors.password = 'Password is required';
      } else if (managerInfo.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      if (managerInfo.password !== managerInfo.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else if (step === 2) {
      if (!branchInfo.pharmacyName) newErrors.pharmacyName = 'Pharmacy name is required';
      if (!branchInfo.branchName) newErrors.branchName = 'Location name is required';
      if (!branchInfo.phone) newErrors.phone = 'Phone number is required';
    }

    if (shouldSetErrors) {
      set({ errors: newErrors });
    }

    return Object.keys(newErrors).length === 0;
  },

  submitSignup: async () => {
    const { managerInfo, branchInfo } = get();
    set({ isLoading: true, error: null });

    try {
      const payload = {
        full_name: managerInfo.fullName,
        email: managerInfo.email,
        password: managerInfo.password,
        role_id: 2, // Manager
        pharmacy_name: branchInfo.pharmacyName,
        branch_name: branchInfo.branchName,
        location: branchInfo.branchName, // Using branch name as location
        phone: branchInfo.phone,
        branch_email: branchInfo.branchEmail || undefined,
      };

      const response = await signupManager(payload);

      if (response.success) {
        set({ isSuccess: true, isLoading: false });
        return { success: true };
      } else {
        set({ error: response.message, isLoading: false });
        return { success: false, message: response.message };
      }
    } catch (err) {
      const errorMessage = err.message || 'An error occurred during registration';
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  resetSignup: () =>
    set({
      currentStep: 1,
      managerInfo: {
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
      },
      branchInfo: {
        pharmacyName: '',
        branchName: '',
        phone: '',
        branchEmail: '',
      },
      errors: {},
      isLoading: false,
      isSuccess: false,
      error: null,
    }),
}));

export default useSignupStore;
