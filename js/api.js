// js/api.js
const API_BASE = 'http://localhost:3000';

function getToken(){ return localStorage.getItem('token') || ''; }
function setToken(t){ localStorage.setItem('token', t); }
function clearToken(){ localStorage.removeItem('token'); }

async function apiGet(path, auth=false){
  const headers = { 'Accept':'application/json' };
  if(auth){ const t=getToken(); if(t) headers.Authorization='Bearer '+t; }
  const r = await fetch(API_BASE+path, { headers });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}
async function apiPost(path, data={}, auth=false){
  const headers = { 'Content-Type':'application/json','Accept':'application/json' };
  if(auth){ const t=getToken(); if(t) headers.Authorization='Bearer '+t; }
  const r = await fetch(API_BASE+path, { method:'POST', headers, body: JSON.stringify(data) });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}
async function apiPatch(path, data={}, auth=false){
  const headers = { 'Content-Type':'application/json','Accept':'application/json' };
  if(auth){ const t=getToken(); if(t) headers.Authorization='Bearer '+t; }
  const r = await fetch(API_BASE+path, { method:'PATCH', headers, body: JSON.stringify(data) });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}
