import { ChevronDown, File } from 'lucide-react';

type SourceHit = {
  content: string;
  metadata: { source: string; title: string };
};

function uniqueSources(context: SourceHit[]): {
  source: string;
  title: string;
}[] {
  const seen = new Map<string, { source: string; title: string }>();
  for (const item of context) {
    const source = item.metadata.source;
    if (!source || seen.has(source)) {
      continue;
    }
    seen.set(source, {
      source,
      title: item.metadata.title || source,
    });
  }
  return [...seen.values()];
}

export function MessageSources(props: { context: SourceHit[] }) {
  const sources = uniqueSources(props.context);
  if (!sources.length) {
    return null;
  }

  const label =
    sources.length === 1 ? 'Used 1 source' : `Used ${sources.length} sources`;

  return (
    <details className="group mt-2">
      <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-gray-500 marker:content-none [&::-webkit-details-marker]:hidden dark:text-gray-400">
        <ChevronDown className="-rotate-90 h-3 w-3 shrink-0 transition-transform group-open:rotate-0" />
        {label}
      </summary>
      <ul className="mt-1.5 space-y-1.5 pl-4">
        {sources.map((item) => (
          <li key={item.source}>
            <a
              href={item.source}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-1.5 text-xs text-gray-500 hover:text-gray-900 hover:underline dark:text-gray-400 dark:hover:text-gray-100"
            >
              <File className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{item.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
