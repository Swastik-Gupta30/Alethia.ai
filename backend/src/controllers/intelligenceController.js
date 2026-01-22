import axios from "axios";
import { Intelligence } from "../models/intelligence.model.js";

export const getIntelligence = async (req, res) => {
    const { ticker } = req.params;

    if (!ticker) {
        return res.status(400).json({ message: "Ticker is required" });
    }

    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || "http://localhost:8001";

    // Helper for simple retries - Increased to 30 retries (60s)
    const fetchWithRetry = async (url, retries = 30, delay = 2000) => {
        for (let i = 0; i < retries; i++) {
            try {
                return await axios.get(url);
            } catch (error) {
                if (i === retries - 1) throw error;
                // Retry only on connection refused, 503, or 500 (Internal Server Error)
                if (error.code === 'ECONNREFUSED' || (error.response && (error.response.status === 503 || error.response.status === 500))) {
                    console.log(`Connection to ML Service failed. Retrying in ${delay}ms... (${i + 1}/${retries})`);
                    await new Promise(res => setTimeout(res, delay));
                } else {
                    throw error;
                }
            }
        }
    };

    try {
        // 1. Try fetching from ML Service using retry
        const response = await fetchWithRetry(`${pythonServiceUrl}/predict/${ticker}`);
        const mlData = response.data;

        // Check if ML service is in training mode
        if (mlData.status === "training") {
            console.log(`ML Service is training. Attempting to fetch cached data for ${ticker}...`);
            const cachedData = await Intelligence.findOne({ ticker: ticker.toUpperCase() });

            if (cachedData) {
                return res.status(200).json({
                    ...cachedData.toObject(),
                    source: "cache",
                    system_status: "training",
                    message: "Data served from cache while model retrains."
                });
            } else {
                // If no cache and training, return the training status message
                return res.status(202).json(mlData);
            }
        }

        // 2. If successful and not training, update Cache (Upsert)
        try {
            await Intelligence.findOneAndUpdate(
                { ticker: ticker.toUpperCase() },
                {
                    reliability_score: mlData.reliability_score,
                    regime: mlData.regime,
                    prediction: mlData.prediction,
                    narrative_summary: mlData.narrative_summary,
                    is_consistent: mlData.is_consistent,
                    last_updated: new Date()
                },
                { upsert: true, new: true }
            );
        } catch (dbError) {
            console.error("Failed to cache intelligence data:", dbError.message);
            // Continue serving data even if cache fails
        }

        return res.status(200).json({ ...mlData, source: "live" });

    } catch (error) {
        console.error("Error fetching intelligence data:", error.message);

        // 3. Fallback: Try Cache on Error
        try {
            const cachedData = await Intelligence.findOne({ ticker: ticker.toUpperCase() });
            if (cachedData) {
                console.log(`Serving cached data for ${ticker} due to ML service failure.`);
                return res.status(200).json({
                    ...cachedData.toObject(),
                    source: "cache",
                    system_status: "error_fallback",
                    warning: "Live analysis unavailable. Showing last known data."
                });
            }
        } catch (cacheError) {
            console.error("Cache retrieval failed:", cacheError.message);
        }

        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        } else if (error.request) {
            return res.status(503).json({ message: "Intelligence service unavailable and no cache found." });
        } else {
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
};

export const getTickers = async (req, res) => {
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || "http://localhost:8001";

    // Helper for simple retries - Increased to 30 retries (60s) for slow ML startup
    const fetchWithRetry = async (url, retries = 30, delay = 2000) => {
        for (let i = 0; i < retries; i++) {
            try {
                return await axios.get(url);
            } catch (error) {
                if (i === retries - 1) throw error;
                if (error.code === 'ECONNREFUSED' || (error.response && error.response.status === 503)) {
                    console.log(`Connection to ML Service failed. Retrying in ${delay}ms... (${i + 1}/${retries})`);
                    await new Promise(res => setTimeout(res, delay));
                } else {
                    throw error;
                }
            }
        }
    };

    try {
        const response = await fetchWithRetry(`${pythonServiceUrl}/tickers`);

        // Enrich with intelligence meta-data if available in cache (optional but nice)
        // For now, just pass through
        return res.status(200).json(response.data);
    } catch (error) {
        console.error("Error fetching tickers:", error.message);
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        } else if (error.request) {
            return res.status(503).json({ message: "Intelligence service unavailable" });
        } else {
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
}
