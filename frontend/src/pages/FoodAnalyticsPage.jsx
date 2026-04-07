import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertCircle, TrendingDown, TrendingUp, Filter } from 'lucide-react';

const FoodAnalyticsPage = () => {
    const { user } = useContext(AuthContext);
    const [weeklyData, setWeeklyData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWeeklyStats();
    }, []);

    const fetchWeeklyStats = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/menu/ratings/weekly`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setWeeklyData(data);
            setLoading(false);
        } catch (e) {
            toast.error("Failed to load analytics");
            setLoading(false);
        }
    };

    const lowRated = weeklyData.filter(d => d.satisfaction < 50).sort((a,b) => a.satisfaction - b.satisfaction);
    const topRated = weeklyData.filter(d => d.satisfaction > 80).sort((a,b) => b.satisfaction - a.satisfaction);

    if (loading) return <div className="content-area">Analyzing food data...</div>;

    return (
        <div className="content-area animate-fade-in">
            <header style={{ marginBottom: '3rem' }}>
                <h1 className="page-title">Food Quality Analytics</h1>
                <p className="text-muted">Analyzing student satisfaction for the past 7 days</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                {/* Weekly Chart */}
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontWeight: 600, fontSize: '1.25rem' }}>
                        <TrendingUp size={24} color="var(--primary)" /> Meal Satisfaction Trend (%)
                    </div>
                    <div style={{ width: '100%', height: 350 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyData.slice(0, 10)}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="dish" tick={{fontSize: 10}} />
                                <YAxis domain={[0, 100]} unit="%" />
                                <Tooltip />
                                <Bar dataKey="satisfaction" fill="#8884d8">
                                    {weeklyData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.satisfaction < 50 ? '#EF4444' : '#6366F1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Rated Summary */}
                <div className="card" style={{ borderLeft: '5px solid #10B981' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#059669', fontWeight: 700, marginBottom: '1rem' }}>
                        <TrendingUp size={20} /> High Rated Items
                    </div>
                    {topRated.length > 0 ? (
                        topRated.slice(0, 3).map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                <span>{item.dish}</span>
                                <strong style={{ color: '#10B981' }}>{item.satisfaction}%</strong>
                            </div>
                        ))
                    ) : <p className="text-muted">No top rated items yet.</p>}
                </div>

                {/* Low Rated Summary */}
                <div className="card" style={{ borderLeft: '5px solid #EF4444' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#DC2626', fontWeight: 700, marginBottom: '1rem' }}>
                        <TrendingDown size={20} /> Focus Needed (Low Rated)
                    </div>
                    {lowRated.length > 0 ? (
                        lowRated.slice(0, 3).map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                <span>{item.dish}</span>
                                <strong style={{ color: '#EF4444' }}>{item.satisfaction}%</strong>
                            </div>
                        ))
                    ) : <p className="text-muted">All items are rated above 50%!</p>}
                </div>
            </div>

            {/* Weekly Detailed Sheet */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700, fontSize: '1.25rem' }}>
                        <Filter size={24} /> Weekly Performance Sheet
                    </div>
                </div>
                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Meal</th>
                                <th>Dish Name</th>
                                <th>Satisfaction</th>
                                <th>Votes</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {weeklyData.map((row, idx) => (
                                <tr key={idx} style={{ background: row.satisfaction < 50 ? '#fef2f2' : 'transparent' }}>
                                    <td>{row.date}</td>
                                    <td>{row.meal}</td>
                                    <td style={{ fontWeight: 700 }}>{row.dish}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '40px', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: `${row.satisfaction}%`, height: '100%', background: row.satisfaction < 50 ? '#EF4444' : '#10B981' }} />
                                            </div>
                                            {row.satisfaction}%
                                        </div>
                                    </td>
                                    <td>{row.count}</td>
                                    <td>
                                        <span className={`badge badge-${row.satisfaction < 50 ? 'rejected' : 'resolved'}`}>
                                            {row.satisfaction < 50 ? 'Poor' : row.satisfaction > 80 ? 'Excellent' : 'Good'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FoodAnalyticsPage;
