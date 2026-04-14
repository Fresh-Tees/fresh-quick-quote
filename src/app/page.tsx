import { QuickQuote } from "@/components/QuickQuote";

export default function Home() {
  return (
    <main className="min-h-[100dvh] bg-[url('/images/quote-bg.png')] bg-cover bg-center bg-fixed">
      <div className="min-h-[100dvh] bg-black/35 flex items-center justify-center py-4 sm:py-6">
        <div className="w-full max-w-3xl md:max-w-5xl xl:max-w-6xl mx-auto px-3 sm:px-4">
          <div className="rounded-2xl border border-white/25 bg-white/20 backdrop-blur-xl shadow-2xl p-4 sm:p-6 md:p-8 lg:p-10 overflow-hidden">
            <QuickQuote />
          </div>
        </div>
      </div>
    </main>
  );
}
