import { Wifi, Plug, Coffee, Star, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface CafeCardProps {
  name: string;
  image: string;
  rating: number;
  distance: string;
  amenities: string[];
  vibes: string[];
  isOpen?: boolean;
  index?: number;
}

const amenityIcons: Record<string, React.ElementType> = {
  wifi: Wifi,
  outlets: Plug,
  coffee: Coffee,
};

const CafeCard = ({
  name,
  image,
  rating,
  distance,
  amenities,
  vibes,
  isOpen = true,
  index = 0,
}: CafeCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="group cursor-pointer"
    >
      <div className="bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-card transition-all duration-300 border border-border/50">
        {/* Image */}
        <div className="relative h-40 overflow-hidden">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-card/90 backdrop-blur-sm rounded-full px-2 py-1">
            <Star className="h-3.5 w-3.5 fill-caramel text-caramel" />
            <span className="text-xs font-semibold">{rating}</span>
          </div>
          {!isOpen && (
            <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
              <span className="text-primary-foreground font-medium text-sm bg-destructive px-3 py-1 rounded-full">
                Closed
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-display font-semibold text-lg leading-tight">{name}</h3>
            <div className="flex items-center gap-1 text-muted-foreground shrink-0">
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-xs">{distance}</span>
            </div>
          </div>

          {/* Amenities */}
          <div className="flex items-center gap-2 mb-3">
            {amenities.map((amenity) => {
              const Icon = amenityIcons[amenity.toLowerCase()] || Coffee;
              return (
                <div
                  key={amenity}
                  className="flex items-center gap-1 text-muted-foreground"
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
              );
            })}
          </div>

          {/* Vibes */}
          <div className="flex flex-wrap gap-1.5">
            {vibes.slice(0, 3).map((vibe) => (
              <Badge
                key={vibe}
                variant="secondary"
                className="text-xs font-normal rounded-full px-2.5"
              >
                {vibe}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CafeCard;
