// src/types.ts
// Fully updated & aligned with Recipe Metadata Schema v1.1, Package Plan Mapping,
// Failure Mode Pack, and ultra-extended recommender logic
// Modified according to the document: added new fields to DetectedIntent based on all categories (A-X), including jain, light_meal, sensitive_stomach, no_chopping, multi_meal, day_type, people_count, difficulty_preference, dish_format
// Fixed seasonality type to string[] for consistency with Recipe
// Aligned health_preference with HealthPositioning for consistency

// === Primitive Types ===
export type VegNonVeg = "veg" | "non_veg";
export type SpiceLevel = "mild" | "medium" | "spicy";
export type OilLevel = "low" | "medium" | "high";
export type CalorieDensity = "light" | "medium" | "high";
export type ProteinDensity = "low" | "medium" | "high";
export type DifficultyLevel = "easy" | "medium" | "hard";
export type HealthPositioning = "healthy" | "balanced" | "comfort" | "indulgent";
export type PackageType = "ghar_ka_khana" | "aaj_kuch_naya" | "khana_khazana";
export type MealType = "lunch" | "dinner";
export type DayType = "weekday" | "weekend";
export type DishFormat = "curry" | "dry" | "gravy" | "rice_based" | "roti_based" | "full_meal";

// === Recipe Interface (Full Schema v1.1 Compliance) ===
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

// === DetectedIntent (All fields used in recommender + detector) ===
export interface DetectedIntent {
  // Package
  package_preference?: PackageType;

  // Diet
  veg_preference?: VegNonVeg;
  jain?: boolean;

  // Proteins
  protein_type?: string[];

  // Spice
  spice_level?: SpiceLevel;
  exclude_spicy?: boolean;

  // Health & Oil
  health_preference?: HealthPositioning;
  low_oil?: boolean;
  light_meal?: boolean;
  sensitive_stomach?: boolean;

  // Time
  time_constraint?: number;
  no_chopping?: boolean;

  // Restrictions
  high_protein?: boolean;
  no_dairy?: boolean;
  no_paneer?: boolean;
  no_egg?: boolean;

  // Advanced constraints (now partially detected)
  allergen_tags?: string[];
  avoid_if?: string[];
  seasonality?: string[];

  // Style & Occasion
  comfort_food?: boolean;
  novelty?: boolean;
  family_friendly?: boolean;
  restaurant_style?: boolean;     // detected but not used in scoring yet

  // Preferences
  cuisine_style?: string[];
  best_sellers?: boolean;

  // Meal context & planning
  meal_type?: MealType;
  day_type?: DayType;
  people_count?: number;
  multi_meal?: boolean;

  // Cooking experience
  difficulty_preference?: DifficultyLevel;

  // Dish structure
  dish_format?: DishFormat;

  // Context hints (used in scoring, now partially detected)
  weekday_suitable?: boolean;
  weekend_indulgent?: boolean;
  carb_type?: string;
  diet_tags?: string[];
  typical_spice_profile?: string[];

  // Cognitive state
  is_vague?: boolean;
}

// === Supporting Interfaces ===
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

  // 👇 ADD THIS
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
