CREATE TYPE "public"."ai_knowledge_chunk_type" AS ENUM('post_chunk', 'post_metadata_chunk', 'site_overview_chunk');--> statement-breakpoint
CREATE TABLE "ai_knowledge_chunks" (
	"id" serial PRIMARY KEY NOT NULL,
	"chunk_type" "ai_knowledge_chunk_type" NOT NULL,
	"post_id" integer,
	"post_slug" varchar(255),
	"post_title" varchar(255),
	"category_slug" varchar(100),
	"tag_slugs" jsonb NOT NULL,
	"status_snapshot" "post_status" NOT NULL,
	"visibility_snapshot" "post_visibility" NOT NULL,
	"locale" varchar(12) DEFAULT 'en' NOT NULL,
	"chunk_index" integer NOT NULL,
	"heading" varchar(255),
	"section_path" text,
	"content" text NOT NULL,
	"summary" text,
	"keywords" jsonb NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"token_estimate" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_knowledge_chunks" ADD CONSTRAINT "ai_knowledge_chunks_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_knowledge_chunks_post_chunk_idx" ON "ai_knowledge_chunks" USING btree ("post_id","chunk_index");--> statement-breakpoint
CREATE INDEX "ai_knowledge_chunks_post_id_idx" ON "ai_knowledge_chunks" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "ai_knowledge_chunks_post_slug_idx" ON "ai_knowledge_chunks" USING btree ("post_slug");--> statement-breakpoint
CREATE INDEX "ai_knowledge_chunks_visibility_idx" ON "ai_knowledge_chunks" USING btree ("status_snapshot","visibility_snapshot");--> statement-breakpoint
CREATE INDEX "ai_knowledge_chunks_chunk_type_idx" ON "ai_knowledge_chunks" USING btree ("chunk_type");