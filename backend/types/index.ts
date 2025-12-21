// src/types.ts

export type VegNonVeg = "veg" | "non_veg";
export type SpiceLevel = "mild" | "medium" | "spicy";
export type OilLevel = "low" | "medium" | "high";
export type CalorieDensity = "light" | "medium" | "high";
export type ProteinDensity = "low" | "medium" | "high";
export type DifficultyLevel = "easy" | "medium" | "hard";
export type HealthPositioning = "healthy" | "balanced" | "comfort" | "indulgent";
export type PackageType = "ghar_ka_khana" | "aaj_kuch_naya" | "khana_khazana";
export type MealType = "lunch" | "dinner" | "breakfast"; // Added breakfast
export type DayType = "weekday" | "weekend";

export interface Recipe {
  id: string;
  name: string;
  package: PackageType;
  veg_nonveg: VegNonVeg;
  primary_protein: string | null;
  secondary_protein: string | null;
  contains_paneer: boolean;
  contains_dairy: boolean;
  contains_egg: boolean;
  spice_level: SpiceLevel;
  oil_level: OilLevel;
  calorie_density: CalorieDensity;
  protein_density: ProteinDensity;
  health_positioning: HealthPositioning;
  cuisine_style: string;
  region_style: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  difficulty_level: DifficultyLevel;
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

export interface DetectedIntent {
  package_preference?: PackageType;
  veg_preference?: VegNonVeg;
  jain?: boolean;
  protein_type?: string[];
  spice_level?: SpiceLevel;
  exclude_spicy?: boolean;
  health_preference?: HealthPositioning;
  low_oil?: boolean;
  light_meal?: boolean;
  sensitive_stomach?: boolean;
  time_constraint?: number;
  no_chopping?: boolean;
  high_protein?: boolean;
  no_dairy?: boolean;
  no_paneer?: boolean;
  wants_paneer?: boolean;          // NEW: fixed paneer detection
  no_egg?: boolean;
  quick_meal?: boolean;            // NEW: for jaldi/quick/easy
  wants_roti?: boolean;            // NEW: for roti/chapati/paratha
  wants_rice?: boolean;            // NEW: for rice/chawal
  wants_biryani?: boolean;         // NEW: for biryani/pulao
  allergen_tags?: string[];
  avoid_if?: string[];
  seasonality?: string[];
  comfort_food?: boolean;
  novelty?: boolean;
  family_friendly?: boolean;
  restaurant_style?: boolean;
  cuisine_style?: string[];
  best_sellers?: boolean;
  meal_type?: MealType;
  day_type?: DayType;
  people_count?: number;
  multi_meal?: boolean;
  difficulty_preference?: DifficultyLevel;
  dish_format?: string;            // Changed to string for flexibility
  weekday_suitable?: boolean;
  weekend_indulgent?: boolean;
  carb_type?: string;
  diet_tags?: string[];
  typical_spice_profile?: string[];
  is_vague?: boolean;
  raw_input?: string;
  has_food_mention?:boolean;
}

export interface RecipeMatch {
  recipe: Recipe;
  score: number;
  reasons: string[];
}

export interface ExcludedRecipe {
  recipe: Recipe;
  excluded_reasons: string[];
}

export interface AppliedFilter {
  name: string;
  value: string;
  type: "hard" | "soft";
}

export interface OffTopicResult {
  off_topic: true;
  response: string;
}

export interface RecommendationResult {
  decision: "recommendation" | "clarification" | "fallback";
  matches: RecipeMatch[];
  excluded: ExcludedRecipe[];
  intent: DetectedIntent;
  applied_filters: AppliedFilter[];
  fallback_used: boolean;
  explanation: string;
  failure_type:
    | "contradictory_constraints"
    | "impossible_time"
    | "unavailable_protein"
    | "conflicting_spice"
    | "vague_query"
    | "off_topic"
    | null;
  followup_question?: string;
  debug?: {
    intent: DetectedIntent;
    applied_filters: AppliedFilter[];
    excluded_count: number;
    match_scores: {
      recipe_id: string;
      score: number;
      reasons: string[];
    }[];
    decision_reason: string;
  };
}

export type GetRecommendationResult = RecommendationResult | OffTopicResult;