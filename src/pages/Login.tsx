import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md w-full space-y-6 bg-card p-6 rounded-2xl border border-border shadow-soft">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold mb-1">Welcome back ☕</h1>
          <p className="text-sm text-muted-foreground">
            Log in to continue exploring cafés
          </p>
        </div>

        {/* Email */}
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Forgot password */}
        <div className="text-right">
          <button
            className="text-sm text-caramel hover:underline"
            onClick={() => alert("Password reset link sent! (demo)")}
          >
            Forgot password?
          </button>
        </div>

        {/* Login button */}
        <Button
          className="w-full"
          onClick={() => navigate("/explore")}
        >
          Log In
        </Button>

        {/* Sign up link */}
        <p className="text-center text-sm text-muted-foreground">
          Don’t have an account?{" "}
          <button
            className="text-caramel font-medium hover:underline"
            onClick={() => navigate("/signup")}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
