import "dotenv/config";
import postgres from "postgres";

async function fixLatexFormat() {
  const sql = postgres(process.env.DATABASE_URL, { prepare: false });
  
  try {
    const posts = await sql`SELECT id, title, content FROM posts`;
    
    for (const post of posts) {
      let content = post.content;
      const originalContent = content;
      
      // 步骤1：保护块级公式（$$...$$独占一行的）
      const blockFormulas = [];
      content = content.replace(/\n\$\$([\s\S]*?)\$\$\n/g, (match) => {
        const placeholder = `__BLOCK_FORMULA_${blockFormulas.length}__`;
        blockFormulas.push(match);
        return placeholder;
      });
      
      // 步骤2：修复列表项中的公式格式
      // 例如：- \n$X$\n is the -> - $X$ is the
      content = content.replace(/^([-*]\s+)\n(\$[^$\n]+\$)\n/gm, '$1$2 ');
      
      // 步骤3：修复段落中间的公式换行
      // 匹配：非换行字符 + 换行 + 公式 + 换行 + 非换行字符
      // 改为：非换行字符 + 空格 + 公式 + 空格 + 非换行字符
      content = content.replace(/([^\n])\n(\$[^$\n]+\$)\n([^\n])/g, '$1 $2 $3');
      
      // 步骤4：修复句首公式（换行 + 公式 + 换行 + 文字）
      content = content.replace(/\n(\$[^$\n]+\$)\n([a-zA-Z])/g, ' $1 $2');
      
      // 步骤5：修复句尾公式（文字 + 换行 + 公式 + 换行）
      content = content.replace(/([a-zA-Z,;:])\n(\$[^$\n]+\$)\n/g, '$1 $2 ');
      
      // 步骤6：清理多余的空格
      content = content.replace(/  +/g, ' ');
      
      // 步骤7：恢复块级公式
      blockFormulas.forEach((formula, i) => {
        content = content.replace(`__BLOCK_FORMULA_${i}__`, formula);
      });
      
      if (content !== originalContent) {
        await sql`UPDATE posts SET content = ${content}, updated_at = now() WHERE id = ${post.id}`;
        console.log(`✅ Fixed LaTeX format in post ${post.id}: ${post.title}`);
        
        // 显示修改的示例
        const changes = [];
        const lines = originalContent.split('\n');
        const newLines = content.split('\n');
        for (let i = 0; i < Math.min(lines.length, newLines.length); i++) {
          if (lines[i] !== newLines[i] && changes.length < 3) {
            changes.push({
              before: lines[i].substring(0, 100),
              after: newLines[i].substring(0, 100)
            });
          }
        }
        if (changes.length > 0) {
          console.log('  Sample changes:');
          changes.forEach((c, idx) => {
            console.log(`    ${idx + 1}. Before: "${c.before}"`);
            console.log(`       After:  "${c.after}"`);
          });
        }
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

fixLatexFormat();
