import mysql from 'mysql2/promise';

async function fixBlockFormulas() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    const [posts] = await conn.execute('SELECT id, title, content FROM posts');
    
    for (const post of posts) {
      let content = post.content;
      const original = content;
      
      // Convert block formulas from $...$ (on own lines) to $$...$$
      // Pattern: \n\n$\n...formula...\n$\n\n  ->  \n\n$$\n...formula...\n$$\n\n
      // We need to be careful not to match inline $...$ formulas
      
      // Match: newline + $ + newline + content + newline + $ + newline
      content = content.replace(/\n\$\n((?:[^$]|\$(?!\n))*?)\n\$\n/g, (match, formula) => {
        return `\n$$\n${formula}\n$$\n`;
      });
      
      if (content !== original) {
        await conn.execute(
          'UPDATE posts SET content = ? WHERE id = ?',
          [content, post.id]
        );
        
        const doubleDollarCount = (content.match(/\n\$\$\n/g) || []).length;
        const singleDollarBlockCount = (content.match(/\n\$\n/g) || []).length;
        console.log(`✅ Fixed post ${post.id}: ${post.title}`);
        console.log(`   $$ blocks: ${doubleDollarCount / 2}, remaining $ blocks: ${singleDollarBlockCount / 2}`);
        
        // Show a sample block formula
        const sampleIdx = content.indexOf('\n$$\n');
        if (sampleIdx >= 0) {
          const endIdx = content.indexOf('\n$$\n', sampleIdx + 4);
          if (endIdx >= 0) {
            console.log(`   Sample block formula: ${content.substring(sampleIdx, endIdx + 4).substring(0, 100)}`);
          }
        }
      } else {
        console.log(`⏭️  No changes for post ${post.id}`);
      }
    }
    
    console.log('\n✅ All done!');
  } finally {
    await conn.end();
  }
}

fixBlockFormulas();
