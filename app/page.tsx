export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-900 dark:to-blue-950">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          SKYRA MARKETPLACE
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          Top-up game cari harga termurah dari banyak provider — hemat waktu, hemat budget.
        </p>
        <div className="flex gap-3 justify-center">
          <span className="px-4 py-2 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 text-sm font-semibold">
            🚧 Under Construction
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-8">
          Hosted on Cloudflare · Powered by Supabase · Next.js
        </p>
      </div>
    </main>
  );
}
