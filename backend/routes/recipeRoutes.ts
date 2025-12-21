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
    const result = getRecommendation(message);

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
       EARLY OFF-TOPIC HANDLING
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

    const recommenderResult = result;

    // Initialize conversation state
    if (!conversationState.has(userId)) {
      conversationState.set(userId, { userId, stage: 'initial' });
    }

    const state = conversationState.get(userId)!;

    // Merge intents across conversation
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

    /* ---------- HANDLE RECOMMENDER CLARIFICATION FIRST ---------- */
    if (recommenderResult.followup_question && state.stage === 'initial') {
      conversationalResponse = recommenderResult.explanation;
      followupQuestion = recommenderResult.followup_question;
      // Stay in initial stage until resolved
    }

    /* ---------- TIME / EFFORT CONSTRAINTS ---------- */
    else if (
      (mergedIntent.time_constraint !== undefined || mergedIntent.no_chopping || mergedIntent.multi_meal) &&
      state.stage === 'initial' &&
      recommenderResult.matches.length > 0
    ) {
      currentRecipe = recommenderResult.matches[0].recipe;
      const totalTime = currentRecipe.prep_time_minutes + currentRecipe.cook_time_minutes;

      conversationalResponse = `Got it — you're looking for something quick and easy! I'd go with **${currentRecipe.name}**. It's ready in about ${totalTime} minutes and needs minimal effort.`;

      followupQuestion = mergedIntent.veg_preference ? null : 'Does veg work for you, or would you like non-veg?';
      state.pendingRecipeId = currentRecipe.id;
      state.stage = 'narrowing';
    }

    /* ---------- DECISION FATIGUE / VAGUE QUERY ---------- */
    else if (mergedIntent.is_vague && state.stage === 'initial' && recommenderResult.matches.length > 0) {
      currentRecipe = recommenderResult.matches[0].recipe;

      conversationalResponse = `Totally understand — sometimes you just don't want to decide 😅\n\nLet me make it simple: **${currentRecipe.name}** is one of our most popular, comforting dishes that almost everyone loves.`;

      followupQuestion = 'Veg or non-veg preference?';
      state.pendingRecipeId = currentRecipe.id;
      state.stage = 'narrowing';
    }

    /* ---------- CONVERSATION CONTINUATION (NARROWING → COMMITMENT → etc.) ---------- */
    else if (currentRecipe) {
      if (state.stage === 'narrowing' && mergedIntent.veg_preference !== undefined) {
        conversationalResponse = `Perfect! Shall I prepare **${currentRecipe.name}** for ${peopleCount} people?`;
        state.stage = 'commitment';
      } else if (state.stage === 'commitment' && /yes|ok|haan|sure|han|thik|chalo/i.test(message.toLowerCase())) {
        conversationalResponse = `Awesome! 👍 Just one thing — what name should I save this order under?`;
        state.stage = 'capture_name';
      } else if (state.stage === 'capture_name') {
        state.name = message.trim();
        conversationalResponse = `Thanks ${state.name}! 😊 Would you like me to add **${currentRecipe.name}** to your cart or send the details on WhatsApp?`;
        softCloseOptions = ['Add to cart', 'Send on WhatsApp'];
        state.stage = 'soft_close';
      } else if (state.stage === 'soft_close') {
        conversationalResponse = `All done! Enjoy your meal 😋`;
        state.stage = 'closed';
      }
    }

    /* ---------- DEFAULT NATURAL RESPONSE ---------- */
    if (conversationalResponse === '') {
      if (state.stage === 'initial') {
        conversationalResponse = `Got it! ${recommenderResult.explanation}`;
      } else {
        conversationalResponse = recommenderResult.explanation;
      }
    }

    /* ---------- FINAL DECISION TYPE ---------- */
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