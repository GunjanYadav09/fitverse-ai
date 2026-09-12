import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/Layout';

export default function GroceryPlanner() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [lists, setLists] = useState<any[]>([]);
  const [activeList, setActiveList] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'generate' | 'list'>('generate');
  const [customItem, setCustomItem] = useState({ name: '', quantity: '', category: 'other' });
  const [showAddItem, setShowAddItem] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') fetchLists();
  }, [status, router]);

  const fetchLists = async () => {
    try {
      const res = await fetch('/api/grocery-planner');
      const data = await res.json();
      if (res.ok) {
        setLists(data.lists || []);
        if (data.lists?.length > 0) {
          setActiveList(data.lists[0]);
          setActiveTab('list');
        }
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/grocery-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveList(data.list);
        setActiveTab('list');
        fetchLists();
        toast.success('Grocery list generated! 🛒');
      } else {
        toast.error(data.message || 'Error generating');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setGenerating(false);
    }
  };

  const toggleItem = async (itemId: string) => {
    if (!activeList) return;
    try {
      const res = await fetch('/api/grocery-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', listId: activeList._id, itemId }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveList(data.list);
        // Update in lists array too
        setLists(lists.map((l) => (l._id === data.list._id ? data.list : l)));
      }
    } catch (error) {
      toast.error('Error toggling item');
    }
  };

  const addItem = async () => {
    if (!customItem.name.trim()) {
      toast.error('Please enter an item name');
      return;
    }
    try {
      const res = await fetch('/api/grocery-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-item',
          listId: activeList._id,
          name: customItem.name,
          quantity: customItem.quantity,
          category: customItem.category,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveList(data.list);
        setLists(lists.map((l) => (l._id === data.list._id ? data.list : l)));
        setCustomItem({ name: '', quantity: '', category: 'other' });
        setShowAddItem(false);
        toast.success('Item added!');
      }
    } catch (error) {
      toast.error('Error adding item');
    }
  };

  const removeItem = async (itemId: string) => {
    if (!confirm('Remove this item?')) return;
    try {
      const res = await fetch('/api/grocery-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove-item', listId: activeList._id, itemId }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveList(data.list);
        setLists(lists.map((l) => (l._id === data.list._id ? data.list : l)));
      }
    } catch (error) {
      toast.error('Error removing item');
    }
  };

  const resetChecked = async () => {
    try {
      const res = await fetch('/api/grocery-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', listId: activeList._id }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveList(data.list);
        setLists(lists.map((l) => (l._id === data.list._id ? data.list : l)));
        toast.success('All items unchecked');
      }
    } catch (error) {
      toast.error('Error resetting');
    }
  };

  const deleteList = async (listId: string) => {
    if (!confirm('Delete this list?')) return;
    try {
      const res = await fetch('/api/grocery-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', listId }),
      });
      if (res.ok) {
        toast.success('List deleted');
        const remaining = lists.filter((l) => l._id !== listId);
        setLists(remaining);
        if (remaining.length > 0) {
          setActiveList(remaining[0]);
        } else {
          setActiveList(null);
          setActiveTab('generate');
        }
      }
    } catch (error) {
      toast.error('Error deleting');
    }
  };

  const categoryEmoji: any = {
    produce: '🥬',
    dairy: '🥛',
    protein: '🍗',
    grains: '🌾',
    spices: '🌶️',
    pantry: '🥫',
    frozen: '🧊',
    beverages: '🥤',
    other: '📦',
  };

  const categoryLabel: any = {
    produce: 'Fruits & Vegetables',
    dairy: 'Dairy & Eggs',
    protein: 'Protein',
    grains: 'Grains & Bread',
    spices: 'Spices & Masala',
    pantry: 'Pantry Staples',
    frozen: 'Frozen',
    beverages: 'Beverages',
    other: 'Other',
  };

  const categoryColor: any = {
    produce: '#22C55E',
    dairy: '#3B82F6',
    protein: '#EF4444',
    grains: '#F59E0B',
    spices: '#EC4899',
    pantry: '#8B5CF6',
    frozen: '#06B6D4',
    beverages: '#14B8A6',
    other: '#6B7280',
  };

  if (status === 'loading' || loading) {
    return (
      <Layout title="Grocery Planner">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: '20px' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ fontSize: '4rem' }}
          >
            🛒
          </motion.div>
          <p style={{ opacity: 0.7 }}>Loading grocery planner...</p>
        </div>
      </Layout>
    );
  }

  if (status === 'unauthenticated') return null;

  const progress = activeList
    ? Math.round((activeList.checkedItems / activeList.totalItems) * 100) || 0
    : 0;

  // Group items by category
  const groupedItems = activeList
    ? activeList.items.reduce((acc: any, item: any) => {
        const cat = item.category || 'other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      }, {})
    : {};

  const categories = Object.keys(groupedItems);
  const filteredCategories =
    filterCategory === 'all' ? categories : categories.filter((c) => c === filterCategory);

  return (
    <Layout title="Grocery Planner - FitVerse AI">
      <section style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div className="container">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: '32px' }}
          >
            <motion.h1
              className="section-title"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}
            >
              <motion.span
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                🛒
              </motion.span>
              Grocery Planner
            </motion.h1>
            <p style={{ opacity: 0.7 }}>
              Auto-generate smart shopping lists from your meal plans 🥗
            </p>
          </motion.div>

          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '24px',
              borderBottom: '1px solid rgba(0,0,0,0.1)',
              paddingBottom: '12px',
              flexWrap: 'wrap',
            }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('generate')}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                background: activeTab === 'generate' ? '#8B5CF6' : 'transparent',
                color: activeTab === 'generate' ? 'white' : '#0F172A',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'background 0.3s',
              }}
            >
              ✨ Generate List
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('list')}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                background: activeTab === 'list' ? '#8B5CF6' : 'transparent',
                color: activeTab === 'list' ? 'white' : '#0F172A',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'background 0.3s',
              }}
            >
              📋 Current List {activeList ? `(${activeList.totalItems})` : ''}
            </motion.button>
          </div>

          {/* ============ GENERATE TAB ============ */}
          <AnimatePresence mode="wait">
            {activeTab === 'generate' && (
              <motion.div
                key="generate"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="glass" style={{ padding: '40px', borderRadius: '24px', textAlign: 'center' }}>
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ fontSize: '5rem', marginBottom: '16px' }}
                  >
                    🛒
                  </motion.div>
                  <h2 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>
                    Let's plan your shopping!
                  </h2>
                  <p style={{ opacity: 0.7, marginBottom: '24px', maxWidth: '600px', margin: '0 auto 24px' }}>
                    We'll automatically generate a grocery list based on your latest meal plan,
                    categorized by aisle with estimated costs.
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGenerate}
                    className="btn-primary"
                    disabled={generating}
                    style={{
                      fontSize: '1.1rem',
                      padding: '16px 40px',
                      opacity: generating ? 0.7 : 1,
                      cursor: generating ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {generating ? '🔄 Generating...' : '✨ Generate Grocery List'}
                  </motion.button>

                  {lists.length > 0 && (
                    <div style={{ marginTop: '40px', textAlign: 'left' }}>
                      <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>📁 Previous Lists</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {lists.map((l) => (
                          <motion.div
                            key={l._id}
                            whileHover={{ scale: 1.01, x: 5 }}
                            onClick={() => {
                              setActiveList(l);
                              setActiveTab('list');
                            }}
                            className="glass"
                            style={{
                              padding: '14px 18px',
                              borderRadius: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '8px',
                            }}
                          >
                            <div>
                              <p style={{ margin: 0, fontWeight: '600', fontSize: '0.95rem' }}>
                                {l.listName}
                              </p>
                              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', opacity: 0.7 }}>
                                {l.totalItems} items • ₹{l.estimatedTotal} estimated •{' '}
                                {new Date(l.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span style={{ color: '#8B5CF6', fontWeight: '500', fontSize: '0.85rem' }}>
                              View →
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ============ LIST TAB ============ */}
            {activeTab === 'list' && activeList && (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
              >
                {/* Header Card */}
                <div className="glass" style={{ padding: '24px 32px', borderRadius: '20px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px',
                    }}
                  >
                    <div>
                      <h2 style={{ fontSize: '1.4rem', marginBottom: '4px' }}>
                        {activeList.listName}
                      </h2>
                      <p style={{ opacity: 0.7, margin: 0, fontSize: '0.9rem' }}>
                        Created {new Date(activeList.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowAddItem(!showAddItem)}
                        className="btn-outline"
                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                      >
                        ➕ Add Item
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={resetChecked}
                        className="btn-outline"
                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                      >
                        🔄 Reset
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => deleteList(activeList._id)}
                        className="btn-outline"
                        style={{
                          padding: '8px 16px',
                          fontSize: '0.85rem',
                          borderColor: '#EF4444',
                          color: '#EF4444',
                        }}
                      >
                        🗑 Delete
                      </motion.button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div style={{ marginTop: '20px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '6px',
                        fontSize: '0.85rem',
                      }}
                    >
                      <span style={{ opacity: 0.7 }}>
                        {activeList.checkedItems} of {activeList.totalItems} items checked
                      </span>
                      <span style={{ fontWeight: '600' }}>{progress}%</span>
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
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.6 }}
                        style={{
                          height: '100%',
                          background: progress === 100 ? '#22C55E' : 'linear-gradient(90deg, #8B5CF6, #A855F7)',
                          borderRadius: '10px',
                        }}
                      />
                    </div>
                  </div>

                  {/* Summary chips */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        background: 'rgba(139,92,246,0.1)',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                      }}
                    >
                      🛍️ {activeList.totalItems} items
                    </span>
                    <span
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        background: 'rgba(34,197,94,0.1)',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                      }}
                    >
                      💰 Est. ₹{activeList.estimatedTotal}
                    </span>
                    <span
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        background: 'rgba(245,158,11,0.1)',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                      }}
                    >
                      ✅ {activeList.checkedItems} done
                    </span>
                  </div>
                </div>

                {/* Add Item Form */}
                <AnimatePresence>
                  {showAddItem && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="glass"
                      style={{ padding: '20px 24px', borderRadius: '16px', overflow: 'hidden' }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                          gap: '12px',
                          alignItems: 'end',
                        }}
                      >
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: '500' }}>
                            Item Name *
                          </label>
                          <input
                            type="text"
                            value={customItem.name}
                            onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
                            placeholder="e.g., Apples"
                            style={{
                              width: '100%',
                              padding: '10px',
                              borderRadius: '10px',
                              border: '1px solid rgba(0,0,0,0.1)',
                              background: 'rgba(255,255,255,0.6)',
                              fontSize: '0.9rem',
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: '500' }}>
                            Quantity
                          </label>
                          <input
                            type="text"
                            value={customItem.quantity}
                            onChange={(e) => setCustomItem({ ...customItem, quantity: e.target.value })}
                            placeholder="e.g., 1 kg"
                            style={{
                              width: '100%',
                              padding: '10px',
                              borderRadius: '10px',
                              border: '1px solid rgba(0,0,0,0.1)',
                              background: 'rgba(255,255,255,0.6)',
                              fontSize: '0.9rem',
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: '500' }}>
                            Category
                          </label>
                          <select
                            value={customItem.category}
                            onChange={(e) => setCustomItem({ ...customItem, category: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '10px',
                              borderRadius: '10px',
                              border: '1px solid rgba(0,0,0,0.1)',
                              background: 'rgba(255,255,255,0.6)',
                              fontSize: '0.9rem',
                            }}
                          >
                            <option value="produce">🥬 Produce</option>
                            <option value="dairy">🥛 Dairy</option>
                            <option value="protein">🍗 Protein</option>
                            <option value="grains">🌾 Grains</option>
                            <option value="spices">🌶️ Spices</option>
                            <option value="pantry">🥫 Pantry</option>
                            <option value="frozen">🧊 Frozen</option>
                            <option value="beverages">🥤 Beverages</option>
                            <option value="other">📦 Other</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={addItem} className="btn-primary" style={{ flex: 1, padding: '10px 16px', fontSize: '0.9rem' }}>
                            Add
                          </button>
                          <button
                            onClick={() => setShowAddItem(false)}
                            className="btn-outline"
                            style={{ padding: '10px 16px', fontSize: '0.9rem' }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Category Filter */}
                {categories.length > 1 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFilterCategory('all')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: 'none',
                        background: filterCategory === 'all' ? '#8B5CF6' : 'rgba(0,0,0,0.05)',
                        color: filterCategory === 'all' ? 'white' : '#0F172A',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                      }}
                    >
                      All ({activeList.totalItems})
                    </motion.button>
                    {categories.map((cat) => (
                      <motion.button
                        key={cat}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFilterCategory(cat)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          border: 'none',
                          background: filterCategory === cat ? categoryColor[cat] : 'rgba(0,0,0,0.05)',
                          color: filterCategory === cat ? 'white' : '#0F172A',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                        }}
                      >
                        {categoryEmoji[cat]} {categoryLabel[cat]} ({groupedItems[cat].length})
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Grouped Items */}
                {filteredCategories.map((cat, catIdx) => (
                  <motion.div
                    key={cat}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: catIdx * 0.08 }}
                    className="glass"
                    style={{
                      padding: '20px 24px',
                      borderRadius: '16px',
                      borderLeft: `4px solid ${categoryColor[cat]}`,
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '1.05rem',
                        marginBottom: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: categoryColor[cat],
                      }}
                    >
                      <span style={{ fontSize: '1.3rem' }}>{categoryEmoji[cat]}</span>
                      {categoryLabel[cat]}
                      <span style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: '400' }}>
                        ({groupedItems[cat].length} items)
                      </span>
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <AnimatePresence>
                        {groupedItems[cat].map((item: any, i: number) => (
                          <motion.div
                            key={item._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: i * 0.03 }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px 16px',
                              borderRadius: '12px',
                              background: item.checked ? 'rgba(34,197,94,0.08)' : 'rgba(0,0,0,0.03)',
                              border: item.checked ? '1px solid rgba(34,197,94,0.25)' : '1px solid transparent',
                              transition: 'all 0.3s',
                            }}
                          >
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => toggleItem(item._id)}
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '8px',
                                border: item.checked ? 'none' : '2px solid rgba(0,0,0,0.2)',
                                background: item.checked ? '#22C55E' : 'transparent',
                                color: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                flexShrink: 0,
                              }}
                            >
                              {item.checked && '✓'}
                            </motion.button>

                            <div
                              style={{ flex: 1, cursor: 'pointer' }}
                              onClick={() => toggleItem(item._id)}
                            >
                              <p
                                style={{
                                  margin: 0,
                                  fontWeight: '500',
                                  fontSize: '0.95rem',
                                  textDecoration: item.checked ? 'line-through' : 'none',
                                  opacity: item.checked ? 0.6 : 1,
                                }}
                              >
                                {item.name}
                              </p>
                              {item.quantity && (
                                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', opacity: 0.6 }}>
                                  {item.quantity}
                                </p>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span
                                style={{
                                  fontSize: '0.85rem',
                                  opacity: item.checked ? 0.4 : 0.7,
                                  fontWeight: '500',
                                }}
                              >
                                ₹{item.estimatedCost}
                              </span>
                              <motion.button
                                whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => removeItem(item._id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '0.95rem',
                                  opacity: 0.4,
                                  padding: '4px 8px',
                                }}
                                title="Remove"
                              >
                                🗑
                              </motion.button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}

                {/* Shopping Complete Celebration */}
                {progress === 100 && activeList.totalItems > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass"
                    style={{
                      padding: '32px',
                      borderRadius: '20px',
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, #22C55E15, #10B98115)',
                      border: '2px solid #22C55E40',
                    }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      style={{ fontSize: '4rem' }}
                    >
                      🎉
                    </motion.div>
                    <h3 style={{ marginTop: '12px', marginBottom: '8px', color: '#22C55E' }}>
                      Shopping Complete!
                    </h3>
                    <p style={{ opacity: 0.8 }}>
                      You've checked off all {activeList.totalItems} items. Great job! 🛒✨
                    </p>
                  </motion.div>
                )}

                {/* Estimated Total Card */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="glass"
                  style={{
                    padding: '20px 24px',
                    borderRadius: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <p style={{ margin: 0, opacity: 0.7, fontSize: '0.85rem' }}>
                      💰 Estimated Total Cost
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '1.6rem', fontWeight: '700', color: '#22C55E' }}>
                      ₹{activeList.estimatedTotal}
                    </p>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6, maxWidth: '280px' }}>
                    * Estimates only. Actual prices may vary by store and location.
                  </p>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'list' && !activeList && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass"
                style={{ padding: '60px 20px', borderRadius: '24px', textAlign: 'center' }}
              >
                <motion.div
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ fontSize: '4rem', marginBottom: '16px' }}
                >
                  🛒
                </motion.div>
                <p style={{ opacity: 0.7 }}>No grocery list yet. Generate one first!</p>
                <button
                  onClick={() => setActiveTab('generate')}
                  className="btn-primary"
                  style={{ marginTop: '16px' }}
                >
                  Generate List
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </Layout>
  );
}