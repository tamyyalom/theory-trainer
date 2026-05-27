/* Offline-friendly cache for static question/theory JSON (best-effort). */
const CACHE = 'theory-trainer-data-v1'
const DATA_URLS = ['/data/questions.json', '/data/theory.json']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(DATA_URLS))
      .then(() => self.skipWaiting())
      .catch(() => {}),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (!DATA_URLS.includes(url.pathname)) return

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      try {
        const res = await fetch(event.request)
        if (res.ok) await cache.put(event.request, res.clone())
        return res
      } catch {
        const cached = await cache.match(event.request)
        if (cached) return cached
        throw new Error('offline')
      }
    }),
  )
})
