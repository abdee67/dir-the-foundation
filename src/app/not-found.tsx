import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="storefront flex min-h-[70vh] flex-col items-center justify-center bg-[var(--sf-bg)] px-6 text-center">
      <span className="text-[10px] font-semibold tracking-[0.24em] uppercase text-neutral-400">
        404 • PAGE NOT FOUND
      </span>
      <h1 className="sf-font-display mt-3 text-3xl font-normal text-neutral-900 sm:text-5xl">
        PIECE NOT FOUND
      </h1>
      <p className="mt-4 max-w-md text-xs text-neutral-500">
        The garment or page you are seeking is unavailable or has been archived.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-12 items-center justify-center border border-black bg-black px-8 text-xs font-semibold tracking-[0.18em] uppercase text-white transition-colors hover:bg-neutral-800"
      >
        RETURN TO STORE
      </Link>
    </div>
  )
}
