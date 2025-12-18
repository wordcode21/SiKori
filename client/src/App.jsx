import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Config from './pages/Config';
import Assessment from './pages/Assessment';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement';
import Backup from './pages/Backup';

const PrivateRoute = () => {
    const { user, loading } = useAuth();
    if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
    return user ? <Outlet /> : <Navigate to="/login" />;
};

const SuperAdminRoute = () => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    return user && user.role === 'SUPER_ADMIN' ? <Outlet /> : <Navigate to="/" />;
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route element={<PrivateRoute />}>
                        <Route path="/" element={<Layout />}>
                            <Route index element={<Dashboard />} />
                            <Route path="students" element={<Students />} />
                            <Route path="config" element={<Config />} />
                            <Route path="assessment" element={<Assessment />} />
                            <Route path="reports" element={<Reports />} />
                            <Route path="profile" element={<Profile />} />

                            <Route element={<SuperAdminRoute />}>
                                <Route path="users" element={<UserManagement />} />
                                <Route path="backup" element={<Backup />} />
                            </Route>
                        </Route>
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
