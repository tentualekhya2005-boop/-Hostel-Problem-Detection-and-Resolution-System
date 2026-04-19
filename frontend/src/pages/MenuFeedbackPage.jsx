import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Star, Utensils, Calendar, Clock } from 'lucide-react';

const MenuFeedbackPage = () => {
    const { user } = useContext(AuthContext);
    const [weekHistory, setWeekHistory] = useState([]);
    const [ratings, setRatings] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWeekData();
    }, []);

    const fetchWeekData = async () => {
        try {
            const history = [];
            // Fetch menus for last 7 days
            for (let i = 0; i < 7; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                
                try {
                    const menuRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/menu/date/${dateStr}`, {
                        headers: { Authorization: `Bearer ${user.token}` }
                    });
                    
                    const ratingRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/menu/my-rating/${dateStr}`, {
                        headers: { Authorization: `Bearer ${user.token}` }
                    });
                    
                    history.push({
                        date: dateStr,
                        menu: menuRes.data,
                        ratings: ratingRes.data || {}
                    });
                } catch (e) {
                    // Skip dates with no menu
                }
            }
            setWeekHistory(history);
            setLoading(false);
        } catch (e) {
            toast.error("Failed to load feedback history");
            setLoading(false);
        }
    };

    const handleRate = async (date, meal, rating, itemName) => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/menu/rate`, { date, meal, rating, itemName }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            
            // Update local state
            setWeekHistory(prev => prev.map(day => {
                if (day.date === date) {
                    const newRatings = day.ratings ? { ...day.ratings } : {};
                    const items = [...(newRatings.itemRatings || [])];
                    const idx = items.findIndex(i => i.itemName === itemName);
                    if (idx > -1) items[idx].rating = rating;
                    else items.push({ itemName, category: meal, rating });
                    newRatings.itemRatings = items;
                    newRatings[meal] = rating; // Legacy sync
                    return { ...day, ratings: newRatings };
                }
                return day;
            }));
            toast.success(`${itemName} rated!`);
        } catch (e) { toast.error("Rating failed"); }
    };

    if (loading) return <div className="content-area">Loading meal history...</div>;

    return (
        <div className="content-area animate-fade-in">
            <header style={{ marginBottom: '3rem' }}>
                <h1 className="page-title">Menu Feedback</h1>
                <p className="text-muted">Rate your meals to help us improve the food quality.</p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {weekHistory.map((day, idx) => (
                    <div key={idx} className="card" style={{ padding: '0' }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: idx === 0 ? 'var(--primary-light)' : 'transparent' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <Calendar size={20} color="var(--primary)" />
                                <span style={{ fontWeight: 700 }}>{idx === 0 ? 'Today' : new Date(day.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                            </div>
                            <Clock size={18} color="var(--text-muted)" />
                        </div>
                        
                        <div className="grid-responsive" style={{ padding: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                            {['breakfast', 'lunch', 'snacks', 'dinner'].map(meal => (
                                <div key={meal} className="hover-lift" style={{ 
                                    padding: '1.5rem', 
                                    background: 'var(--bg-secondary)', 
                                    borderRadius: '20px', 
                                    border: '1px solid var(--border)', 
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    <div style={{ color: 'var(--primary)', fontWeight: 800, marginBottom: '1.25rem', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Utensils size={14} /> {meal}
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                        {(day.menu[meal] || '').split(',').map((item, itemIdx, arr) => {
                                            const itemName = item.trim();
                                            if (!itemName) return null;
                                            
                                            // Find rating for this specific item in itemRatings
                                            const itemRatingObj = (day.ratings?.itemRatings || []).find(ir => ir.itemName === itemName);
                                            const currentRating = itemRatingObj ? itemRatingObj.rating : (day.ratings?.[meal] || 0);

                                            return (
                                                <div key={itemIdx} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', padding: '0.5rem 0', borderBottom: itemIdx < arr.length - 1 ? '1px dashed var(--border)' : 'none' }}>
                                                    <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', opacity: 0.9 }}>{itemName}</span>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        {[1,2,3,4,5].map(star => (
                                                            <Star 
                                                                key={star} 
                                                                size={20} 
                                                                style={{ cursor: 'pointer', transition: 'transform 0.1s' }}
                                                                fill={star <= currentRating ? 'var(--primary)' : 'transparent'}
                                                                stroke={star <= currentRating ? 'var(--primary)' : 'var(--text-muted)'}
                                                                onClick={() => handleRate(day.date, meal, star, itemName)}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            {weekHistory.length === 0 && <div className="card text-muted">No menu history found.</div>}
        </div>
    );
};

export default MenuFeedbackPage;
