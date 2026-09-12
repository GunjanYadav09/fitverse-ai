import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';

export default function Workouts() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [workout, setWorkout] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('generate');
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    if (status === 'authenticated') {
      fetchHistory();
    }
  }, [status, router]);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/workouts');
      const data = await response.json();
      if (response.ok) {
        setHistory(data.workouts || []);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const generateWorkout = async () => {
    setGenerating(true);
    setWorkout(null);
    setCompletedExercises([]);

    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' }),
      });

      const data = await response.json();

      if (response.ok) {
        setWorkout(data.workout);
        toast.success("Workout generated! Let's go! 💪");
        setActiveTab('workout');
      } else {
        toast.error(data.message || 'Error generating workout');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const saveWorkout = async () => {
    if (!workout) return;

    setLoading(true);
    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          workoutName: workout.workoutName,
          workoutType: workout.workoutType,
          duration: workout.duration,
          intensity: workout.intensity,
          exercises: workout.exercises,
          notes: workout.notes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Workout saved successfully! 💾');
        fetchHistory();
        setActiveTab('history');
      } else {
        toast.error(data.message || 'Error saving workout');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const completeWorkout = async (workoutId: string) => {
    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          workoutId,
          caloriesBurned: Math.round((workout?.duration || 45) * 6),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Workout completed! Great job! 🎉');
        fetchHistory();
      } else {
        toast.error(data.message || 'Error completing workout');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    }
  };

  const toggleExerciseComplete = (index: number) => {
    setCompletedExercises((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#22C55E';
      default:
        return '#6B7280';
    }
  };

  const getIntensityLabel = (intensity: string) => {
    switch (intensity) {
      case 'high':
        return 'High Intensity 🔥';
      case 'medium':
        return 'Moderate Intensity 💪';
      case 'low':
        return 'Light Intensity 🌱';
      default:
        return intensity;
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

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <Layout title="Workout Generator - FitVerse AI">
      <section style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 className="section-title">🏋️ Workout Generator</h1>
              <p style={{ opacity: 0.7 }}>Get personalized workouts based on your goals and fitness level</p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '12px' }}>
            <button
              onClick={() => setActiveTab('generate')}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                background: activeTab === 'generate' ? '#16A34A' : 'transparent',
                color: activeTab === 'generate' ? 'white' : '#0F172A',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.3s',
              }}
            >
              Generate
            </button>
            <button
              onClick={() => setActiveTab('workout')}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                background: activeTab === 'workout' ? '#16A34A' : 'transparent',
                color: activeTab === 'workout' ? 'white' : '#0F172A',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.3s',
              }}
            >
              Current Workout
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                background: activeTab === 'history' ? '#16A34A' : 'transparent',
                color: activeTab === 'history' ? 'white' : '#0F172A',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.3s',
              }}
            >
              History
            </button>
          </div>

          {/* Generate Tab */}
          {activeTab === 'generate' && (
            <div className="glass" style={{ padding: '40px', borderRadius: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '16px' }}>💪</div>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>Ready to get moving?</h2>
              <p style={{ opacity: 0.7, marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
                We'll create a personalized workout based on your fitness goal, level, and preferences.
                Each workout is designed to help you reach your goals safely and effectively.
              </p>
              <button
                onClick={generateWorkout}
                className="btn-primary"
                disabled={generating}
                style={{
                  fontSize: '1.1rem',
                  padding: '16px 40px',
                  opacity: generating ? 0.7 : 1,
                  cursor: generating ? 'not-allowed' : 'pointer',
                }}
              >
                {generating ? 'Generating...' : '🎯 Generate My Workout'}
              </button>
              <p style={{ marginTop: '16px', fontSize: '0.9rem', opacity: 0.5 }}>
                Powered by AI based on your profile
              </p>
            </div>
          )}

          {/* Current Workout Tab */}
          {activeTab === 'workout' && workout && (
            <div className="glass" style={{ padding: '32px', borderRadius: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '24px',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div>
                  <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{workout.workoutName}</h2>
                  <p style={{ opacity: 0.7 }}>{workout.workoutType}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '6px 16px',
                      borderRadius: '20px',
                      background: `${getIntensityColor(workout.intensity)}20`,
                      color: getIntensityColor(workout.intensity),
                      fontWeight: '500',
                      marginBottom: '8px',
                    }}
                  >
                    {getIntensityLabel(workout.intensity)}
                  </div>
                  <p style={{ fontWeight: '500' }}>⏱️ {workout.duration} minutes</p>
                </div>
              </div>

              <div
                style={{
                  marginBottom: '24px',
                  padding: '16px',
                  background: 'rgba(22,163,74,0.1)',
                  borderRadius: '12px',
                }}
              >
                <p style={{ margin: 0, fontSize: '0.95rem' }}>{workout.notes}</p>
              </div>

              <h3 style={{ marginBottom: '16px' }}>Exercises</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {workout.exercises.map((exercise: any, index: number) => (
                  <div
                    key={index}
                    className="glass"
                    style={{
                      padding: '16px 20px',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      opacity: completedExercises.includes(index) ? 0.5 : 1,
                      border: completedExercises.includes(index) ? '1px solid #22C55E' : 'none',
                      transition: 'all 0.3s',
                    }}
                    onClick={() => toggleExerciseComplete(index)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: completedExercises.includes(index) ? '#22C55E' : 'rgba(0,0,0,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                        }}
                      >
                        {completedExercises.includes(index) ? '✓' : index + 1}
                      </div>
                      <div>
                        <p style={{ fontWeight: '600', margin: 0 }}>{exercise.name}</p>
                        <p style={{ opacity: 0.7, fontSize: '0.9rem', margin: 0 }}>
                          {exercise.sets} sets × {exercise.reps > 0 ? `${exercise.reps} reps` : `${exercise.duration}s`}
                          {exercise.rest > 0 && ` • ${exercise.rest}s rest`}
                        </p>
                      </div>
                    </div>
                    <span style={{ fontSize: '1.2rem' }}>
                      {completedExercises.includes(index) ? '✅' : '⬜'}
                    </span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: '24px',
                  padding: '16px',
                  background: 'rgba(0,0,0,0.05)',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <p style={{ margin: 0 }}>
                  <strong>{completedExercises.length}</strong> of <strong>{workout.exercises.length}</strong> exercises completed
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => {
                      setCompletedExercises(workout.exercises.map((_: any, i: number) => i));
                    }}
                    className="btn-outline"
                    style={{ padding: '8px 20px' }}
                  >
                    Mark All Complete
                  </button>
                  <button
                    onClick={saveWorkout}
                    className="btn-primary"
                    disabled={loading}
                    style={{
                      opacity: loading ? 0.7 : 1,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      padding: '8px 20px',
                    }}
                  >
                    {loading ? 'Saving...' : '💾 Save Workout'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workout' && !workout && (
            <div className="glass" style={{ padding: '40px', borderRadius: '24px', textAlign: 'center' }}>
              <p style={{ opacity: 0.7 }}>No workout generated yet. Click "Generate" to create one!</p>
              <button
                onClick={() => setActiveTab('generate')}
                className="btn-primary"
                style={{ marginTop: '16px' }}
              >
                Generate Workout
              </button>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="glass" style={{ padding: '32px', borderRadius: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>📊 Workout History</h2>
              {history.length === 0 ? (
                <p style={{ opacity: 0.7, textAlign: 'center', padding: '40px' }}>
                  No workouts yet. Generate and save your first workout!
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {history.map((w: any) => (
                    <div
                      key={w._id}
                      className="glass"
                      style={{
                        padding: '16px 20px',
                        borderRadius: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: '600', margin: 0 }}>{w.workoutName}</p>
                        <p style={{ opacity: 0.7, fontSize: '0.9rem', margin: '4px 0 0' }}>
                          {w.workoutType} • {w.duration} min • {w.exercises?.length || 0} exercises
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            background: w.completed ? '#22C55E20' : '#F59E0B20',
                            color: w.completed ? '#22C55E' : '#F59E0B',
                          }}
                        >
                          {w.completed ? '✅ Completed' : '⏳ Pending'}
                        </span>
                        {!w.completed && (
                          <button
                            onClick={() => completeWorkout(w._id)}
                            className="btn-primary"
                            style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                          >
                            Mark Complete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}