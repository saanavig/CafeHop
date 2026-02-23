import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Settings, 
  Bell, 
  CreditCard, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  Star,
  Coffee,
  Store,
  History
} from "lucide-react";
import { useNavigate } from "react-router-dom";


type AccountProps = {
  role: "customer" | "cafe";
};

const Account = ({ role }: AccountProps) => {
  const navigate = useNavigate();

  // Menu items differ slightly depending on role
  const customerMenu = [
    { icon: Bell, label: "Notifications", desc: "Manage alerts", path: "/notifications" },
    { icon: History, label: "Visit History", desc: "Your past café visits", path: "/history" },
    // { icon: CreditCard, label: "Payment Methods", desc: "Cards & wallets", path: "/payments" },
    // { icon: Star, label: "Favorites", desc: "Saved cafés", path: "/favorites" },
    { icon: Settings, label: "Account Settings", desc: "App preferences", path: "/preferences" },
    { icon: HelpCircle, label: "Help & Support", desc: "FAQs & contact", path: "/help" },
  ];

  const cafeMenu = [
    { icon: Bell, label: "Customer Visits", desc: "Track visits & points", path: "/notifications" },
    { icon: CreditCard, label: "POS Systems", desc: "Manage cafe transactions", path: "/payments" },
    { icon: Settings, label: "Cafe Settings", desc: "Update info & preferences", path: "/preferences" },
    { icon: HelpCircle, label: "Support", desc: "FAQs & contact", path: "/help" },
  ];

  const menuItems = role === "customer" ? customerMenu : cafeMenu;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-hero-gradient px-4 pt-8 pb-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto text-center"
        >
          {/* Profile Avatar */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-caramel to-primary flex items-center justify-center shadow-elevated"
          >
            {role === "customer" ? (
              <User className="h-10 w-10 text-primary-foreground" />
            ) : (
              <Store className="h-10 w-10 text-primary-foreground" />
            )}
          </motion.div>
          
          <h1 className="font-display text-2xl font-bold mb-1">
            {role === "customer" ? "Welcome back!" : "Cafe Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground mb-2">
            {role === "customer" ? "cafe.hopper@email.com" : "The Roastery"}
          </p>
          
          <div className="inline-flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border">
            {role === "customer" ? (
              <>
                <Coffee className="h-4 w-4 text-caramel" />
                <span className="text-sm font-medium">Explorer Status</span>
                <span className="text-sm text-caramel font-bold">1,250 pts</span>
              </>
            ) : (
              <>
                <Store className="h-4 w-4 text-caramel" />
                <span className="text-sm font-medium">Cafe Tier</span>
                <span className="text-sm text-caramel font-bold">Gold</span>
              </>
            )}
          </div>
        </motion.div>
      </header>

      {/* Content */}
      <main className="px-4 max-w-lg mx-auto -mt-2">
        {/* Menu */}
        <section className="py-4">
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {menuItems.map((item, index) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted transition-colors border-b border-border last:border-b-0"
                onClick={() => navigate(item.path)}
              >
                <div className="p-2 bg-muted rounded-xl">
                  <item.icon className="h-5 w-5 text-caramel" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </motion.button>
            ))}
          </div>
        </section>

        {/* Logout */}
        <section className="py-4">
          <Button
            variant="outline"
            className="w-full justify-center gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              // later: clear auth token / user state
              navigate("/splash");
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </section>

        {/* App Info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-muted-foreground py-4"
        >
          CafeHop v1.0.0 • Made with ☕
        </motion.p>
      </main>

      <BottomNav role={role} />
    </div>
  );
};

export default Account;
