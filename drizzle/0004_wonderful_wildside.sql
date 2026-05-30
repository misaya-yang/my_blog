ALTER TABLE "posts" ADD COLUMN "series_slug" varchar(120);--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "series_title" varchar(255);--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "series_order" integer;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "featured_rank" integer;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "pinned_track" varchar(50);--> statement-breakpoint
CREATE INDEX "posts_featured_rank_published_at_idx" ON "posts" USING btree ("featured_rank","published_at");--> statement-breakpoint
CREATE INDEX "posts_series_slug_order_idx" ON "posts" USING btree ("series_slug","series_order");--> statement-breakpoint
CREATE INDEX "posts_pinned_track_idx" ON "posts" USING btree ("pinned_track");