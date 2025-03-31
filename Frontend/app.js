(() => {

    const getAgentParameter = () => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('agent');
    };

    const agent = getAgentParameter();

    const callRealtorHandler = async (agentName) => {
        try {
            const response = await fetch(`/realtors?businessName=${agentName}`); // Assuming you create a route '/realtors'
            const data = await response.json();
            console.log('Realtor data:', data);
            // Process the data as needed (e.g., display in the UI)
        } catch (error) {
            console.error('Error calling realtor handler:', error);
        }
    };

    if (agent) {
        callRealtorHandler(agent);
    }

})();