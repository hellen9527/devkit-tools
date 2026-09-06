(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DevKitLanguage=api;
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  function preferredLanguage({saved,languages=[]}={}){
    if(saved==='en'||saved==='zh')return saved;
    const first=Array.isArray(languages)?languages.find(v=>typeof v==='string'&&v.trim()):'';
    return /^zh(?:-|$)/i.test((first||'').trim())?'zh':'en';
  }
  function equivalentPath(path,language){
    if(language!=='en'&&language!=='zh')throw new Error('Unsupported language');
    const clean=path.replace(/\/+$/,'')||'/';
    const suffix=clean==='/zh'?'':clean.startsWith('/zh/')?clean.slice(3):clean==='/'?'':clean;
    return language==='zh'?'/zh'+suffix:suffix||'/';
  }
  return {preferredLanguage,equivalentPath};
});
