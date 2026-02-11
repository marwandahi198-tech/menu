(function () {
  var STATUS = document.getElementById('status');
  var HELP = document.getElementById('help');

  function setStatus(msg, kind) {
    if (!STATUS) return;
    STATUS.textContent = msg;
    STATUS.classList.remove('ok', 'error');
    if (kind) STATUS.classList.add(kind);
  }

  function getBasePath() {
    var script = document.currentScript;
    if (script && script.src) {
      try {
        var path = new URL(script.src).pathname;
        return path.replace(/\/[^/]*$/, '') || '/';
      } catch (_e) {}
    }
    var parts = window.location.pathname.split('/').filter(Boolean);
    if (window.location.hostname.endsWith('github.io') && parts.length > 0) {
      return '/' + parts[0];
    }
    return '/';
  }

  function normalizeBaseUrl(value) {
    var raw = String(value || '').trim();
    if (!raw) return '';
    if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
    try {
      var parsed = new URL(raw);
      if (!/^https?:$/i.test(parsed.protocol)) return '';
      return parsed.origin;
    } catch (_e) {
      return '';
    }
  }

  function normalizeAbsoluteUrl(value) {
    var raw = String(value || '').trim();
    if (!raw) return '';
    try {
      var parsed = new URL(raw);
      if (!/^https?:$/i.test(parsed.protocol)) return '';
      return parsed.toString();
    } catch (_e) {
      return '';
    }
  }

  function normalizeTableRef(value) {
    var raw = String(value || '').trim().toLowerCase().replace(/\s+/g, '');
    if (!raw) return '';
    if (/^t\d+$/.test(raw)) return raw;
    if (/^\d+$/.test(raw)) return 't' + raw;
    return raw;
  }

  function resolveRoute(basePath) {
    var pathname = window.location.pathname || '/';
    var routePath = pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname;
    var parts = routePath.split('/').filter(Boolean);

    if (parts.length === 0) return null;

    var kind = parts[0];
    var tableRef = '';

    if ((kind === 'menu' || kind === 'bill' || kind === 'qr') && parts[1]) {
      tableRef = normalizeTableRef(parts[1]);
      return { kind: kind, tableRef: tableRef };
    }

    if (/^(t\d+|\d+)$/.test(kind)) {
      tableRef = normalizeTableRef(kind);
      return { kind: 'menu', tableRef: tableRef };
    }

    return null;
  }

  function buildTargetPath(route) {
    if (!route || !route.tableRef) return '';
    if (route.kind === 'bill') return '/bill/' + encodeURIComponent(route.tableRef);
    if (route.kind === 'qr') return '/qr/' + encodeURIComponent(route.tableRef);
    return '/menu/' + encodeURIComponent(route.tableRef);
  }

  async function readConfig(basePath) {
    try {
      var response = await fetch(basePath.replace(/\/$/, '') + '/config.json', { cache: 'no-store' });
      if (!response.ok) return {};
      return await response.json();
    } catch (_e) {
      return {};
    }
  }

  function sameUrl(a, b) {
    return String(a || '').replace(/\/?$/, '') === String(b || '').replace(/\/?$/, '');
  }

  async function run() {
    var basePath = getBasePath();
    var route = resolveRoute(basePath);
    if (!route) {
      setStatus('No table route detected. Open a link like /menu/t5 or /bill/t5', 'error');
      if (HELP) HELP.hidden = false;
      return;
    }

    var targetPath = buildTargetPath(route);
    var search = new URLSearchParams(window.location.search || '');

    var directTarget = normalizeAbsoluteUrl(search.get('target'));
    if (directTarget) {
      try {
        var directParsed = new URL(directTarget);
        var rememberedBase = normalizeBaseUrl(directParsed.origin);
        if (rememberedBase) {
          window.localStorage.setItem('menu_redirect_target_base', rememberedBase);
        }
      } catch (_e) {}
      setStatus('Redirecting using direct target...', 'ok');
      if (!sameUrl(directTarget, window.location.href)) {
        window.location.replace(directTarget);
        return;
      }
    }

    var config = await readConfig(basePath);
    var queryBase = normalizeBaseUrl(search.get('base'));
    var configBase = normalizeBaseUrl(config.targetBase);
    var storedBase = normalizeBaseUrl(window.localStorage.getItem('menu_redirect_target_base'));

    var setBase = normalizeBaseUrl(search.get('set_base'));
    if (setBase) {
      window.localStorage.setItem('menu_redirect_target_base', setBase);
      storedBase = setBase;
    }
    if (search.get('clear_base') === '1') {
      window.localStorage.removeItem('menu_redirect_target_base');
      storedBase = '';
    }

    var selectedBase = queryBase || configBase || storedBase;
    if (!selectedBase) {
      setStatus('Missing redirect target. Set targetBase in config.json or use ?target=...', 'error');
      if (HELP) HELP.hidden = false;
      return;
    }

    var targetUrl = selectedBase.replace(/\/+$/, '') + targetPath;

    if (sameUrl(targetUrl, window.location.href)) {
      setStatus('Target matches current URL. Redirect canceled.', 'error');
      if (HELP) HELP.hidden = false;
      return;
    }

    setStatus('Redirecting to: ' + targetUrl, 'ok');
    window.location.replace(targetUrl);
  }

  run();
})();
