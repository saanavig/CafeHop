import { motion } from "framer-motion";
import { ArrowLeft, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Favorites = () => {
  const navigate = useNavigate();

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

      {/* Favorites List */}
      <main className="max-w-lg mx-auto space-y-6">
        <section>
          <p className="text-sm font-medium mb-2">Your Favorite Cafés</p>

          <div className="space-y-2">
            {favoriteCafes.map((cafe, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border hover:shadow-md transition-shadow"
              >
                <div className="flex-shrink-0 p-3 bg-muted rounded-xl flex items-center justify-center">
                  <Star className="h-6 w-6 text-caramel" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{cafe.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{cafe.location}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Footer */}
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