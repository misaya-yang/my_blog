import mysql from 'mysql2/promise';

async function fixLatex() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    const [posts] = await conn.execute('SELECT id, title, content FROM posts');
    
    for (const post of posts) {
      let content = post.content;
      const original = content;
      
      // Step 1: Fix double backslashes -> single backslashes
      // In the database, LaTeX commands are stored with \\\\ (escaped double backslash)
      // We need them to be \\ (single backslash) for remark-math to parse correctly
      content = content.replace(/\\\\/g, '\\');
      
      // Step 2: Fix block formulas - convert standalone $ blocks to $$ blocks
      // Pattern: \n$\n...formula...\n$\n  ->  \n$$\n...formula...\n$$\n
      content = content.replace(/\n\$\n([\s\S]*?)\n\$\n/g, '\n$$\n$1\n$$\n');
      
      // Step 3: Make sure inline formulas within list items stay inline
      // Pattern: - $formula$ text -> keep as is (already correct after step 1)
      
      if (content !== original) {
        await conn.execute(
          'UPDATE posts SET content = ? WHERE id = ?',
          [content, post.id]
        );
        console.log(`✅ Fixed post ${post.id}: ${post.title}`);
        
        // Verify the fix
        const doubleBackslash = content.includes('\\\\');
        const singleDollarBlocks = content.match(/\n\$\n/g);
        const doubleDollarBlocks = content.match(/\n\$\$\n/g);
        console.log(`   Double backslash remaining: ${doubleBackslash}`);
        console.log(`   Single $ blocks: ${singleDollarBlocks?.length || 0}`);
        console.log(`   Double $$ blocks: ${doubleDollarBlocks?.length || 0}`);
        
        // Show sample of fixed content
        const sampleStart = content.indexOf('where:');
        if (sampleStart >= 0) {
          console.log(`   Sample (list section):`);
          console.log(`   ${JSON.stringify(content.substring(sampleStart, sampleStart + 200))}`);
        }
      } else {
        console.log(`⏭️  No changes for post ${post.id}: ${post.title}`);
      }
    }
    
    console.log('\n✅ All posts processed!');
  } finally {
    await conn.end();
  }
}

fixLatex();
