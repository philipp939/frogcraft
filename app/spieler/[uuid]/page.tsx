import { redirect } from "next/navigation";

export default async function Profil({ params }: { params: Promise<{ uuid: string }> }) {
  redirect(`/?spieler=${encodeURIComponent((await params).uuid)}`);
}
