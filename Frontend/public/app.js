const REACT_APP_API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

(() => {
    // Get API base URL from environment or set a default
    const getApiBaseUrl = () => {
        // Check if we have a global variable (from webpack or similar)
        if (typeof REACT_APP_API_BASE_URL !== 'undefined') {
            return REACT_APP_API_BASE_URL;
        }
        
        // Try some bundlers do this)
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
        // Update realtor headshot
        const headshot = document.getElementById('realtor-headshot');
        if (headshot && realtorData.realtorHeadshot) {
            headshot.src = realtorData.realtorHeadshot;
            headshot.alt = `${realtorData.firstName} ${realtorData.lastName}`;
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