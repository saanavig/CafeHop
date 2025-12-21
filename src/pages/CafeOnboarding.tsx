import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Coffee, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Step = 1 | 2 | 3 | 4;

const CafeOnboarding = () => {
  const [step, setStep] = useState<Step>(1);
  const [cafeName, setCafeName] = useState("");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");
  const [posType, setPosType] = useState<"manual" | "square" | null>(null);
  const [linkedPOS, setLinkedPOS] = useState<"Square" | null>(null);
  const [posEmail, setPosEmail] = useState("");
  const [posPassword, setPosPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  const navigate = useNavigate();

  const next = () => {
    setStep((prev) => (prev < 4 ? ((prev + 1) as Step) : prev));
  };

  const back = () => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <Coffee className="h-8 w-8 text-caramel mx-auto mb-2" />
          <h1 className="font-display text-2xl font-bold">
            Café Setup ({step}/4)
          </h1>
          <p className="text-sm text-muted-foreground">
            Register your café and get started ☕
          </p>
        </div>

        {/* STEP 1 — Café Details */}
        {step === 1 && (
          <div className="space-y-4">
            <Input
              placeholder="Café name"
              value={cafeName}
              onChange={(e) => setCafeName(e.target.value)}
            />
            <Input
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <Input
              placeholder="Contact email or phone"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
            <Button
              className="w-full"
              onClick={next}
              disabled={!cafeName || !address || !contact}
            >
              Continue
            </Button>
          </div>
        )}

        {/* STEP 2 — POS Selection */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              How will you track loyalty rewards?
            </p>

            <div className="space-y-2">
              <Button
                variant={posType === "manual" ? "default" : "outline"}
                className="w-full"
                onClick={() => setPosType("manual")}
              >
                Manual (No POS)
              </Button>
              <Button
                variant={posType === "square" ? "default" : "outline"}
                className="w-full"
                onClick={() => setPosType("square")}
              >
                Square POS
              </Button>
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={back}>
                Back
              </Button>
              <Button
                className="w-full ml-2"
                onClick={next}
                disabled={!posType}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 — POS Linking (only if Square selected) */}
        {step === 3 && posType === "square" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Connect your Square account to track loyalty automatically
            </p>

            {!linkedPOS ? (
              <Button
                className="w-full"
                variant="outline"
                onClick={() => setLinkedPOS("Square")}
              >
                Connect Square
              </Button>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="POS Account Email"
                  value={posEmail}
                  onChange={(e) => setPosEmail(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="POS Account Password"
                  value={posPassword}
                  onChange={(e) => setPosPassword(e.target.value)}
                />
                <Input
                  placeholder="Business verification code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                />
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={back}>
                Back
              </Button>
              <Button
                className="w-full ml-2"
                onClick={next}
                disabled={!linkedPOS || !posEmail || !posPassword || !verificationCode}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 — Manual Setup Skip (if manual) */}
        {step === 3 && posType === "manual" && (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              You chose manual setup. Staff will add visits or points manually.
            </p>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={back}>
                Back
              </Button>
              <Button className="w-full ml-2" onClick={next}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4 — Confirmation */}
        {step === 4 && (
          <div className="space-y-6 text-center">
            <CheckCircle className="h-12 w-12 text-caramel mx-auto" />
            <h2 className="text-lg font-semibold">You're almost done!</h2>
            <p className="text-sm text-muted-foreground">
              Your café is registered. You’ll receive confirmation shortly. Once approved, you can start using CafeHop.
            </p>
            <Button className="w-full" onClick={() => navigate("/home")}>
              Finish Setup
            </Button>
            <Button variant="ghost" onClick={back}>
              Back
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CafeOnboarding;
