'use client';

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FloatingPaths from '@/components/shared/FloatingPaths';
import { MailIcon, AtSignIcon } from 'lucide-react';
import { verifyEmail, resendVerification } from '@/api/auth.api';
import { toast } from 'sonner';

export function VerifyEmailPage() {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!verificationCode.trim()) {
      setError('Please enter the verification code.');
      return;
    }

    if (verificationCode.length !== 6) {
      setError('Verification code must be 6 digits.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await verifyEmail(email, verificationCode);

      if (!response.success) {
        setError(response.message || 'Verification failed. Please check your code and try again.');
        setIsLoading(false);
        return;
      }

      toast.success('Email verified successfully! You can now login.');
      navigate('/auth/login');
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!validateEmail(email)) {
      setError('Please enter a valid email address to resend verification.');
      return;
    }

    setIsResending(true);
    setError('');

    try {
      const response = await resendVerification(email);

      if (response.success) {
        toast.success('Verification code sent successfully!');
      } else {
        setError(response.message || 'Failed to resend verification code.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while resending the code.');
    } finally {
      setIsResending(false);
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
            <p className='text-xl'>
              &ldquo;Verify your account to start managing your pharmacy operations securely.&rdquo;
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

        <div className='mx-auto space-y-4 sm:w-sm'>
          <div className='flex items-center gap-2 lg:hidden'>
            <img src='/logo.png' alt='PharmaCare Logo' className='size-24' />
            <p className='text-xl font-semibold'>PharmaCare</p>
          </div>
          <div className='flex flex-col space-y-1'>
            <h1 className='font-heading text-2xl font-bold tracking-wide'>Verify Your Email</h1>
            <p className='text-muted-foreground text-base'>Enter the verification code sent to your email.</p>
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
              <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                Verification Code
              </label>
              <div className='relative h-max'>
                <Input
                  placeholder='Enter 6-digit code'
                  className={`peer ps-9 ${error && error.includes('code') ? 'border-red-500' : ''}`}
                  type='text'
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                />
                <div className='text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50'>
                  <MailIcon className='size-4' aria-hidden='true' />
                </div>
              </div>
            </div>

            {error && <p className='text-red-500 text-sm'>{error}</p>}

            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </Button>
          </form>

          <div className='text-center'>
            <Button
              variant='link'
              className='text-xs'
              onClick={handleResendCode}
              disabled={isResending}
            >
              {isResending ? 'Sending...' : 'Resend Verification Code'}
            </Button>
          </div>

          <div className='flex items-center justify-between text-sm'>
            <a
              href='/auth/login'
              className='text-muted-foreground hover:text-primary underline underline-offset-4'
            >
              Back to Login
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}