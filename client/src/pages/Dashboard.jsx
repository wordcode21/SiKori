import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Users, Library, CheckCircle } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({ students: 0, activities: 0, assessed: 0 });

    useEffect(() => {
        const loadStats = async () => {
            try {
                // Parallel fetch for simple stats
                const [studentsRes, activitiesRes] = await Promise.all([
                    api.get('/students'),
                    api.get('/activities')
                ]);

                setStats({
                    students: studentsRes.data.length,
                    activities: activitiesRes.data.length,
                    assessed: 0 // Need detailed query for this, skip for now or mock
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
