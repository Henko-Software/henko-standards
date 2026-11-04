-- Auditoría (append-only para __name___app) y outbox.
-- SQL de @henko-software/audit (auditLogMigration('__name___app')) y
-- @henko-software/outbox (outboxMigration()) 0.1.0, copiado tal cual.

CREATE TABLE IF NOT EXISTS audit_log (
	id uuid PRIMARY KEY,
	occurred_at timestamptz NOT NULL DEFAULT now(),
	action text NOT NULL,
	entity_type text NOT NULL,
	entity_id text NOT NULL,
	actor_origin text NOT NULL CHECK (actor_origin IN ('person', 'automatic')),
	actor_id text,
	actor_role text,
	automation_label text,
	local_id text,
	before jsonb,
	after jsonb,
	trace_id text,
	correlation_id text
);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON audit_log (entity_type, entity_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_trace_idx ON audit_log (trace_id);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx ON audit_log (actor_id, occurred_at DESC);
REVOKE UPDATE, DELETE, TRUNCATE ON audit_log FROM __name___app;

CREATE TABLE IF NOT EXISTS outbox (
	id uuid PRIMARY KEY,
	type text NOT NULL,
	aggregate_type text NOT NULL,
	aggregate_id text NOT NULL,
	payload jsonb NOT NULL,
	headers jsonb NOT NULL DEFAULT '{}'::jsonb,
	occurred_at timestamptz NOT NULL DEFAULT now(),
	published_at timestamptz,
	attempts integer NOT NULL DEFAULT 0,
	last_error text
);
CREATE INDEX IF NOT EXISTS outbox_pending_idx ON outbox (occurred_at) WHERE published_at IS NULL;
