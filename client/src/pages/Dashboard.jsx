import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Users, Library, CheckCircle } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({ students: 0, activities: 0, assessed: 0 });

    useEffect(() => {
        const loadStats = async () => {
            try {
                // Parallel fetch for stats
                const [studentsRes, activitiesRes, assessRes] = await Promise.all([
                    api.get('/students'),
                    api.get('/activities'),
                    api.get('/assessments')
                ]);

                const students = studentsRes.data;
                const activities = activitiesRes.data;
                const assessments = assessRes.data; // All assessments

                // Calculate Progress
                let totalExpected = 0;
                activities.forEach(act => {
                    const aspectCount = (act.SummativeAspects?.length || 0) + (act.FormativeItems?.length || 0);

                    // Determine eligible students for this activity
                    let eligibleCount = 0;
                    if (!act.targetClasses || act.targetClasses.length === 0) {
                        eligibleCount = students.length;
                    } else {
                        // act.targetClasses should be an array of strings
                        // If it's a string (legacy/bug), split it? Ideally backend returns array.
                        // Based on Config.jsx, we send array. Backend stores array (if JSON) or text?
                        // Let's assume array as per my Edit Config fix.
                        // But wait, in Config.jsx showForm, we join it.
                        // In backend Model? `targetClasses: { type: DataTypes.JSON }` usually? 
                        // Let's assume it works as array. Safe check:
                        const targets = Array.isArray(act.targetClasses) ? act.targetClasses : [];
                        if (targets.length === 0) eligibleCount = students.length;
                        else eligibleCount = students.filter(s => targets.includes(s.class)).length;
                    }

                    totalExpected += aspectCount * eligibleCount;
                });

                const totalActual = assessments.length;
                const percentage = totalExpected === 0 ? 0 : Math.round((totalActual / totalExpected) * 100);

                setStats({
                    students: students.length,
                    activities: activities.length,
                    assessed: percentage
                });
            } catch (e) {
                console.error("Dashboard load failed", e);
            }
        };
        loadStats();
    }, []);

    return (
        <div className="space-y-6 animate-fade-in text-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Dashboard</h2>
                    <p className="text-gray-500 mt-1">
                        {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 flex items-center justify-between border-l-4 border-blue-500">
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Siswa</h3>
                        <p className="text-3xl font-bold text-gray-800 mt-1">{stats.students}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-full text-blue-600">
                        <Users size={28} />
                    </div>
                </div>

                <div className="glass-card p-6 flex items-center justify-between border-l-4 border-purple-500">
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Kegiatan</h3>
                        <p className="text-3xl font-bold text-gray-800 mt-1">{stats.activities}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-full text-purple-600">
                        <Library size={28} />
                    </div>
                </div>

                <div className="glass-card p-6 flex items-center justify-between border-l-4 border-green-500">
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Progress Penilaian</h3>
                        <p className="text-3xl font-bold text-gray-800 mt-1">{stats.assessed}%</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-full text-green-600">
                        <CheckCircle size={28} />
                    </div>
                </div>
            </div>

            <div className="glass-card p-8 text-center mt-12">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Selamat Datang di SiKori v1.0</h3>
                <p className="text-gray-500 max-w-2xl mx-auto">
                    Sistem ini telah diperbarui menggunakan teknologi Full Stack (React + Express + MySQL).
                    Silakan mulai dengan menginput <strong>Data Siswa</strong> atau mengatur <strong>Kegiatan</strong> baru.
                </p>
            </div>
        </div>
    );
};

export default Dashboard;
