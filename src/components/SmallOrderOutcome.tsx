"use client";

import Link from "next/link";

const COLLECTIONS_URL = "https://freshtees.com.au/collections";

export function SmallOrderOutcome() {
  return (
    <div className="max-w-xl md:max-w-3xl xl:max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 text-center space-y-8">
      <section>
        <h1 className="font-display font-bold text-2xl md:text-3xl text-off-black mb-2">
          Awesome, you're in the right spot for custom merch made easy
        </h1>
      </section>
      <a
        href={COLLECTIONS_URL}
        className="inline-flex items-center justify-center min-h-[44px] px-8 py-4 bg-accent text-white font-body font-medium rounded-lg hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
      >
        Order Now
      </a>

      <div className="pt-4 border-t border-off-black/10 mt-6 flex justify-center">
        <Link
          href="/"
          className="font-body text-sm text-off-black/70 hover:text-off-black hover:underline"
        >
          Restart and go back to the start
        </Link>
      </div>
    </div>
  );
}
