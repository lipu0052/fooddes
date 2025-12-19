import { useState } from "react";
import { useNavigate } from "react-router";
import { ChefHat, MessageSquare, Sparkles, ArrowRight } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleStartChat = () => {
    if (searchQuery.trim()) {
      navigate(`/chat?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate("/chat");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleStartChat();
    }
  };

  const quickPrompts = [
    "I want something spicy",
    "Show me healthy veg options",
    "Quick meal under 20 minutes",
    "High protein, not oily",
    "Best sellers",
    "Light dinner for family"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Header */}
      <header className="border-b border-orange-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
              <ChefHat className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Cook Kit
              </h1>
              <p className="text-sm text-gray-600">AI-powered meal recommendations</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Images */}
      <section className="relative overflow-hidden">
        {/* Background Image Grid */}
        <div className="absolute inset-0 grid grid-cols-4 gap-2 opacity-20">
          <img src="https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80" alt="" className="w-full h-48 object-cover" />
          <img src="https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80" alt="" className="w-full h-48 object-cover" />
          <img src="https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80" alt="" className="w-full h-48 object-cover" />
          <img src="https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80" alt="" className="w-full h-48 object-cover" />
          <img src="https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80" alt="" className="w-full h-48 object-cover" />
          <img src="https://images.unsplash.com/photo-1585629649251-f4f8dd575ec0?w=400&q=80" alt="" className="w-full h-48 object-cover" />
          <img src="https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80" alt="" className="w-full h-48 object-cover" />
          <img src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80" alt="" className="w-full h-48 object-cover" />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/95 via-orange-500/95 to-amber-600/95"></div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>Powered by AI</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Tell Us What<br />You're Craving
          </h1>
          
          <p className="text-2xl text-orange-100 mb-12 max-w-2xl mx-auto">
            Our AI understands your preferences and finds the perfect meal kit for you
          </p>

          {/* Main CTA Input */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Try 'spicy chicken' or 'healthy veg options'..."
                className="w-full px-8 py-6 pr-48 rounded-2xl border-2 border-white/30 bg-white/95 backdrop-blur-sm focus:outline-none focus:border-white shadow-2xl text-gray-900 placeholder-gray-500 text-lg"
              />
              <button
                onClick={handleStartChat}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-8 py-4 bg-gradient-to-r from-orange-600 to-amber-700 text-white rounded-xl font-semibold hover:shadow-xl transition-all flex items-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Start Chat</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="max-w-3xl mx-auto">
            <p className="text-orange-100 text-sm mb-4">Quick suggestions:</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSearchQuery(prompt);
                    navigate(`/chat?q=${encodeURIComponent(prompt)}`);
                  }}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full text-sm font-medium transition-all border border-white/30 hover:border-white/50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      

      {/* Transparency Section */}
      <section className="bg-gradient-to-br from-orange-100 to-amber-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Complete Transparency
            </h2>
            <p className="text-xl text-gray-700">
              We show you exactly how we make decisions
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-12 h-12 mb-4 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">What We Found</h3>
              <p className="text-gray-600 mb-4">
                See your extracted intent, applied filters, and why each dish was included
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>Extracted preferences and requirements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>Hard vs soft filters applied</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>Specific reasons for each match</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-12 h-12 mb-4 bg-red-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">What Didn't Match</h3>
              <p className="text-gray-600 mb-4">
                See exactly which dishes were excluded and the specific reasons why
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Complete list of excluded recipes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Clear exclusion reasons for each</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Understand our decision-making process</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">
          Ready to Find Your Perfect Meal?
        </h2>
        <p className="text-xl text-gray-600 mb-10">
          Start a conversation and let our AI do the work
        </p>
        <button
          onClick={() => navigate("/chat")}
          className="px-10 py-5 bg-gradient-to-r from-orange-500 to-amber-600 text-white text-lg font-bold rounded-2xl hover:shadow-2xl transition-all flex items-center gap-3 mx-auto"
        >
          <MessageSquare className="w-6 h-6" />
          <span>Start Chatting Now</span>
          <ArrowRight className="w-6 h-6" />
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-2xl font-bold">Cook Kit</h4>
          </div>
          <p className="text-gray-400">AI-powered meal recommendations you can trust</p>
          <p className="text-gray-500 text-sm mt-4">© 2024 Cook Kit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
