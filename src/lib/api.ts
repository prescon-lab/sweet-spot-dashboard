import { supabase } from "./supabase";

export interface PanelData {
  id: string;
  token: string;
  data: any;
}

export const api = {
  /**
   * Initializes or loads a panel for the given token.
   */
  async bootstrap(token: string): Promise<PanelData | null> {
    try {
      const { data, error } = await supabase
        .from("panel_docs")
        .select("*")
        .eq("token", token)
        .single();
      
      if (error && error.code !== "PGRST116") {
        throw error;
      }
      
      return data as PanelData;
    } catch (error) {
      console.error("Error bootstrapping panel:", error);
      return null;
    }
  },

  /**
   * Saves the panel data back to Supabase.
   */
  async save(token: string, payload: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("panel_docs")
        .update({ data: payload, updated_at: new Date().toISOString() })
        .eq("token", token);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error saving panel data:", error);
      return false;
    }
  },

  /**
   * Uploads an EJ photo to the 'ej-photos' bucket.
   */
  async uploadPhoto(file: File, ejId: string): Promise<string | null> {
    try {
      const filePath = `${ejId}-${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from("ej-photos")
        .upload(filePath, file);

      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from("ej-photos")
        .getPublicUrl(data.path);
        
      return publicUrl;
    } catch (error) {
      console.error("Error uploading photo:", error);
      return null;
    }
  },

  /**
   * Regenerates a guardian token (dummy example for now).
   */
  async regenGuardian(ejId: string): Promise<string> {
    // This should theoretically hit an Edge Function or secure backend 
    // to update `access_tokens`. We mock it here.
    return `new-guardian-token-${ejId}-${Math.floor(Math.random() * 1000)}`;
  }
};
