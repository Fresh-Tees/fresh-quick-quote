import { QuickQuote } from "@/components/QuickQuote";

export default function Home() {
  return (
    <main className="min-h-screen bg-transparent">
      <div className="max-w-3xl md:max-w-5xl xl:max-w-6xl mx-auto my-6 md:my-8 px-3 sm:px-4">
        <div className="bg-white rounded-xl shadow-sm border border-off-black/10 p-4 sm:p-6 md:p-8 lg:p-10 overflow-hidden">
          <QuickQuote />
        </div>
      </div>
    </main>
  );
}
