const request = require('supertest');

jest.mock('../middleware/auth', () => ({
    authenticate: (req, res, next) => {
        req.user = { role: 'SUPER_ADMIN' };
        next();
    },
    authorize: (roles) => (req, res, next) => next()
}));

jest.mock('../config/database', () => ({
    transaction: jest.fn((callback) => callback('mockTransaction')),
    define: jest.fn(() => ({
        belongsTo: jest.fn(),
        hasMany: jest.fn(),
        findAll: jest.fn(),
        create: jest.fn(),
        findByPk: jest.fn(),
        destroy: jest.fn()
    }))
}));

// Mock User model specifically to prevent it from trying to load DB
jest.mock('../models/User', () => ({}));
// jest.mock('../models'); // Remove this to let models/index.js run using our mocked sequelize

const app = require('../app');
const { Activity, SummativeAspect, FormativeItem } = require('../models');

describe('Activities Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/activities', () => {
        it('should return all activities', async () => {
            const mockActivities = [{ name: 'Activity 1' }];
            Activity.findAll.mockResolvedValue(mockActivities);

            const res = await request(app).get('/api/activities');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual(mockActivities);
            expect(Activity.findAll).toHaveBeenCalledWith({
                include: [SummativeAspect, FormativeItem]
            });
        });
    });

    describe('POST /api/activities', () => {
        it('should create activity with transaction', async () => {
            const activityData = {
                name: 'New Activity',
                targetClasses: ['X-A'],
                summativeAspects: [{ name: 'Aspect 1' }]
            };

            const mockCreatedActivity = { id: 1, ...activityData };

            Activity.create.mockResolvedValue(mockCreatedActivity);
            SummativeAspect.create.mockResolvedValue({});
            Activity.findByPk.mockResolvedValue(mockCreatedActivity);

            const res = await request(app).post('/api/activities').send(activityData);

            expect(res.statusCode).toEqual(200);
            expect(Activity.create).toHaveBeenCalled();
            expect(SummativeAspect.create).toHaveBeenCalled();
        });
    });
});
