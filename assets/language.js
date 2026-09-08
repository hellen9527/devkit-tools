(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else {root.DevKitLanguage=api;api.initialize(root);}
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
  function initialize(env){
    const key='devkit-language';
    const remember=language=>{try{env.localStorage.setItem(key,language)}catch{ /* Preference storage is optional. */ }};
    env.document.querySelectorAll('[data-language]').forEach(link=>{
      link.addEventListener('click',()=>{
        const language=link.dataset.language;
        if(language==='en'||language==='zh')remember(language);
      });
    });
    // A shared tool URL always keeps its explicitly selected language.
    if(env.location.pathname!=='/')return;
    let saved;
    try{saved=env.localStorage.getItem(key)}catch{ /* Browsing still works without storage. */ }
    const explicit=new URLSearchParams(env.location.search).get('lang');
    if(explicit==='en'||explicit==='zh'){saved=explicit;remember(explicit);}
    const language=preferredLanguage({saved,languages:env.navigator.languages||[env.navigator.language]});
    if(language==='zh'){
      // Navigation is asynchronous; later defer scripts must skip this page.
      env.DevKitLanguageRedirectPending=true;
      env.location.replace('/zh'+env.location.search+env.location.hash);
    }
  }
  return {preferredLanguage,equivalentPath,initialize};
});
