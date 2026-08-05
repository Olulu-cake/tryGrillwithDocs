import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metric to track checkout failures
export const checkoutFailureRate = new Rate('checkout_failure_rate');

/**
 * Load Test Script
 * 
 * Endpoints:
 * - GET  /api/v1/products - Catalog browsing
 * - POST /api/v1/checkout - Checkout initiation
 */
export const options = {
  stages: [
    { duration: '1m', target: 1000 }, // ramp up to 1000
    { duration: '3m', target: 1000 }, // stay at 1000
    { duration: '1m', target: 5000 }, // ramp up to 5000
    { duration: '5m', target: 5000 }, // stay at 5000 (Load Test)
    { duration: '1m', target: 0 },    // ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests must complete under 500ms
    'checkout_failure_rate': ['rate<0.01'], // checkout failure rate must be < 1%
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // 1. Catalog browsing (Hits Redis cache-aside)
  const catalogRes = http.get(`${BASE_URL}/api/v1/products`);
  check(catalogRes, {
    'catalog status is 200': (r) => r.status === 200,
  });

  // 2. Checkout API
  const checkoutPayload = JSON.stringify({
    userId: 'test-user-uuid-12345',
    guestCartId: 'guest-cart-uuid-999',
    userCartId: 'user-cart-uuid-000',
  });
  
  const checkoutRes = http.post(`${BASE_URL}/api/v1/checkout`, checkoutPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const checkoutSuccess = check(checkoutRes, {
    'checkout status is 200/201': (r) => r.status === 200 || r.status === 201,
  });

  if (!checkoutSuccess) {
    checkoutFailureRate.add(1);
  }

  sleep(1); // Simulating user think time
}
