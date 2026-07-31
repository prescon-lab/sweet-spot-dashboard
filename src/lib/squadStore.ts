import { supabase } from "@/integrations/supabase/client";

export interface Squad {
  id: string;
  name: string;
  leader: string;
  color: string | null;
  created_at: string;
  squad_members?: { guardian_name: string }[];
}

export const squadStore = {
  getSquads: async (): Promise<Squad[]> => {
    const { data, error } = await supabase
      .from("squads")
      .select(`
        *,
        squad_members (
          guardian_name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching squads:", error);
      throw error;
    }
    return data as Squad[];
  },

  addSquad: async (name: string, leader: string, color?: string): Promise<Squad> => {
    const { data, error } = await supabase
      .from("squads")
      .insert({ name, leader, color })
      .select()
      .single();

    if (error) {
      console.error("Error adding squad:", error);
      throw error;
    }
    return data as Squad;
  },

  updateSquad: async (id: string, updates: Partial<Omit<Squad, "id" | "created_at" | "squad_members">>): Promise<Squad> => {
    const { data, error } = await supabase
      .from("squads")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating squad:", error);
      throw error;
    }
    return data as Squad;
  },

  deleteSquad: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("squads")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting squad:", error);
      throw error;
    }
  },

  addMember: async (squad_id: string, guardian_name: string): Promise<void> => {
    const { error } = await supabase
      .from("squad_members")
      .insert({ squad_id, guardian_name });

    if (error) {
      console.error("Error adding squad member:", error);
      throw error;
    }
  },

  removeMember: async (squad_id: string, guardian_name: string): Promise<void> => {
    const { error } = await supabase
      .from("squad_members")
      .delete()
      .match({ squad_id, guardian_name });

    if (error) {
      console.error("Error removing squad member:", error);
      throw error;
    }
  }
};
