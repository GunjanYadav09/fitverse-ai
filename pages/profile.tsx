import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: '',
    dateOfBirth: '',
    gender: '',
    // Body Information
    height: '',
    heightUnit: 'cm',
    weight: '',
    weightUnit: 'kg',
    // Fitness Information
    fitnessGoal: '',
    fitnessLevel: '',
    activityLevel: '',
    workoutPreference: '',
    dietType: '',
    // Lifestyle
    sleepHours: '',
    waterGoal: '2500',
    stressLevel: '',
    // Menstrual Cycle fields
    enableCycleTracking: false,
    lastPeriodStart: '',
    cycleLength: '',
    periodDuration: '',
    isRegular: 'true',
    cycleSymptoms: '',
    cycleNotes: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    if (session?.user?.onboardingCompleted === false) {
      router.push('/onboarding');
    }
    fetchProfile();
  }, [session, status, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();
      if (response.ok && data.profile) {
        setProfile(data.profile);
        setFormData({
          // Personal Information
          fullName: data.user?.fullName || '',
          dateOfBirth: data.profile.dateOfBirth ? new Date(data.profile.dateOfBirth).toISOString().split('T')[0] : '',
          gender: data.profile.gender || '',
          // Body Information
          height: data.profile.height || '',
          heightUnit: data.profile.heightUnit || 'cm',
          weight: data.profile.weight || '',
          weightUnit: data.profile.weightUnit || 'kg',
          // Fitness Information
          fitnessGoal: data.profile.fitnessGoal || '',
          fitnessLevel: data.profile.fitnessLevel || '',
          activityLevel: data.profile.activityLevel || '',
          workoutPreference: data.profile.workoutPreference || '',
          dietType: data.profile.dietType || '',
          // Lifestyle
          sleepHours: data.profile.sleepHours || '',
          waterGoal: data.profile.waterGoal || '2500',
          stressLevel: data.profile.stressLevel || '',
          // Menstrual Cycle fields
          enableCycleTracking: data.cycle?.trackingEnabled || false,
          lastPeriodStart: data.cycle?.lastPeriodStart ? new Date(data.cycle.lastPeriodStart).toISOString().split('T')[0] : '',
          cycleLength: data.cycle?.cycleLength || '',
          periodDuration: data.cycle?.periodDuration || '',
          isRegular: data.cycle?.isRegular ? 'true' : 'false',
          cycleSymptoms: data.cycle?.symptoms?.join(', ') || '',
          cycleNotes: data.cycle?.notes || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Profile updated successfully!');
        fetchProfile();
      } else {
        toast.error(data.message || 'Error updating profile');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
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

  // Don't render anything if not authenticated (will redirect)
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <Layout title="Profile - FitVerse AI">
      <section style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div className="container" style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h1 className="section-title">Your Profile</h1>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="btn-outline"
              style={{ padding: '8px 20px' }}
            >
              Logout
            </button>
          </div>

          <div className="glass" style={{ padding: '32px', borderRadius: '24px' }}>
            <form onSubmit={handleSubmit}>
              <h3 style={{ marginBottom: '16px' }}>Personal Information</h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
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

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '12px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      background: 'rgba(255,255,255,0.5)',
                      fontSize: '1rem',
                    }}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <h3 style={{ marginTop: '24px', marginBottom: '16px' }}>Body Information</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Height</label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    placeholder="e.g., 175"
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

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Height Unit</label>
                  <select
                    name="heightUnit"
                    value={formData.heightUnit}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '12px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      background: 'rgba(255,255,255,0.5)',
                      fontSize: '1rem',
                    }}
                  >
                    <option value="cm">cm</option>
                    <option value="ft">ft/in</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Weight</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="e.g., 70"
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

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Weight Unit</label>
                  <select
                    name="weightUnit"
                    value={formData.weightUnit}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '12px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      background: 'rgba(255,255,255,0.5)',
                      fontSize: '1rem',
                    }}
                  >
                    <option value="kg">kg</option>
                    <option value="lbs">lbs</option>
                  </select>
                </div>
              </div>

              <h3 style={{ marginTop: '24px', marginBottom: '16px' }}>Fitness Information</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Fitness Goal</label>
                  <select
                    name="fitnessGoal"
                    value={formData.fitnessGoal}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '12px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      background: 'rgba(255,255,255,0.5)',
                      fontSize: '1rem',
                    }}
                  >
                    <option value="">Select your goal</option>
                    <option value="weight-loss">Weight Loss</option>
                    <option value="weight-gain">Weight Gain</option>
                    <option value="muscle-gain">Muscle Gain</option>
                    <option value="maintain-weight">Maintain Weight</option>
                    <option value="improve-fitness">Improve Fitness</option>
                    <option value="improve-strength">Improve Strength</option>
                    <option value="improve-endurance">Improve Endurance</option>
                    <option value="improve-flexibility">Improve Flexibility</option>
                    <option value="general-wellness">General Wellness</option>
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Fitness Level</label>
                  <select
                    name="fitnessLevel"
                    value={formData.fitnessLevel}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '12px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      background: 'rgba(255,255,255,0.5)',
                      fontSize: '1rem',
                    }}
                  >
                    <option value="">Select your level</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Activity Level</label>
                <select
                  name="activityLevel"
                  value={formData.activityLevel}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    background: 'rgba(255,255,255,0.5)',
                    fontSize: '1rem',
                  }}
                >
                  <option value="">Select your activity level</option>
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Lightly Active</option>
                  <option value="moderate">Moderately Active</option>
                  <option value="active">Very Active</option>
                  <option value="very-active">Extremely Active</option>
                </select>
              </div>

              <h3 style={{ marginTop: '24px', marginBottom: '16px' }}>Lifestyle</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Sleep (hours)</label>
                  <input
                    type="number"
                    name="sleepHours"
                    value={formData.sleepHours}
                    onChange={handleChange}
                    placeholder="e.g., 7"
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

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Water Goal (ml)</label>
                  <input
                    type="number"
                    name="waterGoal"
                    value={formData.waterGoal}
                    onChange={handleChange}
                    placeholder="e.g., 2500"
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

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Stress Level</label>
                <select
                  name="stressLevel"
                  value={formData.stressLevel}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    background: 'rgba(255,255,255,0.5)',
                    fontSize: '1rem',
                  }}
                >
                  <option value="">Select stress level</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Menstrual Cycle Section - Only for Female Users */}
              {formData.gender === 'female' && (
                <>
                  <h3 style={{ marginTop: '24px', marginBottom: '16px' }}>🔄 Menstrual Cycle</h3>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        name="enableCycleTracking"
                        checked={formData.enableCycleTracking}
                        onChange={handleChange}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <span style={{ fontWeight: '500' }}>Enable Cycle Tracking</span>
                    </label>
                  </div>

                  {formData.enableCycleTracking && (
                    <>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                          Date of Last Period Start
                        </label>
                        <input
                          type="date"
                          name="lastPeriodStart"
                          value={formData.lastPeriodStart}
                          onChange={handleChange}
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

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                            Cycle Length (days)
                          </label>
                          <select
                            name="cycleLength"
                            value={formData.cycleLength}
                            onChange={handleChange}
                            style={{
                              width: '100%',
                              padding: '12px',
                              borderRadius: '12px',
                              border: '1px solid rgba(0,0,0,0.1)',
                              background: 'rgba(255,255,255,0.5)',
                              fontSize: '1rem',
                            }}
                          >
                            <option value="">Select cycle length</option>
                            <option value="21-24">21-24 days</option>
                            <option value="25-28">25-28 days</option>
                            <option value="29-32">29-32 days</option>
                            <option value="33-35">33-35 days</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                            Period Duration (days)
                          </label>
                          <select
                            name="periodDuration"
                            value={formData.periodDuration}
                            onChange={handleChange}
                            style={{
                              width: '100%',
                              padding: '12px',
                              borderRadius: '12px',
                              border: '1px solid rgba(0,0,0,0.1)',
                              background: 'rgba(255,255,255,0.5)',
                              fontSize: '1rem',
                            }}
                          >
                            <option value="">Select duration</option>
                            <option value="2-3">2-3 days</option>
                            <option value="4-5">4-5 days</option>
                            <option value="6-7">6-7 days</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                          Is your cycle regular?
                        </label>
                        <select
                          name="isRegular"
                          value={formData.isRegular}
                          onChange={handleChange}
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '12px',
                            border: '1px solid rgba(0,0,0,0.1)',
                            background: 'rgba(255,255,255,0.5)',
                            fontSize: '1rem',
                          }}
                        >
                          <option value="true">Yes, regular</option>
                          <option value="false">No, irregular</option>
                        </select>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                          Symptoms (comma separated)
                        </label>
                        <input
                          type="text"
                          name="cycleSymptoms"
                          value={formData.cycleSymptoms}
                          onChange={handleChange}
                          placeholder="e.g., cramps, headache, fatigue"
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

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Notes</label>
                        <input
                          type="text"
                          name="cycleNotes"
                          value={formData.cycleNotes}
                          onChange={handleChange}
                          placeholder="Any additional notes..."
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
                    </>
                  )}
                </>
              )}

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
                {loading ? 'Saving...' : 'Update Profile'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
}