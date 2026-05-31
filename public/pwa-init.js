(function() {
  var path = window.location.pathname;
  var hostname = window.location.hostname;

  var renderService = hostname.endsWith('.onrender.com') ? hostname.split('.')[0] : null;
  var appSuffix = renderService && renderService.includes('owner') ? 'owner'
                : renderService && renderService.includes('admin') ? 'admin'
                : renderService && renderService.includes('landing') ? 'landing'
                : renderService ? 'customer' : 'admin';

  if (path.startsWith('/owner')) {
    appSuffix = 'owner';
  } else if (path.match(/^\/r\//)) {
    appSuffix = 'customer';
  }

  var appName = 'FoodApp';
  if (appSuffix === 'owner') {
    appName = 'Owner Panel';
  } else if (appSuffix === 'customer' && path.match(/\/r\/([^/]+)/)) {
    var m = path.match(/\/r\/([^/]+)/);
    if (m) appName = m[1].charAt(0).toUpperCase() + m[1].slice(1).replace(/-/g, ' ');
  } else if (appSuffix === 'admin' && !renderService) {
    var host = hostname.split('.');
    if (host.length >= 3 && host[0] !== 'www' && host[0] !== 'admin' && host[0] !== 'owner') {
      appName = host[0].charAt(0).toUpperCase() + host[0].slice(1).replace(/-/g, ' ');
    }
  }

  var link = document.createElement('link');
  link.rel = 'manifest';
  link.href = '/manifest-' + appSuffix + '.json';
  document.head.appendChild(link);

  document.title = appName + ' - Food Ordering';
  var mt = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (mt) mt.content = appName;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw-' + appSuffix + '.js', { scope: '/' }).then(
        function(r) { console.log('SW registered:', r.scope); },
        function(e) { console.log('SW failed:', e); }
      );
    });
  }
})();
