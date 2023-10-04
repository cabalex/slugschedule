const addResourcesToCache = async (resources) => {
    const cache = await caches.open("v1");
    await cache.addAll(resources);
  };
  
self.addEventListener("install", (event) => {
    event.waitUntil(
      addResourcesToCache([
        "/",
        "/index.html",
        "db/db.yaucsccs"
      ]),
    );
});

self.addEventListener("fetch", (event) => {
    event.respondWith(/* custom content goes here */);
});
  