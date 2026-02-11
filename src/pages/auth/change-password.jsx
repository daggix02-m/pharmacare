'use client';

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FloatingPaths from '@/components/shared/FloatingPaths';
import { LockIcon, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { changePassword, login } from '@/api/auth.api';
import { useAuth } from '@/contexts/AuthContext';

export function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login: authLogin } = useAuth();

  const validatePassword = () => {
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }
    if (!/[a-z]/.test(newPassword)) {
      setError('Password must contain at least one lowercase letter');
      return false;
    }
    if (!/[0-9]/.test(newPassword)) {
      setError('Password must contain at least one number');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return false;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from current password');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validatePassword()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await changePassword(currentPassword, newPassword);

      if (response.success) {
        // Clear any password change flags
        localStorage.removeItem('requiresPasswordChange');
        
        toast.success('Password changed successfully! Logging you in...');

        // Get user email from localStorage or use the email from the current session
        const userEmail = localStorage.getItem('userEmail');
        
        if (userEmail) {
          // Automatically login with the new password
          try {
            const loginResponse = await login(userEmail, newPassword);
            
            if (loginResponse.success) {
              // Update auth context with new user data
              const userData = loginResponse.user || loginResponse.users;
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
              if (userRole === 'admin') navigate('/admin/dashboard');
              else if (userRole === 'manager') navigate('/manager/dashboard');
              else if (userRole === 'pharmacist') navigate('/pharmacist/inventory');
              else if (userRole === 'cashier') navigate('/cashier/payments');
              else navigate('/dashboard');
            } else {
              setError('Password changed but failed to auto-login. Please login manually.');
              setTimeout(() => navigate('/auth/login'), 2000);
            }
          } catch (loginError) {
            console.error('Auto-login after password change failed:', loginError);
            setError('Password changed successfully. Please login with your new password.');
            setTimeout(() => navigate('/auth/login'), 2000);
          }
        } else {
          // No email stored, redirect to login
          toast.success('Password changed successfully! Please login with your new password.');
          setTimeout(() => navigate('/auth/login'), 2000);
        }
      } else {
        setError(response.message || 'Failed to change password. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    let label = 'Weak';
    let color = 'bg-red-500';

    // Length check
    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 10;
    if (password.length >= 12) strength += 15;

    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 15;

    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 15;

    // Contains number
    if (/[0-9]/.test(password)) strength += 15;

    // Contains special character
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 5;

    if (strength <= 30) {
      label = 'Weak';
      color = 'bg-red-500';
    } else if (strength <= 60) {
      label = 'Fair';
      color = 'bg-yellow-500';
    } else if (strength <= 80) {
      label = 'Good';
      color = 'bg-blue-500';
    } else {
      label = 'Strong';
      color = 'bg-green-500';
    }

    return { strength, label, color };
  };

  const passwordStrength = getPasswordStrength(newPassword);

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
              &ldquo;Secure your account by creating a strong password. This helps protect your
              personal information and ensures the safety of our pharmacy management system.&rdquo;
            </p>
            <footer className='font-mono text-sm font-semibold'>~ Security Team, PharmaCare</footer>
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

        <div className='mx-auto space-y-6 sm:w-sm'>
          <div className='flex items-center gap-2 lg:hidden'>
            <img src='/logo.png' alt='PharmaCare Logo' className='size-24' />
            <p className='text-xl font-semibold'>PharmaCare</p>
          </div>
          <div className='flex flex-col space-y-2'>
            <h1 className='font-heading text-2xl font-bold tracking-wide'>Change Your Password</h1>
            <p className='text-muted-foreground text-base'>
              For security reasons, you must change your password before continuing.
            </p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='currentPassword'>Current Password</Label>
              <div className='relative h-max'>
                <Input
                  id='currentPassword'
                  placeholder='Enter current password'
                  className='peer ps-9'
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <div className='text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50'>
                  <LockIcon className='size-4' aria-hidden='true' />
                </div>
                <button
                  type='button'
                  onClick={() => setShowCurrent(!showCurrent)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                >
                  {showCurrent ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
                </button>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='newPassword'>New Password</Label>
              <div className='relative h-max'>
                <Input
                  id='newPassword'
                  placeholder='Enter new password'
                  className='peer ps-9'
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <div className='text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50'>
                  <LockIcon className='size-4' aria-hidden='true' />
                </div>
                <button
                  type='button'
                  onClick={() => setShowNew(!showNew)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                >
                  {showNew ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
                </button>
              </div>
              {newPassword && (
                <div className='space-y-1'>
                  <div className='flex items-center justify-between text-xs'>
                    <span className='text-muted-foreground'>Password strength:</span>
                    <span
                      className={`font-medium ${passwordStrength.strength >= 75 ? 'text-green-600' : passwordStrength.strength >= 50 ? 'text-yellow-600' : 'text-red-600'}`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className='h-1.5 w-full bg-muted rounded-full overflow-hidden'>
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.strength}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>Confirm New Password</Label>
              <div className='relative h-max'>
                <Input
                  id='confirmPassword'
                  placeholder='Confirm new password'
                  className='peer ps-9'
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <div className='text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50'>
                  <LockIcon className='size-4' aria-hidden='true' />
                </div>
                <button
                  type='button'
                  onClick={() => setShowConfirm(!showConfirm)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                >
                  {showConfirm ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
                </button>
              </div>
              {confirmPassword && newPassword === confirmPassword && (
                <p className='text-xs text-green-600 flex items-center gap-1'>
                  <CheckCircle2 className='size-3' />
                  Passwords match
                </p>
              )}
            </div>

            {error && <p className='text-red-500 text-sm'>{error}</p>}

            <Button type='submit' className='w-full' disabled={isSubmitting}>
              {isSubmitting ? 'Changing Password...' : 'Change Password'}
            </Button>
          </form>

          <div className='text-muted-foreground text-center text-sm space-y-1'>
            <p className='font-semibold'>Password requirements:</p>
            <ul className='text-xs space-y-0.5'>
              <li>• Minimum 6 characters</li>
              <li>• At least one uppercase letter</li>
              <li>• At least one lowercase letter</li>
              <li>• At least one number</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
