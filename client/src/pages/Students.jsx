import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Trash2, Search, FileSpreadsheet } from 'lucide-react';

const Students = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterClass, setFilterClass] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', nisn: '', nis: '', class: '' });

    useEffect(() => {
        fetchStudents();
    }, [filterClass]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/students${filterClass !== 'all' ? `?class=${filterClass}` : ''}`);
            setStudents(res.data);
        } catch (error) {
            console.error(error);
            alert('Gagal mengambil data siswa');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (nisn) => {
        if (!confirm('Hapus siswa ini?')) return;
        try {
            await api.delete(`/students/${nisn}`);
            fetchStudents();
        } catch (error) {
            alert('Gagal menghapus');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/students', formData);
            setShowModal(false);
            setFormData({ name: '', nisn: '', nis: '', class: '' });
            fetchStudents();
        } catch (error) {
            alert('Gagal menyimpan: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                // Dynamic import to avoid heavy bundle if not used
                const XLSX = await import('xlsx');
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                const getK = (row, str) => {
                    const keys = Object.keys(row);
                    return keys.find(k => k.toLowerCase().includes(str));
                }

                const studentsToImport = jsonData.map(row => ({
                    nisn: (row[getK(row, 'nisn')] || row['v1'] || '').toString(),
                    nis: (row[getK(row, 'nis')] || '').toString(),
                    name: row[getK(row, 'nama')] || row['NAMA'],
                    class: row[getK(row, 'kelas')] || row['KELAS']
                })).filter(s => s.name && s.nisn);

                if (studentsToImport.length === 0) {
                    alert('Tidak ada data valid ditemukan. Pastikan ada kolom NISN dan NAMA.');
                    return;
                }

                if (confirm(`Akan mengimport ${studentsToImport.length} siswa. Lanjut?`)) {
                    await api.post('/students/bulk', studentsToImport);
                    alert('Berhasil import data!');
                    fetchStudents();
                }
            } catch (err) {
                console.error(err);
                alert('Gagal memproses file excel: ' + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = null; // Reset input
    };

    const handleDownloadTemplate = async () => {
        const XLSX = await import('xlsx');
        const headers = [
            { No: 1, NISN: '1234567890', NIS: '1001', NAMA: 'Contoh Siswa 1', KELAS: 'X-A' },
            { No: 2, NISN: '1234567891', NIS: '1002', NAMA: 'Contoh Siswa 2', KELAS: 'X-A' }
        ];

        const ws = XLSX.utils.json_to_sheet(headers);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template Siswa");
        XLSX.writeFile(wb, "Template_Import_Siswa.xlsx");
    };

    const uniqueClasses = [...new Set(students.map(s => s.class))].sort();

    return (
        <div className="space-y-6 animate-fade-in uppercase">
            {/* Header */}
            <div className="glass-card p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Data Siswa</h2>
                    <p className="text-sm text-gray-500">{students.length} Siswa Terdaftar</p>
                </div>
                <div className="flex gap-2 items-center">
                    <select
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                        className="bg-white border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Semua Kelas</option>
                        {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <button
                        onClick={handleDownloadTemplate}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                        title="Download Format Excel"
                    >
                        <FileSpreadsheet size={18} /> Template
                    </button>

                    <label className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors cursor-pointer">
                        <FileSpreadsheet size={18} /> Import
                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImport} />
                    </label>

                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
                    >
                        <Plus size={18} /> Tambah
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                            <tr>
                                <th className="p-4 w-16">No</th>
                                <th className="p-4">NISN</th>
                                <th className="p-4">NIS</th>
                                <th className="p-4">Nama Lengkap</th>
                                <th className="p-4">Kelas</th>
                                <th className="p-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-400">Loading...</td></tr>
                            ) : students.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-400">Belum ada data siswa.</td></tr>
                            ) : (
                                students.map((bg, idx) => (
                                    <tr key={bg.nisn} className="hover:bg-blue-50/50 transition-colors">
                                        <td className="p-4 text-center text-gray-400">{idx + 1}</td>
                                        <td className="p-4 font-mono text-gray-600">{bg.nisn}</td>
                                        <td className="p-4 font-mono text-gray-500">{bg.nis || '-'}</td>
                                        <td className="p-4 font-medium text-gray-900">{bg.name}</td>
                                        <td className="p-4"><span className="bg-white border border-gray-200 px-2 py-1 rounded text-xs font-bold text-gray-600 shadow-sm">{bg.class}</span></td>
                                        <td className="p-4 text-center">
                                            <button onClick={() => handleDelete(bg.nisn)} className="text-gray-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-full">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-fade-in">
                        <h3 className="text-xl font-bold mb-4">Tambah Siswa</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Nama Lengkap</label>
                                <input required type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">NISN</label>
                                    <input required type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.nisn} onChange={e => setFormData({ ...formData, nisn: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">NIS</label>
                                    <input type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.nis} onChange={e => setFormData({ ...formData, nis: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Kelas</label>
                                <input required type="text" placeholder="Contoh: X-A" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.class} onChange={e => setFormData({ ...formData, class: e.target.value })} />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Batal</button>
                                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Students;
