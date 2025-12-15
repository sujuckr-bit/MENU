const http = require('http');
function req(options, data){
  return new Promise((resolve,reject)=>{
    const r = http.request(options, res=>{let s=''; res.on('data',c=>s+=c); res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:s}));});
    r.on('error', reject);
    if(data) r.write(JSON.stringify(data));
    r.end();
  });
}
(async()=>{
  try{
    // login
    const adminPassword = process.env.TEST_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      console.error('ERROR: TEST_ADMIN_PASSWORD or ADMIN_PASSWORD environment variable not set');
      console.error('Usage: TEST_ADMIN_PASSWORD=your_password node complete_programmatic_tester.js');
      process.exit(1);
    }
    const loginResp = await req({hostname:'localhost',port:8000,path:'/api/login',method:'POST',headers:{'Content-Type':'application/json'}}, {username:'admin',password:adminPassword});
    if(loginResp.status!==200){ console.error('LOGIN_FAILED',loginResp.status,loginResp.body); process.exit(1); }
    const cookie = (loginResp.headers['set-cookie']||[]).map(c=>c.split(';')[0]).join('; ');
    // list orders
    const list = await req({hostname:'localhost',port:8000,path:'/api/orders',method:'GET',headers:{'Cookie':cookie}});
    if(list.status!==200){ console.error('LIST_FAILED',list.status,list.body); process.exit(1); }
    const orders = JSON.parse(list.body||'[]');
    const target = orders.find(o => (o.buyerName||'').toLowerCase().includes('programmatic tester'));
    if(!target){ console.error('NOT_FOUND'); process.exit(2); }
    console.log('FOUND_ID', target.id);
    const comp = await req({hostname:'localhost',port:8000,path:`/api/orders/${target.id}/complete`,method:'POST',headers:{'Content-Type':'application/json','Cookie':cookie}}, {});
    console.log('COMPLETE_RESP', comp.status, comp.body);
    process.exit(0);
  }catch(e){ console.error('ERR',e && e.message); process.exit(1); }
})();
