import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Coffee, CheckCircle, MapPin, Sun, Moon, Users, Leaf, Croissant, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Tag options for café description
const cafeTags = [
  { label: "Cozy", icon: Coffee },
  { label: "Quiet", icon: Moon },
  { label: "Lively", icon: Users },
  { label: "Outdoor seating", icon: Sun },
  { label: "Vegan-friendly", icon: Leaf },
  { label: "Great pastries", icon: Croissant },
  { label: "Instagrammable", icon: Camera },
];


type Step = 1 | 2 | 3 | 4 | 5 | 6;

const CafeOnboarding = () => {
  const [step, setStep] = useState<Step>(1);
  const navigate = useNavigate();

  // Step 1 — Core info
  const [cafeName, setCafeName] = useState("");
  const [address, setAddress] = useState("");
  const [contact_email, setContactEmail] = useState("");
  const [contact_phone, setContactPhone] = useState("");

  // Step 2 — Owner info
  const [ownerFirstName, setOwnerFirstName] = useState("");
  const [ownerLastName, setOwnerLastName] = useState("");

  // Step 3 — Café description tags
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Step 4 — Website / Social links
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");

  // Step 5 — Hours
  const [hours, setHours] = useState<{
    [day: string]: { open?: string; close?: string; closed?: boolean };
  }>({
    Mon: {},
    Tue: {},
    Wed: {},
    Thu: {},
    Fri: {},
    Sat: {},
    Sun: {},
  });

  // Step 6 — POS / Loyalty
  const [posType, setPosType] = useState<"manual" | "square" | null>(null);
  const [rewardThreshold, setRewardThreshold] = useState(10);
  const [rewardName, setRewardName] = useState("Free Coffee");
  const [addingReward, setAddingReward] = useState(false); // toggles the add reward form
  const [newReward, setNewReward] = useState({
    name: "",
    description: "",
    points: 0,
  }); // holds the inputs while adding
  const [rewards, setRewards] = useState<
    { name: string; description: string; points: number }[]
  >([]); // stores all added rewards

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };


  const next = () => setStep((prev) => (prev < 6 ? ((prev + 1) as Step) : prev));
  const back = () => setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));

  const progress = (step / 6) * 100;

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Coffee className="h-8 w-8 text-caramel mx-auto mb-2" />
          <h1 className="font-display text-2xl font-bold">
            Set Up Your Café
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Step {step} of 6
          </p>

          <div className="w-full bg-muted rounded-full h-2 mt-4">
            <div
              className="bg-caramel h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* ---------------- STEP 1 — Core info ---------------- */}
        {step === 1 && (
          <div className="space-y-4">
            <Input placeholder="Café name" value={cafeName} onChange={(e) => setCafeName(e.target.value)} />
            <Input placeholder="Café Address" value={address} onChange={(e) => setAddress(e.target.value)} />
            <Input placeholder="Contact Email" value={contact_email} onChange={(e) => setContactEmail(e.target.value)} />
            <Input placeholder="Contact Phone" value={contact_phone} onChange={(e) => setContactPhone(e.target.value)} />

            <div className="pt-4 flex gap-3">
              <Button variant="ghost" onClick={back}>Back</Button>
              <Button className="w-full" onClick={next} disabled={!cafeName || !address || !contact_email || !contact_phone}>Continue</Button>
            </div>
          </div>
        )}

        {/* ---------------- STEP 2 — Owner info ---------------- */}
        {step === 2 && (
          <div className="space-y-4">
            <Input placeholder="Business owner first name" value={ownerFirstName} onChange={(e) => setOwnerFirstName(e.target.value)} />
            <Input placeholder="Business owner last name" value={ownerLastName} onChange={(e) => setOwnerLastName(e.target.value)} />
            <div className="pt-4 flex gap-3">
              <Button variant="ghost" onClick={back}>Back</Button>
              <Button className="w-full" onClick={next} disabled={!ownerFirstName || !ownerLastName}>Continue</Button>
            </div>
          </div>
        )}

        {/* ---------------- STEP 3 — Café tags ---------------- */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">What describes your café? Select all that apply</p>
            <div className="grid grid-cols-2 gap-3">
              {cafeTags.map((tag) => {
                const active = selectedTags.includes(tag.label);
                return (
                  <button
                    key={tag.label}
                    type="button"
                    onClick={() => toggleTag(tag.label)}
                    className={`flex items-center gap-2 p-3 rounded-2xl border transition
                      ${active ? "border-caramel bg-caramel/10" : "border-border bg-card"}`}
                  >
                    <tag.icon className={`h-5 w-5 ${active ? "text-caramel" : "text-muted-foreground"}`} />
                    <span className="text-sm font-medium">{tag.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 flex gap-3">
              <Button variant="ghost" onClick={back}>Back</Button>
              <Button className="w-full" onClick={next} disabled={selectedTags.length === 0}>Continue</Button>
            </div>
          </div>
        )}

        {/* ---------------- STEP 4 — Website / Social ---------------- */}
        {step === 4 && (
          <div className="space-y-4">
            <Input placeholder="Website URL" value={website} onChange={(e) => setWebsite(e.target.value)} />
            <Input placeholder="Instagram link" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
            <Input placeholder="Facebook link" value={facebook} onChange={(e) => setFacebook(e.target.value)} />

            <div className="pt-4 flex gap-3">
              <Button variant="ghost" onClick={back}>Back</Button>
              <Button className="w-full" onClick={next}>Continue</Button>
            </div>
          </div>
        )}

        {/* ---------------- STEP 5 — Hours ---------------- */}
        {step === 5 && (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Set your café hours. Check "Closed" if the café is not open on a day.
            </p>

            <div className="space-y-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                const dayHours = hours[day] || {};
                const isClosed = dayHours.closed;

                return (
                  <div key={day} className="flex items-center gap-3">
                    {/* Day label */}
                    <span className="w-24 font-medium">{day}</span>

                    {/* Open time */}
                    <input
                      type="time"
                      value={dayHours.open || ""}
                      onChange={(e) =>
                        setHours((prev) => ({
                          ...prev,
                          [day]: { ...prev[day], open: e.target.value },
                        }))
                      }
                      disabled={isClosed}
                      className="border border-gray-300 rounded px-2 py-1 w-36"
                    />

                    <span className="text-sm font-medium">to</span>

                    {/* Close time */}
                    <input
                      type="time"
                      value={dayHours.close || ""}
                      onChange={(e) =>
                        setHours((prev) => ({
                          ...prev,
                          [day]: { ...prev[day], close: e.target.value },
                        }))
                      }
                      disabled={isClosed}
                      className="border border-gray-300 rounded px-2 py-1 w-36"
                    />

                    {/* Closed checkbox */}
                    <label className="ml-4 flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={isClosed || false}
                        onChange={(e) =>
                          setHours((prev) => ({
                            ...prev,
                            [day]: { ...prev[day], closed: e.target.checked },
                          }))
                        }
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      Closed
                    </label>
                  </div>
                );
              })}
            </div>

            {/* Navigation buttons */}
            <div className="pt-6 flex gap-3">
              <Button variant="ghost" onClick={back}>Back</Button>
              <Button
                className="w-full"
                onClick={next}
                disabled={Object.values(hours).some((d) => !d.closed && (!d.open || !d.close))}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

{/* ---------------- STEP 6 — Manual Loyalty ---------------- */}
{/* ---------------- STEP 6 — Manual Loyalty ---------------- */}
{step === 6 && (
  <div className="space-y-5">
    <p className="text-sm text-muted-foreground">
      Track customer visits and reward them! Add rewards now or edit them later.
    </p>

    {/* Manual Tracking */}
    <Button
      variant="default"
      className="w-full"
      onClick={() => setPosType("manual")}
    >
      Manual Tracking Enabled
    </Button>

    {/* Rewards */}
    {posType === "manual" && (
      <div className="mt-4 space-y-3">
        {/* Add reward button */}
        {!addingReward && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setAddingReward(true)}
          >
            + Add Reward
          </Button>
        )}

        {/* Add reward form */}
        {addingReward && (
          <div className="space-y-2 p-4 border rounded-lg bg-card">
            <Input
              placeholder="Reward Name"
              value={newReward.name}
              onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
            />
            <Input
              placeholder="Description / Condition"
              value={newReward.description}
              onChange={(e) =>
                setNewReward({ ...newReward, description: e.target.value })
              }
            />
            <Input
              type="number"
              placeholder="Points needed"
              value={newReward.points}
              onChange={(e) =>
                setNewReward({ ...newReward, points: Math.max(0, Number(e.target.value)) })
              }
            />
            <div className="flex gap-2 mt-2">
              <Button
                className="flex-1"
                onClick={() => {
                  setRewards([...rewards, newReward]);
                  setNewReward({ name: "", description: "", points: 0 });
                  setAddingReward(false);
                }}
                disabled={!newReward.name || !newReward.points}
              >
                Save Reward
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setAddingReward(false);
                  setNewReward({ name: "", description: "", points: 0 });
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Editing state for rewards */}
        {rewards.length > 0 && (
          <RewardList
            rewards={rewards}
            setRewards={setRewards}
          />
        )}
      </div>
    )}

    {/* Navigation buttons */}
    <div className="pt-4 flex gap-3">
      <Button variant="ghost" onClick={back}>Back</Button>
      <Button
        className="w-full"
        onClick={() => navigate("/home")}
        disabled={posType !== "manual"}
      >
        Finish Setup
      </Button>
    </div>
  </div>
)}

        {/* ---------------- OPTIONAL FINAL STEP / CONFIRMATION ---------------- */}
        {step === 6 && posType && rewardName && (
          <motion.div className="text-center mt-6">
            <CheckCircle className="h-12 w-12 text-caramel mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">You're all set! Your café profile is ready.</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default CafeOnboarding;

type Reward = { name: string; description: string; points: number };

const RewardList = ({
  rewards,
  setRewards,
}: {
  rewards: Reward[];
  setRewards: React.Dispatch<React.SetStateAction<Reward[]>>;
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editReward, setEditReward] = useState<Reward>({ name: "", description: "", points: 0 });

  return (
    <div className="space-y-2 mt-2">
      {rewards.map((r, idx) => (
        <div key={idx} className="border rounded-lg bg-card p-3">
          {editingIndex === idx ? (
            <div className="space-y-2">
              <Input
                placeholder="Reward Name"
                value={editReward.name}
                onChange={(e) => setEditReward({ ...editReward, name: e.target.value })}
              />
              <Input
                placeholder="Description / Condition"
                value={editReward.description}
                onChange={(e) => setEditReward({ ...editReward, description: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Points needed"
                value={editReward.points}
                onChange={(e) =>
                  setEditReward({ ...editReward, points: Math.max(0, Number(e.target.value)) })
                }
              />
              <div className="flex gap-2 mt-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    const updated = [...rewards];
                    updated[idx] = editReward;
                    setRewards(updated);
                    setEditingIndex(null);
                  }}
                >
                  Save
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setEditingIndex(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{r.name}</p>
                <p className="text-sm text-muted-foreground">{r.description}</p>
                <p className="text-sm text-muted-foreground">Points: {r.points}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingIndex(idx);
                    setEditReward(r);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setRewards((prev) => prev.filter((_, i) => i !== idx))}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};