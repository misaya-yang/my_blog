import "dotenv/config";
import postgres from "postgres";

async function analyze() {
  const sql = postgres(process.env.DATABASE_URL, { prepare: false });
  const posts = await sql`SELECT id, title, content, view_count FROM posts`;
  
  for (const post of posts) {
    console.log(`\n=== Post ${post.id}: ${post.title} (views: ${post.view_count}) ===`);
    const content = post.content;
    
    // Check block formulas ($ on its own line)
    const blockFormulaPattern = /\n\$\n([\s\S]*?)\n\$\n/g;
    let match;
    let blockCount = 0;
    while ((match = blockFormulaPattern.exec(content)) !== null) {
      blockCount++;
      if (blockCount <= 3) {
        console.log(`Block formula ${blockCount}:`, JSON.stringify(match[1].substring(0, 80)));
      }
    }
    console.log(`Total block formulas: ${blockCount}`);
    
    // Check inline formulas
    const inlinePattern = /\$([^$\n]+)\$/g;
    let inlineCount = 0;
    const samples = [];
    while ((match = inlinePattern.exec(content)) !== null) {
      inlineCount++;
      if (inlineCount <= 5) {
        samples.push(match[0].substring(0, 60));
      }
    }
    console.log(`Total inline formulas: ${inlineCount}`);
    console.log('Sample inline formulas:', samples);
    
    // Check for double backslashes (which would render as literal backslash)
    const doubleBackslash = content.includes('\\\\');
    console.log(`Contains double backslash: ${doubleBackslash}`);
    
    // Check for problematic patterns: formula on its own line within a list
    const listFormulaPattern = /^- (.+)\n(.+)\n(.+)$/gm;
    let listIssues = 0;
    while ((match = listFormulaPattern.exec(content)) !== null) {
      if (match[2].trim().startsWith('$') || match[2].trim() === 'in') {
        listIssues++;
        if (listIssues <= 3) {
          console.log(`List formula issue: "${match[0].substring(0, 100)}"`);
        }
      }
    }
    console.log(`List formula issues: ${listIssues}`);
  }
  
  await sql.end();
}

analyze();
