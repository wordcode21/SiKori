/**
 * Co-curricular Assessment System
 * Main Logic - v2.1 (Class Support + Dummy Data)
 */

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

const RUBRIC_LEVELS = [
    { code: 'SB', label: 'Sangat Baik', color: 'bg-green-100 text-green-700' },
    { code: 'B', label: 'Baik', color: 'bg-blue-100 text-blue-700' },
    { code: 'C', label: 'Cukup', color: 'bg-yellow-100 text-yellow-700' },
    { code: 'K', label: 'Kurang', color: 'bg-red-100 text-red-700' }
];

const app = {
    // State
    state: {
        students: [], // { nisn, nis, name, class: "X-A" }
        activities: [],
        assessments: { summative: {}, formative: {} },
        currentView: 'dashboard',
        selectedActivityId: null,
        selectedClass: 'all', // Filter state
        assessmentTab: 'summative'
    },

    // Initialization
    init() {
        this.loadData();
        this.updateDate();
        this.renderDashboard();
    },

    navigate(target) {
        this.state.currentView = target;
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.remove('active', 'bg-white/50', 'text-blue-600');
            if (el.dataset.target === target) el.classList.add('active', 'bg-white/50', 'text-blue-600');
        });

        const titles = {
            'dashboard': 'Dashboard',
            'students': 'Data Santri / Siswa',
            'config': 'Konfigurasi Penilaian',
            'assessment': 'Input Penilaian',
            'reports': 'Laporan & Export'
        };
        document.getElementById('page-title').textContent = titles[target] || 'Dashboard';

        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
        const targetView = document.getElementById(`view-${target}`);
        if (targetView) {
            targetView.classList.remove('hidden');
            this.renderView(target);
        }
    },

    renderView(view) {
        switch (view) {
            case 'dashboard': this.renderDashboard(); break;
            case 'students': this.renderStudents(); break;
            case 'config': this.renderConfig(); break;
            case 'assessment': this.renderAssessment(); break;
            case 'reports': this.renderReports(); break;
        }
    },

    saveData() {
        localStorage.setItem('sisko_data_v3', JSON.stringify(this.state));
        // Update dashboard stats if visible
        if (this.state.currentView === 'dashboard') this.renderDashboard();
    },

    loadData() {
        const saved = localStorage.getItem('sisko_data_v3');
        if (saved) {
            this.state = JSON.parse(saved);
        }
    },

    updateDate() {
        const now = new Date();
        document.getElementById('current-date').textContent = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    },

    generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2); },

    // -- Utils: Class Management --
    getUniqueClasses() {
        const classes = new Set(this.state.students.map(s => s.class || "Tanpa Kelas"));
        return Array.from(classes).sort();
    },

    getFilteredStudents() {
        if (this.state.selectedClass === 'all') return this.state.students;
        return this.state.students.filter(s => (s.class || "Tanpa Kelas") === this.state.selectedClass);
    },

    // -- 1. Dashboard --
    renderDashboard() {
        // Stats
        document.getElementById('stat-students').textContent = this.state.students.length;
        document.getElementById('stat-activities').textContent = this.state.activities.length;

        let total = 0, filled = 0;
        this.state.activities.forEach(a => {
            if (a.summativeAspects.length > 0) {
                total += (this.state.students.length * a.summativeAspects.length);
                this.state.students.forEach(s => {
                    a.summativeAspects.forEach(asp => {
                        if (this.state.assessments.summative[`${s.nisn}_${a.id}_${asp.id}`]) filled++;
                    });
                });
            }
        });
        const percent = total === 0 ? 0 : Math.round((filled / total) * 100);
        document.getElementById('stat-assessed').textContent = `${percent}%`;

        // Load Dummy Data Button (Only if empty)
        const dashboardView = document.getElementById('view-dashboard');
        // Clear previous custom buttons if any
        const existingBtn = document.getElementById('btn-dummy-data');
        if (existingBtn) existingBtn.remove();

        if (this.state.students.length === 0 && this.state.activities.length === 0) {
            const btn = document.createElement('div');
            btn.id = 'btn-dummy-data';
            btn.className = "mt-8 text-center";
            btn.innerHTML = `
                <button onclick="app.loadDummyData()" class="bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-indigo-700 transition animate-bounce">
                    <i class="fa-solid fa-magic mr-2"></i> Isi Data Dummy (Coba Sistem)
                </button>
            `;
            dashboardView.appendChild(btn);
        }
    },

    // -- 2. Students --
    renderStudents() {
        const container = document.getElementById('view-students');
        const classes = this.getUniqueClasses();
        const students = this.getFilteredStudents();

        container.innerHTML = `
            <div class="glass-card p-6 animate-fade-in">
                <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div>
                        <h3 class="text-xl font-bold text-gray-800">Data Siswa</h3>
                        <p class="text-sm text-gray-500">Total: ${this.state.students.length} Siswa</p>
                    </div>
                    
                    <div class="flex flex-wrap gap-2 items-center">
                        <!-- Class Filter -->
                        <select onchange="app.setFilterClass(this.value)" class="bg-white border text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="all" ${this.state.selectedClass === 'all' ? 'selected' : ''}>Semua Kelas</option>
                            ${classes.map(c => `<option value="${c}" ${this.state.selectedClass === c ? 'selected' : ''}>${c}</option>`).join('')}
                        </select>

                        <button onclick="app.showAddStudentModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                            <i class="fa-solid fa-plus"></i> Manual
                        </button>
                        
                        <label for="file-upload" class="cursor-pointer bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                            <i class="fa-solid fa-file-excel"></i> Import
                        </label>
                        <input id="file-upload" type="file" accept=".xlsx, .xls" class="hidden" onchange="app.handleImport(event)">
                        
                        <button onclick="app.clearStudents()" class="bg-red-100 hover:bg-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>

                <div class="overflow-x-auto rounded-lg border border-gray-200 max-h-[60vh]">
                    <table class="w-full text-left text-sm custom-table">
                        <thead class="sticky top-0 z-10 bg-white shadow-sm">
                            <tr>
                                <th class="p-3">No</th>
                                <th class="p-3">Kelas</th>
                                <th class="p-3">NISN</th>
                                <th class="p-3">NIS</th>
                                <th class="p-3">Nama Lengkap</th>
                                <th class="p-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${students.length > 0 ? students.map((s, index) => `
                                <tr class="border-b last:border-0 border-gray-100 transition-colors hover:bg-gray-50">
                                    <td class="p-3 text-gray-500">${index + 1}</td>
                                    <td class="p-3"><span class="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded">${s.class || '-'}</span></td>
                                    <td class="p-3 font-mono text-gray-600">${s.nisn || '-'}</td>
                                    <td class="p-3 font-mono text-gray-600">${s.nis || '-'}</td>
                                    <td class="p-3 font-medium text-gray-800">${s.name}</td>
                                    <td class="p-3 text-center">
                                        <button onclick="app.deleteStudent('${s.nisn}')" class="text-red-400 hover:text-red-600"><i class="fa-solid fa-trash-can"></i></button>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="6" class="p-12 text-center text-gray-400">
                                        Tidak ada data siswa untuk kelas ini.
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    setFilterClass(cls) {
        this.state.selectedClass = cls;
        // Re-render current view to apply filter
        if (this.state.currentView === 'students') this.renderStudents();
        if (this.state.currentView === 'assessment') this.renderAssessment();
        if (this.state.currentView === 'reports') this.renderReports();
    },

    // -- Student Actions --
    handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            const newStudents = jsonData.map(row => {
                const keys = Object.keys(row);
                // Flexible column searching
                const getK = (str) => keys.find(k => k.toLowerCase().includes(str));

                return {
                    nisn: row[getK('nisn')] || row['v1'] || '', // Fallback to raw keys if needed
                    nis: row[getK('nis')] || '',
                    name: row[getK('nama')] || row['NAMA'] || 'Tanpa Nama',
                    class: row[getK('kelas')] || row['KELAS'] || 'Tanpa Kelas'
                };
            }).filter(s => s.name !== 'Tanpa Nama');

            // Merge with existing, avoid duplicates by NISN
            let addedCount = 0;
            newStudents.forEach(ns => {
                if (!this.state.students.find(s => s.nisn === ns.nisn && ns.nisn !== '')) {
                    this.state.students.push(ns);
                    addedCount++;
                }
            });

            this.saveData();
            this.renderStudents();
            alert(`Berhasil import ${addedCount} siswa baru.`);
        };
        reader.readAsArrayBuffer(file);
    },

    showAddStudentModal() {
        const modal = document.createElement('div');
        modal.id = 'add-student-modal';
        modal.className = `fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in`;
        modal.innerHTML = `
            <div class="glass-card p-6 w-96 relative bg-white">
                <button onclick="document.getElementById('add-student-modal').remove()" class="absolute top-4 right-4 text-gray-400 hover:text-black">
                    <i class="fa-solid fa-xmark text-xl"></i>
                </button>
                <h3 class="text-lg font-bold mb-4">Tambah Siswa Manual</h3>
                <form onsubmit="app.submitNewStudent(event)" class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-500 mb-1">Nama Lengkap</label>
                        <input type="text" name="name" required class="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-gray-500 mb-1">NISN</label>
                            <input type="text" name="nisn" required class="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-500 mb-1">NIS</label>
                            <input type="text" name="nis" class="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none">
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-500 mb-1">Kelas</label>
                        <input type="text" name="class" required placeholder="Contoh: X-A" class="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none">
                    </div>
                    <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-bold">Simpan</button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    },

    submitNewStudent(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const newS = {
            name: fd.get('name'),
            nisn: fd.get('nisn'),
            nis: fd.get('nis'),
            class: fd.get('class')
        };

        // Check duplicate
        if (this.state.students.find(s => s.nisn === newS.nisn)) {
            alert('NISN sudah terdaftar!');
            return;
        }

        this.state.students.push(newS);
        this.saveData();
        document.getElementById('add-student-modal').remove();
        this.renderStudents();
    },

    deleteStudent(nisn) {
        if (confirm('Hapus siswa ini?')) {
            this.state.students = this.state.students.filter(s => s.nisn !== nisn);
            this.saveData();
            this.renderStudents();
        }
    },

    clearStudents() {
        if (confirm('Hapus SEMUA data siswa?')) {
            this.state.students = [];
            this.state.assessments = { summative: {}, formative: {} }; // Clear assessments too as they link to students
            this.saveData();
            this.renderStudents();
        }
    },

    // -- 3. Config --
    renderConfig() {
        const container = document.getElementById('view-config');
        const classes = this.getUniqueClasses();

        container.innerHTML = `
            <div class="space-y-6 animate-fade-in">
                <div class="flex flex-col md:flex-row justify-between items-center bg-white/40 p-6 rounded-xl backdrop-blur-sm border border-white/50 shadow-sm gap-4">
                    <div>
                        <h3 class="text-xl font-bold text-gray-800">Konfigurasi Penilaian</h3>
                        <p class="text-sm text-gray-500">Panduan Kokurikuler 2025: Sumatif (Rubrik) & Formatif (Observasi).</p>
                    </div>
                    <button onclick="app.addActivity()" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 font-medium">
                        <i class="fa-solid fa-plus"></i> Tambah Kegiatan
                    </button>
                </div>

                <div class="grid grid-cols-1 gap-6" id="activity-list">
                    ${this.state.activities.map((activity, index) => this.renderActivityCard(activity, index, classes)).join('')}
                    ${this.state.activities.length === 0 ? `<div class="p-12 text-center text-gray-400">Belum ada kegiatan.</div>` : ''}
                </div>
            </div>
        `;
    },

    renderActivityCard(activity, idx, availableClasses) {
        const targetClasses = activity.targetClasses || []; // Default empty = all

        return `
            <div class="glass-card p-6 relative group transition-all">
                <button onclick="app.deleteActivity(${idx})" class="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-50 hover:opacity-100"><i class="fa-solid fa-trash"></i></button>
                
                <div class="mb-6 space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Nama Kegiatan</label>
                        <input type="text" value="${activity.name}" onchange="app.updateActivity(${idx}, 'name', this.value)" class="w-full bg-transparent border-b-2 border-gray-200 focus:border-blue-500 outline-none text-xl font-bold text-gray-800" placeholder="Nama Kegiatan">
                    </div>
                    
                    <div>
                        <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Target Kelas (Kosongkan = Semua Kelas)</label>
                        <div class="flex flex-wrap gap-2 max-h-24 overflow-y-auto border p-2 rounded bg-gray-50/50">
                            ${availableClasses.length > 0 ? availableClasses.map(cls => `
                                <label class="inline-flex items-center bg-white border border-gray-200 px-3 py-1 rounded-full text-xs cursor-pointer hover:bg-blue-50 ${targetClasses.includes(cls) ? 'ring-2 ring-blue-500 border-transparent' : ''}">
                                    <input type="checkbox" onchange="app.toggleActivityClass(${idx}, '${cls}')" ${targetClasses.includes(cls) ? 'checked' : ''} class="hidden">
                                    <span class="${targetClasses.includes(cls) ? 'text-blue-700 font-bold' : 'text-gray-600'}">${cls}</span>
                                </label>
                            `).join('') : '<span class="text-gray-400 italic text-xs">Belum ada data kelas (Import data siswa dulu)</span>'}
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div class="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <div class="flex justify-between items-center mb-4"><h4 class="font-bold text-blue-800 text-sm">Asesmen Sumatif</h4><button onclick="app.addSummativeAspect(${idx})" class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">+ Aspek</button></div>
                        <div class="space-y-4">${activity.summativeAspects.map((asp, aIdx) => `
                            <div class="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                                <div class="flex justify-between items-start mb-2"><div class="flex-1 mr-2"><input type="text" value="${asp.name}" onchange="app.updateSummative(${idx}, ${aIdx}, 'name', this.value)" class="w-full text-sm font-bold border-none bg-transparent p-0" placeholder="Nama Aspek"><select onchange="app.updateSummative(${idx}, ${aIdx}, 'dimension', this.value)" class="w-full text-xs text-gray-500 border-none bg-transparent p-0 mt-1"><option value="">-- Dimensi --</option>${DIMENSIONS.map(d => `<option value="${d}" ${d === asp.dimension ? 'selected' : ''}>${d}</option>`).join('')}</select></div><button onclick="app.removeSummative(${idx}, ${aIdx})" class="text-gray-300 hover:text-red-500"><i class="fa-solid fa-xmark"></i></button></div>
                            </div>`).join('')}
                        </div>
                    </div>
                    <div class="bg-green-50/50 p-4 rounded-xl border border-green-100">
                        <div class="flex justify-between items-center mb-4"><h4 class="font-bold text-green-800 text-sm">Asesmen Formatif</h4><button onclick="app.addFormativeItem(${idx})" class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">+ Item</button></div>
                        <div class="space-y-2">${activity.formativeItems.map((item, iIdx) => `<div class="flex items-center gap-2 bg-white p-2 rounded shadow-sm border border-gray-100"><i class="fa-solid fa-check-square text-green-300"></i><input type="text" value="${item.name}" onchange="app.updateFormative(${idx}, ${iIdx}, 'name', this.value)" class="flex-1 text-sm bg-transparent border-none" placeholder="Item Observasi"><button onclick="app.removeFormative(${idx}, ${iIdx})" class="text-gray-300 hover:text-red-500"><i class="fa-solid fa-xmark"></i></button></div>`).join('')}</div>
                    </div>
                </div>
            </div>
        `;
    },
    // Config actions
    addActivity() { this.state.activities.push({ id: this.generateId(), name: 'Kegiatan Baru', targetClasses: [], summativeAspects: [], formativeItems: [] }); this.saveData(); this.renderConfig(); },
    deleteActivity(idx) { if (confirm('Hapus?')) { this.state.activities.splice(idx, 1); this.saveData(); this.renderConfig(); } },
    updateActivity(idx, f, v) { this.state.activities[idx][f] = v; this.saveData(); },

    toggleActivityClass(actIdx, cls) {
        let activity = this.state.activities[actIdx];
        if (!activity.targetClasses) activity.targetClasses = [];

        if (activity.targetClasses.includes(cls)) {
            activity.targetClasses = activity.targetClasses.filter(c => c !== cls);
        } else {
            activity.targetClasses.push(cls);
        }
        this.saveData();
        this.renderConfig(); // Re-render to update UI
    },

    addSummativeAspect(idx) { this.state.activities[idx].summativeAspects.push({ id: this.generateId(), name: 'Aspek Baru', dimension: '', rubric: {} }); this.saveData(); this.renderConfig(); },
    removeSummative(a, s) { this.state.activities[a].summativeAspects.splice(s, 1); this.saveData(); this.renderConfig(); },
    updateSummative(a, s, f, v) { this.state.activities[a].summativeAspects[s][f] = v; this.saveData(); },
    addFormativeItem(idx) { this.state.activities[idx].formativeItems.push({ id: this.generateId(), name: '' }); this.saveData(); this.renderConfig(); },
    removeFormative(a, f) { this.state.activities[a].formativeItems.splice(f, 1); this.saveData(); this.renderConfig(); },
    updateFormative(a, f, t, v) { this.state.activities[a].formativeItems[f][t] = v; this.saveData(); },

    // -- 4. Assessment --
    renderAssessment() {
        const container = document.getElementById('view-assessment');

        // 1. Filter Students By Class
        const students = this.getFilteredStudents();
        const selectedClass = this.state.selectedClass;

        // 2. Filter Activities By Selected Class
        // If 'all' classes selected, show ALL activities (or maybe show distinct set? showing all is safer)
        // If specific class, show only activities that target this class (or have NO target = available to all)
        const relevantActivities = this.state.activities.filter(a => {
            if (selectedClass === 'all') return true;
            if (!a.targetClasses || a.targetClasses.length === 0) return true; // Available to all classes
            return a.targetClasses.includes(selectedClass);
        });

        if (relevantActivities.length === 0) {
            container.innerHTML = `
                <div class="glass-card p-8 text-center animate-fade-in">
                    <p class="text-gray-500 mb-2">Tidak ada kegiatan yang tersedia untuk kelas <strong>${selectedClass === 'all' ? 'Semua' : selectedClass}</strong>.</p>
                    <button onclick="app.navigate('config')" class="text-blue-600 hover:underline">Atur Kegiatan</button>
                </div>`;
            return;
        }

        // Auto-select first relevant activity if current selection is invalid
        if (!this.state.selectedActivityId || !relevantActivities.find(a => a.id === this.state.selectedActivityId)) {
            this.state.selectedActivityId = relevantActivities[0].id;
        }

        const activity = relevantActivities.find(a => a.id === this.state.selectedActivityId);

        container.innerHTML = `
            <div class="glass-card p-6 animate-fade-in flex flex-col h-full">
                <div class="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                    <div>
                        <h3 class="text-xl font-bold text-gray-800">Input Penilaian</h3>
                        <p class="text-sm text-gray-500">
                            ${students.length} Siswa | Kelas: ${selectedClass === 'all' ? 'Semua' : selectedClass}
                        </p>
                    </div>
                    <div class="flex gap-2">
                         <select onchange="app.setFilterClass(this.value)" class="bg-white border rounded px-3 py-1 font-medium text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="all" ${selectedClass === 'all' ? 'selected' : ''}>Semua Kelas</option>
                            ${this.getUniqueClasses().map(c => `<option value="${c}" ${selectedClass === c ? 'selected' : ''}>${c}</option>`).join('')}
                        </select>
                        <select onchange="app.selectActivity(this.value)" class="bg-white border rounded px-3 py-1 font-medium text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none">
                            ${relevantActivities.map(a => `<option value="${a.id}" ${a.id == activity.id ? 'selected' : ''}>${a.name}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div class="flex gap-2 mb-4">
                    <button onclick="app.setAssessmentTab('summative')" class="px-4 py-2 rounded-lg font-bold text-sm transition-all ${this.state.assessmentTab === 'summative' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}">Sumatif</button>
                    <button onclick="app.setAssessmentTab('formative')" class="px-4 py-2 rounded-lg font-bold text-sm transition-all ${this.state.assessmentTab === 'formative' ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}">Formatif</button>
                </div>

                <div class="flex-1 overflow-auto border border-gray-200 rounded-lg bg-white shadow-inner">
                    ${this.state.assessmentTab === 'summative' ? this.renderSummativeTable(activity, students) : this.renderFormativeTable(activity, students)}
                </div>
            </div>
        `;
    },
    // Assessment Utils (Updated to accept student list)
    selectActivity(id) { this.state.selectedActivityId = id; this.renderAssessment(); },
    setAssessmentTab(t) { this.state.assessmentTab = t; this.renderAssessment(); },

    renderSummativeTable(act, students) {
        if (act.summativeAspects.length === 0) return `<div class="p-8 text-center text-gray-400">Belum ada aspek sumatif.</div>`;
        return `
            <table class="w-full text-left text-sm custom-table">
                <thead class="sticky top-0 z-10 bg-white shadow-sm">
                    <tr>
                        <th class="p-3 w-10">No</th>
                        <th class="p-3 w-64">Nama Siswa</th>
                        ${act.summativeAspects.map(a => `<th class="p-3 text-center min-w-[150px]">${a.name}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>${students.map((s, i) => `
                    <tr class="border-b hover:bg-blue-50/20">
                        <td class="p-3 text-gray-500">${i + 1}</td>
                        <td class="p-3">
                            <div class="font-medium">${s.name}</div>
                            <div class="text-[10px] text-gray-400">${s.class}</div>
                        </td>
                        ${act.summativeAspects.map(a => `
                            <td class="p-2">
                                <select onchange="app.setSummativeScore('${s.nisn}', '${act.id}', '${a.id}', this.value)" 
                                    class="w-full border rounded p-1 text-center font-bold text-xs ${this.getColor(this.getSumScore(s.nisn, act.id, a.id))} focus:outline-none focus:ring-2 focus:ring-blue-200">
                                    <option value="" class="bg-white text-gray-400">- Pilih -</option>
                                    ${RUBRIC_LEVELS.map(l => `<option value="${l.code}" ${this.getSumScore(s.nisn, act.id, a.id) === l.code ? 'selected' : ''} class="bg-white text-gray-800">${l.label}</option>`).join('')}
                                </select>
                            </td>
                        `).join('')}
                    </tr>`).join('')}
                </tbody>
            </table>`;
    },
    renderFormativeTable(act, students) {
        if (act.formativeItems.length === 0) return `<div class="p-8 text-center text-gray-400">Belum ada item formatif.</div>`;
        return `
             <table class="w-full text-left text-sm custom-table">
                <thead class="sticky top-0 z-10 bg-white shadow-sm">
                    <tr><th class="p-3 w-10">No</th><th class="p-3 w-64">Nama Siswa</th>${act.formativeItems.map(i => `<th class="p-3 text-center w-24">${i.name}</th>`).join('')}<th class="p-3">Catatan</th></tr>
                </thead>
                <tbody>${students.map((s, i) => `
                    <tr class="border-b hover:bg-green-50/20">
                        <td class="p-3 text-gray-500">${i + 1}</td>
                        <td class="p-3"><div class="font-medium">${s.name}</div><div class="text-[10px] text-gray-400">${s.class}</div></td>
                        ${act.formativeItems.map(item => `<td class="p-2 text-center"><input type="checkbox" ${this.getFormCheck(s.nisn, act.id, item.id) ? 'checked' : ''} onchange="app.setFormCheck('${s.nisn}', '${act.id}', '${item.id}', this.checked)" class="w-5 h-5 text-green-600 rounded cursor-pointer"></td>`).join('')}
                        <td class="p-2"><textarea onchange="app.setFormNote('${s.nisn}', '${act.id}', this.value)" class="w-full h-8 text-xs border rounded p-1 resize-none focus:ring-2 focus:ring-green-200 outline-none">${this.getFormNote(s.nisn, act.id)}</textarea></td>
                    </tr>`).join('')}
                </tbody>
            </table>`;
    },
    getSumScore(s, a, asp) { return this.state.assessments.summative[`${s}_${a}_${asp}`] || ''; },
    setSummativeScore(s, a, asp, v) { this.state.assessments.summative[`${s}_${a}_${asp}`] = v; this.saveData(); },
    getColor(c) { const l = RUBRIC_LEVELS.find(x => x.code === c); return l ? l.color : 'bg-white'; },
    getFormCheck(s, a, i) { const r = this.state.assessments.formative[`${s}_${a}_${i}`]; return r ? r.checked : false; },
    setFormCheck(s, a, i, v) { const k = `${s}_${a}_${i}`; this.state.assessments.formative[k] = { ...(this.state.assessments.formative[k] || {}), checked: v }; this.saveData(); },
    getFormNote(s, a) { return this.state.assessments.formative[`${s}_${a}_note`] || ''; },
    setFormNote(s, a, v) { this.state.assessments.formative[`${s}_${a}_note`] = v; this.saveData(); },

    // -- 5. Reports --
    renderReports() {
        const container = document.getElementById('view-reports');
        const students = this.getFilteredStudents();
        container.innerHTML = `
            <div class="glass-card p-6 animate-fade-in flex flex-col h-full">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h3 class="text-xl font-bold text-gray-800">Laporan Akhir</h3>
                        <p class="text-sm text-gray-500">Filter Kelas: ${this.state.selectedClass === 'all' ? 'Semua' : this.state.selectedClass}</p>
                    </div>
                     <div class="flex gap-2">
                        <select onchange="app.setFilterClass(this.value)" class="bg-white border rounded px-3 py-2">
                            <option value="all" ${this.state.selectedClass === 'all' ? 'selected' : ''}>Semua Kelas</option>
                            ${this.getUniqueClasses().map(c => `<option value="${c}" ${this.state.selectedClass === c ? 'selected' : ''}>${c}</option>`).join('')}
                        </select>
                        <button onclick="app.exportToExcel()" class="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl flex items-center gap-2 font-medium">
                            <i class="fa-solid fa-file-excel"></i> Export Excel
                        </button>
                    </div>
                </div>
                <div class="overflow-auto border rounded-lg max-h-[60vh]">
                     <table class="w-full text-left text-sm custom-table">
                        <thead class="sticky top-0 bg-white shadow-sm">
                            <tr><th class="p-3">No</th><th class="p-3">Nama</th><th class="p-3">Kelas</th>${this.state.activities.map(a => `<th class="p-3 bg-gray-50">${a.name}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
                            ${students.map((s, i) => `
                                <tr class="border-b">
                                    <td class="p-3 text-gray-500">${i + 1}</td>
                                    <td class="p-3 font-medium">${s.name}</td>
                                    <td class="p-3 text-xs">${s.class}</td>
                                    ${this.state.activities.map(a => {
            // Show breakdown of Aspects
            const aspects = a.summativeAspects.map(asp => {
                const sc = this.getSumScore(s.nisn, a.id, asp.id);
                const lvl = RUBRIC_LEVELS.find(l => l.code === sc);
                return `<span class="inline-block px-1 rounded text-[10px] ${this.getColor(sc)} mr-1 border border-black/5" title="${asp.name}">${lvl ? lvl.label : '-'}</span>`;
            }).join('');
            return `<td class="p-3">${aspects}</td>`;
        }).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                     </table>
                </div>
            </div>
        `;
    },

    exportToExcel() {
        // Export only filtered students
        const students = this.getFilteredStudents();
        const wb = XLSX.utils.book_new();

        // 1. Summative Sheet
        this.state.activities.forEach(a => {
            if (a.summativeAspects.length === 0) return;
            const data = students.map((s, i) => {
                const row = { No: i + 1, NISN: s.nisn, Nama: s.name, Kelas: s.class };
                a.summativeAspects.forEach(asp => {
                    const code = this.getSumScore(s.nisn, a.id, asp.id);
                    const lvl = RUBRIC_LEVELS.find(l => l.code === code);
                    row[`${asp.name}`] = lvl ? lvl.label : '-';
                });
                return row;
            });
            const ws = XLSX.utils.json_to_sheet(data);
            const sheetName = `S_${a.name}`.substring(0, 31).replace(/[\\/?*[\]]/g, ""); // Safe name
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });

        // 2. Formative Sheet
        this.state.activities.forEach(a => {
            if (a.formativeItems.length === 0) return;
            const data = students.map((s, i) => {
                const row = { No: i + 1, NISN: s.nisn, Nama: s.name, Kelas: s.class };
                a.formativeItems.forEach(itm => {
                    const checked = this.getFormCheck(s.nisn, a.id, itm.id);
                    row[itm.name] = checked ? "Terbiasa" : "-";
                });
                row['Catatan'] = this.getFormNote(s.nisn, a.id);
                return row;
            });
            const ws = XLSX.utils.json_to_sheet(data);
            const sheetName = `F_${a.name}`.substring(0, 31).replace(/[\\/?*[\]]/g, "");
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });

        XLSX.writeFile(wb, "Laporan_Kokurikuler.xlsx");
    },

    // -- Dummy Data Generator --
    loadDummyData() {
        if (!confirm("Data yang ada akan dihapus dan diganti dengan data dummy. Lanjutkan?")) return;

        // 1. Students
        const classes = ['X-A', 'X-B', 'XI-IPA'];
        const firstNames = ['Ahmad', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fajar', 'Gita', 'Hadi', 'Indah', 'Joko'];
        const lastNames = ['Santoso', 'Pratama', 'Putri', 'Wijaya', 'Saputra', 'Nugraha', 'Lestari', 'Hidayat'];

        let students = [];
        let nisnCounter = 1000;

        classes.forEach(cls => {
            for (let i = 0; i < 5; i++) {
                const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
                students.push({
                    nisn: (nisnCounter++).toString(),
                    nis: (nisnCounter + 5000).toString(),
                    name: name,
                    class: cls
                });
            }
        });

        // 2. Activities
        const activities = [
            {
                id: 'act_pramuka',
                name: 'Pramuka',
                summativeAspects: [
                    { id: 'sa_1', name: 'Kedisiplinan', dimension: 'Kemandirian', rubric: {} },
                    { id: 'sa_2', name: 'Kerjasama Tim', dimension: 'Kolaborasi', rubric: {} }
                ],
                formativeItems: [
                    { id: 'fi_1', name: 'Memakai Atribut Lengkap' },
                    { id: 'fi_2', name: 'Hadir Tepat Waktu' }
                ]
            },
            {
                id: 'act_futsal',
                name: 'Futsal',
                summativeAspects: [
                    { id: 'sa_3', name: 'Teknik Permainan', dimension: 'Kreativitas', rubric: {} },
                    { id: 'sa_4', name: 'Sportivitas', dimension: 'Keimanan dan Ketakwaan Terhadap Tuhan YME', rubric: {} } // Sportivitas as Akhlak
                ],
                formativeItems: [
                    { id: 'fi_3', name: 'Pemanasan dengan benar' },
                    { id: 'fi_4', name: 'Menjaga kebersihan lapangan' }
                ]
            }
        ];

        // 3. Populate State
        this.state.students = students;
        this.state.activities = activities;
        this.state.assessments = { summative: {}, formative: {} }; // Reset scores
        this.saveData();

        // Refresh
        this.renderDashboard();
        alert("Data Dummy Berhasil Dimuat!");
    }
};

document.addEventListener('DOMContentLoaded', () => { app.init(); });
