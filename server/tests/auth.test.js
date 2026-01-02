const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('../models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Auth Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/login', () => {
        it('should authenticate user and return token', async () => {
            const mockUser = {
                id: 1,
                username: 'testuser',
                password: 'hashedpassword',
                role: 'ADMIN',
                toJSON: jest.fn().mockReturnValue({ id: 1, username: 'testuser', role: 'ADMIN' }) // Mock sequelize instance toJSON
            };
            // Mock sequelize model behavior
            mockUser.toJSON.mockReturnValue(mockUser);

            User.findOne.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('fake-token');

            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: 'testuser', password: 'password' });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token', 'fake-token');
            expect(User.findOne).toHaveBeenCalledWith({ where: { username: 'testuser' } });
        });

        it('should return 401 for invalid credentials', async () => {
            User.findOne.mockResolvedValue(null);

            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: 'wronguser', password: 'password' });

            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty('error', 'Username atau password salah');
        });
    });
});
