import { redirect } from "next/navigation";

export default function SavedFiltersPage() {
  redirect("/account/saved?tab=filters");
}
