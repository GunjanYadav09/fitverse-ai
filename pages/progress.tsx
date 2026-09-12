import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';

export default function ProgressAnalytics() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [range, setRange] = useState<'7' | '30' | '90'>('7');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') fetchData();
  }, [status, router, range]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/progress?range=${range}`);
      const result = await res.json();
      if (res.ok) setData(result);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) return '0m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  if (status === 'loading' || loading) {
    return (
      <Layout title="Progress Analytics">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: '20px' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ fontSize: '4rem' }}
          >
            📊
          </motion.div>
          <p style={{ opacity: 0.7 }}>Loading your progress...</p>
        </div>
      </Layout>
    );
  }

  if (status === 'unauthenticated') return null;

  if (!data) {
    return (
      <Layout title="Progress Analytics - FitVerse AI">
        <section style={{ paddingTop: '120px', paddingBottom: '80px' }}>
          <div className="container">
            <div className="glass" style={{ padding: '60px 20px', borderRadius: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📊</div>
              <h3 style={{ marginBottom: '8px' }}>No data available yet</h3>
              <p style={{ opacity: 0.7 }}>Start tracking to see your progress here.</p>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  const { water, sleep, workouts, nutrition, weight, consistency, insights } = data;

  const maxWater = Math.max(...water.data.map((d: any) => d.value), water.goal, 1);
  const maxSleep = Math.max(...sleep.data.map((d: any) => d.value), sleep.goal, 1);
  const maxWorkout = Math.max(...workouts.data.map((d: any) => d.minutes), 60);
  const maxCalories = Math.max(...nutrition.data.map((d: any) => d.calories), 2000);

  return (
    <Layout title="Progress Analytics - FitVerse AI">
      <section style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div className="container">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
            <h1 className="section-title">📊 Progress Analytics</h1>
            <p style={{ opacity: 0.7 }}>Your complete fitness journey at a glance</p>
          </motion.div>

          {/* Range Selector */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {(['7', '30', '90'] as const).map((r) => (
              <motion.button
                key={r}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setRange(r)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '20px',
                  border: 'none',
                  background: range === r ? '#3B82F6' : 'rgba(0,0,0,0.05)',
                  color: range === r ? 'white' : '#0F172A',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  transition: 'all 0.3s',
                }}
              >
                {r === '7' ? 'Last 7 days' : r === '30' ? 'Last 30 days' : 'Last 90 days'}
              </motion.button>
            ))}
          </div>

          {/* Top Stats Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '32px',
            }}
          >
            {[
              {
                icon: '💧',
                label: 'Avg Water',
                value: `${water.avg}ml`,
                sub: `${water.daysMet}/${water.data.length} goal days`,
                color: '#06B6D4',
              },
              {
                icon: '😴',
                label: 'Avg Sleep',
                value: formatDuration(sleep.avg),
                sub: `${sleep.daysMet}/${sleep.data.length} goal nights`,
                color: '#6366F1',
              },
              {
                icon: '🏋️',
                label: 'Workouts',
                value: workouts.total,
                sub: `${workouts.totalMinutes} min total`,
                color: '#F59E0B',
              },
              {
                icon: '🔥',
                label: 'Avg Calories',
                value: nutrition.avgCalories,
                sub: `per logged day`,
                color: '#EF4444',
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="glass"
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  borderLeft: `4px solid ${stat.color}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.5rem' }}>{stat.icon}</span>
                  <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>{stat.label}</p>
                </div>
                <p style={{ fontSize: '1.6rem', fontWeight: '700', margin: 0 }}>{stat.value}</p>
                <p style={{ fontSize: '0.8rem', opacity: 0.6, margin: '4px 0 0' }}>{stat.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Insights Card */}
          {insights && insights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass"
              style={{
                padding: '24px 28px',
                borderRadius: '20px',
                marginBottom: '32px',
                background: 'linear-gradient(135deg, #3B82F610, transparent)',
                border: '1px solid #3B82F630',
              }}
            >
              <h3 style={{ fontSize: '1.15rem', marginBottom: '12px' }}>
                💡 Insights & Recommendations
              </h3>
              <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.9' }}>
                {insights.map((insight: string, i: number) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    style={{ fontSize: '0.95rem', marginBottom: '4px' }}
                  >
                    {insight}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Consistency Grid */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>🎯 Consistency</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
              }}
            >
              {[
                { label: 'Water', value: consistency.water, color: '#06B6D4', icon: '💧' },
                { label: 'Sleep', value: consistency.sleep, color: '#6366F1', icon: '😴' },
                { label: 'Workout', value: consistency.workout, color: '#F59E0B', icon: '🏋️' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                  className="glass"
                  style={{ padding: '20px', borderRadius: '16px' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                    }}
                  >
                    <span style={{ fontWeight: '500' }}>
                      {item.icon} {item.label}
                    </span>
                    <span style={{ fontWeight: '700', color: item.color }}>{item.value}%</span>
                  </div>
                  <div
                    style={{
                      height: '10px',
                      background: 'rgba(0,0,0,0.08)',
                      borderRadius: '10px',
                      overflow: 'hidden',
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                      style={{
                        height: '100%',
                        background: item.color,
                        borderRadius: '10px',
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Water Chart */}
          <ChartCard
            title="💧 Water Intake"
            subtitle={`Goal: ${water.goal}ml/day`}
            data={water.data}
            maxValue={maxWater}
            goalValue={water.goal}
            color="#06B6D4"
            formatValue={(v: number) => `${v}ml`}
            delay={0.5}
          />

          {/* Sleep Chart */}
          <ChartCard
            title="😴 Sleep Duration"
            subtitle={`Goal: ${formatDuration(sleep.goal)}/night`}
            data={sleep.data}
            maxValue={maxSleep}
            goalValue={sleep.goal}
            color="#6366F1"
            formatValue={formatDuration}
            delay={0.55}
          />

          {/* Workout Chart */}
          <ChartCard
            title="🏋️ Workout Minutes"
            subtitle={`${workouts.total} workouts • ${workouts.totalMinutes} min • ${workouts.totalCalories} kcal burned`}
            data={workouts.data.map((d: any) => ({ ...d, value: d.minutes }))}
            maxValue={maxWorkout}
            goalValue={30}
            color="#F59E0B"
            formatValue={(v: number) => `${v}min`}
            delay={0.6}
          />

          {/* Nutrition Chart */}
          {nutrition.data.some((d: any) => d.calories > 0) && (
            <ChartCard
              title="🔥 Daily Calories"
              subtitle={`Average: ${nutrition.avgCalories} kcal`}
              data={nutrition.data.map((d: any) => ({ ...d, value: d.calories }))}
              maxValue={maxCalories}
              goalValue={2000}
              color="#EF4444"
              formatValue={(v: number) => `${v} kcal`}
              delay={0.65}
            />
          )}

          {/* Weight Progress */}
          {weight.data.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="glass"
              style={{ padding: '28px', borderRadius: '20px', marginBottom: '20px' }}
            >
              <h2 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>⚖️ Weight Progress</h2>
              <p style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '20px' }}>
                {weight.data.length} entries tracked
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '16px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ textAlign: 'center', padding: '14px', background: 'rgba(0,0,0,0.03)', borderRadius: '12px' }}>
                  <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: 0 }}>Starting</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: '700', margin: '4px 0 0' }}>
                    {weight.start}kg
                  </p>
                </div>
                <div style={{ textAlign: 'center', padding: '14px', background: 'rgba(0,0,0,0.03)', borderRadius: '12px' }}>
                  <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: 0 }}>Current</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: '700', margin: '4px 0 0' }}>
                    {weight.current}kg
                  </p>
                </div>
                <div style={{ textAlign: 'center', padding: '14px', background: 'rgba(0,0,0,0.03)', borderRadius: '12px' }}>
                  <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: 0 }}>Change</p>
                  <p
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: '700',
                      margin: '4px 0 0',
                      color: weight.change < 0 ? '#22C55E' : weight.change > 0 ? '#EF4444' : '#0F172A',
                    }}
                  >
                    {weight.change > 0 ? '+' : ''}
                    {weight.change.toFixed(1)}kg
                  </p>
                </div>
              </div>

              {/* Weight Line Chart */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px', paddingTop: '20px' }}>
                {weight.data.map((w: any, i: number) => {
                  const minW = Math.min(...weight.data.map((x: any) => x.value));
                  const maxW = Math.max(...weight.data.map((x: any) => x.value));
                  const r = maxW - minW || 1;
                  const height = ((w.value - minW) / r) * 80 + 20;
                  return (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 0.6, delay: 0.8 + i * 0.03 }}
                      style={{
                        flex: 1,
                        minWidth: '8px',
                        background: 'linear-gradient(180deg, #3B82F6, #3B82F6cc)',
                        borderRadius: '4px 4px 0 0',
                      }}
                      title={`${w.date}: ${w.value}kg`}
                    />
                  );
                })}
              </div>
              <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '8px', textAlign: 'center' }}>
                Earliest → Latest
              </p>
            </motion.div>
          )}
        </div>
      </section>
    </Layout>
  );
}

