(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else {
    root.DevKitAnalytics=api;
    api.initialize(root,{measurementId:root.document.currentScript?.dataset.measurementId});
  }
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  const origin='https://tools.fategenie.com';
  const tools=['timestamp','cron','json','curl','url','base64','html-entity','color','regex','hash','jwt','cidr','http-status','uuid'];
  // These are clicks, not claims that a conversion succeeded. No field contents
  // or arbitrary dataset/text values are read, even when an operation fails.
  const actions=new Map([
    ['ts-now',['timestamp','use_now']],
    ['json-format',['json','format']],['json-minify',['json','minify']],['json-validate',['json','validate']],
    ['url-enc',['url','encode']],['url-dec',['url','decode']],
    ['b64-enc',['base64','encode']],['b64-dec',['base64','decode']],
    ['ent-enc',['html-entity','encode']],['ent-dec',['html-entity','decode']],
    ['jwt-decode',['jwt','decode']],['rx-test',['regex','test']],
    ['uuid-gen1',['uuid','generate']],['uuid-gen5',['uuid','generate']],['uuid-gen10',['uuid','generate']],['uuid-gen100',['uuid','generate']],
    ['color-convert',['color','convert']],['curl-convert',['curl','convert']],
    ['cron-parse',['cron','parse']],['cidr-calc',['cidr','calculate']]
  ]);
  const initialized=new WeakSet();
  function initialize(env,config){
    if(env.DevKitLanguageRedirectPending)return;
    const id=config?.measurementId;
    if(typeof id!=='string'||!/^G-[A-Z0-9]+$/.test(id)||env.location.origin!==origin)return;
    const pathname=env.location.pathname.replace(/\/$/,'')||'/';
    const language=pathname==='/zh'||pathname.startsWith('/zh/')?'zh':'en';
    const route=language==='zh'?pathname.slice(3)||'/':pathname;
    const page=route==='/'?'home':route.slice(1);
    if(!['home','about','privacy',...tools].includes(page)||env.document.body.dataset.page==='404'||initialized.has(env))return;
    initialized.add(env);
    const doc=env.document;
    const key='devkit-analytics-consent';
    const disabled='ga-disable-'+id;
    const cookiePrefix='devkit_analytics_'+id.slice(2);
    const denied={analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'};
    const panel=doc.getElementById('analytics-consent');
    const preferences=doc.getElementById('analytics-preferences');
    const allow=doc.getElementById('analytics-allow');
    const withdraw=doc.getElementById('analytics-withdraw');
    let choice,loaded=false,pageViewed=false,returnFocus;
    try{choice=env.localStorage.getItem(key)}catch{ /* Storage is optional. */ }
    if(choice!=='granted'&&choice!=='denied')choice=null;
    env[disabled]=true;
    env.dataLayer=env.dataLayer||[];
    env.gtag=function(){env.dataLayer.push(arguments)};
    const gtag=env.gtag;
    // This queue is local only. In basic consent mode no Google script exists
    // until a current or previously saved explicit grant is present.
    gtag('consent','default',denied);
    const remember=value=>{try{env.localStorage.setItem(key,value)}catch{ /* Tools still work. */ }};
    const show=(visible,focus=false)=>{
      if(panel)panel.hidden=!visible;
      if(withdraw)withdraw.hidden=choice!=='granted';
      if(visible&&focus){returnFocus=doc.activeElement;allow?.focus()}
      if(!visible&&returnFocus){returnFocus.focus();returnFocus=null}
    };
    const clearCookies=()=>{
      // Explicit cookie_domain/path and a unique prefix isolate this property.
      // Do not delete generic _ga cookies, language preference or other storage.
      for(const name of [cookiePrefix+'_ga',cookiePrefix+'_ga_'+id.slice(2)]){
        try{doc.cookie=name+'=; Max-Age=0; Path=/; Domain=tools.fategenie.com; Secure; SameSite=Lax'}catch{ /* Cookies may be disabled. */ }
      }
    };
    function deny(persist=true){
      choice='denied';env[disabled]=true;
      if(persist)remember(choice);
      // Disable first so updating an already-loaded tag cannot send events.
      if(loaded)gtag('consent','update',{...denied});
      clearCookies();show(false);
    }
    function grant(persist=true){
      if(choice==='granted'&&loaded){show(false);return}
      choice='granted';env[disabled]=false;
      if(persist)remember(choice);
      gtag('consent','update',{...denied,analytics_storage:'granted'});
      if(!loaded){
        let referrer='';
        try{const url=new URL(doc.referrer);if(url.protocol==='https:'||url.protocol==='http:')referrer=url.origin}catch{ /* Empty or invalid referrer. */ }
        gtag('js',new Date());
        gtag('config',id,{
          send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,
          page_location:origin+pathname,page_referrer:referrer,page_title:'DevKit / '+language+' / '+page,
          cookie_prefix:cookiePrefix,cookie_domain:'tools.fategenie.com',cookie_path:'/',
          cookie_flags:'SameSite=Lax;Secure'
        });
        if(!pageViewed){gtag('event','page_view',{interface_language:language});pageViewed=true}
        const script=doc.createElement('script');script.async=true;script.referrerPolicy='origin';
        script.src='https://www.googletagmanager.com/gtag/js?id='+id;
        loaded=true;doc.head.appendChild(script);
      }
      show(false);
    }
    preferences?.addEventListener('click',()=>show(true,true));
    allow?.addEventListener('click',()=>grant());
    doc.getElementById('analytics-reject')?.addEventListener('click',()=>deny());
    withdraw?.addEventListener('click',()=>deny());
    doc.getElementById('analytics-close')?.addEventListener('click',()=>show(false));
    panel?.addEventListener('keydown',event=>{if(event.key==='Escape')show(false)});
    doc.addEventListener('click',event=>{
      if(choice!=='granted'||env[disabled])return;
      const button=event.target?.closest?.('button[id]');
      const action=actions.get(button?.id);
      if(!action||action[0]!==page)return;
      gtag('event','tool_action',{tool_id:action[0],action:action[1],interface_language:language});
    });
    env.addEventListener('storage',event=>{
      // A withdrawal or cleared storage in another tab must also stop this tab.
      if((event.key===key&&event.newValue!=='granted')||event.key===null)deny(false);
    });
    if(preferences)preferences.hidden=false;
    if(choice==='granted')grant(false);else show(choice===null);
  }
  return {initialize};
});
