'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FloatingPaths from '@/components/shared/FloatingPaths';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSignupStore } from '@/store/useSignupStore';
import {
  ChevronLeftIcon,
  MailIcon,
  LockIcon,
  BuildingIcon,
  PhoneIcon,
  MapPinIcon,
  CheckCircleIcon,
  UserRoundIcon,
  Eye,
  EyeOff,
} from 'lucide-react';

// Step 1 - Manager Information Component
const Step1ManagerInfo = () => {
  const { managerInfo, errors, setManagerInfo, goToNextStep, validateCurrentStep } =
    useSignupStore();

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const canProceed = validateCurrentStep(1, false);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className='space-y-4'
    >
      <div className='relative h-max'>
        <Input
          name='fullName'
          value={managerInfo.fullName}
          onChange={(e) => setManagerInfo('fullName', e.target.value)}
          placeholder='Full Name'
          className={`peer ps-9 ${errors.fullName ? 'border-red-500' : ''}`}
        />
        <div className='text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50'>
          <UserRoundIcon className='size-4' aria-hidden='true' />
        </div>
      </div>
      {errors.fullName && <p className='text-red-500 text-xs'>{errors.fullName}</p>}

      <div className='relative h-max'>
        <Input
          name='email'
          value={managerInfo.email}
          onChange={(e) => setManagerInfo('email', e.target.value)}
          placeholder='Email Address'
          type='email'
          className={`peer ps-9 ${errors.email ? 'border-red-500' : ''}`}
        />
        <div className='text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50'>
          <MailIcon className='size-4' aria-hidden='true' />
        </div>
      </div>
      {errors.email && <p className='text-red-500 text-xs'>{errors.email}</p>}

      <div className='relative h-max'>
        <Input
          name='password'
          value={managerInfo.password}
          onChange={(e) => setManagerInfo('password', e.target.value)}
          placeholder='Password'
          type={showPassword ? 'text' : 'password'}
          className={`peer ps-9 ${errors.password ? 'border-red-500' : ''}`}
        />
        <div className='text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50'>
          <LockIcon className='size-4' aria-hidden='true' />
        </div>
        <button
          type='button'
          onClick={() => setShowPassword(!showPassword)}
          className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
        >
          {showPassword ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
        </button>
      </div>
      {errors.password && (
        <p className='text-red-500 text-xs'>{errors.password}</p>
      )}

      <div className='relative h-max'>
        <Input
          name='confirmPassword'
          value={managerInfo.confirmPassword}
          onChange={(e) => setManagerInfo('confirmPassword', e.target.value)}
          placeholder='Confirm Password'
          type={showConfirmPassword ? 'text' : 'password'}
          className={`peer ps-9 ${errors.confirmPassword ? 'border-red-500' : ''}`}
        />
        <div className='text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50'>
          <LockIcon className='size-4' aria-hidden='true' />
        </div>
        <button
          type='button'
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
        >
          {showConfirmPassword ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
        </button>
      </div>
      {errors.password && <p className='text-red-500 text-xs'>{errors.password}</p>}

      <div className='relative h-max'>
        <Input
          name='confirmPassword'
          value={managerInfo.confirmPassword}
          onChange={(e) => setManagerInfo('confirmPassword', e.target.value)}
          placeholder='Confirm Password'
          type='password'
          className={`peer ps-9 ${errors.confirmPassword ? 'border-red-500' : ''}`}
        />
        <div className='text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50'>
          <LockIcon className='size-4' aria-hidden='true' />
        </div>
      </div>
      {errors.confirmPassword && <p className='text-red-500 text-xs'>{errors.confirmPassword}</p>}

      <div className='flex gap-2'>
        <Button type='button' variant='outline' onClick={goToNextStep} className='w-full' disabled={!canProceed}>
          Continue
        </Button>
      </div>
    </motion.div>
  );
};

// Step 2 - Pharmacy/Branch Information Component
const Step2BranchInfo = () => {
  const { branchInfo, errors, setBranchInfo, goToNextStep, goToPreviousStep, validateCurrentStep } =
    useSignupStore();

  const canProceed = validateCurrentStep(2, false);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className='space-y-4'
    >
      <div className='relative h-max'>
        <Input
          name='pharmacyName'
          value={branchInfo.pharmacyName}
          onChange={(e) => setBranchInfo('pharmacyName', e.target.value)}
          placeholder='Pharmacy Name'
          className={`peer ps-9 ${errors.pharmacyName ? 'border-red-500' : ''}`}
        />
        <div className='text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50'>
          <BuildingIcon className='size-4' aria-hidden='true' />
        </div>
      </div>
      {errors.pharmacyName && <p className='text-red-500 text-xs'>{errors.pharmacyName}</p>}

      <div className='relative h-max'>
        <Input
          name='branchName'
          value={branchInfo.branchName}
          onChange={(e) => setBranchInfo('branchName', e.target.value)}
          placeholder='Branch Name'
          className={`peer ps-9 ${errors.branchName ? 'border-red-500' : ''}`}
        />
        <div className='text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50'>
          <BuildingIcon className='size-4' aria-hidden='true' />
        </div>
      </div>
      {errors.branchName && <p className='text-red-500 text-xs'>{errors.branchName}</p>}

      <div className='relative h-max'>
        <Input
          name='branchLocation'
          value={branchInfo.branchLocation}
          onChange={(e) => setBranchInfo('branchLocation', e.target.value)}
          placeholder='Branch Location'
          className={`peer ps-9 ${errors.branchLocation ? 'border-red-500' : ''}`}
        />
        <div className='text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50'>
          <MapPinIcon className='size-4' aria-hidden='true' />
        </div>
      </div>
      {errors.branchLocation && <p className='text-red-500 text-xs'>{errors.branchLocation}</p>}

      <div className='relative h-max'>
        <Input
          name='phone'
          value={branchInfo.phone}
          onChange={(e) => setBranchInfo('phone', e.target.value)}
          placeholder='Phone Number'
          className={`peer ps-9 ${errors.phone ? 'border-red-500' : ''}`}
        />
        <div className='text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50'>
          <PhoneIcon className='size-4' aria-hidden='true' />
        </div>
      </div>
      {errors.phone && <p className='text-red-500 text-xs'>{errors.phone}</p>}

      <div className='relative h-max'>
        <Input
          name='branchEmail'
          value={branchInfo.branchEmail}
          onChange={(e) => setBranchInfo('branchEmail', e.target.value)}
          placeholder='Branch Email (Optional)'
          type='email'
          className={`peer ps-9 ${errors.branchEmail ? 'border-red-500' : ''}`}
        />
        <div className='text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50'>
          <MailIcon className='size-4' aria-hidden='true' />
        </div>
      </div>
      {errors.branchEmail && <p className='text-red-500 text-xs'>{errors.branchEmail}</p>}

      {errors.general && <p className='text-red-500 text-sm'>{errors.general}</p>}

      <div className='flex gap-2'>
        <Button type='button' variant='outline' onClick={goToPreviousStep} className='w-full'>
          Back
        </Button>
        <Button type='button' onClick={goToNextStep} className='w-full' disabled={!canProceed}>
          Continue
        </Button>
      </div>
    </motion.div>
  );
};

