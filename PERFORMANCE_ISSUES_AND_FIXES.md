# Performance Issue Report — Share Market Software

## Problem
Production APIs take **1.5+ minutes** to fetch data and the UI becomes slow when data grows to millions of rows.

## Why it happens (even when API keys are commented)
Commenting API keys only stops external calls (Zerodha Kite, AllTick, etc.). The internal **database queries, heavy JavaScript loops, and frontend polling** still run. Those are the real bottlenecks.

---

## Root Causes

| # | Area | Issue | File |
|---|---|---|---|
| 1 | **Trades API** | No `LIMIT`/`OFFSET`; fetches every visible trade. Heavy `UPPER/REPLACE/COLLATE` LEFT JOINs that cannot use indexes. Per-row PnL/margin recalculation. | `sharemarket-aws-backend-master/src/controllers/tradeController.js:1871` |
| 2 | **Dashboard M2M** | `WHERE status != 'DELETED'` with no time window. Huge `IN (...)` clauses. Per-trade JS loop where `require()` is called inside the loop. O(n×m) price matching. | `sharemarket-aws-backend-master/src/controllers/dashboardController.js:99` |
| 3 | **Market routes** | Loads the full `scrip_data` table (30M+ rows in production) into memory. Kite REST quotes are fetched for thousands of symbols. Options chain scans 100K instruments twice. | `sharemarket-aws-backend-master/src/routes/kiteRoutes.js:1291` |
| 4 | **Frontend** | Polls the full trade list every 5 seconds. O(n) `.map()` on every WebSocket tick across 4 arrays. P&L calculated inside render. | `Trading_Frontend-main/src/context/MarketDataContext.jsx:204`<br>`Trading_Frontend-main/src/pages/trades/TradesPage.jsx:27` |
| 5 | **Database** | Missing composite indexes on `(status, is_pending)`, `client_settings.broker_id`, `banned_scrips.created_by`, `script_testing.tradingsymbol`, etc. | MySQL schema |

---

## Recommended Fixes

### P0 — Do First (Highest Impact)
1. Add server-side `LIMIT`/`OFFSET` pagination to `GET /trades`.
2. Add a mandatory time-window filter and move dashboard aggregation to SQL (`GROUP BY`, `SUM`).
3. Add the composite indexes listed below.
4. Stop loading full `scrip_data`; query only needed symbols or cache in Redis.
5. Convert `MarketDataContext` arrays to a single `Map<symbol, row>` for O(1) updates.
6. Stop the 5-second trade-list polling; use WebSocket `price_update` events.

### P1 — Next
1. Use the Kite WebSocket ticker for live prices instead of REST `/quote` calls.
2. Cache `banned_scrips` and allowed-segments per user (30–60s TTL).
3. Virtualize large tables (`ActiveTradesPage`, `MarketDataPage`, etc.) with `react-window`.
4. Move P&L/margin calculation out of render into `useMemo` or compute it on the backend.

### P2 — Architecture
1. Partition or archive `scrip_ticks_history` (monthly partitions, or move to TimescaleDB/InfluxDB).
2. Add a MySQL read replica for heavy SELECTs.
3. Introduce BullMQ for background exports, RMS auto-close, target/SL triggers, and pending-order execution.

---

## SQL Indexes to Add

```sql
-- trades hot filter combinations
ALTER TABLE trades
  ADD KEY idx_trades_status_pending_time (status, is_pending, entry_time),
  ADD KEY idx_trades_user_status_pending_time (user_id, status, is_pending, entry_time),
  ADD KEY idx_trades_created_status (created_by, status, is_pending),
  ADD KEY idx_trades_exit_time (exit_time);

-- hierarchy / permission lookups
ALTER TABLE users ADD KEY idx_users_is_demo (is_demo);
ALTER TABLE client_settings ADD KEY idx_client_settings_broker_id (broker_id);
ALTER TABLE banned_scrips ADD KEY idx_banned_created_by (created_by);

-- symbol lookups
ALTER TABLE script_testing ADD KEY idx_tradingsymbol (tradingsymbol);
ALTER TABLE market_group_items ADD KEY idx_mgi_symbol (symbol), ADD KEY idx_mgi_group_id (group_id);
```

> Note: `trades` uses `utf8mb4_general_ci` but the code forces `utf8mb4_unicode_ci` in joins. Align collations or remove forced `COLLATE` clauses so indexes can be used.

---

## Expected Impact
- **P0 fixes** should bring API response times down from minutes to seconds.
- **Indexes + pagination** can reduce DB CPU and I/O by 10–100x.
- **Frontend Map + WebSocket** updates remove per-tick UI lag.

---

## Implemented Fixes (Completed)

### Backend
- **SQL indexes** added to `trades`, `users`, `client_settings`, `banned_scrips`, `script_testing`, `market_group_items`.
- **`GET /trades`** now supports optional `page`/`limit` pagination and `SQL_CALC_FOUND_ROWS`; returns `{data, total, page, limit}` when paginated, full array otherwise.
- **`GET /trades/active`** (`getActivePositions`) supports optional pagination and simplified joins.
- **`GET /dashboard/live-m2m`** now defaults to a 7-day time window, pre-loads user configs, moves `require()`/`getWeekBoundaries` out of the per-trade loop, and uses a precomputed price lookup instead of scanning `Object.keys(prices)` per trade.
- **Banned scrips** and **allowed segments** are cached in memory with TTL and invalidated on mutations.
- **`kiteRoutes.js`** now uses the precomputed `indexedInstruments` buckets for options chain, shares a cached `getLotMap()` helper, and no longer broadcasts the full watchlist snapshot over WebSocket.
- **`kiteService.getQuote()`** has 1-second request deduplication/in-flight caching.
- **`MarketDataService`** caps dirty symbols per broadcast tick, flushes tick history asynchronously, and reduced crypto/forex/commodity full-array pushes to every 3 seconds.
- **`targetSLService`** now skips overlapping ticks.

### Frontend
- **`TradesPage`** removed 5-second polling, passes backend filters + `limit`, and uses a debounced fetch.
- **`ActiveTradesPage`** fetches OPEN trades with a `limit` and uses a memoized `scripMap` for O(1) price lookups instead of rebuilding arrays per row.
- **`MarketDataContext`** now uses normalized `Map<symbol, row>` refs for O(1) WebSocket price merges, debounces snapshot requests, and memoizes the context value.
- **`LiveM2MPage`** dashboard polling reduced from 1 second to 10 seconds.

### Validation
- Backend starts without errors (`npm start` smoke test passed).
- Frontend production build passes (`npm run build`).
- `EXPLAIN` confirms new indexes are used for filtered trade/dashboard queries.

## Suggested Next Step
Monitor production response times. If further improvement is needed, consider:
1. Partitioning `scrip_ticks_history` by month.
2. Virtualizing large tables (`ActiveTradesPage`, `MarketDataPage`, etc.) with `react-window`.
3. Moving heavy P&L/margin calculations entirely to SQL or a materialized cache.
