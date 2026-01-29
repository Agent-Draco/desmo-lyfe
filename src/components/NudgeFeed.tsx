import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, Package, AlertTriangle, ExternalLink, ShoppingCart, Loader2 } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { generateNudges, Nudge } from "@/lib/rulesEngine";
import { findRecipesByIngredients, SpoonSureProfile } from "@/lib/spoonacular";

interface NudgeFeedProps {
  inventory: any[];
  profile?: SpoonSureProfile;
}

export const NudgeFeed = ({ inventory }: NudgeFeedProps) => {
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const newNudges = generateNudges(inventory);
    setNudges(newNudges);
  }, [inventory]);

  const handleRecipeClick = async (nudge: Nudge) => {
    if (nudge.type !== 'active-recipe') return;

    const item = inventory.find(i => i.id === nudge.itemId);
    if (!item) return;

    setLoadingRecipes(prev => new Set(prev).add(nudge.itemId));

    try {
      const recipes = await findRecipesByIngredients([item.name], profile);
      if (recipes.length > 0) {
        // Update nudge with recipe data
        setNudges(prev => prev.map(n =>
          n.itemId === nudge.itemId && n.type === 'active-recipe'
            ? {
                ...n,
                recipeData: {
                  title: recipes[0].title,
                  id: recipes[0].id,
                  image: recipes[0].image
                }
              }
            : n
        ));
      }
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
    } finally {
      setLoadingRecipes(prev => {
        const newSet = new Set(prev);
        newSet.delete(nudge.itemId);
        return newSet;
      });
    }
  };

  if (nudges.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Nudges
      </h3>
      <AnimatePresence>
        {nudges.map((nudge, i) => (
          <motion.div
            key={`${nudge.itemId}-${nudge.type}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: i * 0.1 }}
          >
            <GlassCard className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {nudge.type === 'recipe' || nudge.type === 'active-recipe' ? (
                    <ChefHat className="w-5 h-5 text-primary" />
                  ) : nudge.type === 'ebay' ? (
                    <ShoppingCart className="w-5 h-5 text-primary" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground mb-3">{nudge.message}</p>

                  {nudge.type === 'active-recipe' && !nudge.recipeData && (
                    <Button
                      size="sm"
                      onClick={() => handleRecipeClick(nudge)}
                      disabled={loadingRecipes.has(nudge.itemId)}
                      className="text-xs"
                    >
                      {loadingRecipes.has(nudge.itemId) ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : null}
                      Get Recipe Ideas
                    </Button>
                  )}

                  {nudge.recipeData && (
                    <div className="mt-3 p-3 bg-secondary/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://spoonacular.com/recipeImages/${nudge.recipeData.id}-90x90.${nudge.recipeData.image.split('.').pop()}`}
                          alt={nudge.recipeData.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {nudge.recipeData.title}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-1 h-6 text-xs"
                            onClick={() => window.open(`https://spoonacular.com/recipes/${nudge.recipeData!.title.replace(/\s+/g, '-').toLowerCase()}-${nudge.recipeData!.id}`, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View Recipe
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
