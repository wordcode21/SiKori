import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { FileSpreadsheet, Download } from 'lucide-react';

const Reports = () => {
    const [activities, setActivities] = useState([]);
    const [students, setStudents] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [actRes, stuRes, assRes] = await Promise.all([
                    api.get('/activities'),
                    api.get('/students'),
                    api.get('/assessments')
                ]);
                setActivities(actRes.data);
                setStudents(stuRes.data);
                setAssessments(assRes.data);
            } catch (e) { console.error(e); }
        };
        load();
    }, []);

    const handleExport = async (activityId) => {
        const activity = activities.find(a => a.id === activityId);
        if (!activity) return;

        setLoading(true);
        try {
            const XLSX = await import('xlsx');
            const wb = XLSX.utils.book_new();

            // 1. Summative Sheet
            if (activity.SummativeAspects && activity.SummativeAspects.length > 0) {
                const headers = ['No', 'NISN', 'Nama', 'Kelas', ...activity.SummativeAspects.map(a => a.name)];
                const data = students.map((s, idx) => {
                    const row = { No: idx + 1, NISN: s.nisn, Nama: s.name, Kelas: s.class };
                    activity.SummativeAspects.forEach(asp => {
                        // Find Assessment
                        const ass = assessments.find(ax => ax.studentNisn === s.nisn && ax.aspectId === asp.id && ax.type === 'SUMMATIVE');
                        row[asp.name] = ass?.score || '-';
                    });
                    return row;
                });
                const ws = XLSX.utils.json_to_sheet(data, { header: Object.keys(data[0] || {}) }); // Preserves order mostly
                XLSX.utils.book_append_sheet(wb, ws, `S_${activity.name.substring(0, 25)}`);
            }

            // 2. Formative Sheet
            if (activity.FormativeItems && activity.FormativeItems.length > 0) {
                const data = students.map((s, idx) => {
                    const row = { No: idx + 1, NISN: s.nisn, Nama: s.name, Kelas: s.class };
                    activity.FormativeItems.forEach(itm => {
                        const ass = assessments.find(ax => ax.studentNisn === s.nisn && ax.itemId === itm.id && ax.type === 'FORMATIVE');
                        row[itm.name] = ass?.checked ? 'V' : '-';
                    });
                    return row;
                });
                const ws = XLSX.utils.json_to_sheet(data);
                XLSX.utils.book_append_sheet(wb, ws, `F_${activity.name.substring(0, 25)}`);
            }

            XLSX.writeFile(wb, `Laporan_${activity.name}.xlsx`);

        } catch (e) {
            console.error(e);
            alert("Gagal Export");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="glass-card p-6">
                <h2 className="text-2xl font-bold text-gray-800">Laporan & Export</h2>
                <p className="text-sm text-gray-500">Unduh rekap penilaian dalam format Excel.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activities.map(act => (
                    <div key={act.id} className="glass-card p-6 flex flex-col justify-between hover:shadow-lg transition-shadow">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-1">{act.name}</h3>
                            <p className="text-xs text-gray-500 mb-4">
                                Sumatif: {act.SummativeAspects?.length || 0} Aspek |
                                Formatif: {act.FormativeItems?.length || 0} Item
                            </p>
                        </div>
                        <button
                            disabled={loading}
                            onClick={() => handleExport(act.id)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-bold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processing...' : <><Download size={18} /> Download Excel</>}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Reports;
