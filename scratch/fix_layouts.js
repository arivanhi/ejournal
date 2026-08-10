const fs = require('fs');
const path = require('path');

const files = [
    'd:/smanda-ej/ejournal-sman2/app/admin/layout.tsx',
    'd:/smanda-ej/ejournal-sman2/app/pimpinan/layout.tsx',
    'd:/smanda-ej/ejournal-sman2/app/teacher/layout.tsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Change import
    content = content.replace(/import \{ authOptions \} from "@\/app\/api\/auth\/\[\.\.\.nextauth\]\/route";/, 'import { authOptions } from "@/lib/authOptions";');
    
    // Change query to robust one
    content = content.replace(/const user = await prisma\.user\.findFirst\(\{\s*where: \{ username: \(session\.user as any\)\.username \|\| "" \},\s*\}\);/, 
        `const sessionValue = (session.user as any).username || session.user.name || "";
	const user = await prisma.user.findFirst({
		where: { OR: [{ username: sessionValue }, { nama: sessionValue }] },
	});`);
    
    fs.writeFileSync(file, content);
    console.log(`Processed ${file}`);
});

// Also fix app/page.tsx
const pageFile = 'd:/smanda-ej/ejournal-sman2/app/page.tsx';
let pageContent = fs.readFileSync(pageFile, 'utf8');
pageContent = pageContent.replace(/import \{ authOptions \} from "\.\/api\/auth\/\[\.\.\.nextauth\]\/route";/, 'import { authOptions } from "@/lib/authOptions";');
fs.writeFileSync(pageFile, pageContent);
console.log(`Processed ${pageFile}`);

