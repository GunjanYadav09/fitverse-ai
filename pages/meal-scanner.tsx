import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';

export default function MealScanner() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [nutritionData, setNutritionData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('scan');
  const [foodName, setFoodName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Authentication check - redirect to login if not authenticated
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
      const response = await fetch('/api/meal-scanner');
      const data = await response.json();
      if (response.ok) {
        setHistory(data.entries || []);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setNutritionData(null);
  };

  const handleAnalyze = async () => {
    if (!file && !foodName) {
      toast.error('Please upload an image or enter a food name');
      return;
    }

    setAnalyzing(true);
    setNutritionData(null);

    try {
      const requestBody: any = {};
      
      if (file) {
        const reader = new FileReader();
        const base64Promise = new Promise((resolve) => {
          reader.onload = (e) => {
            resolve(e.target?.result);
          };
          reader.readAsDataURL(file);
        });
        const base64Image = await base64Promise;
        requestBody.imageBase64 = base64Image;
      }
      
      if (foodName) {
        requestBody.foodName = foodName;
      }

      const response = await fetch('/api/meal-scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        setNutritionData(data.data);
        toast.success(`Found: ${data.data.foodName}! 🎉`);
        fetchHistory();
        setActiveTab('results');
      } else {
        toast.error(data.message || 'Error analyzing food');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const resetScanner = () => {
    setSelectedImage(null);
    setFile(null);
    setNutritionData(null);
    setFoodName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setActiveTab('scan');
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return '#22C55E';
    if (score >= 60) return '#F59E0B';
    if (score >= 40) return '#F97316';
    return '#EF4444';
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent 🏆';
    if (score >= 60) return 'Good 👍';
    if (score >= 40) return 'Fair 😊';
    return 'Needs Improvement 🎯';
  };

  const quickFoods = ['pizza', 'apple', 'rice', 'chicken', 'banana', 'egg', 'bread', 'pasta', 'idli', 'dosa', 'roti', 'dal'];

  // Show loading state while checking authentication
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
    <Layout title="Meal Scanner - FitVerse AI">
      <section style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 className="section-title">📸 Meal Scanner</h1>
              <p style={{ opacity: 0.7 }}>Upload a photo or enter a food name to get nutrition information</p>
            </div>
            <button
              onClick={resetScanner}
              className="btn-outline"
              style={{ padding: '8px 20px' }}
            >
              New Scan
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '12px' }}>
            <button
              onClick={() => setActiveTab('scan')}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                background: activeTab === 'scan' ? '#16A34A' : 'transparent',
                color: activeTab === 'scan' ? 'white' : '#0F172A',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.3s',
              }}
            >
              Scan Meal
            </button>
            <button
              onClick={() => setActiveTab('results')}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                background: activeTab === 'results' ? '#16A34A' : 'transparent',
                color: activeTab === 'results' ? 'white' : '#0F172A',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.3s',
              }}
            >
              Results
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

          {/* Scan Tab */}
          {activeTab === 'scan' && (
            <div className="glass" style={{ padding: '32px', borderRadius: '24px' }}>
              {/* Quick Food Suggestions */}
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontWeight: '500', marginBottom: '8px' }}>Quick search:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {quickFoods.map((food) => (
                    <button
                      key={food}
                      onClick={() => {
                        setFoodName(food);
                        setSelectedImage(null);
                        setFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                        setTimeout(() => handleAnalyze(), 300);
                      }}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '20px',
                        border: '1px solid rgba(22,163,74,0.3)',
                        background: foodName === food ? '#16A34A' : 'transparent',
                        color: foodName === food ? 'white' : '#0F172A',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        transition: 'all 0.3s',
                      }}
                    >
                      {food.charAt(0).toUpperCase() + food.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Food Entry */}
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontWeight: '500', marginBottom: '8px' }}>Or enter food name manually:</p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="e.g., pizza, apple, rice, chicken"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '12px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      background: 'rgba(255,255,255,0.5)',
                      fontSize: '1rem',
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAnalyze();
                      }
                    }}
                  />
                  <button
                    onClick={handleAnalyze}
                    className="btn-primary"
                    disabled={analyzing || !foodName}
                    style={{
                      opacity: analyzing || !foodName ? 0.7 : 1,
                      cursor: analyzing || !foodName ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {analyzing ? 'Searching...' : '🔍 Search'}
                  </button>
                </div>
              </div>

              <div style={{ textAlign: 'center', margin: '12px 0', opacity: 0.5 }}>
                <span>— OR Upload an Image —</span>
              </div>

              {/* Image Upload */}
              <div 
                style={{
                  border: '2px dashed rgba(0,0,0,0.2)',
                  borderRadius: '16px',
                  padding: '40px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  minHeight: '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = '#16A34A';
                  e.currentTarget.style.background = 'rgba(22,163,74,0.05)';
                }}
                onDragLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)';
                  e.currentTarget.style.background = 'transparent';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) {
                    const event = { target: { files: [file] } } as any;
                    handleImageUpload(event);
                  }
                  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                {selectedImage ? (
                  <div style={{ width: '100%', maxWidth: '400px' }}>
                    <img 
                      src={selectedImage} 
                      alt="Selected meal"
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '300px',
                        objectFit: 'cover',
                        borderRadius: '12px',
                      }}
                    />
                    <p style={{ marginTop: '12px', opacity: 0.7 }}>
                      Click to change image
                    </p>
                  </div>
                ) : (
                  <>
                    <span style={{ fontSize: '4rem' }}>📷</span>
                    <h3 style={{ marginTop: '16px' }}>Upload a meal photo</h3>
                    <p style={{ opacity: 0.7, marginTop: '8px' }}>
                      Click or drag & drop an image here
                    </p>
                    <p style={{ fontSize: '0.85rem', opacity: 0.5, marginTop: '8px' }}>
                      Supports JPG, PNG, WEBP (Max 5MB)
                    </p>
                  </>
                )}
              </div>

              {selectedImage && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'center' }}>
                  <button
                    onClick={handleAnalyze}
                    className="btn-primary"
                    disabled={analyzing}
                    style={{
                      opacity: analyzing ? 0.7 : 1,
                      cursor: analyzing ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {analyzing ? 'Analyzing...' : '🔍 Analyze Food'}
                  </button>
                  <button
                    onClick={resetScanner}
                    className="btn-outline"
                  >
                    Clear Image
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Results Tab */}
          {activeTab === 'results' && nutritionData && (
            <div className="glass" style={{ padding: '32px', borderRadius: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>
                Analysis Results
              </h2>

              {/* Health Score */}
              <div style={{
                background: `linear-gradient(135deg, ${getHealthScoreColor(nutritionData.nutrition.healthScore)}20, transparent)`,
                padding: '20px',
                borderRadius: '16px',
                marginBottom: '24px',
                border: `2px solid ${getHealthScoreColor(nutritionData.nutrition.healthScore)}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem' }}>Health Score</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: '700', color: getHealthScoreColor(nutritionData.nutrition.healthScore) }}>
                      {nutritionData.nutrition.healthScore}/100
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '1.5rem', fontWeight: '600' }}>
                      {getHealthScoreLabel(nutritionData.nutrition.healthScore)}
                    </p>
                    <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>
                      {nutritionData.foodName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Nutrition Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.05)' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Nutrient</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Per Serving</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Calories', value: nutritionData.nutrition.calories, unit: 'kcal', status: 'normal' },
                      { name: 'Protein', value: nutritionData.nutrition.protein, unit: 'g', status: 'good' },
                      { name: 'Carbohydrates', value: nutritionData.nutrition.carbs, unit: 'g', status: 'normal' },
                      { name: 'Fat', value: nutritionData.nutrition.fat, unit: 'g', status: 'normal' },
                      { name: 'Fiber', value: nutritionData.nutrition.fiber, unit: 'g', status: 'good' },
                      { name: 'Sugar', value: nutritionData.nutrition.sugar, unit: 'g', status: 'warning' },
                      { name: 'Sodium', value: nutritionData.nutrition.sodium, unit: 'mg', status: 'normal' },
                    ].map((item, index) => (
                      <tr key={index} style={{
                        borderBottom: '1px solid rgba(0,0,0,0.05)',
                      }}>
                        <td style={{ padding: '12px', fontWeight: '500' }}>{item.name}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <strong>{item.value || 0}</strong> {item.unit}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', opacity: 0.7 }}>
                          per 100g
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            background: item.status === 'good' ? '#22C55E20' : 
                                       item.status === 'warning' ? '#F59E0B20' : 
                                       '#E2E8F020',
                            color: item.status === 'good' ? '#22C55E' : 
                                   item.status === 'warning' ? '#F59E0B' : 
                                   '#0F172A',
                          }}>
                            {item.status === 'good' ? '✅ Good' : 
                             item.status === 'warning' ? '⚠️ Moderate' : 
                             '✓ Normal'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Detected Labels */}
              {nutritionData.detectedLabels && nutritionData.detectedLabels.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <p style={{ fontWeight: '500', marginBottom: '8px' }}>Detected Items:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {nutritionData.detectedLabels.map((label: string, idx: number) => (
                      <span key={idx} style={{
                        background: 'rgba(22,163,74,0.1)',
                        padding: '4px 16px',
                        borderRadius: '20px',
                        fontSize: '0.9rem',
                        border: '1px solid rgba(22,163,74,0.2)',
                      }}>
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <button
                  onClick={resetScanner}
                  className="btn-primary"
                >
                  Scan Another Meal
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className="btn-outline"
                >
                  View History
                </button>
              </div>
            </div>
          )}

          {activeTab === 'results' && !nutritionData && (
            <div className="glass" style={{ padding: '40px', borderRadius: '24px', textAlign: 'center' }}>
              <p style={{ opacity: 0.7 }}>No results yet. Scan a meal first!</p>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="glass" style={{ padding: '32px', borderRadius: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>
                📊 Nutrition History
              </h2>
              {history.length === 0 ? (
                <p style={{ opacity: 0.7, textAlign: 'center', padding: '40px' }}>
                  No entries yet. Start scanning your meals!
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                  }}>
                    <thead>
                      <tr style={{ background: 'rgba(0,0,0,0.05)' }}>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Food</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Calories</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Protein</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Carbs</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Fat</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Score</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((entry: any) => (
                        <tr key={entry._id} style={{
                          borderBottom: '1px solid rgba(0,0,0,0.05)',
                        }}>
                          <td style={{ padding: '12px', fontWeight: '500' }}>{entry.foodName}</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>{Math.round(entry.calories || 0)} kcal</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>{entry.protein || 0}g</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>{entry.carbs || 0}g</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>{entry.fat || 0}g</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 12px',
                              borderRadius: '20px',
                              fontSize: '0.85rem',
                              background: entry.healthScore >= 60 ? '#22C55E20' : '#F59E0B20',
                              color: entry.healthScore >= 60 ? '#22C55E' : '#F59E0B',
                            }}>
                              {entry.healthScore || 0}%
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', opacity: 0.7, fontSize: '0.9rem' }}>
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}