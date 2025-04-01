document.addEventListener('DOMContentLoaded', function() {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const agentParam = urlParams.get('agent');
    
    // Always show the default view
    document.getElementById('default-view').classList.remove('hidden');
    
    // If there's an agent parameter, also fetch and display agent information
    if (agentParam) {
        document.getElementById('loading').classList.remove('hidden');
        
        // Function to fetch agent data
        const fetchAgentData = async (agentName) => {
            try {
                // First, try to get the agent data from the server
                const response = await fetch(`/api/realtors?name=${encodeURIComponent(agentName)}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch realtor data');
                }
                
                const data = await response.json();
                
                // Check if we got valid agent data
                if (data && data.length > 0) {
                    return data[0]; // Return the first matching agent
                } else {
                    throw new Error('No realtor found with that name');
                }
            } catch (error) {
                console.error('Error fetching agent data:', error);
                throw error;
            }
        };
        
        // Execute the fetch
        fetchAgentData(agentParam)
            .then(agentData => {
                // Display agent information
                document.getElementById('realtor-headshot').src = agentData.headshot || 'placeholder-image.jpg';
                document.getElementById('realtor-name').textContent = agentData.name || 'Realtor Name';
                
                // Populate contact info
                const contactInfoDiv = document.getElementById('contact-info');
                contactInfoDiv.innerHTML = ''; // Clear existing content
                
                if (agentData.phone) {
                    const phoneElement = document.createElement('p');
                    phoneElement.innerHTML = `Phone: <a href="tel:${agentData.phone}" class="text-blue-600 hover:underline">${agentData.phone}</a>`;
                    contactInfoDiv.appendChild(phoneElement);
                }
                
                if (agentData.email) {
                    const emailElement = document.createElement('p');
                    emailElement.innerHTML = `Email: <a href="mailto:${agentData.email}" class="text-blue-600 hover:underline">${agentData.email}</a>`;
                    contactInfoDiv.appendChild(emailElement);
                }
                
                // Show the realtor card
                document.getElementById('realtor-card').classList.remove('hidden');
            })
            .catch(error => {
                const errorMessage = document.getElementById('error-message');
                errorMessage.querySelector('span').textContent = error.message;
                errorMessage.classList.remove('hidden');
            })
            .finally(() => {
                document.getElementById('loading').classList.add('hidden');
            });
    }
    
    // Set up the "Get Your Custom Card" button event listener
    document.getElementById('get-card-button').addEventListener('click', function(e) {
        e.preventDefault();
        // Replace with your actual redirect or form opening logic
        window.location.href = "/signup";
    });
});