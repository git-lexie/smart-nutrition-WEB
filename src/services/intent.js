const tf = require('@tensorflow/tfjs');
const use = require('@tensorflow-models/universal-sentence-encoder');
const foodDatabase = require('../app/data/foodDatabase'); 

let model = null;
let dbEmbedsCache = null; 

export const loadIntentModel = async () => {
    if (!model) {
        await tf.ready(); 
        model = await use.load();
        
        // OPTIMIZATION: Pre-calculate database embeddings on server start
        const dbFoodNames = foodDatabase.map(d => d.name.toLowerCase());
        dbEmbedsCache = await model.embed(dbFoodNames);
        
        console.log("🧠 AI Engine: Ready to process food semantics instantly.");
    }
};

export const processPlateIntent = async (foodList) => {
    await loadIntentModel();
    
    const foodNames = foodList.map(f => f.name.toLowerCase().trim());
    const inputEmbeds = await model.embed(foodNames);

    // High-speed matrix math using the cached database embeddings
    const analysis = tf.tidy(() => {
        const inputNorm = inputEmbeds.div(inputEmbeds.norm('euclidean', 1, true));
        const dbNorm = dbEmbedsCache.div(dbEmbedsCache.norm('euclidean', 1, true));
        const similarity = tf.matMul(inputNorm, dbNorm, false, true);
        
        return {
            indices: similarity.argMax(1).dataSync(),
            scores: similarity.max(1).dataSync()
        };
    });

    inputEmbeds.dispose(); // Prevent memory leaks

    let totalMacros = { calories: 0, protein: 0, carbs: 0, fats: 0 };
    let identifiedFoods = [];

    foodList.forEach((item, i) => {
        const score = analysis.scores[i];
        const match = foodDatabase[analysis.indices[i]];
        
        if (score > 0.40 && match) {
            const ratio = (item.weight || 100) / 100;
            const scaled = {
                input: item.name,
                match: match.name, 
                confidence: Math.round(score * 100),
                weight: item.weight,
                calories: Math.round(match.macros.calories * ratio),
                protein: Math.round(match.macros.protein * ratio),
                carbs: Math.round(match.macros.carbs * ratio),
                fats: Math.round(match.macros.fats * ratio)
            };
            
            identifiedFoods.push(scaled);
            totalMacros.calories += scaled.calories;
            totalMacros.protein += scaled.protein;
            totalMacros.carbs += scaled.carbs;
            totalMacros.fats += scaled.fats;
        } else {
            identifiedFoods.push({ input: item.name, match: "Unknown Item", confidence: Math.round(score * 100), calories: 0 });
        }
    });

    return { totalMacros, identifiedFoods };
};