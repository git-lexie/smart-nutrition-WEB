import internalFoodDb from '../app/data/foodDatabase';

export const generateExpertAdvice = (macros, userProfile, history = []) => {
    const {
        age = 25, gender = 'Male', height = 170, weight = 70, goal = 'maintain'
    } = userProfile;

    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr = (gender.toLowerCase() === 'male') ? bmr + 5 : bmr - 161;
    const maintenanceTDEE = Math.round(bmr * 1.375);
    let targetDailyCalories = maintenanceTDEE;
    let targets = { p: 0.25, c: 0.50, f: 0.25 };

    if (goal.includes('lose')) {
        targetDailyCalories -= 500;
        targets = { p: 0.35, c: 0.35, f: 0.30 };
    } else if (goal.includes('build') || goal.includes('muscle')) {
        targetDailyCalories += 350;
        targets = { p: 0.30, c: 0.50, f: 0.20 };
    }

    const mealCals = macros.calories || 0;
    const mealP = macros.protein || 0;
    const mealC = macros.carbs || 0;
    const mealF = macros.fats || 0;

    const mealEnergyImpact = (mealCals / targetDailyCalories) * 100;
    const proteinRatio = (mealP * 4) / (mealCals || 1);

    let trendAdvice = "";
    if (history.length >= 3) {
        const avgPastCals = history.slice(-3).reduce((acc, s) => acc + (s.macros?.calories || 0), 0) / 3;
        if (goal.includes('lose') && avgPastCals > targetDailyCalories) {
            trendAdvice = "Your recent history suggests a calorie surplus. Tighten up this meal's portion. ";
        } else if (goal.includes('build') && avgPastCals < maintenanceTDEE) {
            trendAdvice = "You've been under-eating lately; your muscles need more fuel to grow. ";
        }
    }

    let activityObj = { name: "Rest", duration: "0 mins", intensity: "Low", reason: "Default state." };

    // ============================================================================
    // TIER 1: THE EXTREMES (SAFETY & DIGESTION PROTOCOLS)
    // ============================================================================
    if (mealCals < 10) {
        activityObj = { name: "Water & Electrolytes", duration: "N/A", intensity: "None", reason: "Trace calories detected. You are effectively fasting. Focus on hydration." };
    } else if (mealCals < 50 && goal.includes('lose')) {
        activityObj = { name: "Fasted Walking", duration: "30 mins", intensity: "Low", reason: "Negligible intake keeps you in a fasted state. Great for pure fat oxidation." };
    } else if (mealCals < 50 && goal.includes('build')) {
        activityObj = { name: "Rest & Eat More", duration: "N/A", intensity: "None", reason: "You cannot build muscle on 50 calories. Please consume a real meal before training." };
    } else if (mealCals > 1500) {
        activityObj = { name: "Digestion Break / Nap", duration: "60 mins", intensity: "None", reason: "Extreme caloric load (>1500). Training now poses a risk of gastric distress. Let digestion settle." };
    } else if (mealCals > 1200 && mealF > 60) {
        activityObj = { name: "Slow Weighted Ruck", duration: "90 mins", intensity: "Low-Moderate", reason: "Massive fatty meal. High intensity is dangerous. A slow, heavy ruck will burn calories without upsetting the stomach." };
    } else if (mealCals > 1000 && mealC > 150) {
        activityObj = { name: "Long Distance Cycle", duration: "2 hours", intensity: "Moderate", reason: "Glycogen overload. You have fuel for a Tour de France stage. Get on a bike and ride." };
    }
    // ============================================================================
    // TIER 2: THE "DANGER ZONES" (HIGH CARB + HIGH FAT COMBOS)
    // ============================================================================
    else if (mealC > 80 && mealF > 40 && goal.includes('lose')) {
        activityObj = { name: "Damage Control HIIT", duration: "45 mins", intensity: "High", reason: "High carb/fat combo is the easiest to store as body fat. High intensity is needed to oxidize this immediately." };
    } else if (mealC > 80 && mealF > 40 && goal.includes('build')) {
        activityObj = { name: "Strongman Training", duration: "90 mins", intensity: "High", reason: "You have an abundance of dirty fuel. Use it for tire flips, sled pushes, and heavy carries." };
    } else if (mealC > 60 && mealF > 30) {
        activityObj = { name: "Metabolic Conditioning (MetCon)", duration: "50 mins", intensity: "High", reason: "Mixed fuel sources require a metabolic demand that targets both glycolytic and oxidative pathways." };
    } else if (mealC > 50 && mealF > 50) {
        activityObj = { name: "Inclined Power Walking", duration: "60 mins", intensity: "Moderate", reason: "Equal high-carb/high-fat ratio. Steady inclined walking prevents nausea while burning significant calories." };
    }
    // ============================================================================
    // TIER 3: THE "GOLDEN RATIO" (HIGH PROTEIN + HIGH CARB - LOW FAT)
    // ============================================================================
    else if (mealP > 40 && mealC > 80 && mealF < 10) {
        activityObj = { name: "Leg Day (Squat Focus)", duration: "75 mins", intensity: "Very High", reason: "The holy grail of pre-workout macros. Massive glycogen and amino acids. Destroy your legs today." };
    } else if (mealP > 35 && mealC > 60 && mealF < 15) {
        activityObj = { name: "Push Day (Chest/Shoulders/Tri)", duration: "60 mins", intensity: "High", reason: "Optimal anabolic window. Your muscles are primed for heavy pressing movements." };
    } else if (mealP > 30 && mealC > 50 && mealF < 10) {
        activityObj = { name: "Pull Day (Back/Biceps)", duration: "60 mins", intensity: "High", reason: "Clean fuel for a high-volume back session. Expect a massive pump." };
    } else if (mealP > 25 && mealC > 40 && goal.includes('build')) {
        activityObj = { name: "Hypertrophy Upper Body", duration: "50 mins", intensity: "Moderate-High", reason: "Standard bodybuilding macros. Focus on 8-12 rep ranges for growth." };
    }
    // ============================================================================
    // TIER 4: CARB DOMINANCE (SUGAR SPIKES & GLYCOGEN)
    // ============================================================================
    // --- The Sugar Rush (Low Fiber/Fat) ---
    else if (mealC > 60 && mealP < 5 && mealF < 5) {
        activityObj = { name: "Sprints / Plyometrics", duration: "20 mins", intensity: "Maximal", reason: "Pure sugar spike detected! Sprint immediately to use this glucose before you crash." };
    } else if (mealC > 40 && mealP < 5 && mealF < 5) {
        activityObj = { name: "Tabata Intervals", duration: "15 mins", intensity: "High", reason: "Insulin is spiking. 4 minutes of Tabata will shuttle that sugar into muscle tissue." };
    }
    // --- The Endurance Loader ---
    else if (mealC > 100 && mealF < 20) {
        activityObj = { name: "Marathon Prep Run", duration: "90+ mins", intensity: "Moderate", reason: "Carb loading detected. Your liver and muscle glycogen stores are topped off for distance." };
    } else if (mealC > 70 && mealF < 15) {
        activityObj = { name: "Tempo Run (5k-10k)", duration: "45 mins", intensity: "High", reason: "High octane fuel. Maintain a threshold pace to utilize the available glucose." };
    } else if (mealC > 50 && mealF < 10) {
        activityObj = { name: "Rowing Intervals (500m)", duration: "30 mins", intensity: "High", reason: "Clean carbs are perfect for explosive rowing intervals." };
    }
    // --- Cutting on High Carbs ---
    else if (mealC > 50 && goal.includes('lose')) {
        activityObj = { name: "Circuit Training", duration: "40 mins", intensity: "High", reason: "You ate high carbs on a cut. Use a no-rest circuit to burn through them rapidly." };
    }
    // ============================================================================
    // TIER 5: FAT DOMINANCE (KETO & SLOW DIGESTION)
    // ============================================================================
    // --- Deep Keto ---
    else if (mealF > 50 && mealC < 10) {
        activityObj = { name: "Zone 2 Cycling", duration: "60 mins", intensity: "Moderate", reason: "Deep ketosis environment. Zone 2 training optimizes fat adaptation and mitochondrial efficiency." };
    } else if (mealF > 30 && mealC < 5) {
        activityObj = { name: "Steady State Elliptical", duration: "45 mins", intensity: "Moderate", reason: "Pure fat fuel. Keep heart rate steady to encourage beta-oxidation." };
    }
    // --- The "Heavy Stomach" ---
    else if (mealF > 40 && mealP > 30) {
        activityObj = { name: "Powerlifting (Low Reps)", duration: "60 mins", intensity: "High Load/Low HR", reason: "Heavy digestion creates lethargy. Stick to low-rep, high-rest strength work to avoid nausea." };
    } else if (mealF > 30 && mealP > 20) {
        activityObj = { name: "Incline Treadmill Walk", duration: "40 mins", intensity: "Moderate", reason: "Moderate fats require time. Incline walking burns calories without jostling the stomach." };
    }
    // ============================================================================
    // TIER 6: PROTEIN DOMINANCE (THERMOGENIC & RECOVERY)
    // ============================================================================
    // --- The Carnivore ---
    else if (mealP > 60 && mealC < 10) {
        activityObj = { name: "Heavy Deadlifts", duration: "45 mins", intensity: "High", reason: "Massive protein load creates a thermogenic effect. Channel this heat into heavy pulls." };
    } else if (mealP > 40 && mealC < 20) {
        activityObj = { name: "Functional Strength", duration: "50 mins", intensity: "Moderate", reason: "High protein, low energy. Focus on technique and strength rather than cardio output." };
    }
    // --- The "Light & Tight" ---
    else if (mealP > 25 && mealC < 10 && mealF < 5) {
        activityObj = { name: "Abdominal & Core Circuit", duration: "25 mins", intensity: "Moderate", reason: "Light protein snack. Perfect for core compression exercises without a full stomach." };
    } else if (mealP > 20 && mealCals < 200) {
        activityObj = { name: "Mobility & Foam Rolling", duration: "30 mins", intensity: "Low", reason: "Protein input for repair. Use this time to unglue stiff muscles." };
    }
    // ============================================================================
    // TIER 7: BALANCED / MODERATE MEALS (GENERAL FITNESS)
    // ============================================================================
    else if (mealC > 30 && mealP > 20 && mealF > 15) {
        activityObj = { name: "CrossFit WOD", duration: "30 mins", intensity: "High", reason: "Perfectly balanced macros provide the versatility needed for a mixed-modal WOD." };
    } else if (mealC > 25 && mealP > 25 && mealF < 10) {
        activityObj = { name: "Calisthenics / Bar Brothers", duration: "40 mins", intensity: "Moderate", reason: "Lean fuel. Great for bodyweight mastery like pull-ups and dips." };
    } else if (mealC > 20 && mealP > 20 && goal.includes('build')) {
        activityObj = { name: "Volume Arm Day", duration: "45 mins", intensity: "Moderate", reason: "Decent energy. Good time to chase a pump with curls and extensions." };
    } else if (mealC > 20 && mealP > 20 && goal.includes('lose')) {
        activityObj = { name: "Jump Rope Intervals", duration: "20 mins", intensity: "High", reason: "Balanced energy. Jump rope burns massive calories in a short timeframe." };
    }
    // ============================================================================
    // TIER 8: SPECIFIC SCENARIOS & MICRO-ADJUSTMENTS
    // ============================================================================
    // --- Fiber Heavy (Vegetable dominance) ---
    else if (mealEnergyImpact < 20 && mealC > 20 && mealP < 5) {
        activityObj = { name: "Yoga Flow", duration: "30 mins", intensity: "Low", reason: "Fiber-rich, low-calorie meal. Yoga aids digestion and utilizes the slow-release energy." };
    }
    // --- Late Night / Pre-Bed ---
    else if (mealCals > 300 && mealP > 20 && new Date().getHours() > 20) {
        activityObj = { name: "Light Stretching", duration: "15 mins", intensity: "Very Low", reason: "Late protein intake. Gentle stretching prepares the body for anabolic sleep." };
    }
    // --- Morning / Breakfast Scenarios ---
    else if (mealC > 40 && new Date().getHours() < 10) {
        activityObj = { name: "Morning Run", duration: "30 mins", intensity: "Moderate", reason: "Morning carbs detected. Burn them off immediately to set a metabolic tone for the day." };
    } else if (mealF > 20 && new Date().getHours() < 10) {
        activityObj = { name: "Morning Hike", duration: "45 mins", intensity: "Low", reason: "Fat-heavy breakfast. A hike in nature utilizes the slow energy release." };
    }
    // --- The "Cheat Meal" Correction ---
    else if (mealCals > 800 && goal.includes('lose')) {
        activityObj = { name: "Full Body Depletion", duration: "60 mins", intensity: "High", reason: "Cheat meal detected? Do a full body depletion workout to minimize fat gain." };
    }
    // --- Low Energy / Tired ---
    else if (mealCals > 200 && mealC < 30 && mealP < 10 && mealF < 10) {
        activityObj = { name: "Brisk Walk", duration: "20 mins", intensity: "Low", reason: "Undefined macro profile implies processed snacks. Walk it off." };
    }
    // ============================================================================
    // TIER 9: FALLBACKS
    // ============================================================================
    else if (mealEnergyImpact > 50) {
        activityObj = { name: "General Cardio", duration: "40 mins", intensity: "Moderate", reason: "High energy detected. Any form of cardio will help manage this load." };
    } else if (mealEnergyImpact > 25) {
        activityObj = { name: "General Weightlifting", duration: "45 mins", intensity: "Moderate", reason: "Moderate energy. Good for a standard lifting maintenance session." };
    } else {
        activityObj = { name: "Light Walk or Stretching", duration: "10-15 mins", intensity: "Low", reason: "Maintains steady insulin levels and aids baseline digestion post-meal." };
    }

    let recommendedFoods = [];
    let advice = trendAdvice;

    const getFoodBase = (categoryMatch, limit) => {
        let matches = internalFoodDb.filter(f => f.category && f.category.toLowerCase().includes(categoryMatch.toLowerCase()));
        if (matches.length === 0 && internalFoodDb.length > 0) {
            matches = [internalFoodDb[Math.floor(Math.random() * internalFoodDb.length)]];
        }
        return matches.slice(0, limit);
    };

    // --- TIER 1: CALORIC EXTREMES (Safety & Portion Control) ---
    if (mealCals < 50) {
        advice += "This is effectively a fast. Trace calories only. ";
        recommendedFoods = [{ name: "Water & Electrolytes", weight: 500, reason: "Hydration is key during fasting windows." }];
    } else if (mealCals < (targetDailyCalories * 0.10)) {
        advice += "Tiny snack detected. This won't keep you full for long. ";
        if (goal.includes('build')) {
            advice += "For growth, you need to eat bigger! ";
            recommendedFoods = getFoodBase("protein", 1).map(f => ({ name: f.name, weight: 150, reason: "Anabolic building block." }))
                .concat(getFoodBase("carb", 1).map(f => ({ name: f.name, weight: 200, reason: "Caloric density." })));
        } else {
            advice += "Keep it light but satiating. ";
            recommendedFoods = getFoodBase("fiber", 1).map(f => ({ name: f.name, weight: 100, reason: "Hunger control." }));
        }
    } else if (mealCals > (targetDailyCalories * 0.60)) {
        advice += "Binge Alert! You just consumed over 60% of your daily intake in one sitting. ";
        recommendedFoods = [{ name: "Green Tea / Water", weight: 300, reason: "Aid digestion and reduce bloating." }];
    } else if (mealCals > (targetDailyCalories * 0.45)) {
        advice += "Massive payload. You've eaten half your daily goal. Your next meal must be purely fibrous vegetables. ";
        recommendedFoods = getFoodBase("fiber", 2).map(f => ({ name: f.name, weight: 200, reason: "Volume without calories." }));
    }
    // --- TIER 2: MACRO IMBALANCES (The "Danger Zones") ---
    else if (mealC > 60 && mealF > 30) {
        advice += "High Carb + High Fat is the 'Danger Zone' for fat storage. Your insulin is high while blood fat is high. ";
        recommendedFoods = getFoodBase("fiber", 1).map(f => ({ name: f.name, weight: 150, reason: "Slows absorption of this heavy load." }));
    }
    // High Sugar / Carb Spike (Crash Risk)
    else if (mealC > 50 && mealP < 10 && mealF < 5) {
        advice += "Sugar spike warning! Minimal protein or fat to slow digestion. You will crash in 60 minutes. ";
        recommendedFoods = getFoodBase("protein", 1).map(f => ({ name: f.name, weight: 120, reason: "Blunts the insulin response." }))
            .concat(getFoodBase("fat", 1).map(f => ({ name: f.name, weight: 20, reason: "Slows gastric emptying." })));
    }
    // High Fat / Keto (Sluggishness)
    else if (mealF > 40 && mealC < 10) {
        advice += "Heavy keto meal. Digestion will be slow. Expect steady energy but don't do HIIT training right now. ";
        recommendedFoods = [{ name: "Lemon Water", weight: 200, reason: "Acid aids fat breakdown." }];
    }
    // Protein Only (Rabbit Starvation)
    else if (mealP > 50 && mealC < 10 && mealF < 10) {
        advice += "Pure protein is thermogenic but inefficient as a sole fuel source. Your body has to work hard to convert this. ";
        if (goal.includes('build')) recommendedFoods = getFoodBase("carb", 1).map(f => ({ name: f.name, weight: 200, reason: "Protein sparing effect." }));
        else recommendedFoods = getFoodBase("fat", 1).map(f => ({ name: f.name, weight: 30, reason: "Essential fatty acids." }));
    }
    // --- TIER 3: GOAL-SPECIFIC OPTIMIZATION ---
    // Bulking: Low Protein
    else if (proteinRatio < targets.p && goal.includes('build')) {
        advice += "You are missing the anabolic window! Low protein while bulking = fat gain, not muscle gain. ";
        recommendedFoods = getFoodBase("protein", 2).map(f => ({ name: f.name, weight: 180, reason: "Primary muscle builder." }));
    }
    // Cutting: Low Protein
    else if (proteinRatio < targets.p && goal.includes('lose')) {
        advice += "Cutting without protein destroys muscle tissue. You will lose strength, not just weight. ";
        recommendedFoods = getFoodBase("protein", 1).map(f => ({ name: f.name, weight: 150, reason: "Muscle preservation." }));
    }
    // Bulking: Low Carb
    else if (mealC < 30 && goal.includes('build')) {
        advice += "Hard to grow without glycogen. Carbs are muscle-sparing and fuel intense lifting. ";
        recommendedFoods = getFoodBase("carb", 1).map(f => ({ name: f.name, weight: 250, reason: "Glycogen replenishment." }));
    }
    // Cutting: High Fat
    else if (mealF > 25 && goal.includes('lose')) {
        advice += "Fats are 9 calories per gram. This meal is expensive for your calorie budget. ";
        recommendedFoods = getFoodBase("fiber", 2).map(f => ({ name: f.name, weight: 150, reason: "Fill the void with zero calories." }));
    }
    // --- TIER 4: PERFORMANCE & TIMING ---
    // Pre-Workout (High Carb, Low Fat)
    else if (mealC > 40 && mealF < 10 && mealP > 20) {
        advice += "Perfect Pre-Workout fuel! High carb for energy, low fat for quick digestion. Go lift heavy! ";
        recommendedFoods = [{ name: "Water", weight: 500, reason: "Hydrate for the pump." }];
    }
    // Post-Workout (High Protein, High Carb)
    else if (mealP > 30 && mealC > 50) {
        advice += "Textbook Post-Workout recovery. Refilling glycogen and repairing tears perfectly. ";
        recommendedFoods = getFoodBase("fruit", 1).map(f => ({ name: f.name, weight: 100, reason: "Micronutrients and antioxidants." }));
    }
    // Late Night (High Carb)
    else if (mealC > 50 && new Date().getHours() > 20) {
        advice += "Heavy carbs before bed can disrupt growth hormone release. Try to keep dinner protein-focused next time. ";
        recommendedFoods = [{ name: "Chamomile Tea", weight: 200, reason: "Relaxation without calories." }];
    }
    // Breakfast (High Protein)
    else if (mealP > 30 && new Date().getHours() < 10) {
        advice += "Excellent start! A high protein breakfast regulates appetite for the entire day. ";
        recommendedFoods = getFoodBase("fruit", 1).map(f => ({ name: f.name, weight: 100, reason: "Morning energy kick." }));
    }
    // --- TIER 5: MICRO-ADJUSTMENTS ---
    // Low Fiber (FIXED: replaced 'meal' with 'macros')
    else if (mealC > 40 && (!macros.fiber || macros.fiber < 5)) {
        advice += " decent meal but very low fiber. This will digest too fast. Add some roughage. ";
        recommendedFoods = getFoodBase("fiber", 1).map(f => ({ name: f.name, weight: 150, reason: "Gut health & digestion speed." }));
    }
    // Sodium Warning
    else if (mealCals > 400 && mealP < 10 && mealC < 30 && mealF > 20) {
        advice += "Likely processed food detected (High Fat/Cal, Low Macro definition). Watch your sodium intake. ";
        recommendedFoods = [{ name: "Potassium Rich Fruit (Banana)", weight: 100, reason: "Counteracts sodium bloating." }];
    }
    // The "Perfect Zone"
    else {
        advice += "This is a beautifully balanced plate. You hit the sweet spot of satiety and fuel. ";
        recommendedFoods = getFoodBase("fruit", 1).map(f => ({ name: f.name, weight: 100, reason: "Vitamin boost." }));
    }

    // Fallback if DB is empty or fails
    if (recommendedFoods.length === 0 && internalFoodDb.length > 0) {
        recommendedFoods = [{ name: internalFoodDb[0].name, weight: 150, reason: "Staple food recommendation." }];
    }
    if (recommendedFoods.length === 0) {
        recommendedFoods = [{ name: "Water", weight: 250, reason: "Hydration is essential." }];
    }

    const quotes = [
        "Train like an athlete, eat like a nutritionist.",
        "Food is not just calories; it is information that tells your body what to do.",
        "Eat for the body you want, not the body you have.",
        "You can't out-train a bad diet.",
        "The best workout is the one that happened; the best meal is the one that fueled you.",
        "Don't reward yourself with food. You are not a dog.",
        "Your body is a reflection of your lifestyle, not your genes.",
        "Real food doesn't have ingredients, it is ingredients.",
        "Don't dig your grave with your own knife and fork.",
        "Sugar is the new smoking.",
        "If you keep good food in your fridge, you will eat good food.",
        "A healthy outside starts from the inside.",
        "Every time you eat is an opportunity to nourish your body.",
        "Processed food is the enemy of progress.",
        "Drink water like your life depends on it, because it does.",
        "Abs are made in the kitchen, revealed in the gym.",
        "The most powerful drug you can take is the food you eat.",
        "Don't eat less, eat right.",
        "Hunger is not an emergency.",
        "Junk food satisfies you for a minute. Healthy food satisfies you for a lifetime.",
        "Your diet is a bank account. Good food choices are good investments.",
        "Let food be thy medicine and medicine be thy food.",
        "Cheat meals are a treat, not a lifestyle.",
        "Carbs are not the enemy, lack of discipline is.",
        "Protein is the building block of your future self.",
        "Stop counting calories and start counting chemicals.",
        "Eat like you love yourself.",
        "Fast food results in a slow body.",
        "You are what you eat, so don't be fast, cheap, easy, or fake.",
        "Nothing tastes as good as healthy feels.",
        "Consistency is the ultimate performance enhancer.",
        "You don't have to be extreme, just consistent.",
        "Motivation is what gets you started. Habit is what keeps you going.",
        "Small daily improvements are the key to staggering long-term results.",
        "Discipline is choosing between what you want now and what you want most.",
        "Success isn't always about greatness. It's about consistency.",
        "Do something today that your future self will thank you for.",
        "Discipline is the bridge between goals and accomplishment.",
        "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
        "Motivation comes and goes. Discipline stays.",
        "The only bad workout is the one that didn't happen.",
        "Don't stop when you're tired. Stop when you're done.",
        "Excuses don't burn calories.",
        "Suffer the pain of discipline or suffer the pain of regret.",
        "If it was easy, everyone would do it.",
        "Your excuses are lies your fears sold you.",
        "Results happen over time, not overnight. Work hard, stay consistent, and be patient.",
        "The body achieves what the mind believes.",
        "Don't wish for it, work for it.",
        "Willpower is a muscle. The more you use it, the stronger it gets.",
        "Be stronger than your strongest excuse.",
        "Action is the foundational key to all success.",
        "Don't decrease the goal. Increase the effort.",
        "A one-hour workout is 4% of your day. No excuses.",
        "Show up for yourself everyday.",
        "It never gets easier, you just get stronger.",
        "Strive for progress, not perfection.",
        "The scale measures your weight, not your worth or your hard work.",
        "Your health is an investment, not an expense.",
        "Take care of your body. It’s the only place you have to live.",
        "Fitness is not about being better than someone else. It's about being better than you used to be.",
        "Pain is weakness leaving the body.",
        "Sweat is just fat crying.",
        "Train insane or remain the same.",
        "Comfort zones are where dreams go to die.",
        "The only bad workout is the one you didn't do.",
        "Strong is the new skinny.",
        "Muscles are torn in the gym, fed in the kitchen, and built in bed.",
        "Rest is not laziness, it's recovery.",
        "You don't get the ass you want by sitting on it.",
        "Lift heavy, live light.",
        "Your body can stand almost anything. It’s your mind that you have to convince.",
        "Exercise is a celebration of what your body can do. Not a punishment for what you ate.",
        "Fall in love with the process and the results will come.",
        "Strength doesn't come from what you can do. It comes from overcoming the things you once thought you couldn't.",
        "Make your body the sexiest outfit you own.",
        "Hustle for that muscle.",
        "Go the extra mile. It’s never crowded.",
        "Sore today, strong tomorrow.",
        "If you still look cute at the end of your workout, you didn't train hard enough.",
        "Squat like nobody is watching.",
        "Deadlifts: Because picking things up and putting them down solves problems.",
        "A healthy mind in a healthy body.",
        "Invest in yourself, it pays the best interest.",
        "Your body hears everything your mind says.",
        "Focus on your health, not your weight.",
        "Fitness is 100% mental. Your body won't go where your mind doesn't push it.",
        "Be the best version of you.",
        "Don't let a bad day be a bad life.",
        "Create healthy habits, not restrictions.",
        "The struggle you're in today is developing the strength you need for tomorrow.",
        "Health is wealth.",
        "A goal without a plan is just a wish.",
        "Respect your body. It’s the only vehicle you get in this life.",
        "Don't trade what you want most for what you want now.",
        "Be proud, but never satisfied.",
        "Change is hard at first, messy in the middle, and gorgeous at the end.",
        "If you're tired of starting over, stop giving up.",
        "Keep your squats low and your standards high.",
        "Wake up with determination. Go to bed with satisfaction.",
        "The pain of today is the victory of tomorrow.",
        "Rome wasn't built in a day, but they worked on it every single day.",
        "You are your only competition.",
        "Your vibe attracts your tribe. Stay healthy.",
        "Think like a champion.",
        "Mindset is everything.",
        "Believe you can and you're halfway there.",
        "Success starts with self-discipline.",
        "Transform your body, transform your life."
    ];

    return {
        advice: advice.trim(),
        recommendedActivity: activityObj,
        recommendedFoods,
        quote: quotes[Math.floor(Math.random() * quotes.length)]
    };
};

