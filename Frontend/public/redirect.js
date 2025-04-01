// Immediate path-to-query redirect script (to be included in HTML head)
(function() {
    try {
        const url = new URL(window.location.href);
        const pathSegments = url.pathname.split("/").filter(Boolean);
        
        if (pathSegments.length >= 1 && url.pathname !== '/') {
            const lo = pathSegments[0];
            
            const params = new URLSearchParams(window.location.search);
            if (!params.has('lo')) {
                params.set('lo', lo);
                window.location.replace(`${url.origin}/?${params.toString()}`);
            }
        }
    } catch (e) {
        console.error('Path redirect failed:', e);
    }
})();
