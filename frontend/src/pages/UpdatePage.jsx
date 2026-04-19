import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Calendar, BarChart3, RefreshCw } from 'lucide-react';

const UpdatePage = () => {
  const { user } = useContext(AuthContext);

  // Menu state
  const [menuDate, setMenuDate] = useState(new Date().toISOString().split('T')[0]);
  const [menu, setMenu] = useState({ breakfast: '', lunch: '', snacks: '', dinner: '' });
  const [menuLoading, setMenuLoading] = useState(false);

  // Stats state
  const [stats, setStats] = useState({
    year1: 0, year1Total: 0,
    year2: 0, year2Total: 0,
    year3: 0, year3Total: 0,
    year4: 0, year4Total: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => { fetchCurrentStats(); }, []);

  const fetchCurrentStats = async () => {
    try {
      const { data } = await axios.get(`http://127.0.0.1:5001/api/stats`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setStats(data);
    } catch (e) { console.log('Could not fetch stats'); }
  };

  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    setMenuLoading(true);
    try {
      await axios.post(`http://127.0.0.1:5001/api/menu`, { date: menuDate, ...menu }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success('✅ Daily menu updated successfully!');
      setMenu({ breakfast: '', lunch: '', snacks: '', dinner: '' });
    } catch (error) {
      toast.error('Failed to update menu');
    } finally { setMenuLoading(false); }
  };

  const handleStatsSubmit = async (e) => {
    e.preventDefault();
    setStatsLoading(true);
    try {
      await axios.post(`http://127.0.0.1:5001/api/stats`, stats, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success('✅ Hostel occupancy updated successfully!');
    } catch (error) {
      toast.error('Failed to update stats');
    } finally { setStatsLoading(false); }
  };

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <RefreshCw size={32} color="var(--primary)" /> Update Hostel Data
        </h1>
        <p className="text-muted">Update the daily food menu and hostel occupancy statistics.</p>
      </header>

      <div className="grid-responsive">
        {/* Update Menu */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>
            <Calendar size={22} /> Update Daily Menu
          </div>
          <form onSubmit={handleMenuSubmit}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={menuDate} onChange={e => setMenuDate(e.target.value)} required />
            </div>
            {['breakfast', 'lunch', 'snacks', 'dinner'].map(meal => (
              <div className="form-group" key={meal}>
                <label className="form-label" style={{ textTransform: 'capitalize' }}>
                  {meal === 'breakfast' ? '🌅' : meal === 'lunch' ? '☀️' : meal === 'snacks' ? '🍎' : '🌙'} {meal.charAt(0).toUpperCase() + meal.slice(1)}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={`Enter ${meal} items, comma separated`}
                  value={menu[meal]}
                  onChange={e => setMenu({ ...menu, [meal]: e.target.value })}
                  required
                />
              </div>
            ))}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={menuLoading}>
              {menuLoading ? 'Saving...' : '💾 Save Menu'}
            </button>
          </form>
        </div>

        {/* Update Hostel Stats */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>
            <BarChart3 size={22} /> Update Hostel Occupancy
          </div>
          <form onSubmit={handleStatsSubmit}>
            {[1, 2, 3, 4].map(yr => (
              <div className="form-group" key={yr}>
                <label className="form-label">{yr}{yr === 1 ? 'st' : yr === 2 ? 'nd' : yr === 3 ? 'rd' : 'th'} Year <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Occupied / Capacity)</span></label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    placeholder="Occupied"
                    value={stats[`year${yr}`]}
                    onChange={e => setStats({ ...stats, [`year${yr}`]: Number(e.target.value) })}
                    required
                  />
                  <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>/</span>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    placeholder="Capacity"
                    value={stats[`year${yr}Total`]}
                    onChange={e => setStats({ ...stats, [`year${yr}Total`]: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>
            ))}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={statsLoading}>
              {statsLoading ? 'Saving...' : '💾 Save Occupancy'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdatePage;
