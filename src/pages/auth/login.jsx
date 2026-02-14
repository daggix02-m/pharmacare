'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FloatingPaths from '@/components/shared/FloatingPaths';
import { AppleIcon, AtSignIcon, GithubIcon, LockIcon, Eye, EyeOff } from 'lucide-react';
import { login } from '@/api/auth.api';
import { toast } from 'sonner';
import { validateEmail } from '@/utils/validation';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setError(emailValidation.error);
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    // Production mode: Normal API authentication
    try {
      const response = await login(email, password);

      if (!response.success) {
        // Provide more specific error messages based on the response
        let errorMessage =
          response.message || 'Login failed. Please check your credentials and try again.';

        // Check for CORS-related errors
        if (errorMessage.includes('CORS') || errorMessage.includes('cross-origin')) {
          errorMessage =
            'Connection error: Unable to reach the authentication server. This may be due to network restrictions or browser security settings. Please try using a different browser or network.';
        } else if (errorMessage.includes('Network error')) {
          errorMessage =
            'Network error: Unable to connect to the authentication server. Please check your internet connection and try again.';
        } else if (errorMessage.includes('took too long') || errorMessage.includes('cancelled')) {
          errorMessage =
            'Connection timeout: The server is taking too long to respond. Please check your internet connection and try again. If the problem persists, please contact support.';
        } else if (
          errorMessage.includes('Too many login attempts') ||
          errorMessage.includes('Too many requests')
        ) {
          errorMessage =
            'Too many login attempts. Please wait 15 minutes before trying again. This is for your account security.';
        } else if (errorMessage.includes('pending admin activation')) {
          errorMessage =
            'Your account is pending approval from an administrator. You will receive an email once your account is activated.';
        } else if (
          errorMessage.includes('not activated') ||
          errorMessage.includes('verify your email')
        ) {
          errorMessage =
            'Your account is not yet active. Please verify your email or contact your manager for assistance.';
        }

        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      // Check if user needs to change password (first time login or temporary password)
      // Backend returns "requiresPasswordChange" or "mustChangePassword" boolean
      if (response.requiresPasswordChange || response.mustChangePassword) {
        toast.info('Please change your password to continue.');
        navigate('/auth/change-password');
        return;
      }

      // Update Auth Context
      const userData = response.user || response.users;
      const userRole = localStorage.getItem('userRole');

      if (userData) {
        authLogin({
          id: userData.id || userData.user_id,
          email: userData.email,
          full_name: userData.full_name,
          role_id: userData.role_id,
          branch_id: userData.branch_id,
          role: userRole,
        });
      }

      // Redirect based on role
      toast.success('Login successful!');

      if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else if (userRole === 'manager') {
        navigate('/manager/dashboard');
      } else if (userRole === 'pharmacist') {
        navigate('/pharmacist/dashboard');
      } else if (userRole === 'cashier') {
        navigate('/cashier/dashboard');
      } else {
        navigate('/dashboard'); // default fallback
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    toast.info(`${provider} login is coming soon!`);
  };

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
              &ldquo;PharmaCare transformed how we manage our pharmacy. Inventory tracking is now
              automated, prescription processing is seamless, and our team can focus on patient care
              instead of paperwork.&rdquo;
            </p>
            <footer className='font-mono text-sm font-semibold'>
              ~ Dr. Mekdes Hailu, Pharmacy Manager
            </footer>
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

        <div className='mx-auto space-y-4 sm:w-sm'>
          <div className='flex items-center gap-2 lg:hidden'>
            <img src='/logo.png' alt='PharmaCare Logo' className='size-24' />
            <p className='text-xl font-semibold'>PharmaCare</p>
          </div>
          <div className='flex flex-col space-y-1'>
            <h1 className='font-heading text-2xl font-bold tracking-wide'>Welcome Back!</h1>
            <p className='text-muted-foreground text-base'>Login to your PharmaCare account.</p>
          </div>

          <div className='space-y-2'>
            <Button
              type='button'
              size='lg'
              className='w-full'
              onClick={() => handleSocialLogin('Google')}
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='currentColor'
                className='size-4 me-2'
              >
                <g>
                  <path d='M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669   C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62   c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401   c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z' />
                </g>
              </svg>
              Continue with Google
            </Button>
            <Button
              type='button'
              size='lg'
              className='w-full'
              onClick={() => handleSocialLogin('Apple')}
            >
              <AppleIcon className='size-4 me-2' />
              Continue with Apple
            </Button>
            <Button
              type='button'
              size='lg'
              className='w-full'
              onClick={() => handleSocialLogin('GitHub')}
            >
              <GithubIcon className='size-4 me-2' />
              Continue with GitHub
            </Button>
          </div>

          <div className='flex w-full items-center justify-center'>
            <div className='bg-border h-px w-full' />
            <span className='text-muted-foreground px-2 text-xs'>OR</span>
            <div className='bg-border h-px w-full' />
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <div className='relative h-max'>
                <Input
                  placeholder='your.email@example.com'
                  className={`peer ps-9 ${error && (error.includes('Email') || error.includes('email')) ? 'border-red-500' : ''}`}
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className='text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50'>
                  <AtSignIcon className='size-4' aria-hidden='true' />
                </div>
              </div>
            </div>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                  Password
                </label>
                <a
                  href='/auth/forgot-password'
                  className='text-xs underline-offset-4 hover:underline'
                >
                  Forgot password?
                </a>
              </div>
              <div className='relative h-max'>
                <Input
                  placeholder='Password'
                  className={`peer ps-9 ${error && error.includes('Password') ? 'border-red-500' : ''}`}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            </div>

            {error && <p className='text-red-500 text-sm'>{error}</p>}

            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className='flex items-center justify-between text-sm'>
            <a
              href='/auth/signup'
              className='text-muted-foreground hover:text-primary underline underline-offset-4'
            >
              Create Account
            </a>
          </div>

          <p className='text-muted-foreground mt-8 text-center text-sm'>
            By clicking continue, you agree to our{' '}
            <a href='#' className='hover:text-primary underline underline-offset-4'>
              Terms of Service
            </a>{' '}
            and{' '}
            <a href='#' className='hover:text-primary underline underline-offset-4'>
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
