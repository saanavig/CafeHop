import { Button } from "@/components/ui/button";
import { Coffee, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";

const OnboardingRole = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-2xl font-bold">How will you use CafeHop?</h1>

        <Button
          variant="outline"
          className="w-full flex items-center gap-3 justify-center"
          onClick={() => navigate("/onboarding/customer")}
        >
          <Coffee className="h-5 w-5" />
          I’m a customer
        </Button>

        <Button
          variant="outline"
          className="w-full flex items-center gap-3 justify-center"
          onClick={() => navigate("/onboarding/cafe")}
        >
          <Store className="h-5 w-5" />
          I own a café
        </Button>
      </div>
    </div>
  );
};

export default OnboardingRole;
