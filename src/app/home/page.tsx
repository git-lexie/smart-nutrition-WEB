"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { connectScale } from "@/lib/bluetooth";
import {
  saveOfflineSession,
  getOfflineSessions,
  clearSyncedSessions,
} from "@/lib/db";
import OnboardingModal from "@/components/OnboardingModal";
import foodDatabase from "../data/foodDatabase";
import {
  User,
  Activity,
  Bluetooth,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Sparkles,
  History,
  Dumbbell,
  ChevronRight,
  X,
  Timer,
  Zap,
  Mic,
  Volume2,
  Info,
} from "lucide-react";

// --- HELPER: Speech Synthesis (AI Voice) ---
const useSpeech = (sex: "male" | "female" = "female") => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const updateVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.onvoiceschanged = updateVoices;
    updateVoices();
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!text) return;
      window.speechSynthesis.cancel(); // Stop any current speech

      const utterance = new SpeechSynthesisUtterance(text);
      // Attempt to find a voice matching the sex preference
      const preferredVoice = voices.find((v) =>
        sex === "male"
          ? v.name.includes("Male") || v.name.includes("David")
          : v.name.includes("Female") ||
            v.name.includes("Zira") ||
            v.name.includes("Google US"),
      );

      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.rate = 1.05; // Slightly faster for a professional, conversational flow
      utterance.pitch = sex === "female" ? 1.0 : 0.95;

      window.speechSynthesis.speak(utterance);
    },
    [voices, sex],
  );

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  return { speak, stop };
};

// --- HELPER: Convert stored grams to currently selected UI unit ---
const convertUnit = (val: number, targetUnit: string) => {
  if (!val) return 0;
  if (targetUnit === "oz") return Number((val / 28.3495).toFixed(2));
  return Math.round(val);
};

