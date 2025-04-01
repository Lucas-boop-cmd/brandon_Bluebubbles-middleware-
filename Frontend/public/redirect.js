// Ultra-aggressive path-to-query redirect script
(function() {
    // Function to handle the path-to-query conversion
    function handlePathRedirect() {
        try {
            const url = new URL(window.location.href);
            const pathSegments = url.pathname.split("/").filter(Boolean);
            
            if (pathSegments.length >= 1 && url.pathname !== '/') {
                const lo = pathSegments[0];
                console.log('Path redirect: Segment detected:', lo);
                
                const params = new URLSearchParams(window.location.search);
                if (!params.has('lo')) {
                    params.set('lo', lo);
                    const newUrl = `${url.origin}/?${params.toString()}`;
                    console.log('Path redirect: Redirecting to', newUrl);
                    window.location.replace(newUrl);
                    return true;
                }
            }
            return false;
        } catch (e) {
            console.error('Path redirect failed:', e);
            return false;
        }
    }

    // Execute immediately on script load
    console.log('Path redirect: Script loaded');
    if (handlePathRedirect()) return;
    
    // Also attach to document ready events
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Path redirect: DOM content loaded');
            handlePathRedirect();
        });
    }
    
    // Also attach to window load event
    window.addEventListener('load', function() {
        console.log('Path redirect: Window loaded');
        handlePathRedirect();
    });
    
    // Set a timeout to check again shortly after page load
    setTimeout(function() {
        console.log('Path redirect: Timeout check');
        handlePathRedirect();
    }, 100);
})();
