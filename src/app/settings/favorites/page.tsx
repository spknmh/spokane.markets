import { redirect } from "next/navigation";

export default function FavoriteVendorsPage() {
  redirect("/account/saved?tab=favorites");
}
