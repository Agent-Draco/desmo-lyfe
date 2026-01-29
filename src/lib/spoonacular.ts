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

export interface SpoonSureProfile {
  enabled: boolean;
  dietType: 'veg' | 'non-veg' | 'vegan' | 'jain';
  allergies: string[];
  customPreferences: string;
}

/**
 * Find recipes by ingredients using Spoonacular API with profile preferences
 */
export async function findRecipesByIngredients(
  ingredients: string[],
  profile?: SpoonSureProfile
): Promise<Recipe[]> {
  try {
    let url = `${SPOONACULAR_BASE_URL}/recipes/findByIngredients?apiKey=${SPOONACULAR_API_KEY}&ingredients=${encodeURIComponent(ingredients.join(', '))}&number=5&ranking=1`;

    // Add dietary restrictions based on profile
    if (profile) {
      const intolerances = profile.allergies.map(allergy =>
        allergy.toLowerCase().replace(' ', '')
      ).join(',');

      if (intolerances) {
        url += `&intolerances=${encodeURIComponent(intolerances)}`;
      }

      // Add diet type
      switch (profile.dietType) {
        case 'vegan':
          url += `&diet=vegan`;
          break;
        case 'veg':
          url += `&diet=vegetarian`;
          break;
        case 'jain':
          // Jain diet is vegetarian but excludes root vegetables, onions, garlic
          url += `&diet=vegetarian&excludeIngredients=onion,garlic,potato`;
          break;
        // non-veg doesn't need special filtering
      }

      // Add custom preferences to query if available
      if (profile.customPreferences.trim()) {
        // This is a simple implementation - in a real app you'd parse the custom preferences
        const customPrefs = profile.customPreferences.toLowerCase();
        if (customPrefs.includes('low carb')) {
          url += `&diet=ketogenic`;
        } else if (customPrefs.includes('gluten free')) {
          url += `&diet=gluten free`;
        }
        // Add more custom preference parsing as needed
      }
    }

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
