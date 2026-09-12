import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';

export default function Onboarding() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 7; // Changed from 6 to 7

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    if (session?.user?.onboardingCompleted) {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  const [formData, setFormData] = useState({
    fullName: session?.user?.name || '',
    dateOfBirth: '',
    gender: '',
    height: '',
    heightUnit: 'cm',
    weight: '',
    weightUnit: 'kg',
    fitnessGoal: '',
    fitnessLevel: '',
    activityLevel: '',
    workoutPreference: '',
    dietType: '',
    sleepHours: '',
    waterGoal: '2500',
    stressLevel: '',
    // Menstrual Cycle fields
    lastPeriodStart: '',
    cycleLength: '',
    periodDuration: '',
    isRegular: 'true',
    cycleSymptoms: [] as string[],
    cycleNotes: '',
    enableCycleTracking: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    if (step < totalSteps) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Onboarding complete! Welcome to FitVerse AI! 🎉');
        await fetch('/api/auth/session');
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        toast.error(data.message || data.error || 'Something went wrong');
        console.error('Error details:', data);
      }
    } catch (error) {
      console.error('Network error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Personal Info
  const renderStep1 = () => (
    <div>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>About You</h2>
      <p style={{ opacity: 0.7, marginBottom: '24px' }}>Tell us a bit about yourself</p>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Full Name</label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Your full name"
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid rgba(0,0,0,0.1)',
            background: 'rgba(255,255,255,0.5)',
            fontSize: '1rem',
          }}
          required
        />
      </div>

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
          required
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
          required
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer-not-to-say">Prefer not to say</option>
        </select>
      </div>
    </div>
  );

  // Step 2: Body Info
  const renderStep2 = () => (
    <div>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Body Information</h2>
      <p style={{ opacity: 0.7, marginBottom: '24px' }}>Help us understand your body metrics</p>

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
            required
          />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Unit</label>
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
            required
          />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Unit</label>
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
    </div>
  );

  // Step 3: Fitness Goals
  const renderStep3 = () => (
    <div>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Fitness Goals</h2>
      <p style={{ opacity: 0.7, marginBottom: '24px' }}>What do you want to achieve?</p>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Primary Fitness Goal</label>
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
          required
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
          required
        >
          <option value="">Select your level</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
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
          required
        >
          <option value="">Select your activity level</option>
          <option value="sedentary">Sedentary</option>
          <option value="light">Lightly Active</option>
          <option value="moderate">Moderately Active</option>
          <option value="active">Very Active</option>
          <option value="very-active">Extremely Active</option>
        </select>
      </div>
    </div>
  );

  // Step 4: Workout
  const renderStep4 = () => (
    <div>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Workout Preferences</h2>
      <p style={{ opacity: 0.7, marginBottom: '24px' }}>Tell us about your workout style</p>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Preferred Workout Location</label>
        <select
          name="workoutPreference"
          value={formData.workoutPreference}
          onChange={handleChange}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid rgba(0,0,0,0.1)',
            background: 'rgba(255,255,255,0.5)',
            fontSize: '1rem',
          }}
          required
        >
          <option value="">Select location</option>
          <option value="home">Home</option>
          <option value="gym">Gym</option>
          <option value="outdoor">Outdoor</option>
          <option value="both">Both</option>
        </select>
      </div>
    </div>
  );

  // Step 5: Diet
  const renderStep5 = () => (
    <div>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Diet Preferences</h2>
      <p style={{ opacity: 0.7, marginBottom: '24px' }}>Tell us about your eating habits</p>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Diet Type</label>
        <select
          name="dietType"
          value={formData.dietType}
          onChange={handleChange}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid rgba(0,0,0,0.1)',
            background: 'rgba(255,255,255,0.5)',
            fontSize: '1rem',
          }}
          required
        >
          <option value="">Select diet type</option>
          <option value="vegetarian">Vegetarian</option>
          <option value="vegan">Vegan</option>
          <option value="non-vegetarian">Non-Vegetarian</option>
          <option value="eggetarian">Eggetarian</option>
          <option value="other">Other</option>
        </select>
      </div>
    </div>
  );

  // Step 6: Menstrual Cycle (Only for Female users)
  const renderStep6 = () => {
    // Only show this step if gender is female
    if (formData.gender !== 'female') {
      // Skip to next step automatically
      setTimeout(() => setStep(7), 100);
      return null;
    }

    return (
      <div>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Menstrual Cycle Tracking</h2>
        <p style={{ opacity: 0.7, marginBottom: '24px' }}>
          This information helps us personalize your fitness recommendations. 
          <br />
          <span style={{ fontSize: '0.9rem', color: '#16A34A' }}>
            💡 This is optional and you can skip it.
          </span>
        </p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              name="enableCycleTracking"
              checked={formData.enableCycleTracking}
              onChange={(e) => setFormData({ ...formData, enableCycleTracking: e.target.checked })}
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
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Symptoms (optional)</label>
              <input
                type="text"
                name="cycleSymptoms"
                value={formData.cycleSymptoms}
                onChange={(e) => {
                  const value = e.target.value.split(',').map(s => s.trim());
                  setFormData({ ...formData, cycleSymptoms: value as any });
                }}
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
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Notes (optional)</label>
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
      </div>
    );
  };

  // Step 7: Lifestyle
  const renderStep7 = () => (
    <div>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Lifestyle</h2>
      <p style={{ opacity: 0.7, marginBottom: '24px' }}>Help us understand your daily routine</p>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Average Sleep (hours)</label>
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
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Daily Water Goal (ml)</label>
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

      <div style={{ marginBottom: '16px' }}>
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
    </div>
  );

  const renderStep = () => {
    switch(step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      case 7: return renderStep7();
      default: return renderStep1();
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

  return (
    <Layout title="Onboarding - FitVerse AI">
      <section style={{ paddingTop: '100px', paddingBottom: '80px' }}>
        <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="glass" style={{ padding: '40px', borderRadius: '32px' }}>
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: '500' }}>Step {step} of {totalSteps}</span>
                <span style={{ opacity: 0.7 }}>{Math.round((step / totalSteps) * 100)}%</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(0,0,0,0.1)', borderRadius: '2px' }}>
                <div style={{
                  height: '100%',
                  width: `${(step / totalSteps) * 100}%`,
                  background: 'linear-gradient(90deg, #22C55E, #10B981)',
                  borderRadius: '2px',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {renderStep()}

              {step !== 6 || formData.gender !== 'female' ? (
                <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                  {step > 1 && step !== 6 && (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="btn-outline"
                      style={{ flex: 1 }}
                    >
                      Back
                    </button>
                  )}
                  
                  {step < totalSteps ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="btn-primary"
                      style={{ flex: 1 }}
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                      style={{
                        flex: 1,
                        opacity: loading ? 0.7 : 1,
                        cursor: loading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {loading ? 'Saving...' : 'Complete Onboarding 🎉'}
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="btn-outline"
                    style={{ flex: 1 }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="btn-primary"
                    style={{ flex: 1 }}
                  >
                    Next
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
}