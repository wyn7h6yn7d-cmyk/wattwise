import { redirect } from "next/navigation";

/** Legacy English URL — canonical Estonian cookies page is /kupsised. */
export default function CookiePolicyPage() {
  redirect("/kupsised");
}
