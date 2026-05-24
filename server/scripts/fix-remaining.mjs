import mysql from 'mysql2/promise';

async function fixRemaining() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    const [posts] = await conn.execute('SELECT id, title, content FROM posts');
    
    for (const post of posts) {
      let content = post.content;
      const original = content;
      
      // Fix remaining single $ blocks that weren't caught
      // These might have different whitespace patterns
      // Pattern: \n$\n ... $\n or \n $\n ... $\n (with leading spaces)
      content = content.replace(/\n\s*\$\n([\s\S]*?)\n\s*\$\n/g, (match, formula) => {
        // Only convert if formula doesn't contain $ (to avoid matching inline formulas)
        if (!formula.includes('$$')) {
          return `\n$$\n${formula.trim()}\n$$\n`;
        }
        return match;
      });
      
      if (content !== original) {
        await conn.execute(
          'UPDATE posts SET content = ? WHERE id = ?',
          [content, post.id]
        );
        console.log(`✅ Fixed remaining issues in post ${post.id}: ${post.title}`);
      } else {
        console.log(`⏭️  No remaining issues in post ${post.id}`);
      }
    }
    
    // Verify final state
    const [verifyPosts] = await conn.execute('SELECT id, title, content FROM posts');
    for (const post of verifyPosts) {
      const content = post.content;
      const singleBlocks = (content.match(/\n\$\n/g) || []).length;
      const doubleBlocks = (content.match(/\n\$\$\n/g) || []).length;
      const inlineFormulas = (content.match(/\$[^$\n]+\$/g) || []).length;
      console.log(`\nPost ${post.id} final state:`);
      console.log(`  Single $ blocks: ${singleBlocks}`);
      console.log(`  Double $$ blocks: ${doubleBlocks / 2} formulas`);
      console.log(`  Inline formulas: ${inlineFormulas}`);
    }
    
    console.log('\n✅ All done!');
  } finally {
    await conn.end();
  }
}

fixRemaining();
