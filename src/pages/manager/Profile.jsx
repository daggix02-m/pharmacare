import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Navigation from '@/components/layout/Navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { getProfile, updateProfile, changePassword } from '@/api/auth.api';
import {
  User,
  Mail,
  Lock,
  Camera,
  Save,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

const ManagerProfile = () => {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    profile_picture: null,
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await getProfile();
      if (response.success && response.user) {
        setProfileData({
          full_name: response.user.full_name || '',
          email: response.user.email || '',
          profile_picture: response.user.profile_picture || null,
        });
        if (response.user.profile_picture) {
          setProfilePicturePreview(response.user.profile_picture);
        }
      } else {
        toast.error('Failed to load profile data');
      }
    } catch (error) {
      toast.error('An error occurred while loading profile');
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
        setProfileData({ ...profileData, profile_picture: file });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const formData = new FormData();
      formData.append('full_name', profileData.full_name);
      formData.append('email', profileData.email);
      
      if (profileData.profile_picture instanceof File) {
        formData.append('profile_picture', profileData.profile_picture);
      }

      const response = await updateProfile(formData);

      if (response.success) {
        toast.success('Profile updated successfully');
        
        // Update auth context with new data
        if (response.user) {
          login({
            id: response.user.id,
            email: response.user.email,
            full_name: response.user.full_name,
            role_id: response.user.role_id,
            branch_id: response.user.branch_id,
            role: user?.role,
          });
        }
      } else {
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('An error occurred while updating profile');
      console.error('Error updating profile:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    // Validate passwords
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);

    try {
      const response = await changePassword(
        passwordData.current_password,
        passwordData.new_password
      );

      if (response.success) {
        toast.success('Password changed successfully');
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: '',
        });
      } else {
        toast.error(response.message || 'Failed to change password');
      }
    } catch (error) {
      toast.error('An error occurred while changing password');
      console.error('Error changing password:', error);
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950'>
      <Navigation />

      <main className='max-w-4xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          {/* Header */}
          <div className='mb-6'>
            <h1 className='text-3xl font-bold text-slate-900 dark:text-slate-50'>
              Profile Settings
            </h1>
            <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>
              Manage your account settings and preferences
            </p>
          </div>

          <div className='space-y-6'>
            {/* Profile Information Card */}
            <Card className='bg-white/80 backdrop-blur-sm border-slate-200 dark:bg-slate-900/80 dark:border-slate-800'>
              <CardHeader>
                <CardTitle className='text-slate-900 dark:text-slate-50 flex items-center gap-2'>
                  <ShieldCheck className='h-5 w-5 text-blue-600' />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information and profile picture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className='space-y-6'>
                  {/* Profile Picture */}
                  <div className='flex items-center space-x-6'>
                    <div className='relative'>
                      <div className='h-24 w-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-slate-200 dark:border-slate-700'>
                        {profilePicturePreview ? (
                          <img
                            src={profilePicturePreview}
                            alt='Profile'
                            className='h-full w-full object-cover'
                          />
                        ) : (
                          <User className='h-12 w-12 text-slate-400' />
                        )}
                      </div>
                      <label
                        htmlFor='profile-picture'
                        className='absolute bottom-0 right-0 p-1 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-700 transition-colors'
                      >
                        <Camera className='h-4 w-4 text-white' />
                      </label>
                      <input
                        id='profile-picture'
                        type='file'
                        accept='image/*'
                        onChange={handleProfilePictureChange}
                        className='hidden'
                      />
                    </div>
                    <div className='flex-1'>
                      <h3 className='text-sm font-medium text-slate-900 dark:text-slate-50'>
                        Profile Picture
                      </h3>
                      <p className='text-xs text-slate-600 dark:text-slate-400 mt-1'>
                        JPG, PNG or GIF. Max size 5MB
                      </p>
                    </div>
                  </div>

                  <Separator />
                  
                  {/* Name Field */}
                  <div className='space-y-2'>
                    <Label htmlFor='full_name'>Full Name</Label>
                    <div className='relative'>
                      <User className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400' />
                      <Input
                        id='full_name'
                        type='text'
                        value={profileData.full_name}
                        onChange={(e) =>
                          setProfileData({ ...profileData, full_name: e.target.value })
                        }
                        className='pl-10'
                        placeholder='Enter your full name'
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Email Field */}
                  <div className='space-y-2'>
                    <Label htmlFor='email'>Email Address</Label>
                    <div className='relative'>
                      <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400' />
                      <Input
                        id='email'
                        type='email'
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData({ ...profileData, email: e.target.value })
                        }
                        className='pl-10'
                        placeholder='Enter your email'
                        required
                      />
                    </div>
                  </div>

                  <div className='flex justify-end'>
                    <Button
                      type='submit'
                      disabled={updating}
                      className='bg-blue-600 hover:bg-blue-700'
                    >
                      {updating ? (
                        <>
                          <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className='h-4 w-4 mr-2' />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card className='bg-white/80 backdrop-blur-sm border-slate-200 dark:bg-slate-900/80 dark:border-slate-800'>
              <CardHeader>
                <CardTitle className='text-slate-900 dark:text-slate-50 flex items-center gap-2'>
                  <Lock className='h-5 w-5 text-blue-600' />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className='space-y-6'>
                  {/* Current Password */}
                  <div className='space-y-2'>
                    <Label htmlFor='current_password'>Current Password</Label>
                    <div className='relative'>
                      <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400' />
                      <Input
                        id='current_password'
                        type='password'
                        value={passwordData.current_password}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            current_password: e.target.value,
                          })
                        }
                        className='pl-10'
                        placeholder='Enter current password'
                        required
                      />
                    </div>
                  </div>
                  
                  {/* New Password */}
                  <div className='space-y-2'>
                    <Label htmlFor='new_password'>New Password</Label>
                    <div className='relative'>
                      <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400' />
                      <Input
                        id='new_password'
                        type='password'
                        value={passwordData.new_password}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            new_password: e.target.value,
                          })
                        }
                        className='pl-10'
                        placeholder='Enter new password'
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className='space-y-2'>
                    <Label htmlFor='confirm_password'>Confirm New Password</Label>
                    <div className='relative'>
                      <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400' />
                      <Input
                        id='confirm_password'
                        type='password'
                        value={passwordData.confirm_password}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirm_password: e.target.value,
                          })
                        }
                        className='pl-10'
                        placeholder='Confirm new password'
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className='flex justify-end'>
                    <Button
                      type='submit'
                      disabled={changingPassword}
                      className='bg-blue-600 hover:bg-blue-700'
                    >
                      {changingPassword ? (
                        <>
                          <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                          Changing...
                        </>
                      ) : (
                        <>
                          <Save className='h-4 w-4 mr-2' />
                          Change Password
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManagerProfile;
