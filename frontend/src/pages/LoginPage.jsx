import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");

        // Mock Login Logic
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const u = JSON.parse(storedUser);
            if (u.email === email) {
                login(u);
                return;
            }
        }

        const mockUser = { name: "Test User", email, role: "Investor" };
        login(mockUser);
    };

    return (
        <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 pt-24">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <div className="mb-6 text-center">
                    <Link to="/" className="text-indigo-400 hover:text-indigo-300 font-medium text-sm transition-colors">
                        &larr; Back to Home
                    </Link>
                </div>
                <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-white">
                    Sign in to your account
                </h2>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {error && <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded border border-red-900/50">{error}</div>}

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-300">
                            Email address
                        </label>
                        <div className="mt-2">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 bg-gray-900 text-white shadow-sm ring-1 ring-inset ring-gray-700 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 px-3"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-300">
                                Password
                            </label>
                        </div>
                        <div className="mt-2">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 bg-gray-900 text-white shadow-sm ring-1 ring-inset ring-gray-700 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 px-3"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-lg hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
                        >
                            Sign in
                        </button>
                    </div>
                </form>

                <p className="mt-10 text-center text-sm text-gray-400">
                    Not a member?{" "}
                    <Link to="/signup" className="font-semibold leading-6 text-indigo-400 hover:text-indigo-300">
                        Start a 14 day free trial
                    </Link>
                </p>
            </div>
        </div>
    );
}
