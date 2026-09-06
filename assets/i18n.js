/* Explicit UI translations only. Tool inputs and computed data never pass through this module. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.DevKitI18n = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  const isChinese = () => /^zh(?:-|$)/i.test(typeof document !== 'undefined' ? document.documentElement?.lang || '' : '');
  const dictionary = () => root.DEVKIT_LOCALE || {};
  function translate(key, ...args) {
    const ui = dictionary().ui || {};
    const template = isChinese() && Object.hasOwn(ui, key) ? ui[key] : key;
    return template.replace(/\{(\d+)\}/g, (match, n) => n < args.length ? String(args[n]) : match);
  }
  function formatError(error, context) {
    const message = String(error?.message ?? error);
    if (!isChinese()) return message;
    if (Object.hasOwn(dictionary().ui || {}, message)) return translate(message);
    const claim = message.match(/^(exp|nbf|iat) must be a valid numeric timestamp\.$/);
    if (claim) return translate('{0} must be a valid numeric timestamp.', claim[1]);
    return translate({json:'Invalid JSON syntax.',jwt:'Invalid JWT encoding or JSON content.',regex:'Invalid regular expression or flags.',url:'Invalid percent encoding.',base64:'Invalid Base64 or UTF-8 text.'}[context] || 'Operation failed. Check the input.');
  }
  function relativeTime(diff, quantity, unit, fallback) {
    if (!isChinese()) return fallback;
    const name = {year:'年',month:'个月',day:'天',hour:'小时',minute:'分钟',second:'秒'}[unit];
    return quantity + ' ' + name + (diff < 0 ? '前' : '后');
  }
  function cronExplain(f, fallback) {
    if (!isChinese()) return fallback;
    const set = values => values.join('、');
    const days = [...new Set(f.dow.map(d => d % 7))];
    const time = f.min.length === 60 && f.hour.length === 24 ? '每分钟' :
      f.min.length === 1 && f.hour.length === 1 ? '在 '+String(f.hour[0]).padStart(2,'0')+':'+String(f.min[0]).padStart(2,'0') :
      '在 '+set(f.hour)+' 时的第 '+set(f.min)+' 分钟';
    const dom = '每月 '+set(f.dom)+' 日', dow = days.map(d => ['周日','周一','周二','周三','周四','周五','周六'][d]).join('、');
    let date;
    if (f.domStar && f.dowStar && f.dom.length === 31 && days.length === 7) date = '每天';
    else if (f.domStar || f.dowStar) date = [f.dom.length < 31 ? dom : '',days.length < 7 ? dow : ''].filter(Boolean).join(' 且 ') || '每天';
    else date = dom+' 或 '+dow;
    return time+' · '+date+(f.mon.length < 12 ? ' · '+set(f.mon)+' 月' : '');
  }
  function httpDescription(code, fallback) {
    return isChinese() ? dictionary().http?.[code] || fallback : fallback;
  }
  return {translate,formatError,relativeTime,cronExplain,httpDescription,locale:()=>isChinese()?'zh-CN':'en-US'};
});
