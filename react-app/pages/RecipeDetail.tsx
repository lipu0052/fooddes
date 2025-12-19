import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { 
  ArrowLeft, Clock, ChefHat, Flame, Heart, 
  Calendar, Users, TrendingUp, Leaf, AlertCircle, Star,
  Check, X
} from "lucide-react";

interface Recipe {
  id: string;
  name: string;
  veg_nonveg: string;
  primary_protein: string | null;
  secondary_protein: string | null;
  contains_paneer: boolean;
  contains_dairy: boolean;
  contains_egg: boolean;
  spice_level: string;
  oil_level: string;
  calorie_density: string;
  protein_density: string;
  health_positioning: string;
  cuisine_style: string;
  region_style: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  difficulty_level: string;
  carb_type: string;
  meal_type: string[];
  diet_tags: string[];
  allergen_tags: string[];
  comfort_food: boolean;
  kid_friendly: boolean;
  weekday_suitable: boolean;
  weekend_indulgent: boolean;
  best_seller: boolean;
  pairs_with: string[];
  avoid_if: string[];
  seasonality: string[];
  typical_spice_profile: string[];
  typical_user_intents: string[];
  image_url: string;
}

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecipe();
  }, [id]);

  const fetchRecipe = async () => {
    try {
      const response = await fetch(`/api/recipes/${id}`);
      const data = await response.json();
      if (data.success) {
        setRecipe(data.data);
      }
    } catch (error) {
      console.error("Error fetching recipe:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recipe not found</h2>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const totalTime = recipe.prep_time_minutes + recipe.cook_time_minutes;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Header */}
      <header className="border-b border-orange-100 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-gray-700 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to recipes</span>
          </button>
        </div>
      </header>

      {/* Hero Image */}
      <div className="relative h-96 overflow-hidden">
        <img
          src={recipe.image_url}
          alt={recipe.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            {recipe.best_seller && (
              <div className="inline-flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
                <TrendingUp className="w-4 h-4" />
                Best Seller
              </div>
            )}
            <h1 className="text-5xl font-bold text-white mb-4">{recipe.name}</h1>
            <div className="flex gap-3 flex-wrap">
              <span className={`px-4 py-2 rounded-full font-medium backdrop-blur-sm ${
                recipe.veg_nonveg === "veg"
                  ? "bg-green-500/90 text-white"
                  : "bg-red-500/90 text-white"
              }`}>
                <Leaf className="w-4 h-4 inline mr-2" />
                {recipe.veg_nonveg === "veg" ? "Vegetarian" : "Non-Vegetarian"}
              </span>
              <span className="px-4 py-2 rounded-full font-medium bg-orange-500/90 text-white backdrop-blur-sm">
                <Flame className="w-4 h-4 inline mr-2" />
                {recipe.spice_level.charAt(0).toUpperCase() + recipe.spice_level.slice(1)} Spice
              </span>
              <span className="px-4 py-2 rounded-full font-medium bg-blue-500/90 text-white backdrop-blur-sm">
                <Clock className="w-4 h-4 inline mr-2" />
                {totalTime} minutes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Stats */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Info</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <StatCard icon={<Clock />} label="Prep Time" value={`${recipe.prep_time_minutes} min`} />
                <StatCard icon={<Clock />} label="Cook Time" value={`${recipe.cook_time_minutes} min`} />
                <StatCard icon={<ChefHat />} label="Difficulty" value={recipe.difficulty_level} />
                <StatCard icon={<Heart />} label="Type" value={recipe.health_positioning} />
              </div>
            </div>

            {/* Nutritional Info */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Nutritional Profile</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <InfoItem 
                  label="Protein Density" 
                  value={recipe.protein_density} 
                  color={recipe.protein_density === "high" ? "green" : recipe.protein_density === "medium" ? "blue" : "gray"}
                />
                <InfoItem 
                  label="Calorie Density" 
                  value={recipe.calorie_density} 
                  color={recipe.calorie_density === "light" ? "green" : recipe.calorie_density === "medium" ? "blue" : "orange"}
                />
                <InfoItem 
                  label="Oil Level" 
                  value={recipe.oil_level} 
                  color={recipe.oil_level === "low" ? "green" : recipe.oil_level === "medium" ? "blue" : "orange"}
                />
              </div>
            </div>

            {/* Ingredients */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Protein Sources</h2>
              <div className="space-y-3">
                {recipe.primary_protein && (
                  <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl">
                    <Check className="w-5 h-5 text-orange-600" />
                    <span className="text-gray-900 font-medium capitalize">
                      Primary: {recipe.primary_protein}
                    </span>
                  </div>
                )}
                {recipe.secondary_protein && (
                  <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl">
                    <Check className="w-5 h-5 text-orange-600" />
                    <span className="text-gray-900 font-medium capitalize">
                      Secondary: {recipe.secondary_protein}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Contains */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Contains</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <ContainsItem label="Paneer" contains={recipe.contains_paneer} />
                <ContainsItem label="Dairy" contains={recipe.contains_dairy} />
                <ContainsItem label="Egg" contains={recipe.contains_egg} />
              </div>
            </div>

            {/* Cuisine & Style */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Cuisine & Style</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-orange-500 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Cuisine Style</p>
                    <p className="text-gray-600 capitalize">{recipe.cuisine_style.replace(/_/g, " ")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-orange-500 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Region</p>
                    <p className="text-gray-600 capitalize">{recipe.region_style.replace(/_/g, " ")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-orange-500 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Carb Type</p>
                    <p className="text-gray-600 capitalize">{recipe.carb_type.replace(/_/g, " ")}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Spice Profile */}
            {recipe.typical_spice_profile.length > 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Flavor Profile</h2>
                <div className="flex gap-2 flex-wrap">
                  {recipe.typical_spice_profile.map((spice, idx) => (
                    <span key={idx} className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium capitalize">
                      {spice.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Meal Type */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Meal Type</h3>
              <div className="flex gap-2 flex-wrap">
                {recipe.meal_type.map((meal, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize">
                    {meal}
                  </span>
                ))}
              </div>
            </div>

            {/* Diet Tags */}
            {recipe.diet_tags.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Diet Tags</h3>
                <div className="flex gap-2 flex-wrap">
                  {recipe.diet_tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium capitalize">
                      {tag.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Allergens */}
            {recipe.allergen_tags.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-red-200">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <h3 className="text-lg font-bold text-gray-900">Allergen Warning</h3>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {recipe.allergen_tags.map((allergen, idx) => (
                    <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium capitalize">
                      {allergen.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Features */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Features</h3>
              <div className="space-y-3">
                {recipe.comfort_food && <FeatureItem icon={<Heart />} label="Comfort Food" />}
                {recipe.kid_friendly && <FeatureItem icon={<Users />} label="Kid Friendly" />}
                {recipe.weekday_suitable && <FeatureItem icon={<Calendar />} label="Weekday Suitable" />}
                {recipe.weekend_indulgent && <FeatureItem icon={<Star />} label="Weekend Special" />}
              </div>
            </div>

            {/* Pairs With */}
            {recipe.pairs_with.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Pairs Well With</h3>
                <div className="flex gap-2 flex-wrap">
                  {recipe.pairs_with.map((item, idx) => (
                    <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium capitalize">
                      {item.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Seasonality */}
            {recipe.seasonality.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Seasonality</h3>
                <div className="flex gap-2 flex-wrap">
                  {recipe.seasonality.map((season, idx) => (
                    <span key={idx} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium capitalize">
                      {season.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 mx-auto mb-3 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
        {icon}
      </div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="font-bold text-gray-900 capitalize">{value}</p>
    </div>
  );
}

function InfoItem({ label, value, color }: { label: string; value: string; color: string }) {
  const colorClasses = {
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    orange: "bg-orange-100 text-orange-700",
    gray: "bg-gray-100 text-gray-700"
  };

  return (
    <div className="text-center">
      <p className="text-sm text-gray-600 mb-2">{label}</p>
      <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold capitalize ${colorClasses[color as keyof typeof colorClasses]}`}>
        {value}
      </span>
    </div>
  );
}

function ContainsItem({ label, contains }: { label: string; contains: boolean }) {
  return (
    <div className={`flex items-center gap-2 p-3 rounded-xl ${contains ? "bg-orange-50" : "bg-gray-50"}`}>
      {contains ? (
        <Check className="w-5 h-5 text-orange-600" />
      ) : (
        <X className="w-5 h-5 text-gray-400" />
      )}
      <span className={`font-medium ${contains ? "text-gray-900" : "text-gray-500"}`}>
        {label}
      </span>
    </div>
  );
}

function FeatureItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
      <div className="text-green-600">
        {icon}
      </div>
      <span className="text-gray-900 font-medium">{label}</span>
    </div>
  );
}
