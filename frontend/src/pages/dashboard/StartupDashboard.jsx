import { Upload, FileText, Activity } from "lucide-react";

export default function StartupDashboard() {
    return (
        <div className="flex min-h-screen bg-gray-950 pt-16">
            {/* Sidebar - visual only for now, could be its own component */}
            <aside className="w-64 bg-gray-900 border-r border-white/5 hidden md:block">
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-white">Startup Portal</h2>
                </div>
                <nav className="px-4 space-y-1">
                    <a href="#" className="bg-indigo-600/10 text-indigo-400 group flex items-center px-4 py-2 text-sm font-medium rounded-md border border-indigo-600/20">
                        <Activity className="mr-3 h-5 w-5" />
                        Overview
                    </a>
                    <a href="#" className="text-gray-400 hover:bg-gray-800 hover:text-white group flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors">
                        <Upload className="mr-3 h-5 w-5" />
                        Submit Data
                    </a>
                </nav>
            </aside>

            <main className="flex-1 p-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold text-white mb-6">Dashboard Overview</h1>

                    {/* Stats */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
                        <div className="bg-gray-900 overflow-hidden shadow-lg rounded-lg border border-white/5">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-gray-400 truncate">Current Reliability Score</dt>
                                <dd className="mt-1 text-3xl font-semibold text-indigo-400">85%</dd>
                            </div>
                        </div>
                        <div className="bg-gray-900 overflow-hidden shadow-lg rounded-lg border border-white/5">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-gray-400 truncate">Data Submissions</dt>
                                <dd className="mt-1 text-3xl font-semibold text-white">12</dd>
                            </div>
                        </div>
                        <div className="bg-gray-900 overflow-hidden shadow-lg rounded-lg border border-white/5">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-gray-400 truncate">Pending Reviews</dt>
                                <dd className="mt-1 text-3xl font-semibold text-white">0</dd>
                            </div>
                        </div>
                    </div>

                    {/* Submission Section */}
                    <div className="bg-gray-900 shadow-lg sm:rounded-lg border border-white/5">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-base font-semibold leading-6 text-white">Submit Financial Data</h3>
                            <div className="mt-2 max-w-xl text-sm text-gray-400">
                                <p>Upload your quarterly reports or API credentials to update your reliability score.</p>
                            </div>
                            <div className="mt-5">
                                <button type="button" className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors">
                                    <Upload className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                                    Upload Files
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Placeholder */}
                    <div className="mt-8 bg-gray-900 shadow-lg sm:rounded-lg p-6 border border-white/5">
                        <h3 className="text-base font-semibold leading-6 text-white mb-4">Reliability History</h3>
                        <div className="h-64 bg-gray-950 border-2 border-dashed border-gray-800 rounded-lg flex items-center justify-center">
                            <span className="text-gray-500">Reliability Chart Placeholder</span>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
