/* Service Worker: hält die App offline verfügbar.
   Bei jeder Änderung an den Dateien die VERSION erhöhen. */
var VERSION = "kotoba-v7";
var DATEIEN = [
  "./",
  "./index.html",
  "./app.css",
  "./app.js",
  "./vokabeln.js",
  "./manifest.webmanifest",
  "./favicon.svg",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(VERSION)
      .then(function(c){ return c.addAll(DATEIEN); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(namen){
      return Promise.all(namen.map(function(n){
        return n === VERSION ? null : caches.delete(n);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

/* Eigene Dateien: erst Netz, dann Cache, damit Aktualisierungen ankommen.
   Alles Fremde (Schriften) unberührt lassen. */
self.addEventListener("fetch", function(e){
  var anfrage = e.request;
  if(anfrage.method !== "GET") return;
  if(new URL(anfrage.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(anfrage).then(function(antwort){
      if(antwort && antwort.status === 200 && antwort.type === "basic"){
        var kopie = antwort.clone();
        caches.open(VERSION).then(function(c){ c.put(anfrage, kopie); });
      }
      return antwort;
    }).catch(function(){
      return caches.match(anfrage).then(function(treffer){
        return treffer || caches.match("./index.html");
      });
    })
  );
});
