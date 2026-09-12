import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import Link from 'next/link';

export default function Explore() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

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

  const features = [
    {
      id: 1,
      icon: '📸',
      title: 'Meal Scanner',
      description: 'Upload meal photos, AI identifies food & nutrition',
      link: '/meal-scanner',
      linkText: 'Scan Meal →',
      color: '#22C55E',
    },
    {
      id: 2,
      icon: '🏋️',
      title: 'Workout Generator',
      description: 'Get personalized workouts based on your goals and fitness level',
      link: '/workouts',
      linkText: 'Generate Workout →',
      color: '#F59E0B',
    },
    {
      id: 3,
      icon: '🍽️',
      title: 'Meal Planner',
      description: 'Personalized meal plans based on your goals and preferences',
      link: '/nutrition',
      linkText: 'Plan Meals →',
      color: '#EC4899',
    },
    {
      id: 4,
      icon: '💧',
      title: 'Water Tracker',
      description: 'Stay hydrated with smart tracking and streak counter',
      link: '/hydration',
      linkText: 'Track Water →',
      color: '#06B6D4',
    },
    {
      id: 5,
      icon: '😴',
      title: 'Sleep Tracker',
      description: 'Monitor sleep, get personalized solutions & study schedules',
      link: '/sleep',
      linkText: 'Track Sleep →',
      color: '#6366F1',
    },
    {
      id: 6,
      icon: '🍕',
      title: 'Craving Converter',
      description: 'Turn unhealthy cravings into delicious healthy alternatives',
      link: '/craving-converter',
      linkText: 'Convert Craving →',
      color: '#EF4444',
    },
    {
      id: 7,
      icon: '🛒',
      title: 'Grocery Planner',
      description: 'Auto-generate smart shopping lists from your meal plans',
      link: '/grocery-planner',
      linkText: 'Generate List →',
      color: '#8B5CF6',
    },
    {
      id: 8,
      icon: '🏥',
      title: 'Restaurant Health Advisor',
      description: 'AI analyzes any restaurant menu and recommends the healthiest options',
      link: '/restaurant-advisor',
      linkText: 'Get Advice →',
      color: '#10B981',
    },
    {
      id: 9,
      icon: '📊',
      title: 'Progress Analytics',
      description: 'Beautiful charts and insights to track your journey',
      link: '/progress',
      linkText: 'View Progress →',
      color: '#3B82F6',
    },
  ];

  if (session?.user?.gender === 'female') {
    features.push({
      id: 10,
      icon: '🔄',
      title: 'Cycle Tracker',
      description: 'Track your menstrual cycle for personalized fitness insights',
      link: '/cycle',
      linkText: 'View Cycle →',
      color: '#EC4899',
    });
  }

  return (
    <Layout title="Explore - FitVerse AI">
      <section style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <h1 className="section-title" style={{ fontSize: '2.5rem' }}>
              Explore FitVerse AI 🚀
            </h1>
            <Link href="/dashboard" style={{ color: '#16A34A', fontWeight: '500' }}>
              ← Back to Dashboard
            </Link>
          </motion.div>
          <p style={{ opacity: 0.7, marginBottom: '40px', fontSize: '1.1rem' }}>
            Discover all the powerful features to supercharge your fitness journey
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '28px',
            }}
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                className="glass"
                style={{
                  padding: '28px 24px',
                  borderRadius: '24px',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  borderTop: `4px solid ${feature.color}`,
                }}
              >
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
                  transition={{ duration: 0.5 }}
                  style={{ fontSize: '2.8rem', marginBottom: '12px', display: 'inline-block' }}
                >
                  {feature.icon}
                </motion.div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '8px' }}>
                  {feature.title}
                </h3>
                <p style={{ opacity: 0.7, fontSize: '0.95rem', marginBottom: '16px' }}>
                  {feature.description}
                </p>
                <Link
                  href={feature.link}
                  style={{
                    color: feature.color,
                    fontWeight: '600',
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  {feature.linkText}
                </Link>
              </motion.div>
            ))}
          </div>

          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            <Link href="/profile" className="btn-primary" style={{ display: 'inline-block' }}>
              Complete Your Profile
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}