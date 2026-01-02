import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'; // Explicit import to be safe
import Students from '../Students';
import api from '../../utils/api';

// Mocks
vi.mock('../../utils/api');

describe('Students Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders students list', async () => {
        const mockStudents = [
            { nisn: '123', nis: '001', name: 'Student One', class: 'X-A' },
            { nisn: '456', nis: '002', name: 'Student Two', class: 'X-B' }
        ];
        api.get.mockResolvedValue({ data: mockStudents });

        render(<Students />);

        expect(screen.getByText('Loading...')).toBeInTheDocument();

        expect(await screen.findByText(/Student One/i)).toBeInTheDocument();
        expect(screen.getByText(/Student Two/i)).toBeInTheDocument();
        expect(screen.getAllByText(/X-A/i).length).toBeGreaterThan(0);
    });

    it('displays empty state', async () => {
        api.get.mockResolvedValue({ data: [] });

        render(<Students />);

        await waitFor(() => {
            expect(screen.getByText('Belum ada data siswa.')).toBeInTheDocument();
        });
    });
});
