import { createClient } from "@supabase/supabase-js";

// External Vigil Supabase project credentials
const VIGIL_SUPABASE_URL = "https://fasrfnasdimaiueugtig.supabase.co";
const VIGIL_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhc3JmbmFzZGltYWl1ZXVndGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1OTg5NDIsImV4cCI6MjA4NDE3NDk0Mn0.1d0ZGuUBom2eUio3uRB4ihYQQXKBYP9iKvgcF3ITwhE";

// Create a separate client for the Vigil Supabase project
export const vigilSupabase = createClient(VIGIL_SUPABASE_URL, VIGIL_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // Don't persist auth for external project
  },
});

// Type definitions for Vigil tables
export interface VigilSettings {
  id?: string;
  device_serial: string;
  household_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface VigilInventoryItem {
  id?: string;
  name: string;
  status: "in" | "opened" | "out";
  mfg?: string | null;
  exp?: string | null;
  batch?: string | null;
  category?: string | null;
  household_id: string;
  created_at?: string;
  updated_at?: string;
}

// Category definitions with icons and default expiry days
export const FOOD_CATEGORIES: Record<string, { icon: string; emoji: string; defaultExpiryDays: number }> = {
  dairy: { icon: "Milk", emoji: "🥛", defaultExpiryDays: 7 },
  eggs: { icon: "Egg", emoji: "🥚", defaultExpiryDays: 21 },
  bread: { icon: "Croissant", emoji: "🍞", defaultExpiryDays: 5 },
  meat: { icon: "Beef", emoji: "🥩", defaultExpiryDays: 3 },
  poultry: { icon: "Drumstick", emoji: "🍗", defaultExpiryDays: 2 },
  fruits: { icon: "Apple", emoji: "🍎", defaultExpiryDays: 7 },
  vegetables: { icon: "Carrot", emoji: "🥕", defaultExpiryDays: 7 },
  frozen: { icon: "Snowflake", emoji: "❄️", defaultExpiryDays: 90 },
  canned: { icon: "Package", emoji: "🥫", defaultExpiryDays: 365 },
  beverages: { icon: "Wine", emoji: "🍷", defaultExpiryDays: 180 },
  snacks: { icon: "Cookie", emoji: "🍪", defaultExpiryDays: 60 },
  condiments: { icon: "Droplet", emoji: "🫙", defaultExpiryDays: 180 },
  grains: { icon: "Wheat", emoji: "🌾", defaultExpiryDays: 180 },
  seafood: { icon: "Fish", emoji: "🐟", defaultExpiryDays: 2 },
  other: { icon: "Package", emoji: "📦", defaultExpiryDays: 30 },
};

// Map product names to categories
export const getCategoryForProduct = (productName: string): string => {
  const name = productName.toLowerCase();
  if (name.includes("milk") || name.includes("cheese") || name.includes("yogurt") || name.includes("butter") || name.includes("cream")) return "dairy";
  if (name.includes("egg")) return "eggs";
  if (name.includes("bread") || name.includes("bagel") || name.includes("muffin") || name.includes("toast")) return "bread";
  if (name.includes("chicken") || name.includes("turkey") || name.includes("duck")) return "poultry";
  if (name.includes("beef") || name.includes("pork") || name.includes("lamb") || name.includes("steak") || name.includes("bacon") || name.includes("ham")) return "meat";
  if (name.includes("fish") || name.includes("salmon") || name.includes("tuna") || name.includes("shrimp") || name.includes("crab")) return "seafood";
  if (name.includes("apple") || name.includes("banana") || name.includes("orange") || name.includes("grape") || name.includes("berry") || name.includes("mango") || name.includes("peach")) return "fruits";
  if (name.includes("carrot") || name.includes("broccoli") || name.includes("lettuce") || name.includes("tomato") || name.includes("onion") || name.includes("potato") || name.includes("spinach")) return "vegetables";
  if (name.includes("frozen") || name.includes("ice cream")) return "frozen";
  if (name.includes("can") || name.includes("soup") || name.includes("beans")) return "canned";
  if (name.includes("juice") || name.includes("soda") || name.includes("water") || name.includes("wine") || name.includes("beer")) return "beverages";
  if (name.includes("chip") || name.includes("cookie") || name.includes("cracker") || name.includes("candy")) return "snacks";
  if (name.includes("sauce") || name.includes("ketchup") || name.includes("mustard") || name.includes("mayo") || name.includes("dressing")) return "condiments";
  if (name.includes("rice") || name.includes("pasta") || name.includes("flour") || name.includes("oat") || name.includes("cereal")) return "grains";
  return "other";
};
