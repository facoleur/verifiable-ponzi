import Link from "next/link";

export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-275 px-6 py-8 mt-4 border-t border-slate-300/60">
      <div className="flex items-start justify-between gap-8 max-[600px]:flex-col">
        <p className="max-w-sm text-xs leading-relaxed text-slate-500">
          G50 is an experiment in on-chain token mechanics. It is not a
          financial product, investment vehicle, or viable trading tool.
          Interacting with this contract may result in total loss of funds.
        </p>
        <div className="flex shrink-0 gap-4 text-xs text-slate-500">
          <Link
            href="https://twitter.com/facoleur"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-800 transition-colors"
          >
            @facoleur
          </Link>
          <Link
            href="https://github.com/facoleur"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-800 transition-colors"
          >
            GitHub
          </Link>
        </div>
      </div>
    </footer>
  );
}
