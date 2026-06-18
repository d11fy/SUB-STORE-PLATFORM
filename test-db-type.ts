import { createClient } from "@supabase/supabase-js";
import type { Database } from "./lib/types/database";

type AddRelationshipsToSchema<T> = {
  [K in keyof T]: T[K] & { Relationships: any[] };
};

type FixDatabase<DB extends { public: any }> = {
  public: {
    Tables: AddRelationshipsToSchema<DB["public"]["Tables"]>;
    Views: DB["public"]["Views"];
    Functions: DB["public"]["Functions"];
    Enums: DB["public"]["Enums"];
  };
};

type TypedDatabase = FixDatabase<Database>;

const supabase = createClient<TypedDatabase>("", "");

async function main() {
  const { data } = await supabase.from("stores").select("*, packages (*)");
  if (data) {
    const d = data[0];
    console.log(d.packages); // should compile!
  }
}
