import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';

export default function MealPlanner() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('generate');
  const [selectedDay, setSelectedDay] = useState(0);

  // Preferences form state
  const [preferences, setPreferences] = useState({
    allergyInput: '',
    allergies: [] as string[],
    dislikeInput: '',
    dislikes: [] as string[],
    cuisinePreference: 'mixed',
    spiceLevel: 'medium',
    mealComplexity: 'moderate',
    includeSnacks: true,
    additionalNotes: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    if (status === 'authenticated') {
      fetchPlans();
    }
  }, [status, router]);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/meal-planner');
      const data = await response.json();
      if (response.ok) setSavedPlans(data.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  // Add allergy tag
  const addAllergy = () => {
    const val = preferences.allergyInput.trim().toLowerCase();
    if (!val) return;
    if (preferences.allergies.includes(val)) {
      toast.error('Already added');
      return;
    }
    setPreferences({ ...preferences, allergies: [...preferences.allergies, val], allergyInput: '' });
  };

  // Add dislike tag
  const addDislike = () => {
    const val = preferences.dislikeInput.trim().toLowerCase();
    if (!val) return;
    if (preferences.dislikes.includes(val)) {
      toast.error('Already added');
      return;
    }
    setPreferences({ ...preferences, dislikes: [...preferences.dislikes, val], dislikeInput: '' });
  };

  const removeAllergy = (item: string) => {
    setPreferences({ ...preferences, allergies: preferences.allergies.filter((a) => a !== item) });
  };

  const removeDislike = (item: string) => {
    setPreferences({ ...preferences, dislikes: preferences.dislikes.filter((d) => d !== item) });
  };

  const generatePlan = async () => {
    setGenerating(true);
    setPlan(null);

    try {
      // First: save preferences to profile
      await fetch('/api/user/meal-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allergies: preferences.allergies,
          dislikes: preferences.dislikes,
          cuisinePreference: preferences.cuisinePreference,
          spiceLevel: preferences.spiceLevel,
          mealComplexity: preferences.mealComplexity,
          includeSnacks: preferences.includeSnacks,
          additionalNotes: preferences.additionalNotes,
        }),
      });

      // Then: generate plan
      const response = await fetch('/api/meal-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' }),
      });

      const data = await response.json();
      if (response.ok) {
        setPlan(data.plan);
        toast.success('Meal plan generated! 🍽️');
        setActiveTab('plan');
      } else {
        toast.error(data.message || 'Error generating plan');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const savePlan = async () => {
    if (!plan) return;
    setLoading(true);
    try {
      const response = await fetch('/api/meal-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          planName: plan.planName,
          goal: plan.goal,
          totalCalories: plan.totalCalories,
          totalProtein: plan.totalProtein,
          totalCarbs: plan.totalCarbs,
          totalFat: plan.totalFat,
          days: plan.days,
          preferences: {
            allergies: preferences.allergies,
            dislikes: preferences.dislikes,
            cuisinePreference: preferences.cuisinePreference,
            spiceLevel: preferences.spiceLevel,
            mealComplexity: preferences.mealComplexity,
            includeSnacks: preferences.includeSnacks,
            additionalNotes: preferences.additionalNotes,
          },
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Meal plan saved! 💾');
        fetchPlans();
        setActiveTab('saved');
      } else {
        toast.error(data.message || 'Error saving');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this meal plan?')) return;
    try {
      const response = await fetch('/api/meal-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', planId }),
      });
      if (response.ok) {
        toast.success('Plan deleted');
        fetchPlans();
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const viewSavedPlan = (savedPlan: any) => {
    setPlan({
      planName: savedPlan.planName,
      goal: savedPlan.goal,
      totalCalories: savedPlan.totalCalories,
      totalProtein: savedPlan.totalProtein,
      totalCarbs: savedPlan.totalCarbs,
      totalFat: savedPlan.totalFat,
      days: savedPlan.days,
    });
    setActiveTab('plan');
    setSelectedDay(0);
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

  return (
    <Layout title="Meal Planner - FitVerse AI">
      <section style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div className="container">
          <div style={{ marginBottom: '32px' }}>
            <h1 className="section-title">🍽️ Meal Planner</h1>
            <p style={{ opacity: 0.7 }}>Personalized meal plans based on your goals and preferences</p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '12px', flexWrap: 'wrap' }}>
            {[
              { key: 'generate', label: 'Customize & Generate' },
              { key: 'plan', label: 'Current Plan' },
              { key: 'saved', label: `Saved Plans (${savedPlans.length})` },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '20px',
                  border: 'none',
                  background: activeTab === t.key ? '#16A34A' : 'transparent',
                  color: activeTab === t.key ? 'white' : '#0F172A',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.3s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ================= GENERATE TAB ================= */}
          {activeTab === 'generate' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Preferences Card */}
              <div className="glass" style={{ padding: '32px', borderRadius: '24px' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⚙️ Customize Your Plan</h2>
                <p style={{ opacity: 0.7, marginBottom: '24px' }}>
                  Tell us your preferences so we can create the perfect plan for you
                </p>

                {/* Allergies */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                    🚫 Allergies / Intolerances
                  </label>
                  <p style={{ opacity: 0.6, fontSize: '0.9rem', marginBottom: '8px' }}>
                    We'll completely avoid these ingredients in your meal plan
                  </p>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="text"
                      placeholder="e.g., peanuts, dairy, gluten, soy"
                      value={preferences.allergyInput}
                      onChange={(e) => setPreferences({ ...preferences, allergyInput: e.target.value })}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                      style={{
                        flex: 1, padding: '12px', borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)', fontSize: '1rem',
                      }}
                    />
                    <button type="button" onClick={addAllergy} className="btn-primary" style={{ padding: '12px 20px' }}>
                      Add
                    </button>
                  </div>
                  {preferences.allergies.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {preferences.allergies.map((a) => (
                        <span
                          key={a}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '6px 14px', borderRadius: '20px',
                            background: '#EF444420', color: '#EF4444',
                            border: '1px solid #EF444440', fontSize: '0.9rem',
                          }}
                        >
                          {a}
                          <button
                            onClick={() => removeAllergy(a)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontWeight: 'bold', fontSize: '1rem', padding: 0 }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dislikes */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                    👎 Foods You Dislike
                  </label>
                  <p style={{ opacity: 0.6, fontSize: '0.9rem', marginBottom: '8px' }}>
                    We'll try to avoid these foods in your plan
                  </p>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="text"
                      placeholder="e.g., mushrooms, bitter gourd, okra"
                      value={preferences.dislikeInput}
                      onChange={(e) => setPreferences({ ...preferences, dislikeInput: e.target.value })}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDislike())}
                      style={{
                        flex: 1, padding: '12px', borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)', fontSize: '1rem',
                      }}
                    />
                    <button type="button" onClick={addDislike} className="btn-outline" style={{ padding: '12px 20px' }}>
                      Add
                    </button>
                  </div>
                  {preferences.dislikes.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {preferences.dislikes.map((d) => (
                        <span
                          key={d}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '6px 14px', borderRadius: '20px',
                            background: '#F59E0B20', color: '#F59E0B',
                            border: '1px solid #F59E0B40', fontSize: '0.9rem',
                          }}
                        >
                          {d}
                          <button
                            onClick={() => removeDislike(d)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F59E0B', fontWeight: 'bold', fontSize: '1rem', padding: 0 }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Grid of preferences */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>🍽️ Cuisine Preference</label>
                    <select
                      value={preferences.cuisinePreference}
                      onChange={(e) => setPreferences({ ...preferences, cuisinePreference: e.target.value })}
                      style={{
                        width: '100%', padding: '12px', borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)', fontSize: '1rem',
                      }}
                    >
                      <option value="mixed">Mixed</option>
                      <option value="indian">Indian</option>
                      <option value="continental">Continental</option>
                      <option value="asian">Asian</option>
                      <option value="mediterranean">Mediterranean</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>🌶️ Spice Level</label>
                    <select
                      value={preferences.spiceLevel}
                      onChange={(e) => setPreferences({ ...preferences, spiceLevel: e.target.value })}
                      style={{
                        width: '100%', padding: '12px', borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)', fontSize: '1rem',
                      }}
                    >
                      <option value="mild">Mild</option>
                      <option value="medium">Medium</option>
                      <option value="spicy">Spicy</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>⏱️ Meal Complexity</label>
                    <select
                      value={preferences.mealComplexity}
                      onChange={(e) => setPreferences({ ...preferences, mealComplexity: e.target.value })}
                      style={{
                        width: '100%', padding: '12px', borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)', fontSize: '1rem',
                      }}
                    >
                      <option value="quick">Quick & Easy (under 20 min)</option>
                      <option value="moderate">Moderate (20-45 min)</option>
                      <option value="elaborate">Elaborate (45+ min)</option>
                    </select>
                  </div>
                </div>

                {/* Include snacks toggle */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={preferences.includeSnacks}
                      onChange={(e) => setPreferences({ ...preferences, includeSnacks: e.target.checked })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span style={{ fontWeight: '500' }}>🍎 Include snacks in my meal plan</span>
                  </label>
                </div>

                {/* Additional notes */}
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>📝 Additional Notes (optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Any other preferences or requirements... (e.g., 'I prefer quick breakfasts', 'No onion or garlic')"
                    value={preferences.additionalNotes}
                    onChange={(e) => setPreferences({ ...preferences, additionalNotes: e.target.value })}
                    style={{
                      width: '100%', padding: '12px', borderRadius: '12px',
                      border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)',
                      fontSize: '1rem', resize: 'vertical', fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>

              {/* Generate Button */}
              <div className="glass" style={{ padding: '32px', borderRadius: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🥗</div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Ready to generate!</h2>
                <p style={{ opacity: 0.7, marginBottom: '20px', maxWidth: '500px', margin: '0 auto 20px' }}>
                  We'll create a 7-day meal plan tailored to your preferences and goals
                </p>
                <button
                  onClick={generatePlan}
                  className="btn-primary"
                  disabled={generating}
                  style={{
                    fontSize: '1.1rem', padding: '16px 40px',
                    opacity: generating ? 0.7 : 1,
                    cursor: generating ? 'not-allowed' : 'pointer',
                  }}
                >
                  {generating ? 'Generating...' : '🎯 Generate My Meal Plan'}
                </button>
              </div>
            </div>
          )}

          {/* ================= PLAN TAB ================= */}
          {activeTab === 'plan' && plan && (
            <div className="glass" style={{ padding: '32px', borderRadius: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{plan.planName}</h2>
                  <p style={{ opacity: 0.7, textTransform: 'capitalize' }}>
                    Goal: {plan.goal?.replace(/-/g, ' ')}
                  </p>
                </div>
                <button onClick={savePlan} className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : '💾 Save Plan'}
                </button>
              </div>

              {/* Applied Preferences */}
              {preferences.allergies.length > 0 || preferences.dislikes.length > 0 ? (
                <div style={{
                  padding: '14px 18px', borderRadius: '12px',
                  background: 'rgba(22,163,74,0.08)', marginBottom: '20px',
                  border: '1px solid rgba(22,163,74,0.15)',
                }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '500' }}>
                    ✅ Preferences applied:
                  </p>
                  {preferences.allergies.length > 0 && (
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', opacity: 0.8 }}>
                      <strong>Allergies:</strong> {preferences.allergies.join(', ')}
                    </p>
                  )}
                  {preferences.dislikes.length > 0 && (
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', opacity: 0.8 }}>
                      <strong>Dislikes:</strong> {preferences.dislikes.join(', ')}
                    </p>
                  )}
                </div>
              ) : null}

              {/* Nutrition Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {[
                  { label: 'Calories', value: plan.totalCalories, unit: 'kcal/day' },
                  { label: 'Protein', value: `${plan.totalProtein}g`, unit: 'per day' },
                  { label: 'Carbs', value: `${plan.totalCarbs}g`, unit: 'per day' },
                  { label: 'Fat', value: `${plan.totalFat}g`, unit: 'per day' },
                ].map((s, i) => (
                  <div key={i} className="glass" style={{ padding: '16px', borderRadius: '16px', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: 0 }}>{s.label}</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '700', margin: '4px 0 0' }}>{s.value}</p>
                    <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: 0 }}>{s.unit}</p>
                  </div>
                ))}
              </div>

              {/* Day Selector */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
                {plan.days?.map((d: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(i)}
                    style={{
                      padding: '10px 20px', borderRadius: '12px', border: 'none',
                      background: selectedDay === i ? '#16A34A' : 'rgba(0,0,0,0.05)',
                      color: selectedDay === i ? 'white' : '#0F172A',
                      cursor: 'pointer', fontWeight: '500', whiteSpace: 'nowrap', transition: 'all 0.3s',
                    }}
                  >
                    {d.day}
                  </button>
                ))}
              </div>

              {/* Meals */}
              {plan.days?.[selectedDay] && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { type: 'Breakfast', icon: '🌅', meal: plan.days[selectedDay].breakfast },
                    { type: 'Lunch', icon: '☀️', meal: plan.days[selectedDay].lunch },
                    { type: 'Dinner', icon: '🌙', meal: plan.days[selectedDay].dinner },
                  ].map((item, i) => (
                    <div key={i} className="glass" style={{ padding: '20px', borderRadius: '16px' }}>
                      <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: 0 }}>{item.icon} {item.type}</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: '600', margin: '4px 0' }}>{item.meal.name}</p>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem', opacity: 0.7 }}>
                        <span>🔥 {item.meal.calories} kcal</span>
                        <span>💪 {item.meal.protein}g protein</span>
                        <span>🍞 {item.meal.carbs}g carbs</span>
                        <span>🥑 {item.meal.fat}g fat</span>
                      </div>
                    </div>
                  ))}

                  {plan.days[selectedDay].snacks?.length > 0 && (
                    <div className="glass" style={{ padding: '20px', borderRadius: '16px' }}>
                      <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: '0 0 12px' }}>🍎 Snacks</p>
                      {plan.days[selectedDay].snacks.map((snack: any, i: number) => (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '8px 0', flexWrap: 'wrap', gap: '8px',
                          borderBottom: i < plan.days[selectedDay].snacks.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                        }}>
                          <p style={{ margin: 0, fontWeight: '500' }}>{snack.name}</p>
                          <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>
                            {snack.calories} kcal • {snack.protein}g protein
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'plan' && !plan && (
            <div className="glass" style={{ padding: '40px', borderRadius: '24px', textAlign: 'center' }}>
              <p style={{ opacity: 0.7 }}>No meal plan yet. Generate one first!</p>
              <button onClick={() => setActiveTab('generate')} className="btn-primary" style={{ marginTop: '16px' }}>
                Generate Plan
              </button>
            </div>
          )}

          {/* ================= SAVED TAB ================= */}
          {activeTab === 'saved' && (
            <div className="glass" style={{ padding: '32px', borderRadius: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>📁 Saved Meal Plans</h2>
              {savedPlans.length === 0 ? (
                <p style={{ opacity: 0.7, textAlign: 'center', padding: '40px' }}>
                  No saved plans yet. Generate and save your first plan!
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {savedPlans.map((p: any) => (
                    <div key={p._id} className="glass" style={{
                      padding: '16px 20px', borderRadius: '16px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      flexWrap: 'wrap', gap: '12px',
                    }}>
                      <div>
                        <p style={{ fontWeight: '600', margin: 0 }}>
                          {p.planName} {p.isActive && '🟢'}
                        </p>
                        <p style={{ opacity: 0.7, fontSize: '0.9rem', margin: '4px 0 0' }}>
                          {p.totalCalories} kcal • {p.totalProtein}g protein • Created {new Date(p.createdAt).toLocaleDateString()}
                        </p>
                        {p.preferences?.allergies?.length > 0 && (
                          <p style={{ opacity: 0.7, fontSize: '0.8rem', margin: '4px 0 0' }}>
                            🚫 Avoiding: {p.preferences.allergies.join(', ')}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => viewSavedPlan(p)} className="btn-outline" style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
                          View
                        </button>
                        <button
                          onClick={() => deletePlan(p._id)}
                          className="btn-outline"
                          style={{ padding: '6px 16px', fontSize: '0.85rem', borderColor: '#EF4444', color: '#EF4444' }}
                        >
                          Delete
                        </button>
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