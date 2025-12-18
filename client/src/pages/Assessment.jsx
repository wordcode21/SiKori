import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const Assessment = () => {
    const [loading, setLoading] = useState(false);

    // Filters
    const [filterClass, setFilterClass] = useState('');
    const [selectedActivityId, setSelectedActivityId] = useState('');
    const [tab, setTab] = useState('SUMMATIVE'); // SUMMATIVE | FORMATIVE

    // Data
    const [students, setStudents] = useState([]);
    const [activities, setActivities] = useState([]);
    const [currentActivity, setCurrentActivity] = useState(null);
    const [assessments, setAssessments] = useState({}); // Map: key -> data

    // Initial Load
    useEffect(() => {
        const loadInit = async () => {
            try {
                const actRes = await api.get('/activities');
                setActivities(actRes.data);
                if (actRes.data.length > 0) setSelectedActivityId(actRes.data[0].id);
            } catch (e) { console.error(e); }
        };
        loadInit();
    }, []);

    // Load Students & Assessments when filter changes
    useEffect(() => {
        if (!selectedActivityId) return;

        const loadData = async () => {
            setLoading(true);
            try {
                const act = activities.find(a => a.id === selectedActivityId);
                setCurrentActivity(act);

                // Fetch Students (optionally filtered by class if implemented)
                const studentRes = await api.get(`/students${filterClass && filterClass !== 'all' ? `?class=${filterClass}` : ''}`);
                setStudents(studentRes.data);

                // Fetch Existing Assessments
                // Simplified: fetch all for this activity
                const assessRes = await api.get(`/assessments?activityId=${selectedActivityId}`);

                // Transform array to map for O(1) access
                const map = {};
                assessRes.data.forEach(as => {
                    const key = generateKey(as);
                    map[key] = as;
                });
                setAssessments(map);

            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };

        if (activities.length > 0) loadData();

    }, [selectedActivityId, filterClass, activities]);

    const generateKey = (data) => {
        if (data.type === 'SUMMATIVE') return `${data.studentNisn}_${data.aspectId}_SUM`;
        if (data.type === 'FORMATIVE') return `${data.studentNisn}_${data.itemId}_FORM`;
        if (data.type === 'NOTE') return `${data.studentNisn}_NOTE`; // Global note per activity/student
        return '';
    };

    const handleScoreChange = async (studentNisn, aspectId, score) => {
        // Optimistic Update
        const key = `${studentNisn}_${aspectId}_SUM`;
        const oldVal = assessments[key];

        setAssessments(prev => ({ ...prev, [key]: { ...prev[key], score } }));

        try {
            await api.post('/assessments', {
                studentNisn,
                activityId: selectedActivityId,
                type: 'SUMMATIVE',
                aspectId,
                score
            });
        } catch (e) {
            console.error("Save failed", e);
            setAssessments(prev => ({ ...prev, [key]: oldVal })); // Revert
        }
    };

    const handleCheckChange = async (studentNisn, itemId, checked) => {
        const key = `${studentNisn}_${itemId}_FORM`;
        const oldVal = assessments[key];
        setAssessments(prev => ({ ...prev, [key]: { ...prev[key], checked } }));

        try {
            await api.post('/assessments', {
                studentNisn,
                activityId: selectedActivityId,
                type: 'FORMATIVE',
                itemId,
                checked
            });
        } catch (e) {
            setAssessments(prev => ({ ...prev, [key]: oldVal }));
        }
    };

    // Extract unique classes dynamically from student list if specific list not available
    const uniqueClasses = [...new Set(students.map(s => s.class))].sort();

    if (!currentActivity) return <div className="p-8 text-center">Loading or No Activities...</div>;

    return (
        <div className="h-full flex flex-col space-y-4 animate-fade-in">
            {/* Header */}
            <div className="glass-card p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Input Penilaian</h2>
                    <p className="text-xs text-gray-500">{currentActivity.name}</p>
                </div>
                <div className="flex gap-2">
                    <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="bg-white border rounded px-3 py-1 outline-none text-sm">
                        <option value="all">Semua Kelas</option>
                        {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={selectedActivityId} onChange={e => setSelectedActivityId(e.target.value)} className="bg-white border rounded px-3 py-1 outline-none text-sm">
                        {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                <button onClick={() => setTab('SUMMATIVE')} className={`px-6 py-3 rounded-t-xl font-bold text-sm transition-all ${tab === 'SUMMATIVE' ? 'bg-white text-blue-600 border-x border-t border-gray-200 translate-y-[1px]' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>Sumatif</button>
                <button onClick={() => setTab('FORMATIVE')} className={`px-6 py-3 rounded-t-xl font-bold text-sm transition-all ${tab === 'FORMATIVE' ? 'bg-white text-green-600 border-x border-t border-gray-200 translate-y-[1px]' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>Formatif</button>
            </div>

            {/* Grid */}
            <div className="glass-card flex-1 overflow-auto bg-white border-t-0 rounded-tl-none rounded-tr-none">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="sticky top-0 bg-white shadow-sm z-10">
                        <tr>
                            <th className="p-4 bg-gray-50 border-b border-gray-200">No</th>
                            <th className="p-4 bg-gray-50 border-b border-gray-200 md:sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] w-64">Nama Siswa</th>

                            {tab === 'SUMMATIVE' ? currentActivity.SummativeAspects?.map(asp => (
                                <th key={asp.id} className="p-4 text-center min-w-[140px] bg-blue-50 border-b border-blue-100 text-blue-800">{asp.name}</th>
                            )) : currentActivity.FormativeItems?.map(itm => (
                                <th key={itm.id} className="p-4 text-center min-w-[100px] bg-green-50 border-b border-green-100 text-green-800">{itm.name}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {students.length === 0 ? <tr><td colSpan="100" className="p-8 text-center text-gray-400">Tidak ada siswa</td></tr> :
                            students.map((s, idx) => (
                                <tr key={s.nisn} className="hover:bg-gray-50">
                                    <td className="p-3 text-gray-500 text-center">{idx + 1}</td>
                                    <td className="p-3 sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                        <div className="font-bold text-gray-800">{s.name}</div>
                                        <div className="text-[10px] text-gray-400">{s.class}</div>
                                    </td>

                                    {tab === 'SUMMATIVE' ? currentActivity.SummativeAspects?.map(asp => {
                                        const val = assessments[`${s.nisn}_${asp.id}_SUM`]?.score || "";
                                        let color = "bg-white";
                                        if (val === 'SB') color = "bg-green-100 text-green-700";
                                        if (val === 'B') color = "bg-blue-100 text-blue-700";
                                        if (val === 'C') color = "bg-yellow-100 text-yellow-700";
                                        if (val === 'K') color = "bg-red-100 text-red-700";

                                        return (
                                            <td key={asp.id} className="p-2">
                                                <select
                                                    value={val}
                                                    onChange={e => handleScoreChange(s.nisn, asp.id, e.target.value)}
                                                    className={`w-full border rounded p-1 text-center font-bold text-xs outline-none focus:ring-2 focus:ring-blue-200 transition-colors ${color}`}
                                                >
                                                    <option value="" className="bg-white text-gray-400">-</option>
                                                    <option value="SB" className="bg-white text-gray-800">Sangat Baik</option>
                                                    <option value="B" className="bg-white text-gray-800">Baik</option>
                                                    <option value="C" className="bg-white text-gray-800">Cukup</option>
                                                    <option value="K" className="bg-white text-gray-800">Kurang</option>
                                                </select>
                                            </td>
                                        )
                                    }) : currentActivity.FormativeItems?.map(itm => {
                                        const checked = assessments[`${s.nisn}_${itm.id}_FORM`]?.checked || false;
                                        return (
                                            <td key={itm.id} className="p-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={e => handleCheckChange(s.nisn, itm.id, e.target.checked)}
                                                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                                                />
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Assessment;
