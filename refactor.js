const fs = require('fs');

const files = [
  'src/app/game/work/part-time/page.tsx',
  'src/app/game/work/manage/page.tsx',
  'src/app/game/work/education/page.tsx',
  'src/app/game/work/careers/page.tsx',
  'src/app/game/social/page.tsx',
  'src/app/game/shopping/vehicles/page.tsx',
  'src/app/game/shopping/page.tsx',
  'src/app/game/page.tsx',
  'src/app/game/business/page.tsx',
  'src/app/game/business/create/page.tsx',
  'src/app/game/assets/page.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    if (content.includes('alert(')) {
      if (!content.includes('useUIStore')) {
        content = content.replace("import { useRouter } from 'next/navigation';", "import { useRouter } from 'next/navigation';\nimport { useUIStore } from '@/features/ui/useUIStore';");
      }
      content = content.replace(/alert\((.*?)\);/g, "useUIStore.getState().showAlert($1);");
      content = content.replace(/alert\((.*?)\)/g, "useUIStore.getState().showAlert($1)");
      fs.writeFileSync(file, content);
      console.log('Updated alert in ' + file);
    }
  }
});
