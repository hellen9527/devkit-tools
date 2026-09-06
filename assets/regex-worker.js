'use strict';
function matchRegex({pattern,flags,text}) {
  if(text.length>200000) throw new Error('Text is limited to 200,000 characters.');
  if(pattern.length>10000) throw new Error('Pattern is limited to 10,000 characters.');
  const re=new RegExp(pattern,flags), matches=[];
  let m,truncated=false;
  while((m=re.exec(text))!==null){
    if(matches.length===1000){truncated=true;break;}
    matches.push({index:m.index,text:m[0],groups:m.slice(1),named:m.groups || {}});
    if(!re.global)break;
    if(m[0].length===0){
      const i=re.lastIndex;
      re.lastIndex=i+((re.unicode || re.unicodeSets) && text.codePointAt(i)>0xffff?2:1);
    }
  }
  return {matches,truncated};
}
if(typeof module!=='undefined') module.exports={matchRegex};
if(typeof self!=='undefined')self.onmessage=({data})=>{
  try{self.postMessage({result:matchRegex(data)});}
  catch(error){self.postMessage({error:error.message});}
};
