CREATE TYPE "public"."ai_agent_run_status" AS ENUM('started', 'completed', 'failed', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."ai_conversation_status" AS ENUM('active', 'archived', 'flagged');--> statement-breakpoint
CREATE TYPE "public"."ai_identity_type" AS ENUM('anonymous', 'visitor', 'admin');--> statement-breakpoint
CREATE TYPE "public"."ai_message_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TYPE "public"."ai_message_status" AS ENUM('created', 'completed', 'failed', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."ai_scope_type" AS ENUM('site', 'post', 'category', 'tag', 'track');--> statement-breakpoint
CREATE TYPE "public"."ai_usage_action_type" AS ENUM('assistant_message', 'retrieval_query', 'tool_call', 'file_upload', 'file_parse');--> statement-breakpoint
CREATE TYPE "public"."ai_usage_window_type" AS ENUM('day', 'burst');--> statement-breakpoint
CREATE TABLE "ai_agent_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid,
	"user_message_id" uuid,
	"assistant_message_id" uuid,
	"identity_type" "ai_identity_type" NOT NULL,
	"identity_key" varchar(128) NOT NULL,
	"model" varchar(120),
	"scope_type" "ai_scope_type" DEFAULT 'site' NOT NULL,
	"scope_value" varchar(255),
	"retrieval_strategy" varchar(120),
	"retrieved_chunk_ids" jsonb NOT NULL,
	"tool_call_ids" jsonb NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"latency_ms" integer,
	"status" "ai_agent_run_status" DEFAULT 'started' NOT NULL,
	"error_code" varchar(120),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ai_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_type" "ai_identity_type" NOT NULL,
	"owner_key" varchar(128) NOT NULL,
	"title" varchar(255),
	"status" "ai_conversation_status" DEFAULT 'active' NOT NULL,
	"scope_type" "ai_scope_type" DEFAULT 'site' NOT NULL,
	"scope_value" varchar(255),
	"active_post_id" integer,
	"summary" text,
	"message_count" integer DEFAULT 0 NOT NULL,
	"total_input_tokens" integer DEFAULT 0 NOT NULL,
	"total_output_tokens" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_message_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ai_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" "ai_message_role" NOT NULL,
	"status" "ai_message_status" DEFAULT 'created' NOT NULL,
	"content" text NOT NULL,
	"source_json" jsonb,
	"usage_json" jsonb,
	"error_code" varchar(120),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_usage_buckets" (
	"id" serial PRIMARY KEY NOT NULL,
	"identity_type" "ai_identity_type" NOT NULL,
	"identity_key" varchar(128) NOT NULL,
	"action_type" "ai_usage_action_type" NOT NULL,
	"window_type" "ai_usage_window_type" NOT NULL,
	"window_start" timestamp NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_agent_runs" ADD CONSTRAINT "ai_agent_runs_conversation_id_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_agent_runs" ADD CONSTRAINT "ai_agent_runs_user_message_id_ai_messages_id_fk" FOREIGN KEY ("user_message_id") REFERENCES "public"."ai_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_agent_runs" ADD CONSTRAINT "ai_agent_runs_assistant_message_id_ai_messages_id_fk" FOREIGN KEY ("assistant_message_id") REFERENCES "public"."ai_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_active_post_id_posts_id_fk" FOREIGN KEY ("active_post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_agent_runs_conversation_created_at_idx" ON "ai_agent_runs" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_agent_runs_identity_created_at_idx" ON "ai_agent_runs" USING btree ("identity_type","identity_key","created_at");--> statement-breakpoint
CREATE INDEX "ai_agent_runs_status_created_at_idx" ON "ai_agent_runs" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "ai_conversations_owner_updated_at_idx" ON "ai_conversations" USING btree ("owner_type","owner_key","updated_at");--> statement-breakpoint
CREATE INDEX "ai_conversations_status_expires_at_idx" ON "ai_conversations" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX "ai_conversations_scope_idx" ON "ai_conversations" USING btree ("scope_type","scope_value");--> statement-breakpoint
CREATE INDEX "ai_messages_conversation_created_at_idx" ON "ai_messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_usage_buckets_identity_window_idx" ON "ai_usage_buckets" USING btree ("identity_type","identity_key","action_type","window_type","window_start");--> statement-breakpoint
CREATE INDEX "ai_usage_buckets_identity_idx" ON "ai_usage_buckets" USING btree ("identity_type","identity_key");