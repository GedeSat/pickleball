import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // realistis dulu
    { duration: '1m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],  // 2000ms terlalu longgar untuk UX yang baik
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
  },
};

const TOURNAMENT_ID = '1';
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'; // biar bisa ganti tanpa edit file

export default function () {
  const pages = [
    { name: 'homepage', url: `${BASE_URL}/` },
    { name: 'tournament_detail', url: `${BASE_URL}/tournament/${TOURNAMENT_ID}` },
    { name: 'jadwal', url: `${BASE_URL}/tournament/${TOURNAMENT_ID}/jadwal` },
    { name: 'bagan', url: `${BASE_URL}/tournament/${TOURNAMENT_ID}/bracket` },
  ];

  const page = pages[Math.floor(Math.random() * pages.length)];
  const res = http.get(page.url, { tags: { name: page.name } });

  const ok = check(res, {
    [`${page.name} status 200`]: (r) => r.status === 200,
    [`${page.name} < 800ms`]: (r) => r.timings.duration < 800,
  });

  if (!ok) errorRate.add(1);

  sleep(Math.random() * 3);
}