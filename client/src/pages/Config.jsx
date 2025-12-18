import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Trash2, Save, X } from 'lucide-react';

const DIMENSIONS = [
    "Keimanan dan Ketakwaan Terhadap Tuhan YME",
    "Kewargaan (Global/Lokal)",
    "Penalaran Kritis",
    "Kreativitas",
    "Kolaborasi",
    "Kemandirian",
    "Kesehatan (Fisik & Mental)",
    "Komunikasi"
];

const Config = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        targetClasses: '', // Comma separated string for simplicity in UI, converted to array on submit
        summativeAspects: [],
        formativeItems: []
    });

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const res = await api.get('/activities');
            setActivities(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus kegiatan ini? Data nilai terkait juga akan terhapus.')) return;
        try {
            await api.delete(`/activities/${id}`);
            fetchActivities();
        } catch (e) {
            alert('Gagal menghapus');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Process target classes
            const classesArray = formData.targetClasses.split(',').map(c => c.trim()).filter(c => c !== '');
            const payload = {
                ...formData,
                targetClasses: classesArray
            };

            await api.post('/activities', payload);
            setShowForm(false);
            setFormData({ name: '', targetClasses: '', summativeAspects: [], formativeItems: [] });
            fetchActivities();
        } catch (e) {
            alert('Gagal menyimpan: ' + (e.response?.data?.error || e.message));
        }
    };

    // Form Helpers
    const addAspect = () => {
        setFormData({
            ...formData,
            summativeAspects: [...formData.summativeAspects, { name: '', dimension: '' }]
        });
    };
    const updateAspect = (idx, field, val) => {
        const newAspects = [...formData.summativeAspects];
        newAspects[idx][field] = val;
        setFormData({ ...formData, summativeAspects: newAspects });
    };
    const removeAspect = (idx) => {
        const newAspects = formData.summativeAspects.filter((_, i) => i !== idx);
        setFormData({ ...formData, summativeAspects: newAspects });
    };

    const addFormative = () => {
        setFormData({
            ...formData,
            formativeItems: [...formData.formativeItems, { name: '' }]
        });
    };
    const updateFormative = (idx, val) => {
        const newItems = [...formData.formativeItems];
        newItems[idx].name = val;
        setFormData({ ...formData, formativeItems: newItems });
    };
    const removeFormative = (idx) => {
        const newItems = formData.formativeItems.filter((_, i) => i !== idx);
        setFormData({ ...formData, formativeItems: newItems });
    };

    if (showForm) {
        return (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Tambah Kegiatan Baru</h2>
                    <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-red-500"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Info */}
                    <div className="glass-card p-6 space-y-4">
                        <h3 className="font-bold border-b pb-2 text-gray-800">Informasi Dasar</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-1">Nama Kegiatan</label>
                                <input required type="text" className="w-full border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Contoh: Pramuka" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-1">Target Kelas</label>
                                <input type="text" className="w-full border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                                    value={formData.targetClasses} onChange={e => setFormData({ ...formData, targetClasses: e.target.value })} placeholder="Contoh: X-A, X-B" />
                                <p className="text-xs text-gray-400 mt-1">Pisahkan dengan koma. Kosongkan untuk semua kelas.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Summative */}
                        <div className="glass-card p-6 bg-blue-50 border border-blue-100 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-blue-900 flex items-center gap-2">Asesmen Sumatif</h3>
                                <button type="button" onClick={addAspect} className="text-xs bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 font-bold shadow-sm transition-colors">+ Aspek</button>
                            </div>
                            <div className="space-y-3">
                                {formData.summativeAspects.map((asp, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <input required type="text" placeholder="Nama Aspek Penilaian" className="w-full text-sm font-bold border-none p-0 focus:ring-0 text-gray-800 placeholder-gray-300"
                                                value={asp.name} onChange={e => updateAspect(idx, 'name', e.target.value)} />
                                            <button type="button" onClick={() => removeAspect(idx)} className="text-gray-300 hover:text-red-500 transition-colors"><X size={16} /></button>
                                        </div>
                                        <select required className="w-full text-xs border-gray-200 rounded-lg p-2 bg-gray-50 focus:bg-white transition-colors"
                                            value={asp.dimension} onChange={e => updateAspect(idx, 'dimension', e.target.value)}>
                                            <option value="">-- Pilih Dimensi Profil Pelajar Pancasila --</option>
                                            {DIMENSIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                ))}
                                {formData.summativeAspects.length === 0 && <p className="text-xs text-blue-400 text-center py-4">Belum ada aspek sumatif.</p>}
                            </div>
                        </div>

                        {/* Formative */}
                        <div className="glass-card p-6 bg-green-50 border border-green-100 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-green-900">Asesmen Formatif</h3>
                                <button type="button" onClick={addFormative} className="text-xs bg-white border border-green-200 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-50 font-bold shadow-sm transition-colors">+ Item</button>
                            </div>
                            <div className="space-y-3">
                                {formData.formativeItems.map((item, idx) => (
                                    <div key={idx} className="bg-white p-3 rounded-xl shadow-sm border border-green-100 flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                        <input required type="text" placeholder="Item Observasi" className="flex-1 text-sm bg-transparent border-none p-0 focus:ring-0 text-gray-800 placeholder-gray-300 font-medium"
                                            value={item.name} onChange={e => updateFormative(idx, e.target.value)} />
                                        <button type="button" onClick={() => removeFormative(idx)} className="text-gray-300 hover:text-red-500 transition-colors"><X size={16} /></button>
                                    </div>
                                ))}
                                {formData.formativeItems.length === 0 && <p className="text-xs text-green-400 text-center py-4">Belum ada item formatif.</p>}
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:bg-blue-700 transition-all flex justify-center items-center gap-2 transform hover:-translate-y-0.5">
                        <Save size={20} /> Simpan Kegiatan
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="glass-card p-6 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Konfigurasi Penilaian</h2>
                    <p className="text-sm text-gray-500">Kelola kegiatan dan kriteria penilaian.</p>
                </div>
                <button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
                    <Plus size={18} /> Tambah Kegiatan
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {activities.map((act) => (
                    <div key={act.id} className="glass-card p-6 relative group">
                        <button onClick={() => handleDelete(act.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{act.name}</h3>
                        <div className="flex gap-2 mb-4">
                            {(!act.targetClasses || act.targetClasses.length === 0)
                                ? <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">Semua Kelas</span>
                                : act.targetClasses.map(c => <span key={c} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold">{c}</span>)
                            }
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <h4 className="font-bold text-blue-700 mb-2">Aspek Sumatif</h4>
                                <ul className="list-disc list-inside text-gray-600 space-y-1">
                                    {act.SummativeAspects?.map(a => <li key={a.id}>{a.name} <span className="text-[10px] text-gray-400 bg-gray-50 px-1 rounded ml-1">{a.dimension}</span></li>)}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-green-700 mb-2">Item Formatif</h4>
                                <ul className="list-disc list-inside text-gray-600 space-y-1">
                                    {act.FormativeItems?.map(f => <li key={f.id}>{f.name}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                ))}
                {activities.length === 0 && !loading && (
                    <div className="p-12 text-center text-gray-400">Belum ada kegiatan. Silakan tambah baru.</div>
                )}
            </div>
        </div>
    );
};

export default Config;