// --- HELPER: Generate "Alive" & Professional Speech Text ---
// Updated to read detailed macros per item and sound like a real coach
const generateAnalysisSpeech = (
  data: any,
  globalUnit: string,
  isHistory: boolean = false,
) => {
  let narrative = "";

  // 1. Professional Intro
  if (isHistory) {
    const date = new Date(data.createdAt || data.date).toLocaleDateString(
      undefined,
      { weekday: "long", month: "short", day: "numeric" },
    );
    narrative += `Pulling up your nutrition record from ${date}. `;
  } else {
    narrative += "Analysis complete. ";
  }

  // 2. Total Context
  const cals = Math.round(
    data.macros?.calories || data.totalMacros?.calories || 0,
  );
  narrative += `This session totals ${cals} calories. `;

  // 3. Detailed Breakdown (Alive Aspect)
  if (data.foods && data.foods.length > 0) {
    narrative += "Here is the detailed nutritional breakdown. ";
    data.foods.forEach((f: any) => {
      // FIX: Determine correct path for macros based on context (Live vs History)
      let dCalories = 0,
        dProtein = 0,
        dCarbs = 0,
        dFats = 0;

      if (f.macros) {
        // Live Session Structure
        dCalories = f.macros.calories || 0;
        dProtein = f.macros.protein || 0;
        dCarbs = f.macros.carbs || 0;
        dFats = f.macros.fats || 0;
      } else {
        // History/Saved Structure
        dCalories = f.calories || 0;
        dProtein = f.protein || 0;
        dCarbs = f.carbs || 0;
        dFats = f.fats || 0;
      }

      // Conversational sentence for each item using the resolved variables
      narrative += `The ${f.name} contributes ${convertUnit(dCalories, globalUnit)} calories, providing ${convertUnit(dProtein, globalUnit)} protein, ${convertUnit(dCarbs, globalUnit)} carbs, and ${convertUnit(dFats, globalUnit)} fat. `;
    });
  }

  // 4. Expert Advice
  if (data.advice) narrative += `My professional assessment: ${data.advice} `;

  // 5. Activity Recommendation
  if (data.recommendedActivity)
    narrative += `To optimize your metabolic rate, consider ${data.recommendedActivity.name} for ${data.recommendedActivity.duration}. `;

  // 6. Goal-Based Suggestions
  if (data.recommendedFoods && data.recommendedFoods.length > 0) {
    const suggestions = data.recommendedFoods
      .slice(0, 3)
      .map((f: any) => f.name)
      .join(", ");
    narrative += `To better align with your specific fitness goals, I strongly recommend incorporating ${suggestions} into your next meal. `;
  }

  // 7. Motivation
  if (data.quote) narrative += `Remember: ${data.quote}`;

  return narrative;
};

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  // Voice State
  const [isListening, setIsListening] = useState(false);

  // App State
  const [foodList, setFoodList] = useState<any[]>([]);
  const [foodName, setFoodName] = useState("");
  const [weight, setWeight] = useState<string>("");
  const [unit, setUnit] = useState<"g" | "ml" | "oz">("g");
  const [aiResponse, setAiResponse] = useState<any>(null);

  // Autocomplete State
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // History & Editing State
  const [history, setHistory] = useState<any[]>([]);
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  // Status State
  const [loadingAI, setLoadingAI] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBluetoothActive, setIsBluetoothActive] = useState(false);

  // Initialize Speech Engine
  const { speak, stop } = useSpeech(user?.profile?.voicesex || "female");

  // --- 1. DATA PERSISTENCE & SYNC ---
  const fetchHistory = useCallback(async (authToken: string) => {
    try {
      // const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await axios.get(`/api/user/history?limit=10`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setHistory(res.data);
    } catch (err) {
      console.log("History fetch failed (likely offline)");
    }
  }, []);

  const syncOfflineData = useCallback(
    async (authToken: string) => {
      const offlineData = await getOfflineSessions();
      if (offlineData.length === 0) return;

      setIsSyncing(true);
      try {
        // const baseUrl = process.env.NEXT_PUBLIC_API_URL;
        await axios.post(
          `/api/user/sync`,
          { sessions: offlineData },
          {
            headers: { Authorization: `Bearer ${authToken}` },
          },
        );

        await clearSyncedSessions(offlineData.map((d: any) => d.id as number));
        await fetchHistory(authToken);
        speak("System online. Offline data has been synchronized.");
      } catch (err) {
        console.error("Sync to MongoDB failed", err);
      } finally {
        setIsSyncing(false);
      }
    },
    [fetchHistory, speak],
  );

  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (!t || !u) {
      router.push("/login");
      return;
    }

    setToken(t);
    setUser(JSON.parse(u));

    if (navigator.onLine) {
      fetchHistory(t);
    } else {
      setIsOffline(true);
    }

    const handleOnline = () => {
      setIsOffline(false);
      syncOfflineData(t);
    };
    const handleOffline = () => {
      setIsOffline(true);
      speak("Connection lost. Switching to local storage.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [router, syncOfflineData, fetchHistory, speak]);

  // --- 2. VOICE & WELCOME LOGIC ---
  useEffect(() => {
    if (user && user.name) {
      const hasWelcomed = sessionStorage.getItem("hasWelcomed");
      if (!hasWelcomed) {
        const hour = new Date().getHours();
        // Professional Time-based greeting
        const timeGreeting =
          hour < 12
            ? "Good morning"
            : hour < 18
              ? "Good afternoon"
              : "Good evening";

        setTimeout(() => {
          speak(
            `${timeGreeting}, ${user.name}. Your expert coach is ready. Please place an item on the scale to begin tracking.`,
          );
          sessionStorage.setItem("hasWelcomed", "true");
        }, 1000);
      }
    }
  }, [user, speak]);

  const handleVoiceInput = () => {
    stop();
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice input.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    setIsListening(true);
    recognition.start();

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setFoodName(transcript);
      setIsListening(false);
      speak(`I identified ${transcript}. Please confirm the weight.`);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  // --- 3. ACTIONS & CALCULATIONS ---
  const dailyStandard = useMemo(() => {
    if (!user?.profile) return { calories: 0, protein: 0, carbs: 0, fats: 0 };
    const { weight, height, age, sex, activityLevel, goal } = user.profile;

    let bmr =
      sex?.toLowerCase() === "male"
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;

    let multiplier = 1.2;
    if (activityLevel?.includes("Light")) multiplier = 1.375;
    else if (activityLevel?.includes("Moderate")) multiplier = 1.55;
    else if (activityLevel?.includes("Heavy")) multiplier = 1.725;
    else if (activityLevel?.includes("Athlete")) multiplier = 1.9;

    let targetCals = bmr * multiplier;
    let pPct = 0.3,
      cPct = 0.4,
      fPct = 0.3;

    if (goal === "Weight Loss") {
      targetCals -= 500;
      pPct = 0.4;
      cPct = 0.3;
      fPct = 0.3;
    } else if (goal === "Muscle Gain") {
      targetCals += 300;
      pPct = 0.3;
      cPct = 0.5;
      fPct = 0.2;
    }

    return {
      calories: Math.round(targetCals),
      protein: Math.round((targetCals * pPct) / 4),
      carbs: Math.round((targetCals * cPct) / 4),
      fats: Math.round((targetCals * fPct) / 9),
    };
  }, [user]);

  const todayIntake = useMemo(() => {
    const today = new Date().toDateString();
    return history.reduce(
      (acc, session) => {
        const sessionDate = new Date(
          session.createdAt || session.date,
        ).toDateString();
        if (sessionDate === today) {
          acc.calories +=
            session.macros?.calories || session.totalMacros?.calories || 0;
          acc.protein +=
            session.macros?.protein || session.totalMacros?.protein || 0;
          acc.carbs += session.macros?.carbs || session.totalMacros?.carbs || 0;
          acc.fats += session.macros?.fats || session.totalMacros?.fats || 0;
        }
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 },
    );
  }, [history]);

  const plateTotals = useMemo(() => {
    return foodList.reduce(
      (acc, curr) => ({
        calories: acc.calories + (curr.macros?.calories ?? curr.calories ?? 0),
        protein: acc.protein + (curr.macros?.protein ?? curr.protein ?? 0),
        carbs: acc.carbs + (curr.macros?.carbs ?? curr.carbs ?? 0),
        fats: acc.fats + (curr.macros?.fats ?? curr.fats ?? 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 },
    );
  }, [foodList]);

  const unsavedPlateTotals = useMemo(() => {
    return foodList
      .filter((item) => !item.isSaved)
      .reduce(
        (acc, curr) => ({
          calories:
            acc.calories + (curr.macros?.calories ?? curr.calories ?? 0),
          protein: acc.protein + (curr.macros?.protein ?? curr.protein ?? 0),
          carbs: acc.carbs + (curr.macros?.carbs ?? curr.carbs ?? 0),
          fats: acc.fats + (curr.macros?.fats ?? curr.fats ?? 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 },
      );
  }, [foodList]);

  const remainingMacros = useMemo(() => {
    return {
      calories: Math.max(
        0,
        dailyStandard.calories -
          todayIntake.calories -
          unsavedPlateTotals.calories,
      ),
      protein: Math.max(
        0,
        dailyStandard.protein -
          todayIntake.protein -
          unsavedPlateTotals.protein,
      ),
      carbs: Math.max(
        0,
        dailyStandard.carbs - todayIntake.carbs - unsavedPlateTotals.carbs,
      ),
      fats: Math.max(
        0,
        dailyStandard.fats - todayIntake.fats - unsavedPlateTotals.fats,
      ),
    };
  }, [dailyStandard, todayIntake, unsavedPlateTotals]);

  const currentInputMacros = useMemo(() => {
    if (!foodName || !weight) return null;
    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0) return null;

    let weightInGrams = w;
    if (unit === "oz") weightInGrams = w * 28.3495;
    if (unit === "ml") weightInGrams = w;

    const dbFood = foodDatabase.find(
      (f: any) => f.name.toLowerCase() === foodName.toLowerCase(),
    );
    if (!dbFood || !dbFood.macros) return null;

    return {
      calories: Math.round((dbFood.macros.calories * weightInGrams) / 100),
      protein: Math.round((dbFood.macros.protein * weightInGrams) / 100),
      carbs: Math.round((dbFood.macros.carbs * weightInGrams) / 100),
      fats: Math.round((dbFood.macros.fats * weightInGrams) / 100),
    };
  }, [foodName, weight, unit]);

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUnit(e.target.value as "g" | "ml" | "oz");
  };

  const handleAddFood = () => {
    // Smart Warning: Check for empty input
    if (!foodName || !weight) {
      speak(
        "I cannot add that. Please identify the food and its weight first.",
      );
      return;
    }

    const w = parseFloat(weight);
    let weightInGrams = w;
    if (unit === "oz") weightInGrams = w * 28.3495;
    if (unit === "ml") weightInGrams = w;

    const dbFood = foodDatabase.find(
      (f: any) => f.name.toLowerCase() === foodName.toLowerCase(),
    );
    let itemMacros = { calories: 0, protein: 0, carbs: 0, fats: 0 };

    if (dbFood && dbFood.macros) {
      itemMacros = {
        calories: Math.round((dbFood.macros.calories * weightInGrams) / 100),
        protein: Math.round((dbFood.macros.protein * weightInGrams) / 100),
        carbs: Math.round((dbFood.macros.carbs * weightInGrams) / 100),
        fats: Math.round((dbFood.macros.fats * weightInGrams) / 100),
      };
    }

    setFoodList([
      ...foodList,
      {
        name: foodName,
        weight: Math.round(weightInGrams),
        macros: itemMacros,
        isSaved: false,
      },
    ]);

    speak(`Added ${w} ${unit} of ${foodName} to the plate.`);
    setFoodName("");
    setWeight("");
  };

  const handleBluetoothConnect = async () => {
    try {
      const success = await connectScale((w) => {
        setWeight(w.toString());
        setUnit("g");
      });
      if (success) {
        speak("Scale connected.");
        setIsBluetoothActive(true);
      } else {
        speak("Connection failed.");
      }
    } catch (e) {
      speak("Error connecting.");
    }
  };

  const handleFoodNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFoodName(val);

    if (val.trim().length > 0) {
      const matches = foodDatabase
        .filter((food: any) =>
          food.name.toLowerCase().includes(val.toLowerCase()),
        )
        .slice(0, 5);
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (name: string) => {
    setFoodName(name);
    setShowSuggestions(false);
  };

  // --- EDIT & DELETE LOGIC ---
  const handleDeleteSession = async (id: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;
    try {
      // const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      await axios.delete(`/api/user/session/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory((prev) => prev.filter((s) => s._id !== id));
      if (openSessionId === id) setOpenSessionId(null);
      speak("Session successfully deleted.");
    } catch (err) {
      console.error("Delete failed", err);
      speak("Could not delete the session.");
    }
  };

  const handleEditSession = (session: any) => {
    setEditingSessionId(session._id || session.id);

    const hydratedFoods = session.foods.map((f: any) => {
      let itemMacros = { calories: 0, protein: 0, carbs: 0, fats: 0 };

      // nested macros ONLY if they actually contain data (> 0)
      if (f.macros?.calories > 0) {
        itemMacros = { ...f.macros };
      }
      // root level macros ONLY if they actually contain data (> 0)
      else if (f.calories > 0) {
        itemMacros = {
          calories: f.calories,
          protein: f.protein,
          carbs: f.carbs,
          fats: f.fats,
        };
      }
      // 3. If missing or 0, FORCE recalculation from the local foodDatabase
      else {
        const safeName = f.name?.trim().toLowerCase() || "";
        const dbFood = foodDatabase.find(
          (dbF: any) => dbF.name.trim().toLowerCase() === safeName,
        );
        const w = f.weight || 0;

        if (dbFood && dbFood.macros) {
          itemMacros = {
            calories: Math.round((dbFood.macros.calories * w) / 100),
            protein: Math.round((dbFood.macros.protein * w) / 100),
            carbs: Math.round((dbFood.macros.carbs * w) / 100),
            fats: Math.round((dbFood.macros.fats * w) / 100),
          };
        }
      }

      // Return the item with guaranteed macros attached to both standard locations
      return {
        ...f,
        macros: itemMacros,
        calories: itemMacros.calories,
        protein: itemMacros.protein,
        carbs: itemMacros.carbs,
        fats: itemMacros.fats,
        isSaved: false,
      };
    });

    setFoodList(hydratedFoods); // Put the recalculated items on the plate
    setOpenSessionId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    speak("Session loaded. You can now modify the items and save to update.");
  };

  const runAIAnalysis = async () => {
    const unsavedFoods = foodList.filter((f) => !f.isSaved);

    // Smart Warning: Check for empty plate
    if (foodList.length === 0 && unsavedFoods.length === 0) {
      speak(
        "Your plate appears empty. Please add a food item so I can perform the analysis.",
      );
      return;
    }

    setLoadingAI(true);
    stop();
    speak("Processing meal composition. Please wait a moment.");

    // --- UPDATED OFFLINE LOGIC ---
    if (isOffline) {
      // Map the state data to strictly match the MealLog interface in db.ts
      const offlineMealLog = {
        local_user_id: user?.id || user?._id || "guest",
        timestamp: new Date().toISOString(),
        total_calories: Number(plateTotals?.calories || 0),
        total_protein: Number(plateTotals?.protein || 0),
        total_carbs: Number(plateTotals?.carbs || 0),
        total_fat: Number(plateTotals?.fats || 0),
        meal_items: foodList || [],
      };

      try {
        // Save using the correctly mapped object
        await saveOfflineSession(offlineMealLog as any);

        // Update UI state to mark items as saved locally
        setFoodList((prev) => prev.map((item) => ({ ...item, isSaved: true })));
        setLoadingAI(false);
        if (editingSessionId) setEditingSessionId(null);
        speak(
          "Session saved locally. I will sync this when we are back online.",
        );
      } catch (error) {
        console.error("Failed to save offline:", error);
        speak("Storage error. Could not save session.");
        setLoadingAI(false);
      }
      return;
    }

    // --- ONLINE LOGIC ---
    // This is the payload structure your MongoDB API expects
    const sessionData = {
      foods: foodList,
      totalMacros: plateTotals,
      date: new Date().toISOString(),
      goal: user?.profile?.goal,
    };

    try {
      // const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      let response;

      if (editingSessionId) {
        response = await axios.put(
          `/api/user/session/${editingSessionId}`,
          sessionData,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setEditingSessionId(null);
      } else {
        response = await axios.post(`/api/user/session`, sessionData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setAiResponse({
        ...response.data,
        foods: foodList,
        totalMacros: plateTotals,
      });

      await fetchHistory(token!);
      setFoodList((prev) => prev.map((item) => ({ ...item, isSaved: true })));

      // Professional "Alive" Readout
      const speechText = generateAnalysisSpeech(
        { ...response.data, foods: foodList, totalMacros: plateTotals },
        unit,
        false,
      );
      speak(speechText);
    } catch (error) {
      speak("I encountered a service error. Please try again.");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleHistoryClick = (session: any) => {
    if (openSessionId === session._id) {
      setOpenSessionId(null);
      stop();
    } else {
      setOpenSessionId(session._id);
      // Play same professional readout for Past History
      const speechText = generateAnalysisSpeech(session, unit, true);
      speak(speechText);
    }
  };

  const closeHistory = () => {
    setOpenSessionId(null);
    stop();
  };

  if (!user)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="animate-spin text-emerald-500" />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-900 pb-24 text-slate-200 font-sans">
      {/* Onboarding only for new users */}
      {!(user.isProfileComplete || user.profile?.isProfileComplete) && (
        <OnboardingModal
          token={token}
          onComplete={(upd: any) => {
            const updatedUser = {
              ...user,
              profile: { ...upd, isProfileComplete: true }, // Added here to match backend
              isProfileComplete: true,
            };
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
            speak("Calibration complete. Welcome to your new lifestyle.");
          }}
        />
      )}

      <nav className="bg-slate-800 px-6 py-4 shadow-sm flex justify-between items-center sticky top-0 z-20 border-b border-slate-700">
        <div className="font-bold text-xl text-emerald-500 flex items-center gap-2 tracking-tight">
          <Activity size={24} /> SmartNutri
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleBluetoothConnect}
            className={`flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-full hover:bg-slate-600 transition-all border ${
              isBluetoothActive
                ? "bg-emerald-500/10 border-emerald-500 text-emerald-500"
                : "bg-slate-700 border-slate-600 text-slate-400"
            }`}
          >
            <Bluetooth
              size={14}
              className={isBluetoothActive ? "animate-pulse" : ""}
            />
            {isBluetoothActive ? "SCALE LINKED" : "LINK SCALE"}
          </button>
          <button
            onClick={() => router.push("/profile")}
            className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            <User size={20} />
          </button>
        </div>
      </nav>

      <main className="p-4 max-w-lg mx-auto space-y-6">
        {/* HEADER / METRICS */}
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Hi, {user.name}
            </h1>
            <p className="text-emerald-400 text-sm font-medium italic capitalize flex items-center gap-1">
              Target: {user.profile?.goal?.replace("_", " ") || "Maintenance"}
            </p>
            {isOffline && (
              <span className="text-rose-400 text-xs mt-1 block flex items-center gap-1 font-bold">
                <Volume2 size={12} /> OFFLINE MODE
              </span>
            )}
            {isSyncing && (
              <span className="text-emerald-400 text-xs mt-1 block flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" /> Syncing...
              </span>
            )}
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[#00ffa3] font-bold text-xs mb-2 uppercase tracking-widest opacity-80">
              Remaining Daily Targets
            </span>
            <div className="flex gap-2">
              <div className="bg-[#111827] px-3 py-1.5 rounded-xl border border-slate-800 flex flex-col items-center min-w-[44px]">
                <span className="text-[8px] uppercase font-bold text-slate-500 mb-0.5">
                  Calo
                </span>
                <span className="text-[#00ffa3] font-bold text-xs">
                  {convertUnit(remainingMacros.calories, unit)}
                  {unit}
                </span>
              </div>
              <div className="bg-[#111827] px-3 py-1.5 rounded-xl border border-slate-800 flex flex-col items-center min-w-[44px]">
                <span className="text-[8px] uppercase font-bold text-slate-500 mb-0.5">
                  Prot
                </span>
                <span className="text-[#3b82f6] font-bold text-xs">
                  {convertUnit(remainingMacros.protein, unit)}
                  {unit}
                </span>
              </div>
              <div className="bg-[#111827] px-3 py-1.5 rounded-xl border border-slate-800 flex flex-col items-center min-w-[44px]">
                <span className="text-[8px] uppercase font-bold text-slate-500 mb-0.5">
                  Carb
                </span>
                <span className="text-[#f59e0b] font-bold text-xs">
                  {convertUnit(remainingMacros.carbs, unit)}
                  {unit}
                </span>
              </div>
              <div className="bg-[#111827] px-3 py-1.5 rounded-xl border border-slate-800 flex flex-col items-center min-w-[44px]">
                <span className="text-[8px] uppercase font-bold text-slate-500 mb-0.5">
                  Fat
                </span>
                <span className="text-[#f43f5e] font-bold text-xs">
                  {convertUnit(remainingMacros.fats, unit)}
                  {unit}
                </span>
              </div>
            </div>
          </div>
        </header>

        <section className="bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-700">
          <div className="relative mb-4">
            <input
              value={foodName}
              onChange={handleFoodNameChange}
              onFocus={() =>
                foodName.trim().length > 0 && setShowSuggestions(true)
              }
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="What's on the plate?"
              className="w-full p-4 pr-12 rounded-2xl bg-slate-900 text-white outline-none focus:ring-2 focus:ring-emerald-500 border border-slate-700 placeholder:text-slate-500"
            />
            <button
              onClick={handleVoiceInput}
              className={`absolute right-3 top-3 p-2 rounded-full transition-all ${isListening ? "bg-red-500/20 text-red-500 animate-pulse" : "text-slate-400 hover:text-emerald-500"}`}
            >
              <Mic size={20} />
            </button>

            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-10 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto overflow-hidden">
                {suggestions.map((item, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleSuggestionClick(item.name)}
                    className="px-4 py-3 hover:bg-slate-700 cursor-pointer text-sm text-slate-200 border-b border-slate-700/50 last:border-0 flex justify-between items-center transition-colors"
                  >
                    <span className="capitalize font-medium">{item.name}</span>
                    {item.macros && (
                      <span className="text-[10px] text-emerald-500 font-mono bg-emerald-500/10 px-2 py-1 rounded-md">
                        {item.macros.calories} kcal / 100g
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0"
                className="w-full p-4 rounded-2xl bg-slate-900 text-white outline-none border border-slate-700 focus:ring-2 focus:ring-emerald-500 text-lg font-bold"
              />
              {isBluetoothActive && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                  LIVE
                </span>
              )}
            </div>
            <div className="relative">
              <select
                value={unit}
                onChange={handleUnitChange}
                className="w-20 h-full bg-emerald-700 hover:bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg font-bold text-sm transition-all uppercase appearance-none text-center outline-none cursor-pointer"
              >
                <option value="g">G</option>
                <option value="ml">ML</option>
                <option value="oz">OZ</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center px-1 text-white opacity-70">
                <ChevronRight size={14} className="rotate-90" />
              </div>
            </div>
            <button
              onClick={handleAddFood}
              className="w-16 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
            >
              <Plus size={24} />
            </button>
          </div>

          {currentInputMacros && (
            <div className="flex justify-between items-center text-xs font-mono font-bold bg-slate-900/50 p-3 rounded-xl border border-slate-700">
              <span className="text-slate-400 text-[10px] uppercase">
                Input Macros:
              </span>
              <div className="flex gap-3">
                <span className="text-[#00ffa3]">
                  {convertUnit(currentInputMacros.calories, unit)}
                  {unit}
                </span>
                <span className="text-[#3b82f6]">
                  {convertUnit(currentInputMacros.protein, unit)}
                  {unit}
                </span>
                <span className="text-[#f59e0b]">
                  {convertUnit(currentInputMacros.carbs, unit)}
                  {unit}
                </span>
                <span className="text-[#f43f5e]">
                  {convertUnit(currentInputMacros.fats, unit)}
                  {unit}
                </span>
              </div>
            </div>
          )}
        </section>

        <section className="bg-slate-800 rounded-3xl p-6 shadow-lg border border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
              <History size={16} className="text-emerald-500" /> Current Plate
            </h3>
            {foodList.some((f) => f.isSaved) && (
              <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20">
                Saved Items Visible
              </span>
            )}
          </div>

          <ul className="space-y-3 mb-6">
            {foodList.length === 0 && (
              <p className="text-slate-500 text-xs italic text-center py-4">
                Your plate is empty.
              </p>
            )}
            {foodList.map((item, idx) => (
              <li
                key={idx}
                className={`flex justify-between items-start text-sm p-3 rounded-xl border ${item.isSaved ? "bg-slate-900/30 border-slate-700/30 text-slate-400 opacity-80" : "bg-slate-900/50 border-slate-700/50 text-slate-300"}`}
              >
                <div className="w-full">
                  <div className="flex justify-between w-full mb-1">
                    <span
                      className={`capitalize font-bold text-base ${item.isSaved ? "text-slate-400" : "text-white"}`}
                    >
                      {item.name}{" "}
                      <span className="text-slate-400 font-normal text-sm">
                        ({convertUnit(item.weight, unit)}
                        {unit})
                      </span>
                    </span>
                    <button
                      onClick={() => {
                        setFoodList(foodList.filter((_, i) => i !== idx));
                        speak(`Removed ${item.name} from the plate.`);
                      }}
                    >
                      <Trash2
                        size={16}
                        className="text-rose-400 hover:text-rose-300 transition-colors"
                      />
                    </button>
                  </div>
                  <div className="gap-3 text-xs text-slate-400 font-mono mt-2 bg-slate-800/50 p-2 rounded-lg inline-flex flex-wrap border border-slate-700/50">
                    <span className="text-emerald-400 font-semibold">
                      Cals:{" "}
                      {convertUnit(
                        item.macros?.calories ?? item.calories ?? 0,
                        unit,
                      )}
                    </span>
                    <span className="text-blue-400">
                      Prot:{" "}
                      {convertUnit(
                        item.macros?.protein ?? item.protein ?? 0,
                        unit,
                      )}
                    </span>
                    <span className="text-amber-400">
                      Carb:{" "}
                      {convertUnit(item.macros?.carbs ?? item.carbs ?? 0, unit)}
                    </span>
                    <span className="text-rose-400">
                      Fat:{" "}
                      {convertUnit(item.macros?.fats ?? item.fats ?? 0, unit)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {foodList.length > 0 && (
            <div className="mb-6 p-4 bg-[#111827] rounded-xl border border-slate-700 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase border-b border-slate-700 pb-2">
                Total Food Macros (On Plate)
              </span>
              <div className="flex justify-between items-center text-sm font-mono font-bold pt-1">
                <span className="text-[#00ffa3]">
                  Cals: {convertUnit(plateTotals.calories, unit)}
                  {unit}
                </span>
                <span className="text-[#3b82f6]">
                  Prot: {convertUnit(plateTotals.protein, unit)}
                  {unit}
                </span>
                <span className="text-[#f59e0b]">
                  Carb: {convertUnit(plateTotals.carbs, unit)}
                  {unit}
                </span>
                <span className="text-[#f43f5e]">
                  Fat: {convertUnit(plateTotals.fats, unit)}
                  {unit}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={runAIAnalysis}
            disabled={loadingAI}
            className="w-full bg-[#00ffa3] hover:bg-[#00e693] text-slate-900 py-4 rounded-2xl font-black flex justify-center items-center gap-2 mt-6 transition-all shadow-[0_0_20px_rgba(0,255,163,0.3)] hover:shadow-[0_0_30px_rgba(0,255,163,0.5)] text-lg uppercase tracking-wider"
          >
            {loadingAI ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Sparkles size={20} />
            )}
            {editingSessionId ? "Update Meal Session" : "Analyze & Save Meal"}
          </button>

          {editingSessionId && (
            <button
              onClick={() => {
                setEditingSessionId(null);
                setFoodList([]);
                speak("Editing cancelled.");
              }}
              className="w-full mt-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white py-3.5 rounded-2xl font-bold transition-all text-sm uppercase tracking-wide"
            >
              Cancel Editing
            </button>
          )}
        </section>

        {/* LIVE ANALYSIS */}
        {aiResponse && (
          <div className="animate-in slide-in-from-bottom-5">
            <ReportCard
              data={aiResponse}
              globalUnit={unit}
              isHistory={false}
              onClose={() => {
                setAiResponse(null);
                stop();
              }}
            />
          </div>
        )}

        {/* RECENT SESSIONS SECTION */}
        <section className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Recent Activity
            </h3>
            {openSessionId && (
              <button
                onClick={closeHistory}
                className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 hover:text-emerald-400"
              >
                <X size={12} /> STOP & CLOSE
              </button>
            )}
          </div>

          <div className="space-y-3">
            {history.slice(0, 2).map((session, i) => (
              <div key={session._id || i} className="space-y-3">
                <button
                  onClick={() => handleHistoryClick(session)}
                  className={`w-full p-4 rounded-2xl border transition-all flex justify-between items-center ${
                    openSessionId === session._id
                      ? "bg-slate-700 border-emerald-500/50"
                      : "bg-slate-800 border-slate-700 hover:border-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900 rounded-lg text-emerald-500">
                      <History size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">
                        {new Date(session.createdAt).toLocaleDateString()} •{" "}
                        {new Date(session.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-xs text-slate-400">
                        {session.foods?.length} items •{" "}
                        {Math.round(
                          session.macros?.calories ||
                            session.totalMacros?.calories ||
                            0,
                        )}{" "}
                        kcal
                      </p>
                    </div>
                  </div>
                  {/* Playing Indicator */}
                  {openSessionId === session._id ? (
                    <Volume2
                      size={18}
                      className="text-emerald-400 animate-pulse"
                    />
                  ) : (
                    <ChevronRight size={18} className="text-slate-500" />
                  )}
                </button>

                {openSessionId === session._id && (
                  <div className="animate-in zoom-in-95 duration-300">
                    <ReportCard
                      data={session}
                      globalUnit={unit}
                      isHistory={true}
                      onEdit={handleEditSession}
                      onDelete={handleDeleteSession}
                      onClose={closeHistory}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

// UPDATED: ReportCard Component handling both Live & Past Analysis data structures
function ReportCard({
  data,
  globalUnit,
  onClose,
  isHistory,
  onEdit,
  onDelete,
}: {
  data: any;
  globalUnit: string;
  onClose?: () => void;
  isHistory: boolean;
  onEdit?: (session: any) => void;
  onDelete?: (id: string) => void;
}) {
  // Fallback for total session macros
  const macrosToUse = data.macros || data.totalMacros || {};

  return (
    <div className="bg-[#1a2332] rounded-3xl shadow-2xl border border-slate-800 overflow-hidden mb-4">
      {/* Header switches color based on History vs Live */}
      <div
        className={`${isHistory ? "bg-slate-700" : "bg-[#00a369]"} p-4 text-white flex justify-between items-center`}
      >
        <span className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
          <Sparkles size={16} />{" "}
          {isHistory ? "Past Analysis" : "Expert Analysis"}
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[10px] bg-white/10 hover:bg-white/20 transition-colors px-2 py-1 rounded-full uppercase font-bold"
          >
            Close
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* EDIT AND DELETE BUTTONS MOVED TO TOP (BELOW PAST ANALYSIS HEADER) */}
        {isHistory && onEdit && onDelete && (
          <div className="flex gap-3 pb-4 border-b border-slate-800/50">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(data);
              }}
              className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-colors border border-blue-500/20 uppercase tracking-wider"
            >
              <Edit2 size={14} /> Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(data._id || data.id);
              }}
              className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-colors border border-rose-500/20 uppercase tracking-wider"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}

        {/* Total Session Macros Grid */}
        <div className="grid grid-cols-4 gap-2">
          <MacroTile
            label="Cals"
            value={`${convertUnit(macrosToUse.calories || 0, globalUnit)}${globalUnit}`}
            color="text-[#00ffa3]"
          />
          <MacroTile
            label="Prot"
            value={`${convertUnit(macrosToUse.protein || 0, globalUnit)}${globalUnit}`}
            color="text-[#3b82f6]"
          />
          <MacroTile
            label="Carb"
            value={`${convertUnit(macrosToUse.carbs || 0, globalUnit)}${globalUnit}`}
            color="text-[#f59e0b]"
          />
          <MacroTile
            label="Fat"
            value={`${convertUnit(macrosToUse.fats || 0, globalUnit)}${globalUnit}`}
            color="text-[#f43f5e]"
          />
        </div>

        {/* DETAILED ITEM BREAKDOWN */}
        {data.foods && data.foods.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Info size={12} /> Nutritional Breakdown
            </h4>
            <div className="space-y-2">
              {data.foods.map((f: any, i: number) => {
                // CRASH & ZERO FIX: If database completely stripped the macro numbers, recalculate them instantly using the foodDatabase
                const dbFood = foodDatabase.find(
                  (dbF: any) =>
                    dbF.name.toLowerCase() === f.name?.toLowerCase(),
                );
                const w = f.weight || 0;

                const dCalories =
                  f.macros?.calories ||
                  f.calories ||
                  (dbFood ? Math.round((dbFood.macros.calories * w) / 100) : 0);
                const dProtein =
                  f.macros?.protein ||
                  f.protein ||
                  (dbFood ? Math.round((dbFood.macros.protein * w) / 100) : 0);
                const dCarbs =
                  f.macros?.carbs ||
                  f.carbs ||
                  (dbFood ? Math.round((dbFood.macros.carbs * w) / 100) : 0);
                const dFats =
                  f.macros?.fats ||
                  f.fats ||
                  (dbFood ? Math.round((dbFood.macros.fats * w) / 100) : 0);

                return (
                  <div
                    key={i}
                    className="flex flex-col p-3 bg-[#111827] rounded-xl border border-slate-800/50"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-slate-200 capitalize">
                        {f.name}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono bg-slate-800 border border-slate-700 px-2 py-1 rounded">
                        {convertUnit(f.weight, globalUnit)}
                        {globalUnit}
                      </span>
                    </div>

                    {/* Visual Macro Row per Item using the calculated variables */}
                    <div className="flex justify-between items-center text-sm font-mono pt-1">
                      <span className="text-emerald-400">
                        Cals: {convertUnit(dCalories, globalUnit)}
                      </span>
                      <span className="text-blue-400">
                        Prot: {convertUnit(dProtein, globalUnit)}
                      </span>
                      <span className="text-amber-400">
                        Carb: {convertUnit(dCarbs, globalUnit)}
                      </span>
                      <span className="text-rose-400">
                        Fat: {convertUnit(dFats, globalUnit)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Coach Advice */}
        {data.advice && (
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Expert Assessment
            </h4>
            <div className="p-4 bg-[#111827] rounded-2xl border border-slate-800/50 shadow-inner">
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {data.advice}
              </p>
            </div>
          </div>
        )}

        {/* Detailed Activity Balance */}
        {data.recommendedActivity && (
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Activity Balance Detail
            </h4>
            <div className="bg-[#111827] rounded-2xl border border-slate-800/50 overflow-hidden">
              <div className="p-4 flex items-start gap-3 border-b border-slate-800/50">
                <div className="p-2 bg-[#3b82f6]/10 rounded-lg">
                  <Dumbbell className="text-[#3b82f6]" size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200">
                    {data.recommendedActivity.name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Targeting {macrosToUse.calories > 500 ? "High" : "Moderate"}{" "}
                    Caloric Burn
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 p-3 gap-2">
                <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-xl">
                  <Timer size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-mono text-slate-300">
                    {data.recommendedActivity.duration || "30 mins"}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-xl">
                  <Zap size={14} className="text-amber-500" />
                  <span className="text-[10px] font-mono text-slate-300">
                    -{Math.round(macrosToUse.calories * 0.8 || 200)} kcal
                  </span>
                </div>
              </div>
              <p className="px-4 pb-4 text-[10px] text-slate-500 italic">
                This activity compensates for the glycemic load of your current
                plate.
              </p>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {data.recommendedFoods && data.recommendedFoods.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Goal-Based Suggestions
            </h4>
            <div className="space-y-2">
              {data.recommendedFoods.map((f: any, i: number) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-3 bg-[#111827] rounded-xl border border-slate-800/50"
                >
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-200 font-bold">
                      {f.name}{" "}
                      <span className="text-[10px] font-normal text-slate-500">
                        ({convertUnit(f.weight, globalUnit)}
                        {globalUnit})
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400 italic">
                      {f.reason}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quote Footer */}
      <div className="bg-[#111827]/50 p-4 text-center italic text-[10px] text-slate-500 border-t border-slate-800">
        "{data.quote || "Precision is the foundation of progress."}"
      </div>
    </div>
  );
}

function MacroTile({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-[#111827] p-3 rounded-xl border border-slate-800 flex flex-col items-center">
      <span className="text-[8px] uppercase font-bold text-slate-500 mb-0.5">
        {label}
      </span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
  );
}
