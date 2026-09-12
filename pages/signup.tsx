import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';

export default function Signup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Account created! Please login.');
        setTimeout(() => router.push('/login'), 1500);
      } else {
        toast.error(data.message || 'Something went wrong');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  return (
    <Layout title="Sign Up - FitVerse AI">
      <section style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div className="container" style={{ maxWidth: '480px', margin: '0 auto' }}>
          <div className="glass" style={{ padding: '40px', borderRadius: '32px' }}>
            <h1 className="section-title" style={{ textAlign: 'center', fontSize: '2rem' }}>
              Create Account
            </h1>
            <p style={{ textAlign: 'center', marginBottom: '24px', opacity: 0.7 }}>
              Start your health journey with FitVerse AI
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: errors.fullName ? '1px solid #ef4444' : '1px solid rgba(0,0,0,0.1)',
                    background: 'rgba(255,255,255,0.5)',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s',
                  }}
                />
                {errors.fullName && (
                  <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '4px' }}>
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: errors.email ? '1px solid #ef4444' : '1px solid rgba(0,0,0,0.1)',
                    background: 'rgba(255,255,255,0.5)',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s',
                  }}
                />
                {errors.email && (
                  <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '4px' }}>
                    {errors.email}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <input
                  type="password"
                  name="password"
                  placeholder="Password (min 6 characters)"
                  value={formData.password}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: errors.password ? '1px solid #ef4444' : '1px solid rgba(0,0,0,0.1)',
                    background: 'rgba(255,255,255,0.5)',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s',
                  }}
                />
                {errors.password && (
                  <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '4px' }}>
                    {errors.password}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: errors.confirmPassword ? '1px solid #ef4444' : '1px solid rgba(0,0,0,0.1)',
                    background: 'rgba(255,255,255,0.5)',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s',
                  }}
                />
                {errors.confirmPassword && (
                  <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '4px' }}>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{
                  width: '100%',
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '16px' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#16A34A', fontWeight: '600' }}>
                Login
              </Link>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}