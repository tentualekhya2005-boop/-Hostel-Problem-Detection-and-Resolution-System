import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Grid, Trash2, Utensils, Music } from 'lucide-react';

const FavoritesPage = () => {
    const { user } = useContext(AuthContext);
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/me`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setFavorites(data.favorites || []);
            setLoading(false);
        } catch (e) {
            toast.error("Failed to load favorites");
            setLoading(false);
        }
    };

    const toggleFavorite = async (item) => {
        try {
            const { data } = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/favorites`, { item }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setFavorites(data);
            toast.success("Removed from favorites");
        } catch (e) {
            toast.error("Action failed");
        }
    };

    if (loading) return <div className="content-area">Loading Favorites...</div>;

    return (
        <div className="content-area animate-fade-in">
            <header style={{ marginBottom: '3rem' }}>
                <h1 className="page-title">My Favourites</h1>
                <p className="text-muted">Your curated list of top-rated items</p>
            </header>

            {favorites.length === 0 ? (
                <div className="card" style={{ padding: '5rem', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        <Grid size={64} color="#E2E8F0" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>No favorites yet</h2>
                    <p className="text-muted">Heart items in the Daily Menu to see them here.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                    {favorites.map((item, idx) => (
                        <div key={idx} className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderLeft: '5px solid var(--primary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Utensils size={20} color="var(--primary)" />
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{item}</div>
                            </div>
                            <button 
                                onClick={() => toggleFavorite(item)}
                                style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '0.5rem' }}
                                title="Remove"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FavoritesPage;
