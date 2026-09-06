'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../dist');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8','.svg':'image/svg+xml'};
function handler(req,res){
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end('Bad request');return;}
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
 const file=path.resolve(root,'.'+pathname);
 let target=file;
 if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 if(pathname.split('/').some(p=>p.startsWith('.')||p==='_headers')){res.writeHead(404);res.end('Not found');return;}
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory()){
  if(pathname!=='/'&&pathname.endsWith('/')){res.writeHead(308,{Location:pathname.slice(0,-1)});res.end();return;}
  target=path.join(file,'index.html');
 }
 const found=fs.existsSync(target)&&fs.statSync(target).isFile();
 if(!found)target=path.join(root,'404.html');
 res.writeHead(found?200:404,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
 if(req.method==='HEAD'){res.end();return;}
 fs.createReadStream(target).on('error',()=>res.destroy()).pipe(res);
}
if(require.main===module){const port=Number(process.env.PORT||8766);http.createServer(handler).listen(port,'127.0.0.1',()=>console.log(`DevKit: http://127.0.0.1:${port}`));}
module.exports={handler};
