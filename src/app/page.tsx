import { AppHeader } from "@/components/AppHeader";
import { Wizard } from "@/components/Wizard";

export default function Home() {
  return (
    <main className="min-h-screen">
      <AppHeader />
      <Wizard />
    </main>
  );
}
