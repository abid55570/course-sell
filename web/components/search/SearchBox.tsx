/**
 * A plain form. No client JavaScript, no hydration, no shipped index.
 *
 * It submits to /search, which does the matching on the server. That means it
 * works while the page is still loading and on a connection too slow to have
 * run any JS yet, which is the normal case for a buyer arriving from an
 * Instagram reel on mobile data.
 */
export default function SearchBox({
  defaultValue = '',
  size = 'sm',
  autoFocus = false,
}: {
  defaultValue?: string;
  size?: 'sm' | 'lg';
  autoFocus?: boolean;
}) {
  const large = size === 'lg';

  return (
    <form action="/search" role="search" className={large ? 'w-full' : 'w-full sm:w-64'}>
      <label htmlFor={large ? 'search-lg' : 'search-sm'} className="sr-only">
        Search products
      </label>
      <div className="flex items-stretch border border-ink/20 bg-canvas focus-within:border-primary">
        <input
          id={large ? 'search-lg' : 'search-sm'}
          type="search"
          name="q"
          defaultValue={defaultValue}
          autoFocus={autoFocus}
          placeholder="Search products"
          autoComplete="off"
          className={`min-w-0 flex-1 bg-transparent px-3 font-mono uppercase tracking-[0.1em] text-ink placeholder:text-ink-soft focus:outline-none ${
            large ? 'h-14 text-sm' : 'h-11 text-xs'
          }`}
        />
        <button
          type="submit"
          className={`shrink-0 bg-ink px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
            large ? 'h-14' : 'h-11'
          }`}
        >
          Find
        </button>
      </div>
    </form>
  );
}
