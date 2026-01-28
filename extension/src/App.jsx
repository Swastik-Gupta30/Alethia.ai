import { useState, useEffect } from 'react';
import { analyzePageSignal, sendChatMessage } from './api';

function App() {
    const [activeTab, setActiveTab] = useState('insight');
    const [pageInfo, setPageInfo] = useState({ title: '', url: '' });
    const [analysisData, setAnalysisData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Get current page info when popup opens
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                setPageInfo({
                    title: tabs[0].title || 'Unknown Page',
                    url: tabs[0].url || '',
                });
            }
        });
    }, []);

    const getScoreColor = (score) => {
        if (score <= 40) return 'bg-score-red';
        if (score <= 70) return 'bg-score-yellow';
        return 'bg-score-green';
    };

    const truncateTitle = (title, maxLength = 50) => {
        if (title.length <= maxLength) return title;
        return title.substring(0, maxLength) + '...';
    };

    const handleAnalyze = async () => {
        setLoading(true);
        setError(null);

        try {
            // Get active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            // Extract page text using content script (limit to first 50k chars)
            const [result] = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    const text = document.body.innerText;
                    // Limit to 50,000 characters to prevent request size issues
                    return text.substring(0, 50000);
                },
            });

            const pageText = result.result;

            console.log('Extracted text length:', pageText.length);

            // Send to backend
            const response = await analyzePageSignal({
                url: tab.url,
                pageTitle: tab.title,
                pageText: pageText,
            });

            setAnalysisData(response);
        } catch (err) {
            console.error('Analysis error:', err);
            setError(`Failed to analyze page: ${err.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleChat = async (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const userMessage = { role: 'user', content: chatInput };
        setChatMessages((prev) => [...prev, userMessage]);
        setChatInput('');
        setChatLoading(true);

        try {
            // Get page text for context
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const [result] = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => document.body.innerText.substring(0, 5000), // Limit context
            });

            const response = await sendChatMessage({
                query: chatInput,
                context: {
                    pageTitle: pageInfo.title,
                    pageText: result.result,
                    url: tab.url,
                },
            });

            const assistantMessage = { role: 'assistant', content: response.response };
            setChatMessages((prev) => [...prev, assistantMessage]);
        } catch (err) {
            console.error('Chat error:', err);
            const errorMessage = {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please make sure the backend is running.',
            };
            setChatMessages((prev) => [...prev, errorMessage]);
        } finally {
            setChatLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-gray-900 text-gray-100">
            {/* Header with Tabs */}
            <div className="flex border-b border-gray-700">
                <button
                    onClick={() => setActiveTab('insight')}
                    className={`flex-1 py-3 px-4 font-semibold transition-colors ${activeTab === 'insight'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                >
                    Insight
                </button>
                <button
                    onClick={() => setActiveTab('ask')}
                    className={`flex-1 py-3 px-4 font-semibold transition-colors ${activeTab === 'ask'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                >
                    Ask
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'insight' ? (
                    <div className="h-full flex flex-col p-4 space-y-4">
                        {/* Page Title */}
                        <div className="bg-gray-800 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Current Page</p>
                            <p className="text-sm font-medium truncate" title={pageInfo.title}>
                                {truncateTitle(pageInfo.title)}
                            </p>
                        </div>

                        {/* Analyze Button */}
                        <button
                            onClick={handleAnalyze}
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-bold text-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Analyzing...' : 'Analyze Signal'}
                        </button>

                        {/* Error Display */}
                        {error && (
                            <div className="bg-red-900/50 border border-red-600 rounded-lg p-3">
                                <p className="text-sm text-red-200">{error}</p>
                            </div>
                        )}

                        {/* Loading Skeleton */}
                        {loading && (
                            <div className="flex-1 space-y-4">
                                <div className="flex justify-center">
                                    <div className="w-32 h-32 skeleton rounded-full"></div>
                                </div>
                                <div className="skeleton h-6 w-3/4 mx-auto"></div>
                                <div className="skeleton h-20 w-full"></div>
                            </div>
                        )}

                        {/* Analysis Results */}
                        {!loading && analysisData && (
                            <div className="flex-1 space-y-4">
                                {/* Reliability Score Badge */}
                                <div className="flex justify-center">
                                    <div
                                        className={`w-32 h-32 rounded-full flex items-center justify-center ${getScoreColor(
                                            analysisData.score
                                        )} shadow-lg`}
                                    >
                                        <div className="text-center">
                                            <div className="text-4xl font-bold text-white">
                                                {analysisData.score}
                                            </div>
                                            <div className="text-xs text-white/80">Reliability</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="bg-gray-800 rounded-lg p-4">
                                    <h3 className="text-sm font-semibold text-gray-300 mb-2">
                                        Key Finding
                                    </h3>
                                    <p className="text-sm leading-relaxed text-gray-200">
                                        {analysisData.summary}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* No Data State */}
                        {!loading && !analysisData && !error && (
                            <div className="flex-1 flex items-center justify-center text-center px-4">
                                <div className="text-gray-400">
                                    <p className="text-sm">Click "Analyze Signal" to evaluate</p>
                                    <p className="text-sm">the financial reliability of this page.</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col">
                        {/* Context Header */}
                        <div className="bg-gray-800 p-3 border-b border-gray-700">
                            <p className="text-xs text-gray-400">Asking about:</p>
                            <p className="text-sm font-medium truncate" title={pageInfo.title}>
                                {truncateTitle(pageInfo.title, 45)}
                            </p>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto chat-scroll p-4 space-y-3">
                            {chatMessages.length === 0 ? (
                                <div className="h-full flex items-center justify-center">
                                    <p className="text-sm text-gray-400 text-center px-4">
                                        Ask questions about this page's financial content
                                    </p>
                                </div>
                            ) : (
                                chatMessages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'
                                            }`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-lg p-3 ${msg.role === 'user'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-700 text-gray-100'
                                                }`}
                                        >
                                            <p className="text-sm leading-relaxed">{msg.content}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                            {chatLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-700 rounded-lg p-3">
                                        <div className="flex space-x-2">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                            <div
                                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                                style={{ animationDelay: '0.2s' }}
                                            ></div>
                                            <div
                                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                                style={{ animationDelay: '0.4s' }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Chat Input */}
                        <form onSubmit={handleChat} className="p-4 bg-gray-800 border-t border-gray-700">
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Ask a question..."
                                    disabled={chatLoading}
                                    className="flex-1 bg-gray-700 text-gray-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                />
                                <button
                                    type="submit"
                                    disabled={chatLoading || !chatInput.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:cursor-not-allowed"
                                >
                                    Send
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
