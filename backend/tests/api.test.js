// Mock DB before loading app
jest.mock('../src/config/db', () => {
  const mockQuery = jest.fn();
  return {
    query: mockQuery,
    getPool: () => ({
      query: mockQuery
    })
  };
});

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

describe('GPS Tracking Dashboard API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. Health Endpoint Test
  describe('GET /health', () => {
    it('should return UP status', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'UP');
    });
  });

  // 2. Auth Endpoint Tests
  describe('POST /api/auth/login', () => {
    it('should validate missing email and password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('provide email and password');
    });

    it('should fail with invalid credentials', async () => {
      db.query.mockResolvedValueOnce([[]]); // Return no users

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'fake@fake.com', password: 'password123' });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid credentials');
    });
  });

  // 3. Bookings Route Protection Test
  describe('GET /api/bookings', () => {
    it('should block request without JWT token', async () => {
      const res = await request(app).get('/api/bookings');
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Not authorized, no token provided');
    });
  });

  // 4. Public Trip Tracking Route
  describe('GET /api/trips/tracking/:tripUid', () => {
    it('should return trip details for valid Trip UID', async () => {
      // Mock trip data return
      db.query.mockResolvedValueOnce([[
        {
          id: 1,
          trip_uid: 'TRIP-BLR-EC-001',
          status: 'trip_in_progress',
          current_latitude: 13.1000,
          current_longitude: 77.6900,
          current_address: 'Hebbal, Bangalore',
          customer_name: 'John Doe',
          pickup_location: 'Airport',
          drop_location: 'Electronic City'
        }
      ]]);
      
      // Mock GPS path logs
      db.query.mockResolvedValueOnce([[]]);

      const res = await request(app).get('/api/trips/tracking/TRIP-BLR-EC-001');
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.trip_uid).toBe('TRIP-BLR-EC-001');
    });

    it('should return 404 for non-existing UID', async () => {
      db.query.mockResolvedValueOnce([[]]); // No trip found

      const res = await request(app).get('/api/trips/tracking/TRIP-FAKE-123');
      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });
  });
});
