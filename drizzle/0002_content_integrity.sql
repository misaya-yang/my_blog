DELETE FROM "post_tags"
WHERE "post_id" NOT IN (SELECT "id" FROM "posts")
   OR "tag_id" NOT IN (SELECT "id" FROM "tags");--> statement-breakpoint
DELETE FROM "post_versions"
WHERE "post_id" NOT IN (SELECT "id" FROM "posts");--> statement-breakpoint
UPDATE "posts"
SET "category_id" = NULL
WHERE "category_id" IS NOT NULL
  AND "category_id" NOT IN (SELECT "id" FROM "categories");--> statement-breakpoint
DELETE FROM "posts"
WHERE "author_id" NOT IN (SELECT "id" FROM "users");--> statement-breakpoint
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_versions" ADD CONSTRAINT "post_versions_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "post_tags_post_id_idx" ON "post_tags" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "post_tags_tag_id_idx" ON "post_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "post_versions_post_id_idx" ON "post_versions" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "posts_status_visibility_published_at_idx" ON "posts" USING btree ("status","visibility","published_at");--> statement-breakpoint
CREATE INDEX "posts_category_id_idx" ON "posts" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");
