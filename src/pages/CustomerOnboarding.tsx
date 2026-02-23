import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Wifi,
  Plug,
  Camera,
  Moon,
  Laptop,
  Coffee,
  Users,
  Sun,
  Briefcase,
  Leaf,
  Sunrise,
  Croissant,
  DollarSign,
  Wallet,
  CreditCard,
  GraduationCap,
  Banknote,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const preferenceCategories = [
  {
    title: "Atmosphere",
    items: [
      { label: "Quiet", icon: Moon },
      { label: "Cozy", icon: Coffee },
      { label: "Lively", icon: Users },
      { label: "Outdoor seating", icon: Sun },
    ],
  },
  {
    title: "Work-Friendly",
    items: [ 
      { label: "WiFi", icon: Wifi },
      { label: "Power outlets", icon: Plug },
      { label: "Study-friendly", icon: Laptop },
      { label: "Good for meetings", icon: Briefcase },
    ],
  },
  {
    title: "Food & Drinks",
    items: [
      { label: "Great pastries", icon: Croissant },
      { label: "Vegan options", icon: Leaf },
      { label: "Specialty drinks", icon: Coffee },
    ],
  },
  {
    title: "Vibe",
    items: [
      { label: "Instagrammable", icon: Camera },
      { label: "Late-night", icon: Moon },
      { label: "Early morning", icon: Sunrise },
    ],
  },
  {
    title: "Budget",
    items: [
      { label: "$ (Budget-friendly)", icon: DollarSign },
      { label: "$$ (Moderate)", icon: Wallet },
      { label: "$$$ (Premium)", icon: CreditCard },
      { label: "Student discounts", icon: GraduationCap },
      { label: "Accepts cash", icon: Banknote },
    ],
  },
];

const CustomerOnboarding = () => {
  const navigate = useNavigate();

  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);
  const [locationAllowed, setLocationAllowed] = useState(false);
  const [step, setStep] = useState(0);

  const togglePref = (pref: string) => {
    setSelectedPrefs((prev) =>
      prev.includes(pref)
        ? prev.filter((p) => p !== pref)
        : [...prev, pref]
    );
  };

  const currentCategory = preferenceCategories[step];

  const totalSteps = preferenceCategories.length + 1; // +1 for location

  return (
    <div className="min-h-screen bg-background px-6 py-8 pb-24 flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto w-full"
      >
        <h1 className="font-display text-2xl font-bold mb-2">
          Customize your café experience
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          Step {step + 1} of {totalSteps}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-border h-2 rounded-full mb-8">
          <div
            className="bg-caramel h-2 rounded-full transition-all"
            style={{
              width: `${((step + 1) / totalSteps) * 100}%`,
            }}
          />
        </div>

        {/* Back Button */}
        {step > 0 && (
          <button
            onClick={() => setStep((prev) => prev - 1)}
            className="text-sm text-muted-foreground mb-4"
          >
            Back
          </button>
        )}

        {/* Preference Steps */}
        {step < preferenceCategories.length && (
          <motion.div
            key={currentCategory.title}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold mb-4">
              {currentCategory.title}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {currentCategory.items.map((pref) => {
                const active = selectedPrefs.includes(pref.label);

                return (
                  <button
                    key={pref.label}
                    onClick={() => togglePref(pref.label)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border transition
                      ${
                        active
                          ? "border-caramel bg-caramel/10"
                          : "border-border bg-card"
                      }`}
                  >
                    <pref.icon
                      className={`h-5 w-5 ${
                        active
                          ? "text-caramel"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-sm font-medium">
                      {pref.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Location Step */}
        {step === preferenceCategories.length && (
          <div className="bg-card border border-border rounded-2xl p-4 mb-8">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="h-5 w-5 text-caramel" />
              <p className="font-medium">Enable location</p>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Find cafés near you and see what’s open.
            </p>
            <Button
              variant={locationAllowed ? "outline" : "caramel"}
              className="w-full"
              onClick={() => setLocationAllowed(true)}
            >
              {locationAllowed
                ? "Location enabled"
                : "Allow location"}
            </Button>
          </div>
        )}
      </motion.div>

      {/* Continue / Finish Button */}
      <div className="max-w-lg mx-auto w-full sticky bottom-6">
        <Button
          className="w-full shadow-lg"
          onClick={() => {
            if (step < preferenceCategories.length) {
              setStep((prev) => prev + 1);
            } else {
              navigate("/home");
            }
          }}
          disabled={
            step === preferenceCategories.length &&
            !locationAllowed
          }
        >
          {step < preferenceCategories.length
            ? "Continue"
            : "Finish"}
        </Button>
      </div>
    </div>
  );
};

export default CustomerOnboarding;