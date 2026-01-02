const request = require('supertest');
// Mock middleware BEFORE importing app
jest.mock('../middleware/auth', () => ({
    authenticate: (req, res, next) => {
        req.user = { role: 'SUPER_ADMIN' }; // Default mock user
        next();
    },
    authorize: (roles) => (req, res, next) => next()
}));

const app = require('../app');
const { Student } = require('../models');

// Mock User model specifically
jest.mock('../models/User', () => ({}));
jest.mock('../models');

describe('Students Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/students', () => {
        it('should return all students for SUPER_ADMIN', async () => {
            const mockStudents = [{ name: 'Student 1', class: 'X-A' }, { name: 'Student 2', class: 'X-B' }];
            Student.findAll.mockResolvedValue(mockStudents);

            const res = await request(app).get('/api/students');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual(mockStudents);
            expect(Student.findAll).toHaveBeenCalled();
        });
    });

    describe('POST /api/students', () => {
        it('should create a new student', async () => {
            const newStudent = { name: 'New Student', class: 'X-A', nisn: '12345' };
            Student.create.mockResolvedValue(newStudent);

            const res = await request(app)
                .post('/api/students')
                .send(newStudent);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual(newStudent);
            expect(Student.create).toHaveBeenCalledWith(newStudent);
        });
    });
});
