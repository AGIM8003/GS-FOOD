-- Postgres maintenance suggestions
-- Run as the database owner or a DBA role.

-- Vacuum and analyze all user tables to recover space and update planner stats
VACUUM (VERBOSE, ANALYZE);

-- For large tables, consider:
-- VACUUM (VERBOSE, ANALYZE) schema.table_name;
-- REINDEX TABLE schema.table_name;

-- Check for bloat with pgstattuple extension (if available):
-- SELECT * FROM pgstattuple('schema.table_name');

-- Suggested parameters to temporarily adjust for heavy maintenance windows:
-- SET maintenance_work_mem = '1GB';
-- SET autovacuum = off;  -- only during controlled maintenance

-- Redis notes (performed on Redis server):
-- - Run `INFO` and examine `used_memory`, `used_memory_rss`, `evicted_keys`.
-- - If persistence is enabled, run `BGREWRITEAOF` and `BGSAVE` as appropriate.
