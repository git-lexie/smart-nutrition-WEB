import { processPlateIntent, loadIntentModel } from '@/services/intent'
import { generateExpertAdvice } from '@/services/response'

export const analyzeFoodList = async (foodItems, userProfile, history = []) => {
    try {
        const { totalMacros, identifiedFoods } = await processPlateIntent(foodItems);
        const coaching = generateExpertAdvice(totalMacros, userProfile, history);

        return {
            macros: totalMacros,
            identifiedFoods: identifiedFoods,
            advice: coaching.advice,
            recommendedActivity: coaching.recommendedActivity,
            recommendedFoods: coaching.recommendedFoods,
            quote: coaching.quote
        };
    } catch (err) {
        console.error("AI Service Error:", err);
        throw err;
    }
};

export const loadModel = async () => {
    try {
        await loadIntentModel();
    } catch (err) {
        console.error("❌ AI Service: Failed to load models:", err);
    }
};

export default { loadModel, analyzeFoodList };