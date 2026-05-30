CREATE TYPE "public"."feedback_status" AS ENUM('new', 'reviewed', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."feedback_type" AS ENUM('useful', 'not_useful');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'unsubscribed');--> statement-breakpoint
CREATE TABLE "post_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"visitor_id" varchar(64),
	"visitor_name" varchar(80),
	"type" "feedback_type" NOT NULL,
	"message" text,
	"reply_email" varchar(320),
	"status" "feedback_status" DEFAULT 'new' NOT NULL,
	"source" varchar(255),
	"user_agent" varchar(512),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"preferred_language" varchar(12),
	"interests" text,
	"source" varchar(255),
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "post_feedback" ADD CONSTRAINT "post_feedback_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "post_feedback_post_status_created_at_idx" ON "post_feedback" USING btree ("post_id","status","created_at");--> statement-breakpoint
CREATE INDEX "post_feedback_status_created_at_idx" ON "post_feedback" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "subscribers_status_created_at_idx" ON "subscribers" USING btree ("status","created_at");