'use client';

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FloatingPaths from '@/components/shared/FloatingPaths';
import { ChevronLeftIcon, LockIcon, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { resetPassword } from '@/api/auth.api';
import { validatePassword } from '@/utils/validation';

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');

  // Password strength requirements
  const passwordRequirements = [
    { text: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
    { text: 'One uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
    { text: 'One lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
    { text: 'One number', test: (pwd) => /[0-9]/.test(pwd) },
    { text: 'One special character', test: (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd) },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Reset token is missing. Please use the link from your email.');
      return;
    }

    if (!password) {
      setError('Please enter a new password.');
      return;
    }

    // Use centralized validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.error);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await resetPassword(token, password);

      if (response.success) {
        setSuccess('Password has been reset successfully. Redirecting to login...');
        setTimeout(() => {
          navigate('/auth/login');
        }, 2000);
      } else {
        setError(response.message || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
            <p className='text-xl'>&ldquo;Secure your account with a strong password.&rdquo;</p>
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
          <a href='/auth/login'>
            <ChevronLeftIcon className='size-4 me-2' />
            Back to Login
          </a>
        </Button>
        <div className='mx-auto space-y-4 sm:w-sm'>
          <div className='flex items-center gap-2 lg:hidden'>
            <img src='/logo.png' alt='PharmaCare Logo' className='size-24' />
            <p className='text-xl font-semibold'>PharmaCare</p>
          </div>
          <div className='flex flex-col space-y-1'>
            <h1 className='font-heading text-2xl font-bold tracking-wide'>Reset Password</h1>
            <p className='text-muted-foreground text-base'>Enter your new password below.</p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <div className='relative h-max'>
                <Input
                  placeholder='New Password'
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
            <div className='space-y-2'>
              <div className='relative h-max'>
                <Input
                  placeholder='Confirm New Password'
                  className={`peer ps-9 ${error && error.includes('match') ? 'border-red-500' : ''}`}
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className='space-y-2 rounded-md border bg-muted/50 p-3'>
                <p className='text-sm font-medium'>Password Requirements:</p>
                <ul className='space-y-1'>
                  {passwordRequirements.map((req, index) => (
                    <li key={index} className='flex items-center gap-2 text-xs'>
                      {req.test(password) ? (
                        <CheckCircle2 className='size-3.5 text-green-500' />
                      ) : (
                        <XCircle className='size-3.5 text-muted-foreground' />
                      )}
                      <span className={req.test(password) ? 'text-green-600' : 'text-muted-foreground'}>
                        {req.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {error && <p className='text-red-500 text-sm'>{error}</p>}
            {success && <p className='text-green-500 text-sm'>{success}</p>}

            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
