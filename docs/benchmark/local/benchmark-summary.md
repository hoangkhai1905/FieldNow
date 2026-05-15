# FieldNow Local k6 Benchmark Summary

Date: 2026-05-15

Environment:
- Backend and k6 both ran on the same laptop.
- Network: wired connection.
- Database/services may still include remote dependencies such as Supabase.
- These results are useful as a local baseline, not as production capacity numbers.

## Summary

The backend behaved well under normal load and gradual stress. It did not produce 5xx errors in any recorded test. The main weakness appears during sudden traffic spikes: the system still recovers and keeps returning successful responses, but latency rises noticeably.

## Results

| Test | Max VUs | Requests | Req/s | Failed | p95 | p99 | Verdict |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Load | 2 | 58 | 0.89 | 0.00% | 482ms | 878ms | Pass |
| Stress | 30 | 17,543 | 34.24 | 0.00% | 700ms | 743ms | Pass |
| Spike | 80 | 5,251 | 28.84 | 0.00% | 1.94s | 1.98s | Functional pass, latency threshold failed |

## Interpretation

Load test:
- Clean baseline.
- All checks passed.
- No public search rate limiting.
- Latency is acceptable for a local development run.

Stress test:
- Strong result for local execution.
- 30 VUs sustained with 0% HTTP failures and no server errors.
- p95 stayed under 1 second.
- This suggests the read-heavy API path is stable at moderate local load.

Spike test:
- No request failures and no server errors.
- Recovery checks passed.
- p95 crossed the configured 1.5s threshold at roughly 1.94s.
- This means the system survives a sudden spike to 80 VUs, but responsiveness degrades.

## Important Caveats

Do not treat these numbers as production capacity:
- k6 and the backend compete for the same laptop CPU, memory, and IO.
- Local Node execution and logging can distort latency.
- Wired local network removes some client-side variability.
- Remote database latency can still affect results if Supabase is used.
- Production would include different infrastructure, networking, process managers, proxy layers, and connection limits.

## Current Read

The backend is stable under the tested local scenarios. The practical local baseline is:
- 30 VUs: healthy.
- 80 VU spike: no errors, but latency becomes visible.

The next bottleneck to investigate is not correctness. It is p95 latency under sudden concurrency.

## Recommended Next Tests

1. Run stress with higher stages: 60, 100, 150 VUs.
2. Split endpoint metrics by scenario so `/fields/:id`, `/auth/me`, and `/bookings/me` can be compared independently.
3. Run a separate search-specific test with the `/fields` rate limiter raised or disabled in a test environment.
4. Repeat the same scripts from a different machine or staging runner to avoid local laptop resource contention.
5. Capture backend CPU, memory, Redis, and database connection metrics during spike tests.

## Useful Commands

Run local smoke:

```powershell
cd T:\github\FieldNow\BE
npm run test:load
```

Run stress:

```powershell
cd T:\github\FieldNow\BE
npm run test:stress
```

Run spike:

```powershell
cd T:\github\FieldNow\BE
npm run test:spike
```

Increase spike intensity:

```powershell
$env:SPIKE_VUS="150"
npm run test:spike
```

Include public search in stress or spike tests:

```powershell
$env:INCLUDE_SEARCH="true"
npm run test:stress
```

Note: public search is rate-limited. If `INCLUDE_SEARCH=true`, 429 responses may indicate the limiter is working, not that the backend is failing.
