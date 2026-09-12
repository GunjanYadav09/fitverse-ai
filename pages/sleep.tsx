import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';

export default function SleepTracker() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'log' | 'solutions'>('log');

  // Form state
  const [formData, setFormData] = useState({
    bedtime: '23:00',
    wakeTime: '07:00',
    quality: 3,
    notes: '',
  });

  // Live duration
  const [liveDuration, setLiveDuration] = useState(0);

  // Solutions state
  const [problems, setProblems] = useState<string[]>([]);
  const [problemDetails, setProblemDetails] = useState('');
  const [isNightStudier, setIsNightStudier] = useState(false);
  const [studyHoursPerDay, setStudyHoursPerDay] = useState(4);
  const [preferredStudyTime, setPreferredStudyTime] = useState('flexible');
  const [solutions, setSolutions] = useState<any[]>([]);
  const [studySchedule, setStudySchedule] = useState<any>(null);
  const [generatingSolutions, setGeneratingSolutions] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  useEffect(() => {
    const [bH, bM] = formData.bedtime.split(':').map(Number);
    const [wH, wM] = formData.wakeTime.split(':').map(Number);
    let duration = wH * 60 + wM - (bH * 60 + bM);
    if (duration < 0) duration += 24 * 60;
    setLiveDuration(duration);
  }, [formData.bedtime, formData.wakeTime]);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/sleep');
      const result = await response.json();
      if (response.ok) {
        setData(result);
        if (result.today) {
          setFormData({
            bedtime: result.today.bedtime || '23:00',
            wakeTime: result.today.wakeTime || '07:00',
            quality: result.today.quality || 3,
            notes: result.today.notes || '',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching sleep:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Sleep logged! 💤');
        await fetchData();
      } else {
        toast.error(result.message || 'Error saving');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async () => {
    if (!data?.today?._id) return;
    if (!confirm("Delete today's sleep entry?")) return;

    try {
      const response = await fetch(`/api/sleep?entryId=${data.today._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Entry deleted');
        setFormData({ bedtime: '23:00', wakeTime: '07:00', quality: 3, notes: '' });
        await fetchData();
      }
    } catch (error) {
      toast.error('Error deleting');
    }
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const getQualityLabel = (q: number) => {
    const labels = ['', 'Poor 😞', 'Fair 😕', 'Good 🙂', 'Great 😊', 'Excellent 🤩'];
    return labels[q] || '';
  };

  // ================= SOLUTIONS =================
  const problemOptions = [
    { id: 'cant-fall-asleep', label: "😴 Can't fall asleep", color: '#6366F1' },
    { id: 'wake-up-at-night', label: '🌃 Wake up during night', color: '#8B5CF6' },
    { id: 'cant-sleep-due-stress', label: '😰 Stress/anxiety', color: '#EF4444' },
    { id: 'early-morning-wake', label: '🌅 Wake up too early', color: '#F59E0B' },
    { id: 'sleepy-during-day', label: '😪 Sleepy during day', color: '#EC4899' },
    { id: 'inconsistent-schedule', label: '⏱️ Irregular schedule', color: '#14B8A6' },
    { id: 'study-affected-sleep', label: '📚 Study affects sleep', color: '#3B82F6' },
    { id: 'phone-addiction', label: '📱 Phone before bed', color: '#A855F7' },
    { id: 'caffeine-issues', label: '☕ Too much caffeine', color: '#B45309' },
  ];

  const toggleProblem = (id: string) => {
    setProblems((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const generateSolutions = async () => {
    if (problems.length === 0 && !problemDetails.trim()) {
      toast.error('Please select at least one problem or add details');
      return;
    }

    setGeneratingSolutions(true);
    setSolutions([]);
    setStudySchedule(null);

    try {
      const response = await fetch('/api/sleep/solutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problems,
          details: problemDetails,
          isNightStudier,
          studyHoursPerDay,
          preferredStudyTime,
          wakeTime: formData.wakeTime,
          bedtime: formData.bedtime,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSolutions(result.solutions || []);
        setStudySchedule(result.studySchedule || null);
        toast.success('Personalized solutions ready! 💡');
      } else {
        toast.error(result.message || 'Error generating solutions');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setGeneratingSolutions(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Layout title="Sleep Tracker">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  if (status === 'unauthenticated') return null;

  const today = data?.today;
  const goalMinutes = data?.goal?.minutes || 480;
  const goalHours = data?.goal?.hours || 8;
  const last7Days = data?.last7Days || [];
  const stats = data?.stats || {};
  const streak = data?.streak || 0;

  const todayDuration = today?.duration || 0;
  const todayPercent = Math.min(100, Math.round((todayDuration / goalMinutes) * 100));
  const goalMet = todayDuration >= goalMinutes;
  const maxDuration = Math.max(...last7Days.map((d: any) => d.duration), goalMinutes, 600);

  return (
    <Layout title="Sleep Tracker - FitVerse AI">
      <section style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div className="container">
          {/* Header with Tabs */}
          <div style={{ marginBottom: '32px' }}>
            <h1 className="section-title">😴 Sleep Tracker</h1>
            <p style={{ opacity: 0.7 }}>Track your sleep, improve your rest</p>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginTop: '20px',
                borderBottom: '1px solid rgba(0,0,0,0.1)',
                paddingBottom: '12px',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={() => setActiveTab('log')}
                style={{
                  padding: '8px 20px',
                  borderRadius: '20px',
                  border: 'none',
                  background: activeTab === 'log' ? '#6366F1' : 'transparent',
                  color: activeTab === 'log' ? 'white' : '#0F172A',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.3s',
                }}
              >
                📝 Log Sleep
              </button>
              <button
                onClick={() => setActiveTab('solutions')}
                style={{
                  padding: '8px 20px',
                  borderRadius: '20px',
                  border: 'none',
                  background: activeTab === 'solutions' ? '#6366F1' : 'transparent',
                  color: activeTab === 'solutions' ? 'white' : '#0F172A',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.3s',
                }}
              >
                💡 Get Solutions
              </button>
            </div>
          </div>

          {/* ==================== LOG TAB ==================== */}
          {activeTab === 'log' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
                {/* Today's Summary */}
                <div className="glass" style={{ padding: '32px', borderRadius: '24px' }}>
                  <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Last Night's Sleep</h3>

                  {today ? (
                    <>
                      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <div style={{ fontSize: '3.5rem', fontWeight: '800', color: goalMet ? '#22C55E' : '#6366F1' }}>
                          {formatDuration(todayDuration)}
                        </div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '4px' }}>
                          {today.bedtime} → {today.wakeTime}
                        </div>
                        {goalMet && (
                          <div
                            style={{
                              display: 'inline-block',
                              marginTop: '12px',
                              padding: '6px 16px',
                              borderRadius: '20px',
                              background: '#22C55E20',
                              color: '#22C55E',
                              fontWeight: '600',
                              fontSize: '0.9rem',
                              border: '1px solid #22C55E40',
                            }}
                          >
                            🎉 Goal Met!
                          </div>
                        )}
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                          <span style={{ opacity: 0.7 }}>Progress toward goal</span>
                          <span style={{ fontWeight: '600' }}>{todayPercent}%</span>
                        </div>
                        <div style={{ height: '10px', background: 'rgba(0,0,0,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${todayPercent}%`,
                              height: '100%',
                              background: goalMet ? '#22C55E' : 'linear-gradient(90deg, #6366F1, #8B5CF6)',
                              borderRadius: '10px',
                              transition: 'width 0.8s ease',
                            }}
                          />
                        </div>
                        <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '6px', textAlign: 'right' }}>
                          Goal: {goalHours}h
                        </p>
                      </div>

                      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                        <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: 0 }}>Sleep Quality</p>
                        <p style={{ fontSize: '1.5rem', margin: '4px 0' }}>{'⭐'.repeat(today.quality)}</p>
                        <p style={{ fontSize: '0.9rem', opacity: 0.7, margin: 0 }}>{getQualityLabel(today.quality)}</p>
                      </div>

                      {today.notes && (
                        <div style={{ padding: '12px', background: 'rgba(0,0,0,0.05)', borderRadius: '12px', fontSize: '0.9rem' }}>
                          <p style={{ margin: 0, opacity: 0.8 }}>📝 {today.notes}</p>
                        </div>
                      )}

                      <button
                        onClick={deleteEntry}
                        className="btn-outline"
                        style={{ width: '100%', marginTop: '16px', borderColor: '#EF4444', color: '#EF4444' }}
                      >
                        Delete Today's Entry
                      </button>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <span style={{ fontSize: '4rem' }}>💤</span>
                      <p style={{ opacity: 0.7, marginTop: '12px' }}>No sleep logged yet. Add your first entry!</p>
                    </div>
                  )}

                  {streak > 0 && (
                    <div
                      style={{
                        marginTop: '16px',
                        padding: '10px 20px',
                        borderRadius: '20px',
                        background: 'linear-gradient(135deg, #6366F120, #8B5CF620)',
                        display: 'inline-block',
                        border: '1px solid #6366F140',
                        width: '100%',
                        textAlign: 'center',
                      }}
                    >
                      <span style={{ fontWeight: '600' }}>
                        🔥 {streak} day{streak > 1 ? 's' : ''} streak!
                      </span>
                    </div>
                  )}
                </div>

                {/* Log Sleep Form */}
                <div className="glass" style={{ padding: '32px', borderRadius: '24px' }}>
                  <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>
                    {today ? '✏️ Update Last Night' : '🌙 Log Your Sleep'}
                  </h3>
                  <p style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '20px' }}>
                    Enter your bedtime and wake time from last night
                  </p>

                  <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px', fontSize: '0.9rem' }}>
                          🌙 Bedtime
                        </label>
                        <input
                          type="time"
                          value={formData.bedtime}
                          onChange={(e) => setFormData({ ...formData, bedtime: e.target.value })}
                          required
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '12px',
                            border: '1px solid rgba(0,0,0,0.1)',
                            background: 'rgba(255,255,255,0.5)',
                            fontSize: '1rem',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px', fontSize: '0.9rem' }}>
                          ☀️ Wake Time
                        </label>
                        <input
                          type="time"
                          value={formData.wakeTime}
                          onChange={(e) => setFormData({ ...formData, wakeTime: e.target.value })}
                          required
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '12px',
                            border: '1px solid rgba(0,0,0,0.1)',
                            background: 'rgba(255,255,255,0.5)',
                            fontSize: '1rem',
                          }}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '14px',
                        background: 'rgba(99,102,241,0.08)',
                        borderRadius: '12px',
                        marginBottom: '16px',
                        textAlign: 'center',
                        border: '1px solid rgba(99,102,241,0.15)',
                      }}
                    >
                      <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: 0 }}>Duration</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: '700', margin: '4px 0 0', color: '#6366F1' }}>
                        {formatDuration(liveDuration)}
                      </p>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px', fontSize: '0.9rem' }}>
                        ⭐ Sleep Quality
                      </label>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                        {[1, 2, 3, 4, 5].map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => setFormData({ ...formData, quality: q })}
                            style={{
                              flex: 1,
                              padding: '12px 8px',
                              borderRadius: '12px',
                              border: formData.quality === q ? '2px solid #6366F1' : '1px solid rgba(0,0,0,0.1)',
                              background: formData.quality === q ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              fontSize: '1.2rem',
                              transition: 'all 0.2s',
                            }}
                          >
                            {['😞', '😕', '🙂', '😊', '🤩'][q - 1]}
                          </button>
                        ))}
                      </div>
                      <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '6px', textAlign: 'center' }}>
                        {getQualityLabel(formData.quality)}
                      </p>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px', fontSize: '0.9rem' }}>
                        📝 Notes (optional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g., woke up twice, felt refreshed"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '12px',
                          border: '1px solid rgba(0,0,0,0.1)',
                          background: 'rgba(255,255,255,0.5)',
                          fontSize: '0.95rem',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={saving}
                      style={{
                        width: '100%',
                        padding: '14px',
                        opacity: saving ? 0.7 : 1,
                        cursor: saving ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {saving ? 'Saving...' : today ? '✏️ Update Entry' : '💾 Log Sleep'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Last 7 Days Chart */}
              <div className="glass" style={{ padding: '32px', borderRadius: '24px', marginTop: '24px' }}>
                <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>📊 Last 7 Days</h3>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '12px',
                    alignItems: 'flex-end',
                    minHeight: '180px',
                  }}
                >
                  {last7Days.map((day: any, i: number) => {
                    const isToday = i === last7Days.length - 1;
                    const barHeight = day.duration > 0 ? Math.max(20, (day.duration / maxDuration) * 130) : 8;
                    const goalLineHeight = (goalMinutes / maxDuration) * 130;
                    const barColor = day.goalMet ? '#22C55E' : day.duration > 0 ? '#6366F1' : 'rgba(0,0,0,0.1)';

                    return (
                      <div key={day.date} style={{ textAlign: 'center', position: 'relative' }}>
                        <p
                          style={{
                            fontSize: '0.75rem',
                            opacity: 0.7,
                            margin: '0 0 8px',
                            fontWeight: isToday ? '700' : '400',
                            color: isToday ? '#6366F1' : 'inherit',
                          }}
                        >
                          {day.dayName}
                        </p>

                        <div
                          style={{
                            position: 'relative',
                            height: '140px',
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              bottom: `${goalLineHeight}px`,
                              left: 0,
                              right: 0,
                              borderTop: '2px dashed rgba(99,102,241,0.3)',
                              zIndex: 1,
                            }}
                          />
                          <div
                            style={{
                              width: '70%',
                              height: `${barHeight}px`,
                              background: `linear-gradient(180deg, ${barColor}, ${barColor}cc)`,
                              borderRadius: '10px 10px 0 0',
                              transition: 'height 0.6s ease',
                              position: 'relative',
                              zIndex: 2,
                            }}
                          >
                            {day.goalMet && (
                              <span
                                style={{
                                  position: 'absolute',
                                  top: '-18px',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  fontSize: '0.8rem',
                                }}
                              >
                                ✅
                              </span>
                            )}
                          </div>
                        </div>

                        <p style={{ fontSize: '0.8rem', margin: '6px 0 0', fontWeight: '600', minHeight: '18px' }}>
                          {day.duration > 0 ? formatDuration(day.duration) : '—'}
                        </p>
                        {day.quality > 0 && (
                          <p style={{ fontSize: '0.7rem', margin: '2px 0 0', opacity: 0.6 }}>
                            {'⭐'.repeat(day.quality)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '12px', textAlign: 'center' }}>
                  Dashed line = goal ({goalHours}h)
                </p>

                {stats.entriesCount > 0 && (
                  <div
                    style={{
                      marginTop: '24px',
                      padding: '16px',
                      borderRadius: '12px',
                      background: 'rgba(99,102,241,0.08)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                      gap: '16px',
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: 0 }}>Weekly Avg</p>
                      <p style={{ fontSize: '1.4rem', fontWeight: '700', margin: '4px 0 0' }}>
                        {formatDuration(stats.avgMinutes || 0)}
                      </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: 0 }}>Avg Quality</p>
                      <p style={{ fontSize: '1.4rem', fontWeight: '700', margin: '4px 0 0' }}>
                        {stats.avgQuality || 0} ⭐
                      </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: 0 }}>Best Night</p>
                      <p style={{ fontSize: '1.4rem', fontWeight: '700', margin: '4px 0 0' }}>
                        {stats.bestDay ? formatDuration(stats.bestDay.duration) : '—'}
                      </p>
                      {stats.bestDay && (
                        <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: 0 }}>{stats.bestDay.dayName}</p>
                      )}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: 0 }}>Goals Met</p>
                      <p style={{ fontSize: '1.4rem', fontWeight: '700', margin: '4px 0 0' }}>
                        {last7Days.filter((d: any) => d.goalMet).length} / 7
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sleep Tips */}
              <div className="glass" style={{ padding: '24px', borderRadius: '20px', marginTop: '24px' }}>
                <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>💡 Better Sleep Tips</h3>
                <ul style={{ margin: 0, paddingLeft: '20px', opacity: 0.8, lineHeight: '1.8', fontSize: '0.95rem' }}>
                  <li>Stick to a consistent sleep schedule 🌙</li>
                  <li>Avoid screens 1 hour before bed 📱</li>
                  <li>Keep your room cool and dark ❄️</li>
                  <li>Avoid caffeine after 2 PM ☕</li>
                  <li>Get sunlight during the day ☀️</li>
                  <li>Aim for 7-9 hours of sleep every night 😴</li>
                </ul>
              </div>
            </>
          )}

          {/* ==================== SOLUTIONS TAB ==================== */}
          {activeTab === 'solutions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Problem Selection Card */}
              <div className="glass" style={{ padding: '32px', borderRadius: '24px' }}>
                <h3 style={{ marginBottom: '8px', fontSize: '1.3rem' }}>
                  🧠 Tell us what's troubling your sleep
                </h3>
                <p style={{ opacity: 0.7, marginBottom: '20px', fontSize: '0.95rem' }}>
                  Select all that apply — we'll give you personalized solutions
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
                  {problemOptions.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => toggleProblem(p.id)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '24px',
                        border: problems.includes(p.id)
                          ? `2px solid ${p.color}`
                          : '1px solid rgba(0,0,0,0.1)',
                        background: problems.includes(p.id) ? `${p.color}15` : 'rgba(255,255,255,0.5)',
                        color: problems.includes(p.id) ? p.color : '#0F172A',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px', fontSize: '0.95rem' }}>
                    📝 Anything else? (optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe your sleep problem in your own words..."
                    value={problemDetails}
                    onChange={(e) => setProblemDetails(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '12px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      background: 'rgba(255,255,255,0.5)',
                      fontSize: '0.95rem',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* Student Section */}
                <div
                  style={{
                    padding: '20px',
                    background: 'rgba(99,102,241,0.06)',
                    borderRadius: '16px',
                    border: '1px solid rgba(99,102,241,0.15)',
                    marginBottom: '24px',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      marginBottom: '12px',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isNightStudier}
                      onChange={(e) => setIsNightStudier(e.target.checked)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span style={{ fontWeight: '600' }}>🎓 I'm a student / study at night</span>
                  </label>

                  {isNightStudier && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '16px',
                        marginTop: '16px',
                      }}
                    >
                      <div>
                        <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px', fontSize: '0.9rem' }}>
                          Study hours per day
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={studyHoursPerDay}
                          onChange={(e) => setStudyHoursPerDay(Number(e.target.value))}
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '10px',
                            border: '1px solid rgba(0,0,0,0.1)',
                            background: 'rgba(255,255,255,0.7)',
                            fontSize: '0.95rem',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px', fontSize: '0.9rem' }}>
                          Preferred study time
                        </label>
                        <select
                          value={preferredStudyTime}
                          onChange={(e) => setPreferredStudyTime(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '10px',
                            border: '1px solid rgba(0,0,0,0.1)',
                            background: 'rgba(255,255,255,0.7)',
                            fontSize: '0.95rem',
                          }}
                        >
                          <option value="early-morning">🌅 Early Morning (5-8 AM)</option>
                          <option value="late-night">🌙 Late Night (9 PM - 12 AM)</option>
                          <option value="flexible">⚖️ Flexible</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={generateSolutions}
                  className="btn-primary"
                  disabled={generatingSolutions}
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '1rem',
                    opacity: generatingSolutions ? 0.7 : 1,
                    cursor: generatingSolutions ? 'not-allowed' : 'pointer',
                  }}
                >
                  {generatingSolutions ? '🧠 Analyzing...' : '💡 Get Personalized Solutions'}
                </button>
              </div>

              {/* Solutions Results */}
              {solutions.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '1.3rem', marginBottom: '4px' }}>✨ Your Personalized Solutions</h3>

                  {solutions.map((sol, idx) => (
                    <div
                      key={idx}
                      className="glass"
                      style={{
                        padding: '24px',
                        borderRadius: '20px',
                        borderLeft: '4px solid #6366F1',
                      }}
                    >
                      <h4
                        style={{
                          fontSize: '1.2rem',
                          marginBottom: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span style={{ fontSize: '1.5rem' }}>{sol.icon}</span>
                        {sol.title}
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8', fontSize: '0.95rem' }}>
                        {sol.tips.map((tip: string, i: number) => (
                          <li
                            key={i}
                            style={{ marginBottom: '8px' }}
                            dangerouslySetInnerHTML={{
                              __html: tip.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
                            }}
                          />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Study Schedule */}
              {studySchedule && (
                <div
                  className="glass"
                  style={{
                    padding: '32px',
                    borderRadius: '24px',
                    borderTop: '4px solid #8B5CF6',
                  }}
                >
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>{studySchedule.title}</h3>
                    <p style={{ opacity: 0.7, margin: 0 }}>{studySchedule.description}</p>
                  </div>

                  {/* Timeline */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                    {studySchedule.blocks.map((block: any, i: number) => {
                      const colors: any = {
                        high: '#22C55E',
                        medium: '#3B82F6',
                        rest: '#F59E0B',
                        health: '#EC4899',
                        sleep: '#8B5CF6',
                        critical: '#EF4444',
                      };
                      const color = colors[block.priority] || '#6366F1';

                      return (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            gap: '16px',
                            padding: '14px 18px',
                            borderRadius: '14px',
                            background: `${color}0D`,
                            borderLeft: `3px solid ${color}`,
                            flexWrap: 'wrap',
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{
                              fontWeight: '700',
                              fontSize: '0.9rem',
                              color: color,
                              minWidth: '140px',
                              fontFamily: 'monospace',
                            }}
                          >
                            {block.time}
                          </span>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <p style={{ margin: 0, fontWeight: '600', fontSize: '0.95rem' }}>
                              {block.activity}
                            </p>
                            <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: '0.85rem' }}>
                              {block.detail}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Schedule Tips */}
                  <div
                    style={{
                      padding: '20px',
                      background: 'rgba(139,92,246,0.08)',
                      borderRadius: '16px',
                      border: '1px solid rgba(139,92,246,0.15)',
                    }}
                  >
                    <h4 style={{ marginBottom: '12px', fontSize: '1rem' }}>💡 Study & Sleep Tips</h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', opacity: 0.85, lineHeight: '1.9', fontSize: '0.95rem' }}>
                      {studySchedule.tips.map((tip: string, i: number) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {solutions.length === 0 && !studySchedule && !generatingSolutions && (
                <div className="glass" style={{ padding: '40px', borderRadius: '24px', textAlign: 'center' }}>
                  <span style={{ fontSize: '4rem' }}>💡</span>
                  <h3 style={{ marginTop: '16px', marginBottom: '8px' }}>Ready for personalized solutions?</h3>
                  <p style={{ opacity: 0.7 }}>
                    Select your sleep problems above and click "Get Personalized Solutions"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}