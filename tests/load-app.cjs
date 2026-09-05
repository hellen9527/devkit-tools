const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),path=require('node:path');
module.exports=function loadApp(){
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 const src=html.slice(html.indexOf('<script>\n"use strict";')+8,html.lastIndexOf('</script>'));
 const nodes=new Map();
 const get=s=>{if(!nodes.has(s))nodes.set(s,{_value:'',get value(){return this._value},set value(v){this._value=String(v)},textContent:'',innerHTML:'',checked:false,style:{},dataset:{},listeners:{},classList:{add(){},remove(){},toggle(){}},addEventListener(k,fn){this.listeners[k]=fn},setAttribute(){},appendChild(){}});return nodes.get(s)};
 const context={console,TextEncoder,TextDecoder,Uint8Array,Uint32Array,DataView,ArrayBuffer,atob,btoa,Date,setTimeout(){},clearTimeout(){},setInterval(){},navigator:{},location:{protocol:'https:',origin:'https://example.test',pathname:'/',hash:''},history:{pushState(){}},document:{querySelector:get,querySelectorAll:()=>[],getElementById:id=>get('#'+id),createElement:()=>get('created'+Math.random()),head:{appendChild(){}},addEventListener(){}},window:{crypto:crypto.webcrypto,addEventListener(){}},crypto:crypto.webcrypto};
 vm.createContext(context);vm.runInContext(src,context);
 return {get,run:s=>vm.runInContext(s,context,{timeout:5000})};
};
