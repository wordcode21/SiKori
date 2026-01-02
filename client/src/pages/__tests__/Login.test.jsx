import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'; // Explicit import to be safe
import Login from '../Login';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Mocks
vi.mock('../../context/AuthContext');
vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn()
}));

describe('Login Component', () => {
    const mockLogin = vi.fn();
    const mockNavigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        useAuth.mockReturnValue({ login: mockLogin });
        useNavigate.mockReturnValue(mockNavigate);
    });

    it('renders login form correctly', () => {
        render(<Login />);
        expect(screen.getByText('SiKori v1.0')).toBeInTheDocument();
        expect(screen.getByLabelText('Username')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
    });

    it('handles login success', async () => {
        render(<Login />);

        fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
        fireEvent.click(screen.getByRole('button', { name: /Login/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith('testuser', 'password');
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    it('handles login failure', async () => {
        mockLogin.mockRejectedValue(new Error('Invalid credentials'));
        render(<Login />);

        fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'wronguser' } });
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
        fireEvent.click(screen.getByRole('button', { name: /Login/i }));

        expect(await screen.findByText('Username atau password salah.')).toBeInTheDocument();
    });
});
