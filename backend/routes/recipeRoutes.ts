import { Router } from 'express';
import { recipes } from '../data/recipes';
import { getRecommendation } from '../services/recommendationService';
import { DetectedIntent, Recipe, RecipeMatch, GetRecommendationResult } from '../types';

const router = Router();

/**
 * In-memory conversation state
 */
const conversationState = new Map<string, {
  userId: string;
  lastIntent?: DetectedIntent;
  currentIntent?: DetectedIntent;
  pendingRecipeId?: string;
  name?: string;
  stage: 'initial' | 'narrowing' | 'commitment' | 'capture_name' | 'soft_close' | 'closed';
}>();

function getRecipeByName(nameSubstring: string): Recipe | null {
  return recipes.find(r =>
    r.name.toLowerCase().includes(nameSubstring.toLowerCase())
  ) || null;
}

function getPendingRecipe(pendingId?: string): Recipe | null {
  if (!pendingId) return null;
  return recipes.find(r => r.id === pendingId) || null;
}

router.post('/recommend', (req, res) => {
  const { message, userId = 'anon', debug = false } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message must be a string' });
  }

  try {
    const result = getRecommendation(message); // Returns GetRecommendationResult (RecommendationResult | OffTopicResult)

    /* =========================================================
       DEBUG MODE (Phase 0 testing)
       ========================================================= */
    if (debug === true) {
      if ('off_topic' in result) {
        return res.json({
          success: true,
          phase: 'phase_0',
          off_topic: true,
          response: result.response,
          input: message
        });
      }

      // Normal recommendation debug output
      return res.json({
        success: true,
        phase: 'phase_0',
        input: message,
        intent_understood: result.intent,
        decision: result.followup_question ? 'clarification' : result.matches.length > 0 ? 'recommendation' : 'fallback',
        explanation: result.explanation,
        applied_rules: result.applied_filters,
        ranking: result.matches.map((m: RecipeMatch) => ({
          recipe: m.recipe.name,
          score: m.score,
          reasons: m.reasons,
        })),
        excluded: result.excluded.map(e => ({
          recipe: e.recipe.name,
          reasons: e.excluded_reasons,
        })),
        fallback_used: result.fallback_used,
        failure_type: result.failure_type ?? 'none',
      });
    }

    /* =========================================================
       EARLY OFF-TOPIC HANDLING (Client's Phase 0 Requirement)
       ========================================================= */
    if ('off_topic' in result) {
      return res.json({
        success: true,
        data: {
          explanation: result.response,
          decision: 'off_topic',
          followup_question: null,
          intent: {},
          applied_filters: [],
          fallback_used: false,
          conversation_stage: conversationState.get(userId)?.stage || 'initial',
          escape_options: ['Show full menu', 'Show bestsellers', 'Reset'],
          soft_close_options: [],
          recommendations: [],
        },
      });
    }

    /* =========================================================
       NORMAL FOOD RECOMMENDATION PATH
       TypeScript now knows result is RecommendationResult (safe narrowing)
       ========================================================= */
    const recommenderResult = result; // No cast needed — no red underline!

    // Initialize conversation state if new user
    if (!conversationState.has(userId)) {
      conversationState.set(userId, { userId, stage: 'initial' });
    }

    const state = conversationState.get(userId)!;

    // Merge previous and new intent
    const mergedIntent: DetectedIntent = {
      ...state.lastIntent,
      ...recommenderResult.intent,
    };

    state.currentIntent = mergedIntent;
    state.lastIntent = mergedIntent;

    let conversationalResponse = '';
    let followupQuestion: string | null = null;
    let softCloseOptions: string[] = [];

    const escapeOptions = ['Show full menu', 'Show bestsellers', 'Reset'];

    const peopleCount = mergedIntent.people_count || 2;
    let currentRecipe = getPendingRecipe(state.pendingRecipeId);

    /* ---------- TIME / EFFORT CATEGORY ---------- */
    const isTimeEffort =
      mergedIntent.time_constraint !== undefined ||
      mergedIntent.no_chopping === true ||
      mergedIntent.multi_meal === true;

    if (isTimeEffort && state.stage === 'initial') {
      if (mergedIntent.no_chopping || mergedIntent.time_constraint) {
        currentRecipe = getRecipeByName('khichdi') || recommenderResult.matches[0]?.recipe || null;
      } else if (mergedIntent.multi_meal) {
        currentRecipe = getRecipeByName('dal makhani') || getRecipeByName('rajma') || null;
      }

      if (currentRecipe) {
        const totalTime = currentRecipe.prep_time_minutes + currentRecipe.cook_time_minutes;
        conversationalResponse = `If you want something genuinely easy, I’d suggest ${currentRecipe.name} — ready in about ${totalTime} mins.\n\nNo chopping, very low effort.`;
        followupQuestion = mergedIntent.veg_preference ? null : 'Veg works, or do you want chicken instead?';
        state.pendingRecipeId = currentRecipe.id;
        state.stage = 'narrowing';
      }
    }

    /* ---------- DECISION FATIGUE CATEGORY ---------- */
    else if (mergedIntent.is_vague === true && state.stage === 'initial') {
      currentRecipe = getRecipeByName('butter chicken') || getRecipeByName('rajma') || getRecipeByName('dal makhani') || null;

      if (currentRecipe) {
        conversationalResponse = `Totally get it 😄 If you don’t want to think, ${currentRecipe.name} is a safe, comforting choice.`;
        followupQuestion = 'Veg or non-veg?';
        state.pendingRecipeId = currentRecipe.id;
        state.stage = 'narrowing';
      }
    }

    /* ---------- CONVERSATION CONTINUATION ---------- */
    else if (currentRecipe) {
      if (state.stage === 'narrowing' && mergedIntent.veg_preference !== undefined) {
        conversationalResponse = `Perfect. Shall I set this up for ${peopleCount} people?`;
        state.stage = 'commitment';
      } else if (state.stage === 'commitment' && /yes|ok|haan|sure/i.test(message)) {
        conversationalResponse = `Great 👍 What name should I save this under?`;
        state.stage = 'capture_name';
      } else if (state.stage === 'capture_name') {
        state.name = message.trim();
        conversationalResponse = `Thanks ${state.name}. Want me to add this to cart or send it on WhatsApp?`;
        softCloseOptions = ['Add to cart', 'Send on WhatsApp'];
        state.stage = 'soft_close';
      } else if (state.stage === 'soft_close') {
        conversationalResponse = `All set 😊`;
        state.stage = 'closed';
      }
    }

    /* ---------- DEFAULT FALLBACK TEXT ---------- */
    if (conversationalResponse === '') {
      conversationalResponse = recommenderResult.explanation || 'Here are some popular comfort options people love:';
    }

    /* ---------- DECISION TYPE ---------- */
    const decision = recommenderResult.followup_question
      ? 'clarification'
      : recommenderResult.fallback_used
      ? 'fallback'
      : 'recommendation';

    /* =========================================================
       FINAL RESPONSE
       ========================================================= */
    return res.json({
      success: true,
      data: {
        explanation: conversationalResponse,
        decision,
        followup_question: recommenderResult.followup_question || followupQuestion,
        intent: mergedIntent,
        applied_filters: recommenderResult.applied_filters,
        fallback_used: recommenderResult.fallback_used,
        conversation_stage: state.stage,
        escape_options: escapeOptions,
        soft_close_options: softCloseOptions,
        recommendations: recommenderResult.matches.map((m: RecipeMatch) => ({
          id: m.recipe.id,
          name: m.recipe.name,
          veg_nonveg: m.recipe.veg_nonveg,
          spice_level: m.recipe.spice_level,
          total_time: m.recipe.prep_time_minutes + m.recipe.cook_time_minutes,
          image_url: m.recipe.image_url,
          score: m.score,
          reasons: m.reasons,
        })),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/* ===================== OTHER ROUTES ===================== */

router.post('/reset', (req, res) => {
  const { userId = 'anon' } = req.body;
  conversationState.delete(userId);
  res.json({ success: true });
});

export default router;