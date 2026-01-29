import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SpoonSureProfileRecord {
  id: string;
  user_id: string;
  diet: string | null;
  allergies: string[];
  created_at: string;
  updated_at: string;
}

export const useSpoonSureProfile = (userId: string | null) => {
  const [profile, setProfile] = useState<SpoonSureProfileRecord | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("spoonsure_profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) throw error;
        setProfile((data as SpoonSureProfileRecord) ?? null);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, [userId]);

  const upsertProfile = async (updates: { diet?: string | null; allergies?: string[] }) => {
    if (!userId) return null;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("spoonsure_profiles")
        .upsert(
          {
            user_id: userId,
            diet: updates.diet ?? null,
            allergies: updates.allergies ?? [],
          },
          { onConflict: "user_id" },
        )
        .select("*")
        .single();

      if (error) throw error;
      setProfile(data as SpoonSureProfileRecord);
      return data as SpoonSureProfileRecord;
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, upsertProfile };
};
