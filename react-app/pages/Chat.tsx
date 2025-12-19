import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Send, ChefHat, Sparkles, ArrowLeft, Filter, CheckCircle, XCircle, Info } from "lucide-react";

interface Recipe {
  id: string;
  name: string;
  veg_nonveg: string;
  primary_protein: string | null;
  spice_level: string;
  prep_time: number;
  cook_time: number;
  total_time: number;
  health_positioning: string;
  cuisine_style: string;
  diet_tags: string[];
  image_url: string;
  score: number;
  reasons: string[];
}

interface ExcludedRecipe {
  id: string;
  name: string;
  excluded_reasons: string[];
}

interface AppliedFilter {
  name: string;
  value: string;
  type: "hard" | "soft";
}

interface Intent {
  veg_preference?: string;
  protein_type?: string[];
  spice_level?: string;
  exclude_spicy?: boolean;
  health_preference?: string;
  time_constraint?: number;
  quick_meal?: boolean;
  high_protein?: boolean;
  low_oil?: boolean;
  no_dairy?: boolean;
  no_paneer?: boolean;
  comfort_food?: boolean;
  cuisine_style?: string[];
  best_sellers?: boolean;
  family_friendly?: boolean;
  restaurant_style?: boolean;
  is_vague?: boolean;
}

interface Message {
  type: "user" | "assistant";
  content: string;
  recommendations?: Recipe[];
  excluded?: ExcludedRecipe[];
  intent?: Intent;
  applied_filters?: AppliedFilter[];
  fallback_used?: boolean;
}

