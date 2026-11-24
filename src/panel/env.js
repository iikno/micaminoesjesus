// What kind of device/browser this is, from the user agent. Pure so it can be tested.
export function detectEnv(ua = '', { standalone = false, touch = 0, platform = '' } = {}) {
  const ios = /iPhone|iPad|iPod/.test(ua) || (platform === 'MacIntel' && touch > 1); // iPadOS reports a Mac
  // Browsers opened inside another app (Facebook, Instagram, WhatsApp, Gmail...) cannot install; on iOS they lack "Safari/".
  const inApp = /FBAN|FBAV|Instagram|Line\/|MicroMessenger|Twitter|Snapchat|TikTok|GSA\/|WhatsApp|; wv\)/i.test(ua) || (ios && !/Safari\//.test(ua));
  return { ios, android: /Android/.test(ua), inApp, standalone };
}
