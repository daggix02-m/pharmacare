'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import FloatingPaths from '@/components/shared/FloatingPaths';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useSignupStore } from '@/store/useSignupStore';
import {
  ChevronLeftIcon,
  MailIcon,
  LockIcon,
  BuildingIcon,
  PhoneIcon,
  MapPinIcon,
  UserRoundIcon,
  Eye,
  EyeOff,
  ArrowRightIcon,
} from 'lucide-react';

// Animation variants for smooth transitions
const slideVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

// Reusable Input Component with Icon
const InputWithIcon = ({ icon: Icon, id, className, ...props }) => (
  <div className='relative'>
    <Input id={id} className={`peer pl-9 ${className}`} {...props} />
    <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground peer-focus:text-primary transition-colors'>
      <Icon className='size-4' />
    </div>
  </div>
);

// Step 1 - Manager Information Component
const Step1ManagerInfo = () => {
  const { managerInfo, errors, setManagerInfo, goToNextStep, validateCurrentStep } =
    useSignupStore();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const canProceed = validateCurrentStep(1, false);

  return (
    <motion.div
      variants={slideVariants}
      initial='hidden'
      animate='visible'
      exit='exit'
      transition={{ duration: 0.3 }}
    >
      <CardContent className='space-y-4 pt-4'>
        <div className='space-y-2'>
          <Label htmlFor='fullName'>Full Name</Label>
          <InputWithIcon
            id='fullName'
            icon={UserRoundIcon}
            name='fullName'
            value={managerInfo.fullName}
            onChange={(e) => setManagerInfo('fullName', e.target.value)}
            placeholder='John Doe'
            className={errors.fullName ? 'border-destructive focus-visible:ring-destructive' : ''}
          />
          {errors.fullName && (
            <p className='text-xs text-destructive font-medium'>{errors.fullName}</p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='email'>Email Address</Label>
          <InputWithIcon
            id='email'
            icon={MailIcon}
            name='email'
            type='email'
            value={managerInfo.email}
            onChange={(e) => setManagerInfo('email', e.target.value)}
            placeholder='john@example.com'
            className={errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
          />
          {errors.email && <p className='text-xs text-destructive font-medium'>{errors.email}</p>}
        </div>

        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='password'>Password</Label>
            <div className='relative'>
              <Input
                id='password'
                name='password'
                type={showPassword ? 'text' : 'password'}
                value={managerInfo.password}
                onChange={(e) => setManagerInfo('password', e.target.value)}
                placeholder='••••••••'
                className={`peer pl-9 ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              />
              <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground peer-focus:text-primary transition-colors'>
                <LockIcon className='size-4' />
              </div>
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none'
              >
                {showPassword ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
              </button>
            </div>
            {errors.password && (
              <p className='text-xs text-destructive font-medium'>{errors.password}</p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='confirmPassword'>Confirm Password</Label>
            <div className='relative'>
              <Input
                id='confirmPassword'
                name='confirmPassword'
                type={showConfirmPassword ? 'text' : 'password'}
                value={managerInfo.confirmPassword}
                onChange={(e) => setManagerInfo('confirmPassword', e.target.value)}
                placeholder='••••••••'
                className={`peer pl-9 ${errors.confirmPassword ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              />
              <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground peer-focus:text-primary transition-colors'>
                <LockIcon className='size-4' />
              </div>
              <button
                type='button'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none'
              >
                {showConfirmPassword ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className='text-xs text-destructive font-medium'>{errors.confirmPassword}</p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className='pt-2'>
        <Button onClick={goToNextStep} className='w-full' disabled={!canProceed}>
          Continue <ArrowRightIcon className='ml-2 size-4' />
        </Button>
      </CardFooter>
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
      variants={slideVariants}
      initial='hidden'
      animate='visible'
      exit='exit'
      transition={{ duration: 0.3 }}
    >
      <CardContent className='space-y-4 pt-4'>
        <div className='space-y-2'>
          <Label htmlFor='pharmacyName'>Pharmacy Name</Label>
          <InputWithIcon
            id='pharmacyName'
            icon={BuildingIcon}
            name='pharmacyName'
            value={branchInfo.pharmacyName}
            onChange={(e) => setBranchInfo('pharmacyName', e.target.value)}
            placeholder='Main Street Pharmacy'
            className={
              errors.pharmacyName ? 'border-destructive focus-visible:ring-destructive' : ''
            }
          />
          {errors.pharmacyName && (
            <p className='text-xs text-destructive font-medium'>{errors.pharmacyName}</p>
          )}
        </div>

        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='branchName'>Location Name</Label>
            <InputWithIcon
              id='branchName'
              icon={BuildingIcon}
              name='branchName'
              value={branchInfo.branchName}
              onChange={(e) => setBranchInfo('branchName', e.target.value)}
              placeholder='e.g. Downtown'
              className={
                errors.branchName ? 'border-destructive focus-visible:ring-destructive' : ''
              }
            />
            {errors.branchName && (
              <p className='text-xs text-destructive font-medium'>{errors.branchName}</p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='phone'>Phone Number</Label>
            <InputWithIcon
              id='phone'
              icon={PhoneIcon}
              name='phone'
              value={branchInfo.phone}
              onChange={(e) => setBranchInfo('phone', e.target.value)}
              placeholder='+1 (555) 000-0000'
              className={errors.phone ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {errors.phone && <p className='text-xs text-destructive font-medium'>{errors.phone}</p>}
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='branchEmail'>
            Branch Email{' '}
            <span className='text-muted-foreground text-xs font-normal'>(Optional)</span>
          </Label>
          <InputWithIcon
            id='branchEmail'
            icon={MailIcon}
            type='email'
            name='branchEmail'
            value={branchInfo.branchEmail}
            onChange={(e) => setBranchInfo('branchEmail', e.target.value)}
            placeholder='branch@pharmacy.com'
            className={
              errors.branchEmail ? 'border-destructive focus-visible:ring-destructive' : ''
            }
          />
          {errors.branchEmail && (
            <p className='text-xs text-destructive font-medium'>{errors.branchEmail}</p>
          )}
        </div>

        {errors.general && <p className='text-sm text-destructive font-medium'>{errors.general}</p>}
      </CardContent>
      <CardFooter className='flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:gap-4'>
        <Button variant='outline' onClick={goToPreviousStep} className='w-full sm:w-auto sm:flex-1'>
          Back
        </Button>
        <Button
          onClick={goToNextStep}
          className='w-full sm:w-auto sm:flex-1'
          disabled={!canProceed}
        >
          Continue <ArrowRightIcon className='ml-2 size-4' />
        </Button>
      </CardFooter>
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
      // Navigate is handled in the parent component via useEffect on isSuccess
    } else {
      toast.error(result.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <motion.div
      variants={slideVariants}
      initial='hidden'
      animate='visible'
      exit='exit'
      transition={{ duration: 0.3 }}
    >
      <CardContent className='space-y-6 pt-4'>
        <div className='rounded-lg border bg-card/50 p-4 space-y-3'>
          <div className='flex items-center gap-2 font-medium text-primary'>
            <UserRoundIcon className='size-4' />
            <h3 className='text-sm uppercase tracking-wide'>Manager Information</h3>
          </div>
          <dl className='grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2'>
            <div>
              <dt className='text-muted-foreground'>Full Name</dt>
              <dd className='font-medium'>{managerInfo.fullName}</dd>
            </div>
            <div>
              <dt className='text-muted-foreground'>Email</dt>
              <dd className='font-medium'>{managerInfo.email}</dd>
            </div>
            <div className='col-span-1 sm:col-span-2'>
              <dt className='text-muted-foreground'>Role</dt>
              <dd className='font-medium'>Manager</dd>
            </div>
          </dl>
        </div>

        <div className='rounded-lg border bg-card/50 p-4 space-y-3'>
          <div className='flex items-center gap-2 font-medium text-primary'>
            <BuildingIcon className='size-4' />
            <h3 className='text-sm uppercase tracking-wide'>Pharmacy Information</h3>
          </div>
          <dl className='grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2'>
            <div>
              <dt className='text-muted-foreground'>Pharmacy Name</dt>
              <dd className='font-medium'>{branchInfo.pharmacyName}</dd>
            </div>
            <div>
              <dt className='text-muted-foreground'>Location Name</dt>
              <dd className='font-medium'>{branchInfo.branchName}</dd>
            </div>
            <div>
              <dt className='text-muted-foreground'>Phone</dt>
              <dd className='font-medium'>{branchInfo.phone}</dd>
            </div>
            {branchInfo.branchEmail && (
              <div>
                <dt className='text-muted-foreground'>Branch Email</dt>
                <dd className='font-medium'>{branchInfo.branchEmail}</dd>
              </div>
            )}
          </dl>
        </div>

        {error && <p className='text-sm text-destructive font-medium text-center'>{error}</p>}
      </CardContent>
      <CardFooter className='flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:gap-4'>
        <Button variant='outline' onClick={goToPreviousStep} className='w-full sm:w-auto sm:flex-1'>
          Back
        </Button>
        <Button onClick={handleSubmit} className='w-full sm:w-auto sm:flex-1' disabled={isLoading}>
          {isLoading ? 'Submitting Request...' : 'Submit Request'}
        </Button>
      </CardFooter>
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
      // Delay navigation slightly for better UX
      const timer = setTimeout(() => {
        navigate('/auth/login');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

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

  return (
    <main className='grid min-h-screen w-full lg:grid-cols-2'>
      {/* Left Panel - Branding */}
      <div className='relative hidden h-full flex-col bg-muted/30 p-10 lg:flex dark:border-r'>
        <div className='absolute inset-0 bg-primary/5 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]' />
        <div className='relative z-20 flex items-center gap-2 text-lg font-medium'>
          <img src='/logo.png' alt='PharmaCare Logo' className='h-10 w-10 object-contain' />
          <span className='text-xl font-semibold tracking-tight'>PharmaCare</span>
        </div>
        <div className='relative z-20 mt-auto max-w-md'>
          <blockquote className='space-y-2'>
            <p className='text-xl font-medium leading-relaxed'>
              &ldquo;Join thousands of pharmacies managing their operations efficiently with our
              platform.&rdquo;
            </p>
          </blockquote>
        </div>
        {/* Decorative Floating Paths */}
        <div className='absolute inset-0 z-10 overflow-hidden opacity-50'>
          <FloatingPaths position={1} />
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className='flex flex-col justify-center p-6 sm:p-10 lg:p-16'>
        <div className='mx-auto w-full max-w-md space-y-6'>
          <Button
            variant='ghost'
            className='w-fit pl-0 hover:bg-transparent hover:text-primary'
            asChild
          >
            <Link to='/' className='flex items-center gap-2'>
              <ChevronLeftIcon className='size-4' />
              Back to Home
            </Link>
          </Button>

          <Card className='border-0 shadow-none sm:border sm:shadow-sm'>
            <CardHeader className='space-y-1 pb-4'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-2xl font-bold tracking-tight'>Create Account</CardTitle>
                <span className='text-sm font-medium text-muted-foreground'>
                  Step {currentStep} of 3
                </span>
              </div>
              <CardDescription>
                {currentStep === 1 && 'Enter your personal details to get started'}
                {currentStep === 2 && 'Tell us about your pharmacy branch'}
                {currentStep === 3 && 'Review your information before submitting'}
              </CardDescription>

              {/* Progress Indicator */}
              <div className='mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary'>
                <motion.div
                  className='h-full bg-primary'
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentStep / 3) * 100}%` }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                />
              </div>
            </CardHeader>

            <AnimatePresence mode='wait'>{renderCurrentStep()}</AnimatePresence>
          </Card>

          <p className='text-center text-sm text-muted-foreground'>
            Already have an account?{' '}
            <Link
              to='/auth/login'
              className='font-medium text-primary hover:underline underline-offset-4'
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
