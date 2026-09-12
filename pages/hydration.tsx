import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';

export default function WaterTracker() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [data, setData] = useState<any>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/water');
      const result = await response.json();
      if (response.ok) {
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching water data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addWater = async (amount: number) => {
    if (adding) return;
    setAdding(true);

    try {
      const response = await fetch('/api/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`+${amount}ml added! 💧`);
        await fetchData();
      } else {
        toast.error(result.message || 'Error adding water');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setAdding(false);
    }
  };

  const removeEntry = async (entryId: string, amount: number) => {
    try {
      const response = await fetch(`/api/water?entryId=${entryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(`Removed ${amount}ml`);
        await fetchData();
      }
    } catch (error) {
      toast.error('Error removing entry');
    }
  };

  const addCustom = () => {
    const amt = Number(customAmount);
    if (!amt || amt <= 0 || amt > 2000) {
      toast.error('Please enter a valid amount (1-2000ml)');
      return;
    }
    addWater(amt);
    setCustomAmount('');
    setShowCustom(false);
  };

  if (status === 'loading' || loading) {
    return (
      <Layout title="Water Tracker">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  if (status === 'unauthenticated') return null;

  const today = data?.today || { total: 0, goal: 2500, percentage: 0, entries: [] };
  const last7Days = data?.last7Days || [];
  const streak = data?.streak || 0;
  const percentage = today.percentage;
  const remaining = Math.max(0, today.goal - today.total);
  const goalMet = today.total >= today.goal;

  // Progress ring
  const ringSize = 220;
  const strokeWidth = 16;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const ringColor = goalMet ? '#22C55E' : percentage >= 50 ? '#3B82F6' : '#06B6D4';

  return (
    <Layout title="Water Tracker - FitVerse AI">
      <section style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div className="container">
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1 className="section-title">💧 Water Tracker</h1>
            <p style={{ opacity: 0.7 }}>Stay hydrated, stay healthy</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
            {/* Progress Ring Card */}
            <div className="glass" style={{ padding: '32px', borderRadius: '24px', textAlign: 'center' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Today's Progress</h3>

              <div style={{ position: 'relative', width: ringSize, height: ringSize, margin: '0 auto' }}>
                <svg width={ringSize} height={ringSize} style={{ transform: 'rotate(-90deg)' }}>
                  {/* Background circle */}
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(0,0,0,0.08)"
                    strokeWidth={strokeWidth}
                  />
                  {/* Progress circle */}
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={radius}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{
                      transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s ease',
                    }}
                  />
                </svg>
                {/* Center content */}
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: '800', color: ringColor }}>
                    {percentage}%
                  </span>
                  <span style={{ fontSize: '0.95rem', opacity: 0.7, marginTop: '4px' }}>
                    {today.total} / {today.goal} ml
                  </span>
                  {goalMet && (
                    <span style={{ fontSize: '0.85rem', color: '#22C55E', marginTop: '8px', fontWeight: '600' }}>
                      🎉 Goal Met!
                    </span>
                  )}
                </div>
              </div>

              {/* Streak */}
              {streak > 0 && (
                <div style={{
                  marginTop: '20px',
                  padding: '10px 20px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #F59E0B20, #EF444420)',
                  display: 'inline-block',
                  border: '1px solid #F59E0B40',
                }}>
                  <span style={{ fontWeight: '600' }}>
                    🔥 {streak} day{streak > 1 ? 's' : ''} streak!
                  </span>
                </div>
              )}

              {!goalMet && (
                <p style={{ marginTop: '16px', fontSize: '0.9rem', opacity: 0.7 }}>
                  {remaining}ml left to reach your goal
                </p>
              )}
            </div>

            {/* Add Water Card */}
            <div className="glass" style={{ padding: '32px', borderRadius: '24px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Add Water</h3>
              <p style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '16px' }}>
                Tap a button below to log your intake
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <button
                  onClick={() => addWater(250)}
                  disabled={adding}
                  className="glass"
                  style={{
                    padding: '20px', borderRadius: '16px',
                    border: '2px solid rgba(6,182,212,0.3)',
                    cursor: adding ? 'not-allowed' : 'pointer',
                    background: 'rgba(6,182,212,0.08)',
                    transition: 'all 0.2s',
                    opacity: adding ? 0.6 : 1,
                  }}
                >
                  <div style={{ fontSize: '1.8rem' }}>🥤</div>
                  <div style={{ fontWeight: '600', marginTop: '4px' }}>250ml</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Glass</div>
                </button>

                <button
                  onClick={() => addWater(500)}
                  disabled={adding}
                  className="glass"
                  style={{
                    padding: '20px', borderRadius: '16px',
                    border: '2px solid rgba(6,182,212,0.3)',
                    cursor: adding ? 'not-allowed' : 'pointer',
                    background: 'rgba(6,182,212,0.08)',
                    transition: 'all 0.2s',
                    opacity: adding ? 0.6 : 1,
                  }}
                >
                  <div style={{ fontSize: '1.8rem' }}>🍶</div>
                  <div style={{ fontWeight: '600', marginTop: '4px' }}>500ml</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Bottle</div>
                </button>

                <button
                  onClick={() => addWater(750)}
                  disabled={adding}
                  className="glass"
                  style={{
                    padding: '20px', borderRadius: '16px',
                    border: '2px solid rgba(6,182,212,0.3)',
                    cursor: adding ? 'not-allowed' : 'pointer',
                    background: 'rgba(6,182,212,0.08)',
                    transition: 'all 0.2s',
                    opacity: adding ? 0.6 : 1,
                  }}
                >
                  <div style={{ fontSize: '1.8rem' }}>🧴</div>
                  <div style={{ fontWeight: '600', marginTop: '4px' }}>750ml</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Large</div>
                </button>

                <button
                  onClick={() => addWater(1000)}
                  disabled={adding}
                  className="glass"
                  style={{
                    padding: '20px', borderRadius: '16px',
                    border: '2px solid rgba(6,182,212,0.3)',
                    cursor: adding ? 'not-allowed' : 'pointer',
                    background: 'rgba(6,182,212,0.08)',
                    transition: 'all 0.2s',
                    opacity: adding ? 0.6 : 1,
                  }}
                >
                  <div style={{ fontSize: '1.8rem' }}>💧</div>
                  <div style={{ fontWeight: '600', marginTop: '4px' }}>1000ml</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>1 Liter</div>
                </button>
              </div>

              {/* Custom Amount */}
              {!showCustom ? (
                <button
                  onClick={() => setShowCustom(true)}
                  className="btn-outline"
                  style={{ width: '100%', padding: '12px' }}
                >
                  ⚙️ Custom Amount
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    placeholder="Enter ml (1-2000)"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustom()}
                    style={{
                      flex: 1, padding: '12px', borderRadius: '12px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      background: 'rgba(255,255,255,0.5)', fontSize: '1rem',
                    }}
                    autoFocus
                  />
                  <button onClick={addCustom} className="btn-primary" style={{ padding: '12px 20px' }}>
                    Add
                  </button>
                  <button
                    onClick={() => { setShowCustom(false); setCustomAmount(''); }}
                    className="btn-outline"
                    style={{ padding: '12px 16px' }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Today's Log */}
              {today.entries.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <p style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '8px' }}>
                    Today's Log ({today.entries.length}):
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {today.entries.map((e: any) => (
                      <span
                        key={e._id}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '4px 12px', borderRadius: '16px',
                          background: 'rgba(6,182,212,0.1)',
                          border: '1px solid rgba(6,182,212,0.2)',
                          fontSize: '0.85rem',
                        }}
                      >
                        {e.amount}ml
                        <button
                          onClick={() => removeEntry(e._id, e.amount)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#EF4444', fontWeight: 'bold', padding: 0, fontSize: '1rem',
                          }}
                          title="Remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Last 7 Days */}
          <div className="glass" style={{ padding: '32px', borderRadius: '24px', marginTop: '24px' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>📊 Last 7 Days</h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '12px',
            }}>
              {last7Days.map((day: any, i: number) => {
                const pct = Math.min(100, Math.round((day.total / today.goal) * 100));
                const isToday = i === last7Days.length - 1;
                const height = Math.max(8, pct * 1.2);
                const barColor = day.goalMet ? '#22C55E' : pct >= 50 ? '#3B82F6' : '#06B6D4';

                return (
                  <div key={day.date} style={{ textAlign: 'center' }}>
                    <p style={{
                      fontSize: '0.75rem', opacity: 0.7, margin: '0 0 8px',
                      fontWeight: isToday ? '700' : '400',
                      color: isToday ? '#16A34A' : 'inherit',
                    }}>
                      {day.dayName}
                    </p>
                    <div style={{
                      position: 'relative',
                      height: '120px',
                      background: 'rgba(0,0,0,0.05)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'flex-end',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: '100%',
                        height: `${height}px`,
                        maxHeight: '120px',
                        background: `linear-gradient(180deg, ${barColor}, ${barColor}cc)`,
                        borderRadius: '12px 12px 0 0',
                        transition: 'height 0.6s ease',
                        position: 'relative',
                      }}>
                        {day.goalMet && (
                          <span style={{
                            position: 'absolute', top: '4px', left: '50%',
                            transform: 'translateX(-50%)', fontSize: '0.75rem',
                          }}>
                            ✅
                          </span>
                        )}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.75rem', margin: '6px 0 0', fontWeight: '600' }}>
                      {day.total}
                    </p>
                    <p style={{ fontSize: '0.7rem', margin: 0, opacity: 0.5 }}>ml</p>
                  </div>
                );
              })}
            </div>

            {/* Weekly Summary */}
            <div style={{
              marginTop: '24px',
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(6,182,212,0.08)',
              display: 'flex',
              justifyContent: 'space-around',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: 0 }}>Total This Week</p>
                <p style={{ fontSize: '1.4rem', fontWeight: '700', margin: '4px 0 0' }}>
                  {last7Days.reduce((s: number, d: any) => s + d.total, 0)} ml
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: 0 }}>Daily Average</p>
                <p style={{ fontSize: '1.4rem', fontWeight: '700', margin: '4px 0 0' }}>
                  {Math.round(last7Days.reduce((s: number, d: any) => s + d.total, 0) / 7)} ml
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: 0 }}>Goals Met</p>
                <p style={{ fontSize: '1.4rem', fontWeight: '700', margin: '4px 0 0' }}>
                  {last7Days.filter((d: any) => d.goalMet).length} / 7
                </p>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="glass" style={{ padding: '24px', borderRadius: '20px', marginTop: '24px' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>💡 Hydration Tips</h3>
            <ul style={{ margin: 0, paddingLeft: '20px', opacity: 0.8, lineHeight: '1.8', fontSize: '0.95rem' }}>
              <li>Start your day with a glass of water 💧</li>
              <li>Drink a glass before each meal 🥤</li>
              <li>Keep a water bottle with you always 🍶</li>
              <li>Drink more during workouts 🏋️</li>
              <li>Listen to your body — thirst is a sign! ⚠️</li>
            </ul>
          </div>
        </div>
      </section>
    </Layout>
  );
}