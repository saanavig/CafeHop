import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Coffee } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Splash = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-hero-gradient flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md"
      >
        <div className="mx-auto w-20 h-20 rounded-2xl bg-caramel/20 flex items-center justify-center mb-6">
          <Coffee className="h-10 w-10 text-caramel" />
        </div>

        <h1 className="font-display text-4xl font-bold mb-3">CafeHop</h1>
        <p className="text-muted-foreground mb-8">
          Discover cafés. Earn rewards. Build community.
        </p>

        <div className="space-y-3">
          <Button
            variant="caramel"
            size="lg"
            className="w-full"
            onClick={() => navigate("/login")}
          >
            Log In
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Splash;