// ============================================================
// CHART COMPONENT
// ============================================================

function ChartCard({
  title,
  subtitle,
  data,
  maxValue,
  goalValue,
  color,
  formatValue,
  delay,
}: any) {
  const showLabels = data.length <= 14;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass"
      style={{ padding: '28px', borderRadius: '20px', marginBottom: '20px' }}
    >
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '4px' }}>{title}</h2>
        <p style={{ opacity: 0.7, fontSize: '0.9rem', margin: 0 }}>{subtitle}</p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: data.length > 30 ? '2px' : data.length > 14 ? '4px' : '8px',
          height: '150px',
          position: 'relative',
          paddingTop: '20px',
        }}
      >
        {/* Goal line */}
        <div
          style={{
            position: 'absolute',
            bottom: `${(goalValue / maxValue) * 110 + 40}px`,
            left: 0,
            right: 0,
            borderTop: `2px dashed ${color}60`,
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
        {data.map((d: any, i: number) => {
          const height = d.value > 0 ? Math.max(6, (d.value / maxValue) * 110) : 4;
          const hitGoal = d.value >= goalValue;

          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: 0,
              }}
            >
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${height}px` }}
                transition={{ duration: 0.6, delay: delay + i * 0.02 }}
                whileHover={{ scale: 1.05 }}
                style={{
                  width: '100%',
                  maxWidth: data.length > 30 ? '20px' : '50px',
                  background: hitGoal
                    ? 'linear-gradient(180deg, #22C55E, #22C55Ecc)'
                    : `linear-gradient(180deg, ${color}, ${color}cc)`,
                  borderRadius: '6px 6px 0 0',
                  cursor: 'pointer',
                  position: 'relative',
                }}
                title={`${d.date}: ${formatValue(d.value)}`}
              />
              {showLabels && (
                <p
                  style={{
                    fontSize: '0.7rem',
                    opacity: 0.6,
                    marginTop: '6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {d.dayName?.charAt(0) || ''}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}