import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Download, TrendingUp, TrendingDown, Star, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ReportsPage = () => {
    const { user } = useContext(AuthContext);
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReportData();
    }, []);

    const fetchReportData = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/menu/ratings/weekly`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setReportData(data);
            setLoading(false);
        } catch (e) {
            toast.error("Failed to load report data");
            setLoading(false);
        }
    };

    const lowRated = reportData.filter(d => d.avgStars < 3).sort((a,b) => a.avgStars - b.avgStars);
    const highRated = reportData.filter(d => d.avgStars >= 3).sort((a,b) => b.avgStars - a.avgStars);

    const handlePrint = () => {
        window.print();
    };

    const downloadPDF = async () => {
        // High-Fi PDF (Attempting again with absolute basics)
        try {
            toast.info('Synthesizing PDF document...', { autoClose: 1000 });
            const pdf = new jsPDF('p', 'mm', 'a4');
            pdf.setFontSize(18);
            pdf.text('Hostel Food Quality Report', 15, 20);
            pdf.setFontSize(10);
            pdf.text(`Official Document - ${new Date().toLocaleDateString()}`, 15, 28);
            
            // Just draw the table text for now to ensure small size & successful name
            let y = 40;
            reportData.forEach(item => {
                pdf.text(`${item.dish} - ${item.avgStars} Stars`, 15, y);
                y += 10;
            });

            pdf.save('FoodData.pdf');
            toast.success('Fast PDF generated!');
        } catch (e) {
            toast.error('Fast PDF failed, please use Print');
        }
    };

    if (loading) return <div className="content-area">Generating reports...</div>;

    return (
        <div className="content-area animate-fade-in">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="page-title">Weekly Food Reports</h1>
                    <p className="text-muted">Summary of student feedback for the current week.</p>
                </div>
                <button onClick={handlePrint} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.6rem 1rem', fontSize: '0.8rem' }}>
                    <Download size={18} /> <span className="hide-mobile">Save Report as PDF (Print)</span><span className="show-mobile">Save PDF</span>
                </button>
            </header>

            <div id="report-to-download">
                {/* Graph Summary */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                        <Star color="gold" fill="gold" size={18} /> Weekly Satisfaction
                    </h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reportData.length > 0 ? [...reportData].sort((a,b) => b.avgStars - a.avgStars).slice(0, 15) : []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="dish" tick={{fontSize: 9}} height={60} interval={0} angle={-30} textAnchor="end" />
                                <YAxis domain={[0, 5]} tick={{fontSize: 10}} />
                                <Tooltip />
                                <Bar dataKey="avgStars" name="Average Stars">
                                    {(reportData.length > 0 ? [...reportData].sort((a,b) => b.avgStars - a.avgStars).slice(0, 15) : []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.avgStars < 3 ? '#ef4444' : '#10b981'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid-responsive" style={{ gap: '1.5rem' }}>
                    {/* Low Rating Report */}
                    <div className="card" style={{ borderTop: '5px solid #ef4444' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef4444', fontWeight: 800, marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                            <TrendingDown size={22} /> IMPROVEMENT NEEDED
                        </div>
                        {lowRated.length > 0 ? (
                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Item Name</th>
                                            <th>Rating</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lowRated.map((item, i) => (
                                            <tr key={i}>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{item.dish}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.meal} | {item.date}</div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Star size={14} fill="gold" color="gold" /> {item.avgStars}
                                                    </div>
                                                </td>
                                                <td><span className="badge badge-danger">Poor</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : <p className="text-muted">No items rated below 3 stars this week. 🎉</p>}
                    </div>

                    {/* High Rating Report */}
                    <div className="card" style={{ borderTop: '5px solid #10b981' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#10b981', fontWeight: 800, marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                            <TrendingUp size={22} /> TOP PERFORMERS
                        </div>
                        {highRated.length > 0 ? (
                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Item Name</th>
                                            <th>Rating</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {highRated.map((item, i) => (
                                            <tr key={i}>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{item.dish}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.meal} | {item.date}</div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Star size={14} fill="gold" color="gold" /> {item.avgStars}
                                                    </div>
                                                </td>
                                                <td><span className="badge badge-resolved">{item.avgStars >= 4 ? 'Excellent' : 'Good'}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : <p className="text-muted">No highly rated items yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
