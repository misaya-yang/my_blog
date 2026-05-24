import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { posts } from './drizzle/schema';
import { readFileSync } from 'fs';

const db = drizzle(process.env.DATABASE_URL!);

async function updateArticles() {
  // Read the new blog articles
  const dfropeContent = readFileSync('/home/ubuntu/ai-tech-blog/dfrope_blog_en.md', 'utf-8');
  const isohcContent = readFileSync('/home/ubuntu/ai-tech-blog/isohc_blog_en.md', 'utf-8');

  // Update DFRoPE article
  await db.update(posts)
    .set({
      title: 'Dynamic Frequency RoPE: My Journey to Solving Long-Sequence Transformers',
      content: dfropeContent,
      excerpt: 'When I first started working with Transformers on long sequences, I quickly ran into a fundamental problem: how do we help these models understand position in sequences that are much longer than what they were trained on? In this post, I share how I developed Dynamic Frequency RoPE (DF-RoPE).',
    })
    .where(eq(posts.slug, 'dynamic-frequency-rope'));

  console.log('DFRoPE article updated!');

  // Update IsoHC article
  await db.update(posts)
    .set({
      title: 'IsoHC: How I Solved the Stability Crisis in Hyper-Connections',
      content: isohcContent,
      excerpt: 'When I first encountered Hyper-Connections, I was excited by its potential. But as I scaled up my experiments, training became unstable at depth. In this post, I share how I developed IsoHC—a new manifold constraint that preserves both global stream mean and ℓ₂ energy along residuals.',
    })
    .where(eq(posts.slug, 'isohc-stability-crisis'));

  console.log('IsoHC article inserted!');
  console.log('Articles updated successfully!');
}

updateArticles().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
