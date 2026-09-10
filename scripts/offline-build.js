import { readdir, writeFile } from "node:fs/promises";
const assets = (await readdir("dist/assets")).map(
  (name) => `/kovo/assets/${name}`,
);
const version = process.env.GITHUB_SHA || Date.now().toString();
await writeFile("dist/version.json", JSON.stringify({ version }));
await writeFile(
  "dist/sw.js",
  `
const CACHE='kovo-shell-${version}';
const ASSETS=${JSON.stringify(["/kovo/", "/kovo/index.html", "/kovo/icon.svg", "/kovo/manifest.json", ...assets])};
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
`,
);
