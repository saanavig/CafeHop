import { motion } from "framer-motion";
import { ArrowLeft, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Favorites = () => {
  const navigate = useNavigate();

  // Placeholder favorite cafes
  const favoriteCafes = [
    { name: "Daily Grind", location: "Brooklyn, NY" },
    { name: "Bean There", location: "Queens, NY" },
    { name: "Java Junction", location: "Manhattan, NY" },
  ];

  return (
    <div className="min-h-screen bg-background px-4">
      {/* Header */}
      <header className="flex items-center gap-3 py-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-muted transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold">Favorites</h1>
      </header>

      <main className="max-w-lg mx-auto space-y-6">
        <section>
          <p className="text-sm font-medium mb-2">Your Favorite Cafés</p>

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {favoriteCafes.map((cafe, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 border-b border-border last:border-b-0 hover:bg-muted transition"
              >
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-caramel" />
                  <div>
                    <p className="font-medium">{cafe.name}</p>
                    <p className="text-xs text-muted-foreground">{cafe.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-muted-foreground"
        >
          CafeHop v1.0.0
        </motion.p>
      </main>
    </div>
  );
};

export default Favorites;
