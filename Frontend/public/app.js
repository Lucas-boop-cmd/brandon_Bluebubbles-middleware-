document.addEventListener('DOMContentLoaded', function() {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const agentParam = urlParams.get('agent');
    
    // Always show the default view
    document.getElementById('default-view').classList.remove('hidden');
    
    // If there's an agent parameter, also fetch and display agent information
    if (agentParam) {
        document.getElementById('loading').classList.remove('hidden');
        
        // Fetch agent information (replace with your actual API endpoint)
        fetch(`/api/agent/${agentParam}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Agent not found');
                }
                return response.json();
            })
            .then(data => {
                // Display agent information
                document.getElementById('realtor-headshot').src = data.headshot || 'placeholder-image.jpg';
                document.getElementById('realtor-name').textContent = data.name || 'Realtor Name';
                
                // Populate contact info
                const contactInfoDiv = document.getElementById('contact-info');
                if (data.phone) {
                    const phoneElement = document.createElement('p');
                    phoneElement.innerHTML = `Phone: <a href="tel:${data.phone}" class="text-blue-600 hover:underline">${data.phone}</a>`;
                    contactInfoDiv.appendChild(phoneElement);
                }
                
                if (data.email) {
                    const emailElement = document.createElement('p');
                    emailElement.innerHTML = `Email: <a href="mailto:${data.email}" class="text-blue-600 hover:underline">${data.email}</a>`;
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