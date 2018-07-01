
const cacheName = 'version2';

const defaultContent = [
	'./',
	'./js/app.js',
	'./css/style.css',
	'./images/logo.png',
	'https://fonts.googleapis.com/css?family=Roboto+Mono:300',
	'https://cdnjs.cloudflare.com/ajax/libs/flexboxgrid/6.3.1/flexboxgrid.min.css',
]
//service worker insalling
self.addEventListener('install', function(e){
	console.log("[service worker]: Installed");

	e.waitUntil(
		caches.open(cacheName).then(function(cache){

			console.log("[service worker]: caching cache files");
			return cache.addAll(defaultContent);

		})
	);

});

//service worker activated
self.addEventListener('activate', function(e){
	console.log("[service worker]: activated");

	e.waitUntil(

		caches.keys().then((cacheNames) =>{
			console.log('[service worker] cache names', cacheNames);
			for(const thisCachName of cacheNames){
				if(thisCachName !== cacheName){
					console.log('deleting cache', thisCachName);
					caches.delete(thisCachName);
				}
			}
		})

	)
});

//fetch event
self.addEventListener('fetch', function(e){
	//console.log("[service worker]: Fetch", e.request.url)
	const url = new URL(e.request.url)
	//console.log(url.origin);
	if(url.origin == location.origin){
		if(url.pathname === '/'){
			e.respondWith(caches.match('/'))
		}
		e.respondWith(
			loadData(e.request)
		)
	}
	else if(url.origin == 'https://free.currencyconverterapi.com'){
		fetch(e.request).then(function(response){
			console.log('[service worker] fetching from other url', url.origin);
			return response;
		})
	}
	else
		e.respondWith(loadData(e.request))

});

function loadData(data){
	console.log('[service worker]: Loading.... Data');
	return caches.open(cacheName).then(function(cache){
		console.log('[service worker]:Opening cache -> is open');
		return cache.match(data.clone()).then(function(response){
			console.log(`[service worker] found in caches`);
			const networkResponse = fetch(data).then(function(res){
				cache.put(data, res.clone());
				return res;
			})

			return response || networkResponse;
		})
	})
}