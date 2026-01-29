// Spoonacular API integration for recipe suggestions
const SPOONACULAR_API_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY as string | undefined;
const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com';

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
    if (!SPOONACULAR_API_KEY) {
      console.error("Missing Spoonacular API key: set VITE_SPOONACULAR_API_KEY");
      return [];
    }
    const ingredientsQuery = ingredients.join(',');

    const url = new URL(`${SPOONACULAR_BASE_URL}/recipes/findByIngredients`);
    url.searchParams.set("apiKey", SPOONACULAR_API_KEY);
    url.searchParams.set("ingredients", ingredientsQuery);
    url.searchParams.set("number", "5");
    url.searchParams.set("ranking", "1");

    const diet = preferences?.diet?.trim();
    if (diet) url.searchParams.set("diet", diet);

    const intolerances = (preferences?.intolerances ?? []).map((s) => s.trim()).filter(Boolean);
    if (intolerances.length) url.searchParams.set("intolerances", intolerances.join(","));

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Spoonacular API error: ${response.status}`);
    }

    const recipes: Recipe[] = await response.json();

    // Get detailed instructions for each recipe
    const recipesWithInstructions = await Promise.all(
      recipes.map(async (recipe) => {
        try {
          const instructionUrl = `${SPOONACULAR_BASE_URL}/recipes/${recipe.id}/analyzedInstructions?apiKey=${SPOONACULAR_API_KEY}`;
          const instructionResponse = await fetch(instructionUrl);

          if (instructionResponse.ok) {
            const instructions = await instructionResponse.json();
            return { ...recipe, analyzedInstructions: instructions };
          }
        } catch (error) {
          console.warn(`Failed to fetch instructions for recipe ${recipe.id}:`, error);
        }
        return recipe;
      })
    );

    return recipesWithInstructions;
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
    const url = `${SPOONACULAR_BASE_URL}/recipes/${recipeId}/information?apiKey=${SPOONACULAR_API_KEY}`;

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
