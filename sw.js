
const CACHE='kovo-shell-ec39da5208dfa9a738402ca5d792f131df6b14dc';
const ASSETS=["/kovo/","/kovo/index.html","/kovo/icon.svg","/kovo/manifest.json","/kovo/assets/index-CLZawMJy.js","/kovo/assets/index-KAMF173d.css"];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('kovo-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith('/kovo/'))return;
 // Serve the complete versioned shell together. Updates activate after old tabs close.
 const cachedAsset=path=>caches.open(CACHE).then(cache=>cache.match(path,{ignoreVary:true}));
 if(event.request.mode==='navigate')event.respondWith(cachedAsset('/kovo/index.html').then(cached=>cached||fetch(event.request)));
 else if(ASSETS.includes(url.pathname))event.respondWith(cachedAsset(url.pathname).then(cached=>cached||fetch(event.request)));
});
