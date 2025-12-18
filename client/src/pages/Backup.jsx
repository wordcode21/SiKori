import React, { useState } from 'react';
import api from '../utils/api';
import { Download, Upload, AlertTriangle, Database, CheckCircle, AlertOctagon } from 'lucide-react';

const Backup = () => {
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ text: '', type: '' });

    const handleDownload = async () => {
        setLoading(true);
        setMsg({ text: '', type: '' });
        try {
            const response = await api.get('/backup', { responseType: 'blob' });


            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Extract filename if possible, otherwise default
            const disposition = response.headers['content-disposition'];
            let filename = 'sikori_backup.json';
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();

            setMsg({ text: 'Backup berhasil didownload.', type: 'success' });
        } catch (e) {
            console.error(e);
            let errorMessage = 'Gagal mendownload backup.';

            if (e.message) {
                errorMessage = e.message;
            }

            setMsg({ text: errorMessage, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Double confirmation for safety
        if (!confirm('PERINGATAN: Tindakan ini akan MENGHAPUS SEMUA DATA yang ada sekarang dan menggantikannya dengan data dari backup. Apakah Anda yakin?')) {
            e.target.value = null;
            return;
        }

        if (!confirm('Apakah kamu benar-benar yakin? Tindakan ini tidak dapat dibatalkan.')) {
            e.target.value = null;
            return;
        }

        setLoading(true);
        setMsg({ text: 'Sedang merestore database...', type: 'info' });

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const json = JSON.parse(evt.target.result);
                await api.post('/backup/restore', json);
                setMsg({ text: 'Database berhasil direstore! Silakan refresh halaman.', type: 'success' });
                setTimeout(() => window.location.reload(), 2000);
            } catch (err) {
                console.error(err);
                setMsg({ text: 'Gagal merestore: ' + (err.response?.data?.error || err.message), type: 'error' });
            } finally {
                setLoading(false);
                e.target.value = null;
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <div className="glass-card p-6 border-l-4 border-indigo-500">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                        <Database size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Backup & Restore</h2>
                        <p className="text-sm text-gray-500">Kelola cadangan data sistem untuk keamanan.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* BACKUP SECTION */}
                <div className="glass-card p-8 flex flex-col items-center text-center space-y-4">
                    <div className="bg-blue-50 p-6 rounded-full text-blue-600 mb-2">
                        <Download size={48} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Download Backup</h3>
                    <p className="text-gray-500 text-sm">
                        Unduh seluruh data database dalam format JSON. Simpan file ini di tempat yang aman.
                    </p>
                    <button
                        onClick={handleDownload}
                        disabled={loading}
                        className={`mt-4 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2
                            ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-1'}
                        `}
                    >
                        {loading ? 'Processing...' : <><Download size={20} /> Download Data</>}
                    </button>
                </div>

                {/* RESTORE SECTION */}
                <div className="glass-card p-8 flex flex-col items-center text-center space-y-4 border-2 border-red-50 bg-red-50/10">
                    <div className="bg-red-50 p-6 rounded-full text-red-600 mb-2">
                        <Upload size={48} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Restore Database</h3>
                    <p className="text-gray-500 text-sm">
                        Kembalikan data dari file backup.
                    </p>

                    <div className="bg-red-100 text-red-700 p-4 rounded-lg text-xs text-left w-full flex gap-2 items-start">
                        <AlertOctagon size={32} className="shrink-0" />
                        <b>PERINGATAN: Tindakan ini akan MENGHAPUS SEMUA DATA yang ada saat ini dan menggantinya dengan data dari file backup.</b>
                    </div>

                    <label className={`mt-4 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2 cursor-pointer
                            ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 hover:-translate-y-1'}
                        `}>
                        {loading ? 'Processing...' : <><Upload size={20} /> Upload File Backup</>}
                        <input type="file" disabled={loading} accept=".json" className="hidden" onChange={handleRestore} />
                    </label>
                </div>
            </div>

            {msg.text && (
                <div className={`p-4 rounded-xl flex items-center gap-3 font-bold animate-fade-in
                    ${msg.type === 'success' ? 'bg-green-100 text-green-700' :
                        msg.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}
                `}>
                    {msg.type === 'success' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                    {msg.text}
                </div>
            )}
        </div>
    );
};

export default Backup;
