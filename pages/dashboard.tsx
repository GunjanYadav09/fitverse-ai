import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import Link from 'next/link';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [waterToday, setWaterToday] = useState({ total: 0, goal: 2500 });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    if (session?.user?.onboardingCompleted === false) {
      router.push('/onboarding');
    }
    if (status === 'authenticated') {
      fetchWaterToday();
    }
  }, [session, status, router]);

  const fetchWaterToday = async () => {
    try {
      const res = await fetch('/api/water');
      const data = await res.json();
      if (res.ok && data.today) {
        setWaterToday({ total: data.today.total, goal: data.today.goal });
      }
    } catch (error) {
      console.error('Error fetching water:', error);
    }
  };

  if (status === 'loading') {
    return (
      <Layout title="Loading...">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  if (status === 'unauthenticated') return null;

  const waterLiters = (waterToday.total / 1000).toFixed(1);
  const waterGoalLiters = (waterToday.goal / 1000).toFixed(1);

  const quickActions = [
    {
      icon: '🏋️',
      title: 'Generate Workout',
      subtitle: 'Personalized for you',
      href: '/workouts',
      color: '#F59E0B',
    },
    {
      icon: '📸',
      title: 'Scan Meal',
      subtitle: 'Track your nutrition',
      href: '/meal-scanner',
      color: '#22C55E',
    },
    {
      icon: '💧',
      title: 'Log Water',
      subtitle: 'Stay hydrated',
      href: '/hydration',
      color: '#06B6D4',
    },
    {
      icon: '🍕',
      title: 'Craving Converter',
      subtitle: 'Healthy alternatives',
      href: '/craving-converter',
      color: '#EF4444',
    },
    {
      icon: '🛒',
      title: 'Grocery Planner',
      subtitle: 'Smart shopping lists',
      href: '/grocery-planner',
      color: '#8B5CF6',
    },
    {
      icon: '🏥',
      title: 'Restaurant Advisor',
      subtitle: 'Healthiest menu picks',
      href: '/restaurant-advisor',
      color: '#10B981',
    },
    {
      icon: '🍽️',
      title: 'Plan Meals',
      subtitle: 'Custom meal plans',
      href: '/nutrition',
      color: '#EC4899',
    },
    {
      icon: '👤',
      title: 'My Profile',
      subtitle: 'Update details',
      href: '/profile',
      color: '#3B82F6',
    },
  ];

  const popularFeatures = [
    { icon: '📸', title: 'Meal Scanner', href: '/meal-scanner' },
    { icon: '🏋️', title: 'Workout Generator', href: '/workouts' },
    { icon: '🍽️', title: 'Meal Planner', href: '/nutrition' },
    { icon: '💧', title: 'Water Tracker', href: '/hydration' },
    { icon: '😴', title: 'Sleep Tracker', href: '/sleep' },
    { icon: '🍕', title: 'Craving Converter', href: '/craving-converter' },
    { icon: '🛒', title: 'Grocery Planner', href: '/grocery-planner' },
    { icon: '🏥', title: 'Restaurant Advisor', href: '/restaurant-advisor' },
    { icon: '📊', title: 'Progress Analytics', href: '/progress' },
    ...(session?.user?.gender === 'female'
      ? [{ icon: '🔄', title: 'Cycle Tracker', href: '/cycle' }]
      : []),
  ];

  return (
    <Layout title="Dashboard - FitVerse AI">
      <section style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div className="container">
          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '40px',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <h1 className="section-title" style={{ marginBottom: '4px' }}>
                Welcome back, {session?.user?.name || 'User'}! 👋
              </h1>
              <p style={{ opacity: 0.7 }}>Let's crush your fitness goals today!</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="btn-outline"
              style={{ padding: '8px 20px' }}
            >
              Logout
            </button>
          </motion.div>

          {/* Stats Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '24px',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass"
              style={{ padding: '24px', borderRadius: '20px' }}
            >
              <h3>🎯 Today's Goal</h3>
              <p style={{ fontSize: '2rem', marginTop: '8px' }}>87%</p>
              <p style={{ opacity: 0.7 }}>You're on track!</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass"
              style={{ padding: '24px', borderRadius: '20px' }}
            >
              <h3>🔥 Calories</h3>
              <p style={{ fontSize: '2rem', marginTop: '8px' }}>1,240</p>
              <p style={{ opacity: 0.7 }}>of 2,000 goal</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -4, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}
            >
              <Link
                href="/hydration"
                className="glass"
                style={{
                  padding: '24px',
                  borderRadius: '20px',
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block',
                }}
              >
                <h3>💧 Water</h3>
                <p style={{ fontSize: '2rem', marginTop: '8px' }}>{waterLiters}L</p>
                <p style={{ opacity: 0.7 }}>of {waterGoalLiters}L goal</p>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="glass"
              style={{ padding: '24px', borderRadius: '20px' }}
            >
              <h3>🏋️ Workouts</h3>
              <p style={{ fontSize: '2rem', marginTop: '8px' }}>5</p>
              <p style={{ opacity: 0.7 }}>This week</p>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <div style={{ marginTop: '40px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Quick Actions</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
              }}
            >
              {quickActions.map((action, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  whileHover={{ y: -6, boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }}
                >
                  <Link
                    href={action.href}
                    className="glass"
                    style={{
                      padding: '20px',
                      borderRadius: '16px',
                      display: 'block',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'all 0.3s',
                      borderLeft: `4px solid ${action.color}`,
                    }}
                  >
                    <motion.span
                      whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                      style={{ fontSize: '2rem', display: 'inline-block' }}
                    >
                      {action.icon}
                    </motion.span>
                    <p style={{ fontWeight: '600', marginTop: '8px' }}>{action.title}</p>
                    <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>{action.subtitle}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Popular Features */}
          <div style={{ marginTop: '40px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Popular Features</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
              }}
            >
              {popularFeatures.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.04 }}
                  whileHover={{ y: -3, boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}
                >
                  <Link
                    href={feature.href}
                    className="glass"
                    style={{
                      padding: '16px 20px',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>{feature.icon}</span>
                    <p style={{ fontWeight: '500', margin: 0 }}>{feature.title}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ marginTop: '40px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Recent Activity</h2>
            <div className="glass" style={{ padding: '24px', borderRadius: '20px' }}>
              <p style={{ opacity: 0.7, textAlign: 'center', padding: '20px' }}>
                Start tracking your activities to see them here! 🚀
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}