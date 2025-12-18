import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Trash2, Edit, Shield } from 'lucide-react';

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WALI_KELAS', 'GURU_MATA_PELAJARAN'];

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const [formData, setFormData] = useState({
        id: '',
        username: '',
        password: '',
        fullName: '',
        role: 'GURU_MATA_PELAJARAN',
        nip: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await api.put(`/users/${formData.id}`, formData);
            } else {
                await api.post('/users', formData);
            }
            setShowModal(false);
            resetForm();
            fetchUsers();
        } catch (e) {
            alert('Gagal menyimpan user: ' + (e.response?.data?.error || e.message));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus user ini?')) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (e) {
            alert('Gagal menghapus user');
        }
    };

    const openEdit = (user) => {
        setFormData({ ...user, password: '' }); // Don't show hash
        setEditMode(true);
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({ id: '', username: '', password: '', fullName: '', role: 'GURU_MATA_PELAJARAN', nip: '' });
        setEditMode(false);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="glass-card p-6 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Manajemen Pengguna</h2>
                    <p className="text-sm text-gray-500">Kelola akun pengguna sistem.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
                >
                    <Plus size={18} /> Tambah User
                </button>
            </div>

            <div className="glass-card overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                        <tr>
                            <th className="p-4">Nama Lengkap</th>
                            <th className="p-4">Username</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">NIP</th>
                            <th className="p-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-blue-50/50 transition-colors">
                                <td className="p-4 font-bold text-gray-800">{u.fullName}</td>
                                <td className="p-4 font-mono text-gray-600">{u.username}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' :
                                        u.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                        {u.role.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-500">{u.nip || '-'}</td>
                                <td className="p-4 text-center flex justify-center gap-2">
                                    <button onClick={() => openEdit(u)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-full"><Edit size={16} /></button>
                                    <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">{editMode ? 'Edit User' : 'Tambah User'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Username</label>
                                <input required type="text" className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} disabled={editMode} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Password {editMode && '(Kosongkan jika tidak diganti)'}</label>
                                <input type="password" required={!editMode} className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Nama Lengkap</label>
                                <input required type="text" className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Role</label>
                                <select className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                    {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">NIP (Opsional)</label>
                                <input type="text" className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.nip} onChange={e => setFormData({ ...formData, nip: e.target.value })} />
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 text-red-500 hover:bg-red-50 rounded-lg border border-red-200">Batal</button>
                                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