export default function Chat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  
  const [messages, setMessages] = useState<Message[]>([
    {
      type: "assistant",
      content: "Hi! I'm your Cook Kit AI assistant. Tell me what you're craving, and I'll find the perfect meal for you. I'll show you exactly how I understand your request and why I recommend each dish."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQuery) {
      handleInitialQuery(initialQuery);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInitialQuery = async (query: string) => {
    setMessages(prev => [...prev, { type: "user", content: query }]);
    setLoading(true);

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query })
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [
          ...prev,
          {
            type: "assistant",
            content: data.data.explanation,
            recommendations: data.data.recommendations,
            excluded: data.data.excluded,
            intent: data.data.intent,
            applied_filters: data.data.applied_filters,
            fallback_used: data.data.fallback_used
          }
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { type: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [
          ...prev,
          {
            type: "assistant",
            content: data.data.explanation,
            recommendations: data.data.recommendations,
            excluded: data.data.excluded,
            intent: data.data.intent,
            applied_filters: data.data.applied_filters,
            fallback_used: data.data.fallback_used
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            type: "assistant",
            content: "Sorry, I couldn't process your request. Please try again."
          }
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [
        ...prev,
        {
          type: "assistant",
          content: "Sorry, something went wrong. Please try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Header */}
      <div className="border-b border-orange-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-gray-700 hover:text-orange-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to home</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  Cook Kit AI
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-5xl mx-auto px-4 py-8 pb-32">
        <div className="space-y-6">
          {messages.map((message, idx) => (
            <div key={idx} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`${message.type === "user" ? "w-auto max-w-2xl" : "w-full"}`}>
                {message.type === "assistant" && (
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-gray-700">Cook Kit AI</span>
                  </div>
                )}
                
                <div className={`rounded-2xl p-4 ${
                  message.type === "user" 
                    ? "bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg" 
                    : "bg-white shadow-md border border-gray-100"
                }`}>
                  <p className={message.type === "user" ? "text-white" : "text-gray-800"}>
                    {message.content}
                  </p>
                </div>

                {/* Intent Detection & Filters */}
                {message.intent && message.applied_filters && message.applied_filters.length > 0 && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="w-5 h-5 text-blue-600" />
                      <h4 className="font-bold text-gray-900">What I Understood</h4>
                    </div>
                    <div className="space-y-2">
                      {message.applied_filters.map((filter, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                          <Filter className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="font-semibold text-gray-900">{filter.name}:</span>{" "}
                            <span className="text-gray-700">{filter.value}</span>
                            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                              filter.type === "hard" 
                                ? "bg-red-100 text-red-700" 
                                : "bg-green-100 text-green-700"
                            }`}>
                              {filter.type === "hard" ? "Must Match" : "Preferred"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {message.fallback_used && (
                      <div className="mt-3 p-3 bg-amber-100 border border-amber-300 rounded-lg">
                        <p className="text-sm text-amber-800 font-medium">
                          ⚠️ No exact matches found. Showing best sellers as fallback.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Recommendations */}
                {message.recommendations && message.recommendations.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h4 className="font-bold text-gray-900">
                        Matched Recipes ({message.recommendations.length})
                      </h4>
                    </div>
                    <div className="space-y-3">
                      {message.recommendations.map((recipe) => (
                        <div 
                          key={recipe.id}
                          onClick={() => navigate(`/recipe/${recipe.id}`)}
                          className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-200 hover:shadow-xl transition-all cursor-pointer group"
                        >
                          <div className="flex gap-4">
                            <div className="w-40 h-40 flex-shrink-0 relative overflow-hidden">
                              <img 
                                src={recipe.image_url} 
                                alt={recipe.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                            <div className="flex-1 p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                                  {recipe.name}
                                </h3>
                                <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-bold">
                                  Score: {recipe.score}
                                </div>
                              </div>
                              
                              <div className="flex gap-2 mb-3 flex-wrap">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  recipe.veg_nonveg === "veg" 
                                    ? "bg-green-100 text-green-700" 
                                    : "bg-red-100 text-red-700"
                                }`}>
                                  {recipe.veg_nonveg === "veg" ? "Vegetarian" : "Non-Veg"}
                                </span>
                                <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">
                                  {recipe.spice_level.charAt(0).toUpperCase() + recipe.spice_level.slice(1)} Spice
                                </span>
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                                  {recipe.total_time} mins
                                </span>
                              </div>

                              {recipe.reasons.length > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <p className="text-xs font-bold text-green-800 mb-2">✓ WHY THIS RECIPE:</p>
                                  <ul className="space-y-1">
                                    {recipe.reasons.map((reason, i) => (
                                      <li key={i} className="text-sm text-gray-800 flex items-start gap-2">
                                        <span className="text-green-600 mt-0.5">•</span>
                                        <span>{reason}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Excluded Recipes */}
                {message.excluded && message.excluded.length > 0 && (
                  <div className="mt-4">
                    <details className="group">
                      <summary className="flex items-center gap-2 cursor-pointer p-4 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <h4 className="font-bold text-gray-900">
                          Excluded Recipes ({message.excluded.length})
                        </h4>
                        <span className="ml-auto text-sm text-gray-600">
                          Click to see why
                        </span>
                      </summary>
                      <div className="mt-3 space-y-3">
                        {message.excluded.map((exc, i) => (
                          <div key={i} className="bg-white border border-red-200 rounded-xl p-4">
                            <h5 className="font-bold text-gray-900 mb-2">{exc.name}</h5>
                            <div className="space-y-1">
                              {exc.excluded_reasons.map((reason, j) => (
                                <div key={j} className="text-sm text-red-700 flex items-start gap-2">
                                  <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                  <span>{reason}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-full">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-700">Cook Kit AI</span>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-8 pb-6">
        <div className="max-w-5xl mx-auto px-4">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me what you're craving..."
              disabled={loading}
              className="w-full px-6 py-4 pr-14 rounded-2xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none shadow-lg text-gray-900 placeholder-gray-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50 hover:shadow-lg transition-all disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <p className="text-center text-xs text-gray-500 mt-3">
            Try: "spicy chicken", "healthy veg options", or "quick meals under 20 mins"
          </p>
        </div>
      </div>
    </div>
  );
}
