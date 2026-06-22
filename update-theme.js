const fs = require('fs');
const files = [
  'e:/AlgoLib Deployment/algolib3.0/src/pages/userprofile/Profile.tsx',
  'e:/AlgoLib Deployment/algolib3.0/src/pages/userprofile/EditProfile.tsx',
  'e:/AlgoLib Deployment/algolib3.0/src/components/Community.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/bg-slate-50/g, 'bg-blue-50');
  content = content.replace(/bg-slate-100/g, 'bg-blue-100');
  content = content.replace(/bg-slate-200/g, 'bg-blue-200');
  content = content.replace(/border-slate-200/g, 'border-blue-200');
  content = content.replace(/border-slate-300/g, 'border-blue-300');
  content = content.replace(/text-slate-900/g, 'text-black');
  content = content.replace(/text-slate-800/g, 'text-black');
  content = content.replace(/text-slate-700/g, 'text-slate-900');
  content = content.replace(/text-slate-600/g, 'text-slate-800');
  content = content.replace(/text-slate-500/g, 'text-slate-700');
  content = content.replace(/text-slate-400/g, 'text-slate-600');
  
  // also change some generic light backgrounds
  content = content.replace(/bg-white(?=\s+dark:)/g, 'bg-sky-50');
  content = content.replace(/from-white(?=\s+dark:)/g, 'from-sky-50');
  content = content.replace(/to-white(?=\s+dark:)/g, 'to-sky-50');
  content = content.replace(/from-slate-50/g, 'from-blue-50');
  content = content.replace(/to-slate-100/g, 'to-blue-100');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated ' + file);
});
