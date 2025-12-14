const fs = require('fs');
const s = fs.readFileSync('c:/Users/DELL/Desktop/MENU/script.js', 'utf8');
function findTryIssues(src){
  const issues = [];
  for(let i=0;i<src.length;i++){
    if(src.startsWith('try', i) && /\btry\b/.test(src.slice(i,i+5))){
      let j = i+3; while(j<src.length && /\s/.test(src[j])) j++;
      if(src[j] !== '{') continue;
      let depth = 0; let k = j; let inStr = null;
      for(;k<src.length;k++){
        const ch = src[k];
        if(inStr){ if(ch === inStr && src[k-1] !== '\\') inStr = null; continue; }
        if(ch === '"' || ch === "'" || ch === '`'){ inStr = ch; continue; }
        if(ch === '{') depth++; else if(ch === '}'){ depth--; if(depth === 0) break; }
      }
      if(k>=src.length){ issues.push({pos:i, reason:'unclosed try block (no matching } )'}); continue; }
      let m = k+1; while(m<src.length && /[\s\n\r\t]/.test(src[m])) m++;
      const next = src.slice(m,m+7);
      if(!next.startsWith('catch') && !next.startsWith('finally')){
        issues.push({pos:i, tryIndex:i, endIndex:k, following: src.slice(m,m+40)});
      }
    }
  }
  return issues;
}
const issues = findTryIssues(s);
if(issues.length === 0) {
  console.log('NO_ISSUES');
  process.exit(0);
} else {
  console.log('FOUND', issues.length, 'ISSUES');
  const it = issues[0];
  const before = s.slice(0,it.pos);
  const line = before.split(/\n/).length;
  console.log('First issue at pos', it.pos, 'approx line', line);
  console.log('Following text starts with:', JSON.stringify(it.following));
  console.log('Context around try:');
  const ctx = s.slice(Math.max(0,it.pos-200), Math.min(s.length, it.endIndex+200));
  console.log(ctx);
  process.exit(1);
}