importScripts("/js/idb.js");
importScripts("/js/dbhelper.js");
importScripts("/js/workbox-sw.js");
let databaseOpen = idb.open("restaurant-db", 1);
var resCaches = ["restaurant-info", "restaurant-map-imgs-v1"];
self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open("restaurant-info").then(function(cache) {
      return cache.addAll([
        "/",
        "index.html",
        "restaurant.html",
        "js/main.js",
        "js/idb.js",
        "js/dbhelper.js",
        "/js/workbox-sw.js",
        "js/restaurant_info.js",
        "css/styles.css",
        "images/1-lg.jpg",
        "images/1-md.jpg",
        "images/1-sm.jpg",
        "images/2-lg.jpg",
        "images/2-md.jpg",
        "images/2-sm.jpg",
        "images/3-lg.jpg",
        "images/3-md.jpg",
        "images/3-sm.jpg",
        "images/4-lg.jpg",
        "images/4-md.jpg",
        "images/4-sm.jpg",
        "images/5-lg.jpg",
        "images/5-md.jpg",
        "images/5-sm.jpg",
        "images/6-lg.jpg",
        "images/6-md.jpg",
        "images/6-sm.jpg",
        "images/7-lg.jpg",
        "images/7-md.jpg",
        "images/7-sm.jpg",
        "images/8-lg.jpg",
        "images/8-md.jpg",
        "images/8-sm.jpg",
        "images/9-lg.jpg",
        "images/9-md.jpg",
        "images/9-sm.jpg",
        "images/10-lg.jpg",
        "images/10-md.jpg",
        "images/10-sm.jpg"
      ]);
    })
  );
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheAll) {
      return Promise.all(
        cacheAll
          .filter(function(cachesAll) {
            return (
              cachesAll.startsWith("restaurant") &&
              !resCaches.includes(cachesAll)
            );
          })
          .map(function(cachesAll) {
            return caches.delete(cachesAll);
          })
      );
    })
  );
});

workbox.routing.registerRoute(
  /.*(?:api|mapbox)\.com/,
  workbox.strategies.cacheFirst({
    cacheName: "restaurant-map-imgs",
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 2000,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 Days
      }),
      new workbox.cacheableResponse.Plugin({
        statuses: [0, 200]
      })
    ]
  })
);

workbox.routing.registerRoute(
  /.*(?:api|mapbox)\.com/,
  workbox.strategies.staleWhileRevalidate()
);

self.addEventListener("fetch", function(event) {
  event.respondWith(
    caches.open("restaurant-info").then(function(cache) {
      return cache
        .match(event.request, { ignoreSearch: true })
        .then(function(response) {
          var fetchPromise = fetch(event.request).then(function(
            networkResponse
          ) {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
          return response || fetchPromise;
        })
        .catch(function(err) {
          console.log("cache not available");
        });
    })
  );
});

self.addEventListener("sync", event => {
  if (event.tag === "ResFavSync") {
    event.waitUntil(DBHelper.handleOfflineRequests());
  }
});
