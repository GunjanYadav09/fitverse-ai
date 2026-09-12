import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import toast from 'react-hot-toast';

export default function CycleTracker() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cycleData, setCycleData] = useState<any>(null);
  const [formData, setFormData] = useState({
    lastPeriodStart: '',
    cycleLength: '',
    periodDuration: '',
    isRegular: 'true',
    symptoms: '',
    notes: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    fetchCycleData();
  }, [status]);

  const fetchCycleData = async () => {
    try {
      const response = await fetch('/api/cycle');
      const data = await response.json();
      if (response.ok && data.data) {
        setCycleData(data.data);
        setFormData({
          lastPeriodStart: data.data.lastPeriodStart ? new Date(data.data.lastPeriodStart).toISOString().split('T')[0] : '',
          cycleLength: data.data.cycleLength || '',
          periodDuration: data.data.periodDuration || '',
          isRegular: data.data.isRegular ? 'true' : 'false',
          symptoms: data.data.symptoms?.join(', ') || '',
          notes: data.data.notes || '',
        });
      }
    } catch (error) {
      console.error('Error fetching cycle data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/cycle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          symptoms: formData.symptoms.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Cycle data updated successfully!');
        fetchCycleData();
      } else {
        toast.error(data.message || 'Error updating cycle data');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Layout title="Cycle Tracker">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Cycle Tracker - FitVerse AI">
      <section style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div className="container" style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h1 className="section-title" style={{ marginBottom: '8px' }}>🔄 Menstrual Cycle Tracker</h1>
          <p style={{ opacity: 0.7, marginBottom: '32px' }}>
            Track your cycle to get personalized fitness and nutrition recommendations.
            <br />
            <span style={{ fontSize: '0.9rem', color: '#16A34A' }}>
              💡 All predictions are estimates. This is not medical advice.
            </span>
          </p>

          <div className="glass" style={{ padding: '32px', borderRadius: '24px' }}>
            <form onSubmit={handleSubmit}>
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
                  required
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
                    required
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
                    required
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
                  name="symptoms"
                  value={formData.symptoms}
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

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Notes</label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
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
                {loading ? 'Saving...' : 'Update Cycle Data'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
}