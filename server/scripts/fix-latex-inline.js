import "dotenv/config";
import postgres from "postgres";

async function fixLatexInline() {
  const sql = postgres(process.env.DATABASE_URL, { prepare: false });
  
  try {
    const posts = await sql`SELECT id, title, content FROM posts`;
    
    for (const post of posts) {
      let content = post.content;
      let modified = false;
      
      // 修复问题1：单个变量独占一行的问题
      // 例如：text\n$X$\ntext -> text $X$ text
      // 但要保留真正的块级公式（$$...$$独占一行）
      
      // 先标记块级公式，避免误修改
      const blockFormulas = [];
      content = content.replace(/\n\$\$([\s\S]*?)\$\$\n/g, (match) => {
        const placeholder = `__BLOCK_FORMULA_${blockFormulas.length}__`;
        blockFormulas.push(match);
        return placeholder;
      });
      
      // 修复单个变量独占一行的问题
      // 匹配模式：前面有文字，然后换行，然后是简短的行内公式（单个变量或简短表达式），然后换行
      content = content.replace(/([^\n])\n(\$[A-Za-z_][A-Za-z0-9_]*\$)\n/g, '$1 $2 ');
      content = content.replace(/([^\n])\n(\$[A-Za-z_][A-Za-z0-9_]*\^?[A-Za-z0-9_]*\$)\n/g, '$1 $2 ');
      
      // 修复 "if $X$ (i.e.," 这种情况中间多余的换行
      content = content.replace(/if\s+\n(\$[^$]+\$)\s+\n\(/g, 'if $1 (');
      
      // 修复 "Specifically, if $X$ (i.e.," 格式
      content = content.replace(/Specifically,\s+if\s+\n(\$[^$]+\$)\s+\n\(/g, 'Specifically, if $1 (');
      
      // 修复 "For general $H$ , the" 这种情况
      content = content.replace(/For\s+general\s+\n(\$[^$]+\$)\s+\n,/g, 'For general $1,');
      
      // 修复 "a matrix $H$ that:" 格式
      content = content.replace(/matrix\s+\n(\$[^$]+\$)\s+\nthat/g, 'matrix $1 that');
      
      // 修复 "means $H$ must be" 格式
      content = content.replace(/means\s+\n(\$[^$]+\$)\s+\nmust/g, 'means $1 must');
      
      // 恢复块级公式
      blockFormulas.forEach((formula, i) => {
        content = content.replace(`__BLOCK_FORMULA_${i}__`, formula);
      });
      
      if (content !== post.content) {
        modified = true;
        await sql`UPDATE posts SET content = ${content}, updated_at = now() WHERE id = ${post.id}`;
        console.log(`✅ Fixed inline LaTeX in post ${post.id}: ${post.title}`);
      } else {
        console.log(`⏭️  No changes needed for post ${post.id}: ${post.title}`);
      }
    }
    
    console.log('\n✅ All posts processed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

fixLatexInline();
