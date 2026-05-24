CREATE TYPE "public"."post_visibility" AS ENUM('hidden', 'admin', 'public');--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "visibility" "post_visibility" DEFAULT 'admin' NOT NULL;--> statement-breakpoint
UPDATE "posts"
SET "visibility" = CASE
  WHEN "slug" = 'evq-cosh-frequency-allocation' THEN 'hidden'::"post_visibility"
  WHEN "status" = 'published' THEN 'public'::"post_visibility"
  ELSE 'admin'::"post_visibility"
END;
