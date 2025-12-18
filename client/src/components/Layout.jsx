import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, PenTool, FileText, CheckCircle, LogOut, User, Shield, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { to: "/", icon: <CheckCircle size={20} />, label: "Dashboard" },
        { to: "/students", icon: <Users size={20} />, label: "Data Siswa" },
        { to: "/assessment", icon: <PenTool size={20} />, label: "Penilaian" },
        { to: "/reports", icon: <FileText size={20} />, label: "Laporan" },
    ];

    // Show Config only for Admin/Headmaster/SuperAdmin
    if (['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH'].includes(user?.role)) {
        navItems.splice(2, 0, { to: "/config", icon: <Settings size={20} />, label: "Konfigurasi" });
    }

    // Show User Management only for SuperAdmin
    if (user?.role === 'SUPER_ADMIN') {
        navItems.push({ to: "/users", icon: <Shield size={20} />, label: "Manajemen User" });
    }

    return (
        <aside className={`fixed inset-y-0 left-0 bg-slate-900 w-64 text-white flex flex-col shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
            <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <CheckCircle className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-tight">SiKori</h1>
                        <p className="text-xs text-slate-400">Ver. 3.2 Mobile</p>
                    </div>
                </div>
                <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
                    <X size={24} />
                </button>
            </div>

            <div className="p-4 border-b border-slate-800">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50">
                    <div className="bg-blue-500 rounded-full p-1.5"><User size={16} /></div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold truncate">{user?.fullName}</p>
                        <p className="text-[10px] text-slate-400 truncate uppercase">{user?.role?.replace('_', ' ')}</p>
                    </div>
                </div>
                <NavLink to="/profile" onClick={onClose} className="text-xs text-blue-400 hover:text-blue-300 mt-2 block text-right">Edit Profil &rarr;</NavLink>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onClose}
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
                <button onClick={handleLogout} className="w-full flex items-center gap-2 justify-center bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white py-2 rounded-lg transition-colors text-sm font-bold">
                    <LogOut size={16} /> Logout
                </button>
            </div>
        </aside>
    );
};

const Layout = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white p-4 flex items-center justify-between z-40 shadow-md">
                <div className="flex items-center gap-2">
                    <CheckCircle className="text-blue-500" size={24} />
                    <span className="font-bold text-lg">SiKori</span>
                </div>
                <button onClick={() => setSidebarOpen(true)} className="p-1 rounded hover:bg-slate-800">
                    <Menu size={24} />
                </button>
            </div>

            {/* Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-x-hidden pt-20 md:pt-8 transition-all duration-300">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
