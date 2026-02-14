import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { signupManager } from '@/api/auth.api';

// Error types for better error handling
const ERROR_TYPES = {
  VALIDATION: 'validation',
  NETWORK: 'network',
  SERVER: 'server',
  UNKNOWN: 'unknown',
};

// Validation rules
const VALIDATION_RULES = {
  fullName: {
    required: true,
    minLength: 2,
    message: 'Full name is required and must be at least 2 characters',
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    message: 'Password must be at least 8 characters with uppercase, lowercase, and number',
  },
  confirmPassword: {
    required: true,
    matchField: 'password',
    message: 'Passwords do not match',
  },
  pharmacyName: {
    required: true,
    minLength: 2,
    message: 'Pharmacy name is required and must be at least 2 characters',
  },
  branchName: {
    required: true,
    minLength: 2,
    message: 'Location name is required and must be at least 2 characters',
  },
  phone: {
    required: true,
    pattern: /^\+?[1-9]\d{1,14}$/,
    message: 'Please enter a valid phone number',
  },
  branchEmail: {
    required: false,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid branch email address',
  },
};

/**
 * Validate a single field based on rules
 */
const validateField = (name, value, allValues) => {
  const rule = VALIDATION_RULES[name];
  if (!rule) return null;

  // Required check
  if (rule.required && !value) {
    return rule.message.replace(' and must be at least', '');
  }

  // Skip other validations if value is empty and not required
  if (!value && !rule.required) return null;

  // Pattern check
  if (rule.pattern && !rule.pattern.test(value)) {
    return rule.message;
  }

  // Min length check
  if (rule.minLength && value.length < rule.minLength) {
    return rule.message;
  }

  // Match field check (for confirmPassword)
  if (rule.matchField && value !== allValues[rule.matchField]) {
    return rule.message;
  }

  return null;
};

/**
 * Enhanced Zustand store for signup flow with optimistic updates and better error handling
 */
export const useSignupStore = create(
  persist(
    (set, get) => ({
      // State
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
      errorType: null,

      // Actions

      /**
       * Optimistic update for manager info field
       * Updates state immediately and clears error for that field
       */
      setManagerInfo: (name, value) =>
        set((state) => {
          // Optimistic update - update immediately
          const newManagerInfo = { ...state.managerInfo, [name]: value };
          
          // Clear error for this field
          const newErrors = { ...state.errors, [name]: '' };

          return {
            managerInfo: newManagerInfo,
            errors: newErrors,
          };
        }),

      /**
       * Optimistic update for branch info field
       * Updates state immediately and clears error for that field
       */
      setBranchInfo: (name, value) =>
        set((state) => {
          // Optimistic update - update immediately
          const newBranchInfo = { ...state.branchInfo, [name]: value };
          
          // Clear error for this field
          const newErrors = { ...state.errors, [name]: '' };

          return {
            branchInfo: newBranchInfo,
            errors: newErrors,
          };
        }),

      /**
       * Validate a single field and update errors
       * Used for real-time validation on blur
       */
      validateField: (name, section) => {
        const state = get();
        const values = section === 'manager' ? state.managerInfo : state.branchInfo;
        const error = validateField(name, values[name], { ...state.managerInfo, ...state.branchInfo });
        
        set((state) => ({
          errors: { ...state.errors, [name]: error || '' },
        }));
        
        return !error;
      },

      /**
       * Validate all fields in current step
       * Returns true if all fields are valid
       */
      validateCurrentStep: (step, shouldSetErrors = true) => {
        const { managerInfo, branchInfo } = get();
        const newErrors = {};

        if (step === 1) {
          // Validate manager info fields
          Object.keys(managerInfo).forEach((name) => {
            const error = validateField(name, managerInfo[name], managerInfo);
            if (error) newErrors[name] = error;
          });
        } else if (step === 2) {
          // Validate branch info fields
          Object.keys(branchInfo).forEach((name) => {
            const error = validateField(name, branchInfo[name], { ...managerInfo, ...branchInfo });
            if (error) newErrors[name] = error;
          });
        }

        if (shouldSetErrors) {
          set({ errors: newErrors });
        }

        return Object.keys(newErrors).length === 0;
      },

      /**
       * Navigate to next step after validation
       */
      goToNextStep: () => {
        const { currentStep, validateCurrentStep } = get();
        if (validateCurrentStep(currentStep, true)) {
          set({ currentStep: Math.min(currentStep + 1, 3) });
        }
      },

      /**
       * Navigate to previous step
       */
      goToPreviousStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 1),
        })),

      /**
       * Set a specific step (for navigation)
       */
      setStep: (step) =>
        set({ currentStep: Math.max(1, Math.min(step, 3)) }),

      /**
       * Submit signup form with optimistic loading state
       */
      submitSignup: async () => {
        const { managerInfo, branchInfo } = get();
        
        // Optimistic loading state
        set({ isLoading: true, error: null, errorType: null });

        try {
          const payload = {
            full_name: managerInfo.fullName,
            email: managerInfo.email,
            password: managerInfo.password,
            role_id: 2, // Manager
            pharmacy_name: branchInfo.pharmacyName,
            branch_name: branchInfo.branchName,
            location: branchInfo.branchName,
            phone: branchInfo.phone,
            branch_email: branchInfo.branchEmail || undefined,
          };

          const response = await signupManager(payload);

          if (response.success) {
            set({ isSuccess: true, isLoading: false });
            return { success: true };
          } else {
            const errorMessage = response.message || 'Registration failed';
            set({ 
              error: errorMessage, 
              isLoading: false,
              errorType: ERROR_TYPES.SERVER,
            });
            return { success: false, message: errorMessage };
          }
        } catch (err) {
          const errorMessage = err.message || 'An error occurred during registration';
          const errorType = err.name === 'NetworkError' || err.message?.includes('network') 
            ? ERROR_TYPES.NETWORK 
            : ERROR_TYPES.UNKNOWN;
          
          set({ 
            error: errorMessage, 
            isLoading: false,
            errorType,
          });
          return { success: false, message: errorMessage };
        }
      },

      /**
       * Clear error state
       */
      clearError: () => set({ error: null, errorType: null }),

      /**
       * Reset entire signup state
       */
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
          errorType: null,
        }),

      /**
       * Get current validation status
       */
      isStepValid: (step) => {
        const { validateCurrentStep } = get();
        return validateCurrentStep(step, false);
      },
    }),
    {
      name: 'pharmacare-signup-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist form data, not loading/error states
      partialize: (state) => ({
        currentStep: state.currentStep,
        managerInfo: state.managerInfo,
        branchInfo: state.branchInfo,
      }),
    }
  )
);

export { ERROR_TYPES, VALIDATION_RULES };
export default useSignupStore;
