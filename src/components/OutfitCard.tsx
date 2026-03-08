import { ExternalLink, Shirt, Footprints, Watch } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";

type Outfit = Database["public"]["Tables"]["outfits"]["Row"];

const OutfitCard = ({ outfit }: { outfit: Outfit }) => {
  const score = outfit.compatibility_score || 50;

  return (
    <div className="glass-card rounded-xl overflow-hidden shadow-card hover:shadow-pink transition-all duration-300 group">
      {/* Image */}
      <div className="aspect-[4/3] bg-secondary relative overflow-hidden">
        {outfit.image_url ? (
          <img
            src={outfit.image_url}
            alt={outfit.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Shirt className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        {/* Score badge */}
        <div className="absolute top-3 right-3 gradient-pink rounded-full px-3 py-1 text-xs font-bold text-primary-foreground">
          {score}% match
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-display font-bold text-lg mb-2">{outfit.name}</h3>

        {outfit.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{outfit.description}</p>
        )}

        {/* Items */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Shirt className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Top:</span>
            <span>{outfit.top}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="h-4 w-4 text-primary text-center">👖</span>
            <span className="text-muted-foreground">Bottom:</span>
            <span>{outfit.bottom}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Footprints className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Shoes:</span>
            <span>{outfit.footwear}</span>
          </div>
          {outfit.accessories && (
            <div className="flex items-center gap-2 text-sm">
              <Watch className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Accessories:</span>
              <span>{outfit.accessories}</span>
            </div>
          )}
        </div>

        {/* Styling tip */}
        {outfit.styling_tip && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4 text-sm">
            <span className="font-semibold text-primary">💡 Tip:</span>{" "}
            <span className="text-muted-foreground">{outfit.styling_tip}</span>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {outfit.style_tags.map((tag) => (
            <span key={tag} className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>

        {/* Affiliate Links */}
        <div className="flex flex-wrap gap-2">
          {outfit.amazon_link && (
            <a href={outfit.amazon_link} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline-pink" className="text-xs">
                Amazon <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </a>
          )}
          {outfit.myntra_link && (
            <a href={outfit.myntra_link} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline-pink" className="text-xs">
                Myntra <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </a>
          )}
          {outfit.flipkart_link && (
            <a href={outfit.flipkart_link} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline-pink" className="text-xs">
                Flipkart <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutfitCard;
