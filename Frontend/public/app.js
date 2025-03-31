(() => {
    // Get API base URL from environment or set a default
    const getApiBaseUrl = () => {
        // Check if we have a global variable (set by the hosting environment)
        if (typeof window.REACT_APP_API_BASE_URL !== 'undefined') {
            return window.REACT_APP_API_BASE_URL;
        }
        
        // Try some bundlers do this
        if (window.env && window.env.REACT_APP_API_BASE_URL) {
            return window.env.REACT_APP_API_BASE_URL;
        }
        
        // Fallback to hardcoded value
        return 'https://bluebubbles-middleware.onrender.com';
    };

    const getAgentParameter = () => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('agent');
    };

    const agent = getAgentParameter();
    
    const callRealtorHandler = async (agentName) => {
        try {
            const backendUrl = getApiBaseUrl();
            console.log('Using backend URL:', backendUrl);
            
            const response = await fetch(`${backendUrl}/realtors?businessName=${encodeURIComponent(agentName)}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors', // Ensure CORS is enabled
            });
            
            if (!response.ok) {
                console.error('Error response:', await response.text());
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Realtor data:', data);
            
            // Update the page with realtor information
            updateRealtorInfo(data);
        } catch (error) {
            console.error('Error calling realtor handler:', error);
            showError(`Could not load realtor information: ${error.message}`);
        }
    };
    
    const updateRealtorInfo = (realtorData) => {
        // Log the entire data object for debugging
        console.log('Complete realtor data object:', realtorData);
        
        // Update realtor headshot
        const headshot = document.getElementById('realtor-headshot');
        if (headshot) {
            // Try various fields that might contain the image URL
            const headshotUrl = realtorData.source || realtorData.imageUrl || realtorData.avatarUrl || realtorData.profileImage;
            console.log('Trying headshot URL:', headshotUrl);
            
            // Check if headshot URL exists and is valid
            if (headshotUrl && isValidUrl(headshotUrl)) {
                console.log('Setting valid headshot URL:', headshotUrl);
                headshot.src = headshotUrl;
                headshot.alt = `${realtorData.firstName} ${realtorData.lastName}`;
                
                // Add error handling for image loading
                headshot.onerror = function() {
                    console.error('Failed to load headshot image:', headshotUrl);
                    // Revert to placeholder on error
                    headshot.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' font-size='18' text-anchor='middle' alignment-baseline='middle' font-family='Arial, sans-serif' fill='%23999999'%3ENo Image%3C/text%3E%3C/svg%3E";
                };
            } else {
                console.warn('Invalid or missing headshot URL');
            }
        }
        
        // Update realtor name
        const name = document.getElementById('realtor-name');
        if (name) {
            name.textContent = `${realtorData.firstName} ${realtorData.lastName}`;
        }
        
        // Update contact info
        const contactInfo = document.getElementById('contact-info');
        if (contactInfo) {
            let contactHtml = '';
            if (realtorData.email) {
                contactHtml += `<p class="text-gray-600 mb-2">Email: <a href="mailto:${realtorData.email}" class="text-blue-600 hover:underline">${realtorData.email}</a></p>`;
            }
            if (realtorData.phone) {
                contactHtml += `<p class="text-gray-600 mb-2">Phone: <a href="tel:${realtorData.phone}" class="text-blue-600 hover:underline">${realtorData.phone}</a></p>`;
            }
            contactInfo.innerHTML = contactHtml;
        }
        
        // Show the realtor card
        const realtorCard = document.getElementById('realtor-card');
        if (realtorCard) {
            realtorCard.classList.remove('hidden');
        }
        
        // Hide loading state
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.classList.add('hidden');
        }
    };
    
    // Helper function to validate URLs
    const isValidUrl = (string) => {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    };

    const showError = (message) => {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
        
        // Hide loading state
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.classList.add('hidden');
        }
    };

    if (agent) {
        // Show loading state
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.classList.remove('hidden');
        }
        
        callRealtorHandler(agent);
    } else {
        showError('No agent specified in URL parameters');
    }
})();