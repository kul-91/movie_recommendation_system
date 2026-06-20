import React, { useState, useEffect, useRef } from "react";

function App() {
    const [moviesList, setMoviesList] = useState([])
    const [searchTerm, setSearchTerm] = useState("")
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [recommendations, setRecommendations] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetch("http://localhost:8000/api/movies").then((res) => {
            if (!res.ok) throw new Error("Failed to fetch movie list");
            return res.json();
        })
            .then((data) => setMoviesList(data))
            .catch((err) => console.log(err))
    }, []);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setSuggestions([]);
            return;
        }

        const filtered = moviesList.filter((title) =>
            title.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 8) // Limit to top 8 suggestions

        setSuggestions(filtered);
    }, [searchTerm, moviesList])

    // Handle click outside dropdown to close it

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch recommendations from FastAPI
    const handleRecommend = async (titleToSearch) => {
        const queryTitle = titleToSearch || searchTerm;
        if (!queryTitle.trim()) return;

        setLoading(true);
        setError("");
        setRecommendations(null);
        setShowDropdown(false);

        try {
            const response = await fetch(
                `http://localhost:8000/api/recommend?movie_title=${encodeURIComponent(
                    queryTitle
                )}`
            );
            if (!response.ok) {
                throw new Error("Movie not found or server error");
            }

            const data = await response.json(); // { searched_movie: {...}, recommendations: [[titles], [posters]] }

            if (data && data.recommendations && data.recommendations.length > 0) {
                setRecommendations({
                    searched: data.searched_movie,
                    recommend: data.recommendations,
                });
            } else {
                setError("No recommendation found.");
            }
        } catch (err) {
            setError(err.message || "Failed to fetch recommendations");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 text-slate-100 px-6 py-12 flex flex-col items-center">
            {/* Header */}
            <header className="text-center mb-12">
                <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent mb-3">
                    MovieMatch
                </h1>
                <p className="text-slate-400 text-lg">
                    Discover your next favorite movie using AI-powered Search
                </p>
            </header>
            {/* Search Container */}
            <div className="w-full max-w-2xl relative mb-16" ref={dropdownRef}>
                <div className="flex gap-3">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Search movie titles (e.g. Spider Man, Iron Man...)"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowDropdown(true);
                            }}
                            onFocus={() => setShowDropdown(true)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleRecommend();
                                }
                            }}
                            className="w-full px-5 py-4 bg-slate-900/60 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/80 focus:border-transparent text-slate-100 placeholder-slate-500 backdrop-blur-md transition-all shadow-lg text-lg"
                        />
                        {/* Suggestions Dropdown */}
                        {showDropdown && suggestions.length > 0 && (
                            <ul className="absolute w-full mt-2 bg-slate-900/95 border border-slate-800/85 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-lg divide-y divide-slate-800/40">
                                {suggestions.map((title, idx) => (
                                    <li
                                        key={idx}
                                        onClick={() => {
                                            setSearchTerm(title);
                                            setShowDropdown(false);
                                            handleRecommend(title);
                                        }}
                                        className="px-5 py-3.5 hover:bg-indigo-600/30 cursor-pointer text-slate-300 hover:text-white transition-colors text-left font-medium"
                                    >
                                        {title}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <button
                        onClick={() => handleRecommend()}
                        className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-indigo-500/20 active:scale-95 text-lg"
                    >
                        Recommend
                    </button>
                </div>
                {error && (
                    <p className="text-red-400 text-sm mt-3 font-semibold bg-red-950/20 border border-red-900/30 px-4 py-2 rounded-lg inline-block">
                        ⚠️ {error}
                    </p>
                )}
            </div>
            {/* Loading Skeleton */}
            {loading && (
                <div className="w-full max-w-6xl">
                    <h2 className="text-2xl font-bold mb-6 text-slate-300 animate-pulse">Finding perfect matches...</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="bg-slate-900/40 border border-slate-800/50 rounded-2xl overflow-hidden p-3 animate-pulse">
                                <div className="w-full aspect-[2/3] bg-slate-800 rounded-xl mb-4" />
                                <div className="h-4 bg-slate-800 rounded w-3/4 mb-2" />
                                <div className="h-3 bg-slate-800 rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recommendation Results */}
            {recommendations && (
                <div className="w-full max-w-6xl animate-fade-in flex flex-col items-start gap-8">

                    {/* Selected Movie Section (Top Left) */}
                    <div className="w-full flex flex-col items-start">
                        <h2 className="text-2xl font-bold mb-6 text-slate-200">
                            Your Search:
                        </h2>
                        <div className="w-full xs:w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5 max-w-[220px]">
                            <a
                                href={`https://www.themoviedb.org/movie/${recommendations.searched.movie_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group block bg-slate-900/40 border border-indigo-500/40 rounded-2xl overflow-hidden p-3 shadow-xl shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500"
                            >
                                <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden mb-3 bg-slate-950">
                                    <img
                                        src={recommendations.searched.poster || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=500"}
                                        alt={recommendations.searched.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <h3 className="font-bold text-slate-300 group-hover:text-indigo-400 transition-colors line-clamp-2 text-sm text-left px-1">
                                    {recommendations.searched.title}
                                </h3>
                            </a>
                        </div>
                    </div>

                    {/* Divider decoration */}
                    <div className="w-full flex items-center gap-4 my-4">
                        <h2 className="text-2xl font-bold text-slate-200 shrink-0 pr-4">
                            Recommendations for You:
                        </h2>
                        <div className="h-[1px] bg-slate-800 flex-grow" />
                    </div>

                    {/* Recommendations Grid (Below) */}
                    <div className="w-full">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                            {recommendations.recommend[0].map((movieId, index) => {
                                const title = recommendations.recommend[1][index];
                                const posterUrl = recommendations.recommend[2][index] || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=500";
                                return (
                                    <a
                                        key={index}
                                        href={`https://www.themoviedb.org/movie/${movieId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group block bg-slate-900/40 border border-slate-800/85 hover:border-indigo-500/40 rounded-2xl overflow-hidden p-3 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-indigo-500/5"
                                    >
                                        <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden mb-3 shadow-inner bg-slate-950">
                                            <img
                                                src={posterUrl}
                                                alt={title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                loading="lazy"
                                            />
                                        </div>
                                        <h3 className="font-bold text-slate-300 group-hover:text-indigo-400 transition-colors line-clamp-2 text-sm text-left px-1">
                                            {title}
                                        </h3>
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
export default App;
