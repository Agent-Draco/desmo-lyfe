// Spoonacular API integration for recipe suggestions
const SPOONACULAR_API_KEY = 'c215a07fd1a942f39c156779f2f59894';
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

/**
 * Find recipes by ingredients using Spoonacular API
 */
export async function findRecipesByIngredients(ingredients: string[]): Promise<Recipe[]> {
  try {
    const ingredientsQuery = ingredients.join(',');
    const url = `${SPOONACULAR_BASE_URL}/recipes/findByIngredients?apiKey=${SPOONACULAR_API_KEY}&ingredients=${encodeURIComponent(ingredientsQuery)}&number=5&ranking=1`;

    const response = await fetch(url);
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
