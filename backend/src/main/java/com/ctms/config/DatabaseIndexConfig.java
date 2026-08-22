package com.ctms.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Creates database indexes on frequently queried columns
 * to accelerate WHERE, JOIN, and ORDER BY operations.
 * Uses IF NOT EXISTS to be idempotent on restarts.
 */
@Component
@Slf4j
public class DatabaseIndexConfig implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseIndexConfig(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        createIndexSafe("idx_trip_requests_employee_id", "trip_requests", "employee_id");
        createIndexSafe("idx_trip_requests_status", "trip_requests", "status");
        createIndexSafe("idx_trip_requests_created_at", "trip_requests", "created_at");
        createIndexSafe("idx_trip_requests_status_created", "trip_requests", "status, created_at");
        createIndexSafe("idx_trip_itinerary_trip_req_id", "trip_itinerary", "trip_request_id");
        createIndexSafe("idx_trip_milestones_trip_req_id", "trip_milestones", "trip_request_id");
        createIndexSafe("idx_trip_checklist_tl_trip_req_id", "trip_checklist_timeline", "trip_request_id");
        createIndexSafe("idx_expenses_trip_req_id", "expenses", "trip_request_id");
        createIndexSafe("idx_expenses_status", "expenses", "status");
        log.info("Database performance indexes verified/created");
    }

    private void createIndexSafe(String indexName, String table, String columns) {
        try {
            jdbcTemplate.execute(
                "CREATE INDEX IF NOT EXISTS " + indexName + " ON " + table + " (" + columns + ")"
            );
        } catch (Exception e) {
            log.debug("Index {} on {}: {}", indexName, table, e.getMessage());
        }
    }
}
