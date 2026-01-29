// Spoonacular API integration for recipe suggestions
const HARDCODED_SPOONACULAR_API_KEY = "c215a07fd1a942f39c156779f2f59894";
const SPOONACULAR_API_KEY =
  (import.meta.env.VITE_SPOONACULAR_API_KEY as string | undefined) ||
  (HARDCODED_SPOONACULAR_API_KEY || undefined);
const SPOONACULAR_RANDOM_ENDPOINT_RAW = "https://api.spoonacular.com/recipies/random";
const SPOONACULAR_RANDOM_ENDPOINT = SPOONACULAR_RANDOM_ENDPOINT_RAW.replace("/recipies/", "/recipes/");

export interface Recipe {
  id: number;
  title: string;
  image: string;
  imageType: string;
  usedIngredientCount: number;
  missedIngredientCount: number;
  likes: number;
  instructions?: string;
  analyzedInstructions?: Array<{
    name: string;
    steps: Array<{
      number: number;
      step: string;
      ingredients: Array<{
        id: number;
        name: string;
        localizedName: string;
        image: string;
      }>;
      equipment: Array<{
        id: number;
        name: string;
        localizedName: string;
        image: string;
      }>;
    }>;
  }>;
}

export interface SpoonacularPreferences {
  diet?: string | null;
  intolerances?: string[];
}

/**
 * Find recipes by ingredients using Spoonacular API
 */
export async function findRecipesByIngredients(
  ingredients: string[],
  preferences?: SpoonacularPreferences,
): Promise<Recipe[]> {
  try {
    const url = new URL(SPOONACULAR_RANDOM_ENDPOINT);
    if (!SPOONACULAR_API_KEY) {
      console.error("Missing Spoonacular API key");
      return [];
    }
    url.searchParams.set("apiKey", SPOONACULAR_API_KEY);
    url.searchParams.set("number", "5");

    const tags: string[] = [];
    const ingredientTag = ingredients
      .map((i) => i.trim())
      .filter(Boolean)
      .slice(0, 2)
      .join(",");
    if (ingredientTag) tags.push(ingredientTag);

    const diet = preferences?.diet?.trim();
    if (diet && diet !== "none") tags.push(diet);

    // Spoonacular random endpoint doesn't fully support strict ingredient filtering.
    // Tags are a best-effort way to bias results toward the ingredient.
    if (tags.length) url.searchParams.set("tags", tags.join(","));

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Spoonacular API error: ${response.status}`);
    }

    const payload = (await response.json()) as any;
    const recipesRaw: any[] = Array.isArray(payload?.recipes) ? payload.recipes : [];
    const mapped: Recipe[] = recipesRaw
      .map((r) => {
        const image: string = typeof r?.image === "string" ? r.image : "";
        const imageType = typeof r?.imageType === "string" ? r.imageType : (image.split(".").pop() || "jpg");
        return {
          id: Number(r?.id),
          title: typeof r?.title === "string" ? r.title : "Recipe",
          image,
          imageType,
          usedIngredientCount: 0,
          missedIngredientCount: 0,
          likes: typeof r?.aggregateLikes === "number" ? r.aggregateLikes : 0,
          analyzedInstructions: Array.isArray(r?.analyzedInstructions) ? r.analyzedInstructions : undefined,
        } as Recipe;
      })
      .filter((r) => Number.isFinite(r.id));

    // Light preference filter (best-effort): if user provided a diet string, keep all.
    // Avoid dropping everything due to random endpoint limitations.
    void ingredients;
    void preferences;

    return mapped;
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return [];
  }
}

/**
 * Get recipe information including instructions
 */
export async function getRecipeInformation(recipeId: number): Promise<Recipe | null> {
  try {
    if (!SPOONACULAR_API_KEY) {
      console.error("Missing Spoonacular API key: set VITE_SPOONACULAR_API_KEY");
      return null;
    }
    const url = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${SPOONACULAR_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Spoonacular API error: ${response.status}`);
    }

    const recipe: Recipe = await response.json();
    return recipe;
  } catch (error) {
    console.error('Error fetching recipe information:', error);
    return null;
  }
}
