import { Wizard } from "@/components/Wizard";

export default function Home() {
  return (
    <main className="min-h-screen bg-transparent">
      <div className="max-w-3xl mx-auto my-8 px-4">
        <div className="bg-white rounded-xl shadow-sm border border-off-black/10 p-6 md:p-8">
          <Wizard />
        </div>
      </div>
    </main>
  );
}
