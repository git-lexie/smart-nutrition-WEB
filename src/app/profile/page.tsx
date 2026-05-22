"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Save, LogOut, Volume2 } from "lucide-react"; // Added Volume2 icon

export default function ProfilePage() {
  const router = useRouter();

  // State matches the MongoDB UserSchema profile object
  const [data, setData] = useState<any>({
    name: "",
    email: "",
    age: "",
    height: "",
    weight: "",
    sex: "Other",
    activityLevel: "Sedentary (office job)",
    goal: "Maintenance",
    voicesex: "female", // NEW: Added Voice Preference state
  });

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const userString = localStorage.getItem("user");

    if (!t || !userString) {
      return router.push("/login");
    }

    const u = JSON.parse(userString);
    setToken(t);

    // Hydrate state. If profile fields are missing in DB, we use defaults.
    setData({
      name: u.name || "",
      email: u.email || "",
      age: u.profile?.age || "",
      height: u.profile?.height || "",
      weight: u.profile?.weight || "",
      sex: u.profile?.sex || "Other",
      activityLevel: u.profile?.activityLevel || "Sedentary (office job)",
      goal: u.profile?.goal || "Maintenance",
      voicesex: u.profile?.voicesex || "female", // NEW: Hydrate Voice Preference
    });
  }, [router]);

  const handleUpdate = async () => {
    if (!token) return;
    setLoading(true);

    try {
      // const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      // 1. Send update to Backend
      const response = await axios.put(`/api/user/profile`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        // 2. Update LocalStorage so the changes reflect on the Dashboard immediately
        const oldUserData = JSON.parse(localStorage.getItem("user") || "{}");
        const updatedUser = {
          ...oldUserData,
          profile: {
            ...oldUserData.profile,
            ...data,
            isProfileComplete: true,
          },
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));

        // NEW: Audio Feedback on Save
        const utterance = new SpeechSynthesisUtterance(
          "Profile settings updated.",
        );
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find((v) =>
          data.voicesex === "male"
            ? v.name.includes("Male") || v.name.includes("David")
            : v.name.includes("Female") ||
              v.name.includes("Zira") ||
              v.name.includes("Google US"),
        );
        if (preferredVoice) utterance.voice = preferredVoice;
        window.speechSynthesis.speak(utterance);

        alert("Profile updated successfully!");
        router.push("/"); // Redirect to dashboard after saving
      }
    } catch (error: any) {
      console.error("Update failed:", error);
      const msg = error.response?.data?.message || "Failed to save profile.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const goals = ["Weight Loss", "Maintenance", "Muscle Gain"];
  const sexs = ["Male", "Female", "Intersex"]; // Added Intersex option
  const activityLevels = [
    "Sedentary (office job)",
    "Light Exercise (1-2 days/week)",
    "Moderate Exercise (3-5 days/week)",
    "Heavy Exercise (6-7 days/week)",
    "Athlete (2x per day)",
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 transition-colors duration-300">
      <div className="max-w-md mx-auto bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full dark:text-white transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold dark:text-white">
            Account Settings
          </h1>
          <div className="w-10"></div>
        </div>

        <div className="space-y-6">
          {/* Read-Only Info */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
              Account Info
            </label>
            <input
              value={data.name}
              disabled
              className="w-full p-3 bg-slate-100 dark:bg-slate-900/50 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed border-none"
            />
            <p className="text-xs text-slate-400 ml-1">{data.email}</p>
          </div>

          <hr className="border-slate-100 dark:border-slate-700" />

          {/* NEW: AI Coach Voice Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-emerald-500 uppercase ml-1 flex items-center gap-1">
              <Volume2 size={12} /> AI Coach Voice
            </label>
            <div className="flex gap-2">
              {["Male", "Female"].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() =>
                    setData({ ...data, voicesex: v.toLowerCase() })
                  }
                  className={`flex-1 py-2 text-sm rounded-xl border transition-all ${
                    data.voicesex === v.toLowerCase()
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                      : "border-slate-200 dark:border-slate-700 dark:text-slate-300"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Physical Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                Age
              </label>
              <input
                type="number"
                value={data.age}
                onChange={(e) => setData({ ...data, age: e.target.value })}
                className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                Height (cm)
              </label>
              <input
                type="number"
                value={data.height}
                onChange={(e) => setData({ ...data, height: e.target.value })}
                className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                Weight (kg)
              </label>
              <input
                type="number"
                value={data.weight}
                onChange={(e) => setData({ ...data, weight: e.target.value })}
                className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* sex Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
              sex
            </label>
            <div className="flex gap-2">
              {sexs.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setData({ ...data, sex: g })}
                  className={`flex-1 py-2 text-sm rounded-xl border transition-all ${
                    data.sex === g
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                      : "border-slate-200 dark:border-slate-700 dark:text-slate-300"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Level */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
              Activity Level
            </label>
            <select
              value={data.activityLevel}
              onChange={(e) =>
                setData({ ...data, activityLevel: e.target.value })
              }
              className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {activityLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          {/* Goal Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
              Fitness Goal
            </label>
            <div className="space-y-2">
              {goals.map((g) => (
                <label
                  key={g}
                  className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${data.goal === g ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10" : "border-slate-200 dark:border-slate-700"}`}
                >
                  <input
                    type="radio"
                    name="goal"
                    checked={data.goal === g}
                    onChange={() => setData({ ...data, goal: g })}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="ml-3 text-sm dark:text-white font-medium">
                    {g}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-4 space-y-3">
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all active:scale-95 disabled:opacity-50"
            >
              <Save size={20} /> {loading ? "Updating..." : "Save Changes"}
            </button>

            <button
              onClick={() => {
                localStorage.clear();
                router.push("/login");
              }}
              className="w-full text-red-500 py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
