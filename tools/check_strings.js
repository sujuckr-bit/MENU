const fs = require('fs');
const s = fs.readFileSync('c:/Users/DELL/Desktop/MENU/script.js','utf8');
function findUnclosed(src){
  let inStr = null; let escaped=false; let line=1; for(let i=0;i<src.length;i++){ const ch=src[i]; if(ch==='\n') line++; if(inStr){ if(escaped){ escaped=false; continue;} if(ch==='\\') { escaped=true; continue;} if(ch===inStr){ return null; } if(inStr==='`' && ch==='$' && src[i+1]==='{'){ // template expression start, skip until matching }
      // skip expression
      i+=2; let depth=0; let inExprStr=null; while(i<src.length){ const c=src[i]; if(c==='\n'){} if(inExprStr){ if(c==='\\'){ i++; continue;} if(c===inExprStr){ inExprStr=null; } i++; continue;} if(c==='"'||c==="'"||c==='`'){ inExprStr=c; i++; continue;} if(c==='{') depth++; else if(c==='}'){ if(depth===0) break; depth--; } i++; }
    }
  } else {
    if(ch==='"' || ch==="'" || ch==='`'){ inStr=ch; }
    if(ch==='\\'){} }
  }
  return {error:'Unclosed string', type: inStr, line};
}
const res=findUnclosed(s);
if(!res) console.log('NO_UNCLOSED_STRINGS'); else console.log(res);
