import React, {useEffect,useState} from 'react';
export default function OfflineStatus(){
 const [status,setStatus]=useState('Preparing offline app…');
 useEffect(()=>{
  let active=true;
  const show=text=>{if(active)setStatus(text);};
  if(!('serviceWorker' in navigator)){show('This browser cannot cache the app for offline reopening. Saved entries remain on this device.');return;}
  navigator.serviceWorker.register('/kovo/sw.js').then(registration=>{
   if(registration.active)show('Offline app ready on this device.');
   const worker=registration.installing || registration.waiting;
   if(worker)worker.addEventListener('statechange',()=>{
    if(worker.state==='activated')show('Offline app ready on this device.');
    if(worker.state==='installed')show('Offline app downloaded. Close and reopen Kovo to finish updating.');
    if(worker.state==='redundant')show('Offline app download failed. Reopen while connected and try again.');
   });
  }).catch(()=>show('Offline app cache unavailable in this browser. Reopen while connected.'));
  return()=>{active=false;};
 },[]);
 return <p className="small" role="status">{status}</p>;
}
