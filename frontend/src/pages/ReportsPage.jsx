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

    const downloadPDF = async () => {
        const input = document.getElementById('report-to-download');
        if (!input) return;
        try {
            toast.info('Preparing PDF...', { autoClose: 1000 });
            const canvas = await html2canvas(input, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.setFontSize(20);
            pdf.text('Hostel Food Quality Report', 105, 15, { align: 'center' });
            pdf.setFontSize(10);
            pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 22, { align: 'center' });
            
            pdf.addImage(imgData, 'PNG', 0, 30, pdfWidth, pdfHeight);
            pdf.save(`Food_Report_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('Report downloaded!');
        } catch (err) {
            toast.error('Failed to generate PDF');
        }
    };

    if (loading) return <div className="content-area">Generating reports...</div>;

    return (
        <div className="content-area animate-fade-in">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Weekly Food Reports</h1>
                    <p className="text-muted">Summary of student feedback for the current week.</p>
                </div>
                <button onClick={downloadPDF} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Download size={20} /> Download Report PDF
                </button>
            </header>

            <div id="report-to-download">
                {/* Graph Summary */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Star color="gold" fill="gold" /> Weekly Satisfaction Comparison
                    </h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[...reportData].sort((a,b) => b.avgStars - a.avgStars).slice(0, 15)}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="dish" tick={{fontSize: 10}} height={60} interval={0} angle={-30} textAnchor="end" />
                                <YAxis domain={[0, 5]} />
                                <Tooltip />
                                <Bar dataKey="avgStars" name="Average Stars">
                                    {reportData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.avgStars < 3 ? '#ef4444' : '#10b981'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* Low Rating Report */}
                    <div className="card" style={{ borderTop: '5px solid #ef4444' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef4444', fontWeight: 800, marginBottom: '1.5rem', fontSize: '1.2rem' }}>
                            <TrendingDown size={24} /> IMPROVEMENT NEEDED ({"<"} 3 Stars)
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
                                                <td><span className="badge badge-rejected">Poor</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : <p className="text-muted">No items rated below 3 stars this week. 🎉</p>}
                    </div>

                    {/* High Rating Report */}
                    <div className="card" style={{ borderTop: '5px solid #10b981' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#10b981', fontWeight: 800, marginBottom: '1.5rem', fontSize: '1.2rem' }}>
                            <TrendingUp size={24} /> TOP PERFORMERS ({">="} 3 Stars)
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
