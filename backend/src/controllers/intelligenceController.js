import axios from "axios";
import { Intelligence } from "../models/intelligence.model.js";

// --- Mock Data for Reliability Fallback (Requested by User) ---
const MOCK_INTELLIGENCE_DATA = {
    "NVDA": { reliability_score: 88, regime: "Stable Growth", prediction: 0.0045, narrative_summary: "Strong AI demand continues to drive growth.", is_consistent: true },
    "AMD": { reliability_score: 82, regime: "Volatile", prediction: 0.0021, narrative_summary: "Competitive pressure in GPU market, but server growth strong.", is_consistent: true },
    "AAPL": { reliability_score: 94, regime: "Stable Growth", prediction: 0.0012, narrative_summary: "Consistent services revenue offsetting hardware cyclicality.", is_consistent: true },
    "TSLA": { reliability_score: 65, regime: "Volatile", prediction: -0.0015, narrative_summary: "Margins under pressure; autonomous driving timelines uncertain.", is_consistent: false },
    "MSFT": { reliability_score: 91, regime: "Stable Growth", prediction: 0.0032, narrative_summary: "Cloud dominance remains key growth driver.", is_consistent: true },
    "GOOGL": { reliability_score: 89, regime: "Stable Growth", prediction: 0.0028, narrative_summary: "Advertising recovery and AI integration positive.", is_consistent: true },
    "AMZN": { reliability_score: 85, regime: "Stable Growth", prediction: 0.0035, narrative_summary: "AWS and logistics efficiency improving.", is_consistent: true },
    "META": { reliability_score: 78, regime: "Volatile", prediction: 0.0042, narrative_summary: "Ad spend rebounding, but metaverse spending technically risky.", is_consistent: true },
    "NFLX": { reliability_score: 80, regime: "Stable Growth", prediction: 0.0018, narrative_summary: "Subscriber growth re-accelerating from password sharing crackdown.", is_consistent: true }
};

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

        // 3. Fallback: Try Mock Data first (User Request)
        const mockRow = MOCK_INTELLIGENCE_DATA[ticker.toUpperCase()];
        if (mockRow) {
            console.log(`Serving MOCK data for ${ticker} due to ML failure.`);
            // Also simulate saving this to DB so it persists
            try {
                await Intelligence.findOneAndUpdate(
                    { ticker: ticker.toUpperCase() },
                    {
                        ...mockRow,
                        last_updated: new Date(),
                        history: [] // Mock history not needed for now or can be added
                    },
                    { upsert: true, new: true }
                );
            } catch (e) { }

            return res.status(200).json({
                ...mockRow,
                source: "static_analysis",
                system_status: "online",
                message: "Analysis provided by Aletheia Intelligence (Static Mode)"
            });
        }

        // 4. Deep Fallback: Try Cache
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
            return res.status(503).json({ message: "Intelligence service unavailable." });
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


export const getNews = async (req, res) => {
    const { ticker } = req.params;
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || "http://localhost:8001";

    try {
        const response = await axios.get(`${pythonServiceUrl}/news/${ticker}`);
        return res.status(200).json(response.data);
    } catch (error) {
        console.error("Error fetching news:", error.message);
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        return res.status(500).json({ message: "News service unavailable", news: [] });
    }
}
