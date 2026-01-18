import axios from "axios";

export const getIntelligence = async (req, res) => {
    const { ticker } = req.params;

    if (!ticker) {
        return res.status(400).json({ message: "Ticker is required" });
    }

    try {
        // Forward to Python ML Service on port 8001 (as decided in plan)
        // Assuming Python service is running locally. In docker, hostname might differ (e.g. 'ml_service'), 
        // but user context implies local dev or monorepo. Plan said localhost:8001.
        const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || "http://localhost:8001";

        const response = await axios.get(`${pythonServiceUrl}/predict/${ticker}`);

        return res.status(200).json(response.data);
    } catch (error) {
        console.error("Error fetching intelligence data:", error.message);

        if (error.response) {
            // Python service returned an error
            return res.status(error.response.status).json(error.response.data);
        } else if (error.request) {
            // No response from Python service
            return res.status(503).json({ message: "Intelligence service unavailable" });
        } else {
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
};
