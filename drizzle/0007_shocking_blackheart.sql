CREATE TYPE "public"."ai_context_source_kind" AS ENUM('pasted_text', 'text_file', 'markdown_file');--> statement-breakpoint
CREATE TYPE "public"."ai_context_source_status" AS ENUM('ready', 'deleted', 'rejected');--> statement-breakpoint
CREATE TABLE "ai_context_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"owner_type" "ai_identity_type" NOT NULL,
	"owner_key" varchar(128) NOT NULL,
	"kind" "ai_context_source_kind" NOT NULL,
	"status" "ai_context_source_status" DEFAULT 'ready' NOT NULL,
	"filename" varchar(255),
	"mime_type" varchar(120),
	"content" text NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"token_estimate" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_context_sources" ADD CONSTRAINT "ai_context_sources_conversation_id_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_context_sources_conversation_idx" ON "ai_context_sources" USING btree ("conversation_id","status","created_at");--> statement-breakpoint
CREATE INDEX "ai_context_sources_owner_idx" ON "ai_context_sources" USING btree ("owner_type","owner_key","created_at");--> statement-breakpoint
CREATE INDEX "ai_context_sources_expires_at_idx" ON "ai_context_sources" USING btree ("expires_at");