import { Home, Compass, Gift, Clock, User } from "lucide-react";
import { motion } from "framer-motion";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

interface BottomNavProps {
  role?: "customer" | "cafe";
}

const allNavItems: NavItem[] = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Compass, label: "Explore", path: "/explore" },
  { icon: Gift, label: "Rewards", path: "/rewards" },
  { icon: Clock, label: "History", path: "/history" },
  { icon: User, label: "Account", path: "/account" },
];

const BottomNav = ({ role = "customer" }: BottomNavProps) => {
  const navItems =
    role === "cafe"
      ? allNavItems.filter((item) => item.label !== "Explore")
      : allNavItems;

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border px-2 pb-safe"
    >
      <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.path}
              className="flex flex-col items-center gap-1 py-3 px-5 rounded-full transition-colors bg-card text-muted-foreground"
              activeClassName="bg-caramel text-white"
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default BottomNav;
