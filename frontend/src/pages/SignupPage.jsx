import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import Logo from '../components/common/Logo';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../hooks/useAuth';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, isAuthenticated, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    university: 'Stanford University',
    major: 'Computer Science',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // If already authenticated, redirect to student dashboard
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/app/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errorMessage) setErrorMessage('');
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setFieldErrors({});

    // Client-side validations
    if (formData.password !== formData.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match.' });
      return;
    }

    if (formData.password.length < 8) {
      setFieldErrors({ password: 'Password must be at least 8 characters long.' });
      return;
    }

    setIsSubmitting(true);

    try {
      await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirmPassword,
        university: formData.university,
        major: formData.major,
      });

      navigate('/app/dashboard');
    } catch (err) {
      console.error('Signup error:', err);
      if (err.data?.errors) {
        const errors = err.data.errors;
        const mappedErrors = {};
        let topMsg = err.data.message || 'Please correct the errors below.';

        for (const [key, val] of Object.entries(errors)) {
          const fieldKey = key === 'confirm_password' ? 'confirmPassword' : key;
          mappedErrors[fieldKey] = Array.isArray(val) ? val[0] : String(val);
        }
        setFieldErrors(mappedErrors);
        setErrorMessage(topMsg);
      } else if (err.message) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Unable to register at this time. Please ensure the backend server is reachable.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 py-12 relative">
      
      <div className="w-full max-w-md">
        {/* Logo & Headline */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <Logo size="lg" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-text">Create your account</h1>
          <p className="text-brand-text-secondary text-sm mt-1.5">
            Start your journey to smarter learning with SAARTHI
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-brand-surface border border-brand-border rounded-card p-6 sm:p-8 shadow-card">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-btn bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-sm text-brand-danger">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="Alex Johnson"
              icon={User}
              value={formData.name}
              onChange={handleChange('name')}
              required
              disabled={isSubmitting}
              error={fieldErrors.name}
            />
            <Input
              label="University Email"
              type="email"
              placeholder="alex.johnson@university.edu"
              icon={Mail}
              value={formData.email}
              onChange={handleChange('email')}
              required
              disabled={isSubmitting}
              error={fieldErrors.email}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Minimum 8 characters"
              icon={Lock}
              value={formData.password}
              onChange={handleChange('password')}
              required
              disabled={isSubmitting}
              error={fieldErrors.password}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
              icon={Lock}
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              required
              disabled={isSubmitting}
              error={fieldErrors.confirmPassword}
            />

            <Button
              type="submit"
              className="w-full shadow-sm font-semibold mt-2"
              size="lg"
              icon={isSubmitting ? Loader2 : ArrowRight}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Student Account'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-brand-text-secondary mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>

        <div className="text-center mt-4">
          <Link
            to="/"
            className="text-xs font-medium text-brand-text-secondary hover:text-brand-primary transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
