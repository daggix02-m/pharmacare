import React, { Component } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in component tree
 * and displays a fallback UI
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    console.error('Error Boundary caught an error:', error, errorInfo);

    // You can also log to an error reporting service here
    // Example: logErrorToService(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    // Get user from localStorage
    const userStr = localStorage.getItem('user');
    let user = null;

    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Failed to parse user data from localStorage:', error);
      user = null;
    }

    if (!user || !user.role) {
      window.location.href = '/login';
      return;
    }

    // Navigate to appropriate dashboard based on user's role
    const roleDashboards = {
      admin: '/admin/dashboard',
      manager: '/manager/dashboard',
      pharmacist: '/pharmacist/dashboard',
      cashier: '/cashier/dashboard',
    };

    const dashboardPath = roleDashboards[user.role] || '/login';
    window.location.href = dashboardPath;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
          <div className='max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center'>
            <div className='mb-4 flex justify-center'>
              <div className='bg-red-100 p-3 rounded-full'>
                <AlertTriangle className='h-12 w-12 text-red-600' />
              </div>
            </div>

            <h1 className='text-2xl font-bold text-gray-900 mb-2'>Something went wrong</h1>

            <p className='text-gray-600 mb-6'>
              We apologize for the inconvenience. An unexpected error has occurred.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className='mb-6 p-4 bg-gray-100 rounded-lg text-left'>
                <p className='text-xs font-mono text-red-600 break-all'>
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className='flex gap-3 justify-center'>
              <Button onClick={this.handleReset} variant='outline'>
                Try Again
              </Button>
              <Button onClick={this.handleGoHome}>Go to Home</Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
