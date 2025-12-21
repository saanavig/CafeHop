import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MapPin, Wifi, Plug, Camera, Moon, Laptop } from "lucide-react";
import { useNavigate } from "react-router-dom";

const preferencesList = [
  { label: "WiFi", icon: Wifi },
  { label: "Power outlets", icon: Plug },
  { label: "Quiet", icon: Moon },
  { label: "Study-friendly", icon: Laptop },
  { label: "Instagrammable", icon: Camera },
  { label: "Late-night", icon: Moon },
];

const CustomerOnboarding = () => {
  const navigate = useNavigate();
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);
  const [locationAllowed, setLocationAllowed] = useState(false);

  const togglePref = (pref: string) => {
    setSelectedPrefs((prev) =>
      prev.includes(pref)
        ? prev.filter((p) => p !== pref)
        : [...prev, pref]
    );
  };

  return (
    <div className="min-h-screen bg-background px-6 py-8 flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto w-full flex-1"
      >
        <h1 className="font-display text-2xl font-bold mb-2">
          Customize your café experience
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Pick what matters most to you — we’ll tailor recommendations.
        </p>

        {/* Preferences */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {preferencesList.map((pref) => {
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
                    active ? "text-caramel" : "text-muted-foreground"
                  }`}
                />
                <span className="text-sm font-medium">{pref.label}</span>
              </button>
            );
          })}
        </div>

        {/* Location */}
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
            {locationAllowed ? "Location enabled" : "Allow location"}
          </Button>
        </div>
      </motion.div>

      {/* Continue */}
      <div className="max-w-lg mx-auto w-full">
        <Button
          className="w-full"
          disabled={!locationAllowed}
          onClick={() => navigate("/home")}
        >
          Finish onboarding
        </Button>
      </div>
    </div>
  );
};

export default CustomerOnboarding;
