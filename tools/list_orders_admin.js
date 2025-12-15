const http = require('http');
function req(opts, data){return new Promise((res,rej)=>{const r=http.request(opts,resp=>{let s=''; resp.on('data',c=>s+=c); resp.on('end',()=>res({status:resp.statusCode,headers:resp.headers,body:s}));}); r.on('error',rej); if(data) r.write(JSON.stringify(data)); r.end();});}

const adminPassword = process.env.TEST_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
if (!adminPassword) {
  console.error('ERROR: TEST_ADMIN_PASSWORD or ADMIN_PASSWORD environment variable not set');
  console.error('Usage: TEST_ADMIN_PASSWORD=your_password node list_orders_admin.js');
  process.exit(1);
}

(async()=>{try{const login=await req({hostname:'localhost',port:8000,path:'/api/login',method:'POST',headers:{'Content-Type':'application/json'}},{username:'admin',password:adminPassword}); console.log('LOGIN',login.status); const cookie=(login.headers['set-cookie']||[]).map(c=>c.split(';')[0]).join('; '); const list=await req({hostname:'localhost',port:8000,path:'/api/orders',method:'GET',headers:{'Cookie':cookie}}); console.log('LIST_STATUS', list.status); try{const orders=JSON.parse(list.body||'[]'); orders.forEach(o=>console.log('ID',o.id,'| buyerName:', o.buyerName || o.buyer || '(no name)')); }catch(e){ console.log('PARSE_ERR',list.body); } process.exit(0);}catch(e){ console.error('ERR',e.message); process.exit(1);} })();
