import type { Metadata } from "next";
import MenuExperience from "@/components/menu/MenuExperience";

export const metadata: Metadata = {
  title: "The menu",
  description: "Explore 60 Indian kitchen favourites, from Punjabi tandoor to coastal curry."
};

export default function MenuPage() {
  return <MenuExperience />;
}
