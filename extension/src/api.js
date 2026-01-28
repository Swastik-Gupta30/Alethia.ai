const API_BASE_URL = 'http://localhost:8000';
export async function analyzePageSignal(data) {
    try {
        console.log('Sending analysis request...', {
            url: data.url,
            titleLength: data.pageTitle?.length,
            textLength: data.pageText?.length
        });

        const response = await fetch(`${API_BASE_URL}/api/extension/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        console.log('Response received:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error analyzing page:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
}
export async function sendChatMessage(data) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error sending chat message:', error);
        throw error;
    }
}
