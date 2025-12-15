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
    const login = { username: 'admin', password: 'admin123' };
    const loginResp = await req({ hostname: 'localhost', port: 8000, path: '/api/login', method: 'POST', headers: {'Content-Type':'application/json'} }, login);
    console.log('LOGIN', loginResp.status, loginResp.body);
    const setCookie = loginResp.headers['set-cookie'];
    if(!setCookie){ console.error('NO_COOKIE'); process.exit(1); }
    const cookie = setCookie.map(c=>c.split(';')[0]).join('; ');
    const id = 6;
    const compResp = await req({ hostname: 'localhost', port: 8000, path: `/api/orders/${id}/complete`, method: 'POST', headers: {'Content-Type':'application/json','Cookie':cookie} }, {});
    console.log('COMPLETE', compResp.status, compResp.body);
    process.exit(0);
  }catch(e){ console.error('ERR', e.message); process.exit(1); }
})();
