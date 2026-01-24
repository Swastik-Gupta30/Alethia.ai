import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, AlertTriangle, Shield, Eye, Activity, GripVertical, Search } from "lucide-react";

export default function InvestorDashboard() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [analysisData, setAnalysisData] = useState(null);
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch Tickers
    useEffect(() => {
        const fetchTickers = async () => {
            try {
                const response = await axios.get("http://localhost:8000/api/intelligence/tickers");

                if (!Array.isArray(response.data)) {
                    if (response.data.status === "training" || response.data.message) {
                        throw new Error(response.data.message || "System Initializing...");
                    }
                    console.warn("Unexpected response format:", response.data);
                    throw new Error("Invalid data format received.");
                }

                const mapped = response.data.map((t, idx) => ({
                    id: idx,
                    name: `${t.ticker} Corp`,
                    ticker: t.ticker,
                    price: `$${t.price}`,
                    change: `${t.change > 0 ? '+' : ''}${t.change}%`,
                    rawChange: t.change,
                    is_analyzed: t.is_analyzed
                }));

                setCompanies(mapped);
            } catch (err) {
                console.error("Failed to fetch tickers:", err);
                setError("Failed to load market data.");
            } finally {
                setLoading(false);
            }
        };

        fetchTickers();
        // Poll every 10 seconds for live updates
        const interval = setInterval(fetchTickers, 10000);
        return () => clearInterval(interval);
    }, []);

    // Fetch Deep Analysis when selected
    useEffect(() => {
        const fetchAnalysis = async () => {
            if (!selectedCompany || !selectedCompany.is_analyzed) {
                setAnalysisData(null);
                return;
            }

            setIsAnalysisLoading(true);
            try {
                const res = await axios.get(`http://localhost:8000/api/intelligence/${selectedCompany.ticker}`);
                setAnalysisData(res.data);
            } catch (err) {
                console.error("Analysis fetch failed", err);
            } finally {
                setIsAnalysisLoading(false);
            }
        };

        fetchAnalysis();
    }, [selectedCompany]);

    // Selection Handler (Click or Drop)
    const handleSelectCompany = (ticker) => {
        const company = companies.find((c) => c.ticker === ticker);
        if (company) {
            setSelectedCompany(company);
        }
    };

    // Drag & Drop Handlers
    const handleDragStart = (e, ticker) => {
        e.dataTransfer.setData("text/plain", ticker);
        setIsDragging(true);
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // Allow dropping
        e.dataTransfer.dropEffect = "copy";
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const ticker = e.dataTransfer.getData("text/plain");
        handleSelectCompany(ticker);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    // Derived state
    const filteredCompanies = companies.filter(c =>
        c.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
                <Activity className="w-8 h-8 animate-spin text-indigo-500 mr-2" />
                Initializing Live Market Feed...
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">System Error</h2>
                    <p className="text-gray-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 p-6 pt-24 text-white">
            <div className="max-w-7xl mx-auto h-[85vh] grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* ---------------- LEFT PANEL: LIVE MARKET LIST ---------------- */}
                <div className="lg:col-span-4 bg-gray-900 rounded-xl border border-white/10 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-white/10 bg-gray-800/50 backdrop-blur-md">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-400" />
                            Live Market Pulse
                        </h2>
                        <div className="relative mt-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search tickers..."
                                className="w-full bg-gray-950 border border-white/10 rounded-md py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1 p-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-700">
                        {filteredCompanies.map((company) => (
                            <div
                                key={company.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, company.ticker)}
                                onDragEnd={handleDragEnd}
                                onClick={() => handleSelectCompany(company.ticker)}
                                className={`
                                    group flex items-center justify-between p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-all
                                    ${selectedCompany?.ticker === company.ticker
                                        ? 'bg-indigo-500/10 border-indigo-500/50'
                                        : 'bg-white/5 border-transparent hover:bg-white/10'}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <GripVertical className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">{company.ticker}</span>
                                            {company.is_analyzed && (
                                                <Shield className="w-3 h-3 text-emerald-400" fill="currentColor" />
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-400">{company.price}</div>
                                    </div>
                                </div>
                                <div className={`text-sm font-medium ${company.rawChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {company.change}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ---------------- RIGHT PANEL: DROP ZONE & ANALYSIS ---------------- */}
                <div
                    className="lg:col-span-8 flex flex-col"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <div className={`
                        flex-1 rounded-xl border-2 border-dashed transition-all relative overflow-hidden flex flex-col
                        ${isDragging ? 'border-indigo-500 bg-indigo-500/5 scale-[0.99]' : 'border-white/10 bg-gray-900/50'}
                    `}>
                        {selectedCompany ? (
                            <div className="p-8 h-full flex flex-col animate-in fade-in zoom-in duration-300">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-8">
                                    <div>
                                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                            {selectedCompany.ticker}
                                        </h1>
                                        <p className="text-gray-400 text-lg">Current Price: <span className="text-white">{selectedCompany.price}</span></p>
                                    </div>
                                    <div className={`text-2xl font-mono ${selectedCompany.rawChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {selectedCompany.change}
                                    </div>
                                </div>

                                {/* Content Logic */}
                                {selectedCompany.is_analyzed ? (
                                    <div className="space-y-6">
                                        {/* Status Card */}
                                        <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Shield className="w-6 h-6 text-indigo-400" />
                                                <h3 className="text-xl font-semibold text-indigo-100">AI Reliability Analysis</h3>
                                            </div>

                                            {isAnalysisLoading ? (
                                                <div className="flex flex-col items-center justify-center py-8">
                                                    <Activity className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                                                    <p className="text-gray-400">Running Neural Inference...</p>
                                                </div>
                                            ) : analysisData ? (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div className="bg-black/20 rounded p-4">
                                                        <div className="text-sm text-gray-400 mb-1">Reliability Score</div>
                                                        <div className={`text-3xl font-bold ${analysisData.reliability_score >= 80 ? 'text-green-400' :
                                                            analysisData.reliability_score >= 50 ? 'text-yellow-400' : 'text-red-400'
                                                            }`}>
                                                            {analysisData.reliability_score} / 100
                                                        </div>
                                                        <div className="text-xs text-indigo-400 mt-2">Live AI Inference</div>
                                                    </div>
                                                    <div className="bg-black/20 rounded p-4">
                                                        <div className="text-sm text-gray-400 mb-1">Market Regime</div>
                                                        <div className="text-xl text-white">{analysisData.regime}</div>
                                                    </div>
                                                    <div className="bg-black/20 rounded p-4">
                                                        <div className="text-sm text-gray-400 mb-1">Model Prediction</div>
                                                        <div className="text-xl text-white">
                                                            {analysisData.prediction > 0.5 ? "Bullish" : "Bearish"}
                                                            <span className="text-xs text-gray-500 ml-2">({(analysisData.prediction * 100).toFixed(1)}%)</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="py-8 text-center text-gray-500">
                                                    Select to analyze
                                                </div>
                                            )}

                                            {analysisData && (
                                                <div className="mt-6 flex justify-end">
                                                    <Link
                                                        to={`/company/${selectedCompany.ticker}`}
                                                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        View Full Deep Dive
                                                    </Link>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                            <p className="text-emerald-200 text-sm">
                                                <span className="font-bold">Verified:</span> This company is actively tracked by our neural engine. Full historical analysis and transcripts are available.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                                        <div className="bg-white/5 p-6 rounded-full mb-4">
                                            <Activity className="w-12 h-12 text-gray-400" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2">Analysis Not Available</h3>
                                        <p className="max-w-md text-gray-400 mx-auto">
                                            The model has not been trained on <strong>{selectedCompany.ticker}</strong>.
                                            We only provide live market data for this asset.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                <Activity className="w-16 h-16 mb-4 opacity-20" />
                                <h3 className="text-xl font-medium text-gray-400">Drag a company here to analyze</h3>
                                <p className="text-sm opacity-50">Select from the live market pulse on the left</p>
                            </div>
                        )}

                        {/* Drag Overlay Helper */}
                        {isDragging && !selectedCompany && (
                            <div className="absolute inset-0 bg-indigo-500/20 backdrop-blur-sm flex items-center justify-center border-4 border-indigo-500 border-dashed rounded-xl z-50 pointer-events-none">
                                <h3 className="text-2xl font-bold text-white drop-shadow-lg">Drop to Analyze</h3>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
