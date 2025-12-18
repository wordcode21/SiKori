import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { User, Lock, Save } from 'lucide-react';

const Profile = () => {
    const { user } = useAuth();
    const [fullName, setFullName] = useState(user.fullName || '');
    const [password, setPassword] = useState('');
    const [msg, setMsg] = useState('');

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put('/auth/profile', {
                fullName,
                password: password || undefined
            });
            setMsg('Profil berhasil diperbarui!');
            setPassword('');
        } catch (e) {
            setMsg('Gagal memperbarui profil.');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
            <div className="glass-card p-6">
                <h2 className="text-2xl font-bold text-gray-800">Profil Saya</h2>
                <p className="text-sm text-gray-500">Kelola informasi akun Anda.</p>
            </div>

            <div className="glass-card p-8 bg-white">
                <div className="flex items-center gap-4 mb-8 border-b pb-6">
                    <div className="bg-blue-100 p-4 rounded-full text-blue-600">
                        <User size={48} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">{user.fullName}</h3>
                        <p className="text-gray-500">Role: <span className="font-mono bg-gray-100 px-2 rounded text-xs">{user.role}</span></p>
                        <p className="text-gray-400 text-sm">@{user.username}</p>
                    </div>
                </div>

                <form onSubmit={handleUpdate} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-1">Nama Lengkap</label>
                        <input
                            type="text"
                            required
                            className="w-full border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>

                    <div className="pt-4 border-t">
                        <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Lock size={16} /> Ganti Password</h4>
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">Password Baru (Kosongkan jika tidak ingin mengganti)</label>
                            <input
                                type="password"
                                className="w-full border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="******"
                            />
                        </div>
                    </div>

                    {msg && (
                        <div className={`p-3 rounded text-sm text-center ${msg.includes('Gagal') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            {msg}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all flex justify-center items-center gap-2"
                    >
                        <Save size={20} /> Simpan Perubahan
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Profile;
