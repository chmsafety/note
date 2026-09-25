/* note — 서비스 워커 (오프라인에서도 앱 화면이 열리게 해 줍니다)
   규칙
   1) 같은 주소(우리 서버)의 GET 요청만 다룹니다.
   2) 항상 인터넷을 먼저 시도하고(최신본 우선), 실패하면 저장해 둔 것을 보여줍니다.
   3) Supabase·구글 글꼴 등 바깥 주소는 손대지 않고 그대로 통과시킵니다. */

const VER   = 'v11';
const CACHE = 'note-' + VER;

const SHELL = [
  './',
  './index.html',
  './app.css?v=11',
  './app.js?v=11',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(SHELL.map(u => c.add(u).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  if (e.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.origin !== self.location.origin) return;      // 바깥 주소는 그대로
  if (url.pathname.indexOf('/note/') !== 0) return;      // 우리 앱 폴더 밖은 그대로

  e.respondWith((async () => {
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.ok && fresh.type === 'basic') {
        const c = await caches.open(CACHE);
        c.put(req, fresh.clone()).catch(() => {});
      }
      return fresh;
    } catch (_) {
      const hit = await caches.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === 'navigate') {
        const shell = await caches.match('./index.html', { ignoreSearch: true });
        if (shell) return shell;
      }
      return new Response('오프라인입니다. 인터넷에 연결한 뒤 다시 열어 주세요.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});