// Step 3 - Review and Submit Component
const Step3Review = () => {
  const { managerInfo, branchInfo, submitSignup, goToPreviousStep, isLoading, error } =
    useSignupStore();

  const handleSubmit = async () => {
    const result = await submitSignup();

    if (result.success) {
      toast.success('Request submitted! An admin will review your application.');
      // Navigate to verify email page after successful registration
      setTimeout(() => {
        window.location.href = '/auth/login'; // Redirect to login instead of verify-email since it's a request
      }, 2000);
    } else {
      toast.error(result.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className='space-y-4'
    >
      <div className='bg-muted p-4 rounded-lg'>
        <h3 className='font-semibold mb-2 flex items-center gap-2'>
          <UserRoundIcon className='size-4' />
          Manager Information
        </h3>
        <div className='space-y-1 text-sm'>
          <p>
            <span className='font-medium'>Full Name:</span> {managerInfo.fullName}
          </p>
          <p>
            <span className='font-medium'>Email:</span> {managerInfo.email}
          </p>
          <p>
            <span className='font-medium'>Role:</span> Manager
          </p>
        </div>
      </div>

      <div className='bg-muted p-4 rounded-lg'>
        <h3 className='font-semibold mb-2 flex items-center gap-2'>
          <BuildingIcon className='size-4' />
          Pharmacy Information
        </h3>
        <div className='space-y-1 text-sm'>
          <p>
            <span className='font-medium'>Pharmacy Name:</span> {branchInfo.pharmacyName}
          </p>
          <p>
            <span className='font-medium'>Branch Name:</span> {branchInfo.branchName}
          </p>
          <p>
            <span className='font-medium'>Branch Location:</span> {branchInfo.branchLocation}
          </p>
          <p>
            <span className='font-medium'>Phone:</span> {branchInfo.phone}
          </p>
          {branchInfo.branchEmail && (
            <p>
              <span className='font-medium'>Branch Email:</span> {branchInfo.branchEmail}
            </p>
          )}
        </div>
      </div>

      {error && <p className='text-red-500 text-sm'>{error}</p>}

      <div className='flex gap-2'>
        <Button type='button' variant='outline' onClick={goToPreviousStep} className='w-full'>
          Back
        </Button>
        <Button type='button' onClick={handleSubmit} className='w-full' disabled={isLoading}>
          {isLoading ? 'Submitting Request...' : 'Submit Request'}
        </Button>
      </div>
    </motion.div>
  );
};

export function SignupPage() {
  const { currentStep, resetSignup, isSuccess } = useSignupStore();
  const navigate = useNavigate();

  // Reset the signup flow when component mounts
  useEffect(() => {
    resetSignup();
  }, [resetSignup]);

  // Handle successful registration
  useEffect(() => {
    if (isSuccess) {
      // Navigate to login
      navigate('/auth/login');
    }
  }, [isSuccess, navigate]);

  // Determine which step component to render
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1ManagerInfo />;
      case 2:
        return <Step2BranchInfo />;
      case 3:
        return <Step3Review />;
      default:
        return <Step1ManagerInfo />;
    }
  };

  // Step titles
  const stepTitles = ['Manager Information', 'Pharmacy Information', 'Review & Submit'];

  return (
    <main className='relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2'>
      <div className='bg-muted/60 relative hidden h-full flex-col border-r p-10 lg:flex'>
        <div className='from-background absolute inset-0 z-10 bg-gradient-to-t to-transparent' />
        <div className='z-10 flex items-center gap-2'>
          <img src='/logo.png' alt='PharmaCare Logo' className='size-24' />
          <p className='text-xl font-semibold'>PharmaCare</p>
        </div>
        <div className='z-10 mt-auto'>
          <blockquote className='space-y-2'>
            <p className='text-xl'>
              &ldquo;Join thousands of pharmacies managing their operations efficiently.&rdquo;
            </p>
          </blockquote>
        </div>
        <div className='absolute inset-0'>
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>
      <div className='relative flex min-h-screen flex-col justify-center p-4'>
        <div aria-hidden className='absolute inset-0 isolate contain-strict -z-10 opacity-60'>
          <div className='bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)] absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full' />
          <div className='bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 [translate:5%_-50%] rounded-full' />
          <div className='bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full' />
        </div>
        <Button variant='ghost' className='absolute top-7 left-5' asChild>
          <a href='/'>
            <ChevronLeftIcon className='size-4 me-2' />
            Home
          </a>
        </Button>
        <div className='mx-auto space-y-4 sm:w-sm'>
          <div className='flex items-center gap-2 lg:hidden'>
            <img src='/logo.png' alt='PharmaCare Logo' className='size-24' />
            <p className='text-xl font-semibold'>PharmaCare</p>
          </div>
          <div className='flex flex-col space-y-1'>
            <h1 className='font-heading text-2xl font-bold tracking-wide'>
              Request Manager Account
            </h1>
            <p className='text-muted-foreground text-base'>
              Step {currentStep} of 3: {stepTitles[currentStep - 1]}
            </p>
            {/* Progress indicator */}
            <div className='flex items-center mt-4'>
              {[1, 2, 3].map((step) => (
                <React.Fragment key={step}>
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      currentStep >= step ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    {currentStep > step ? (
                      <CheckCircleIcon className='size-4' />
                    ) : (
                      <span className='text-xs font-medium'>{step}</span>
                    )}
                  </div>
                  {step < 3 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        currentStep > step ? 'bg-primary' : 'bg-muted'
                      }`}
                    ></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Render the current step component */}
          {renderCurrentStep()}

          <div className='text-center text-sm'>
            Already have an account?{' '}
            <a
              href='/auth/login'
              className='text-muted-foreground hover:text-primary underline underline-offset-4'
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
