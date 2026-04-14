import { QuickQuote } from "@/components/QuickQuote";

export default function Home() {
  return (
    <main className="min-h-screen bg-[url('/images/quote-bg.png')] bg-cover bg-center bg-fixed">
      <div className="min-h-screen bg-black/35">
        <div className="max-w-3xl md:max-w-5xl xl:max-w-6xl mx-auto my-6 md:my-8 px-3 sm:px-4">
          <div className="rounded-2xl border border-white/25 bg-white/20 backdrop-blur-xl shadow-2xl p-4 sm:p-6 md:p-8 lg:p-10 overflow-hidden">
            <QuickQuote />
          </div>
        </div>
      </div>
    </main>
  );
}
