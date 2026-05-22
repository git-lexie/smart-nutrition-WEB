"use client";

import { useState } from "react";
import axios from "axios";
import { Volume2, Check, Ruler, Scale, User, Activity } from "lucide-react";

interface OnboardingProps {
  token: string | null;
  onComplete: (profileData: any) => void;
}

export default function OnboardingModal({
  token,
  onComplete,
}: OnboardingProps) {
  // Local state for the form
  const [formData, setFormData] = useState({
    age: "",
    sex: "Male",
    height: "",
    weight: "",
    activityLevel: "Moderate",
    goal: "Weight Loss",
    voicesex: "female", // Default AI Voice
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      // 1. Send data to Backend
      await axios.put(`${baseUrl}/api/user/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // 2. Trigger completion in Parent (HomePage)
      onComplete(formData);
    } catch (error) {
      alert("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-[#1e293b] border border-slate-700 rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Welcome
          </h2>
          <p className="text-slate-400 text-sm">
            Let's calibrate your AI Nutrition Coach.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Row 1: Age & sex */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <User size={12} /> Age
              </label>
              <input
                type="number"
                required
                value={formData.age}
                onChange={(e) =>
                  setFormData({ ...formData, age: e.target.value })
                }
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-600"
                placeholder="Years"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">
                sex
              </label>
              <select
                value={formData.sex}
                onChange={(e) =>
                  setFormData({ ...formData, sex: e.target.value })
                }
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white outline-none cursor-pointer"
              >
                <option>Male</option>
                <option>Female</option>
                <option>Intersex</option>
              </select>
            </div>
          </div>

          {/* Row 2: Height & Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Ruler size={12} /> Height
              </label>
              <input
                type="number"
                required
                value={formData.height}
                onChange={(e) =>
                  setFormData({ ...formData, height: e.target.value })
                }
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="cm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Scale size={12} /> Weight
              </label>
              <input
                type="number"
                required
                value={formData.weight}
                onChange={(e) =>
                  setFormData({ ...formData, weight: e.target.value })
                }
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="kg"
              />
            </div>
          </div>

          {/* Row 3: Goal */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
              <Activity size={12} /> Primary Goal
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["Weight Loss", "Maintenance", "Muscle Gain"].map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => setFormData({ ...formData, goal })}
                  className={`p-2 rounded-xl text-[10px] font-bold border transition-all ${
                    formData.goal === goal
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                      : "bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>

          {/* Row 4: AI Voice Selection */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-2">
              <Volume2 size={12} /> Select AI Coach Voice
            </label>
            <div className="flex gap-4">
              {["Male", "Female"].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, voicesex: v.toLowerCase() })
                  }
                  className={`flex-1 p-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                    formData.voicesex === v.toLowerCase()
                      ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span className="text-sm font-bold">{v}</span>
                  {formData.voicesex === v.toLowerCase() && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl mt-4 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-emerald-900/20 uppercase tracking-widest text-sm"
          >
            {loading ? "Calibrating..." : "Start Your Journey"}
          </button>
        </form>
      </div>
    </div>
  );
}
