import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, PenTool, FileText, CheckCircle } from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { to: "/", icon: <CheckCircle size={20} />, label: "Dashboard" },
        { to: "/students", icon: <Users size={20} />, label: "Data Siswa" },
        { to: "/config", icon: <Settings size={20} />, label: "Konfigurasi" },
        { to: "/assessment", icon: <PenTool size={20} />, label: "Penilaian" },
        { to: "/reports", icon: <FileText size={20} />, label: "Laporan" },
    ];

    return (
        <aside className="w-64 bg-slate-900 min-h-screen text-white flex flex-col fixed left-0 top-0 shadow-xl z-50">
            <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                    <CheckCircle className="text-white" size={24} />
                </div>
                <div>
                    <h1 className="font-bold text-lg tracking-tight">SiKori</h1>
                    <p className="text-xs text-slate-400">Aplikasi Sistem Kokurikuler</p>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium ${isActive
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20 translate-x-1"
                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            }`
                        }
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className="bg-slate-800/50 rounded-lg p-3 text-xs text-center text-slate-500">
                    &copy; 2025 masadji
                </div>
            </div>
        </aside>
    );
};

const Layout = () => {
    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 ml-64 p-8 overflow-x-hidden">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
