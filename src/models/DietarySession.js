import mongoose from 'mongoose';

const foodItemSchema = new mongoose.Schema({
  input: { 
    type: String 
  },
  match: { 
    type: String 
  },
  name: { 
    type: String, 
    required: true 
  }, 
  weight: { 
    type: Number, 
    required: true 
  },
  confidence: { 
    type: Number 
  },
  calories: { 
    type: Number, 
    default: 0 
  },
  protein: { 
    type: Number, 
    default: 0 
  },
  carbs: { 
    type: Number, 
    default: 0 
  },
  fats: { 
    type: Number, 
    default: 0 
  }
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  goal: { 
    type: String 
  },
  foods: [foodItemSchema],
  macros: {
    calories: { 
      type: Number, 
      default: 0 
    },
    protein: { 
      type: Number, 
      default: 0 
    },
    carbs: { 
      type: Number, 
      default: 0 
    },
    fats: { 
      type: Number, 
      default: 0 
    }
  },
  advice: { 
    type: String 
  },
  recommendedActivity: {
    name: { 
      type: String 
    },
    duration: { 
      type: String 
    },
    intensity: { 
      type: String 
    },
    reason: { 
      type: String 
    }
  },
  recommendedFoods: [{
    name: String,
    weight: Number,
    reason: String
  }],
  quote: { 
    type: String 
  }
}, { timestamps: true });

export default mongoose.models.DietarySession || mongoose.model('DietarySession', sessionSchema);