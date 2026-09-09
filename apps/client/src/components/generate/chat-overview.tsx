import { useEffect, useRef, useState } from 'react';
import { Link } from '@/lib/router';
import type {
  ChatMetadataDto,
  ChatOverviewDto,
  ChatResource,
} from '@/lib/services/chat-service';

type ChatOverviewProps = {
  chat: ChatMetadataDto;
  overview: ChatOverviewDto;
};

export function ChatOverview({ chat, overview }: ChatOverviewProps) {
  const resources = chat.resources ?? [];
  const readyCount = resources.filter((r) => r.status === 'ready').length;
  const failed = resources.filter((r) => r.status === 'failed');
  const failedCount = failed.length;
  const inFlightCount = resources.filter(
    (r) => r.status === 'pending' || r.status === 'processing',
  ).length;
  const hostOriginCount = chat.hostOrigins?.length ?? 0;
  const empty = overview.questionsAllTime === 0;

  return (
    <div className="space-y-8 text-sm">
      {empty ? (
        <div className="py-3 px-4 border border-gray-200 dark:border-white/10">
          <p className="font-medium text-gray-900 dark:text-white">
            Ready for questions
          </p>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Publish the Chat and install the snippet so Visitors can ask. Once
            questions land, usage shows up here.{' '}
            <Link
              href={`/chats/${chat.id}/setup`}
              className="underline text-gray-700 dark:text-gray-200"
            >
              View setup
            </Link>
          </p>
        </div>
      ) : null}

      {!chat.published || hostOriginCount === 0 || readyCount === 0 ? (
        <div className="py-3 px-4 border border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/5">
          <p className="font-medium text-gray-900 dark:text-white">
            Setup incomplete
          </p>
          <ul className="mt-2 space-y-1 text-gray-600 dark:text-gray-300 list-disc pl-5">
            {!chat.published ? (
              <li>
                Chat is draft —{' '}
                <Link href={`/chats/${chat.id}/setup`} className="underline">
                  publish in Setup
                </Link>
              </li>
            ) : null}
            {hostOriginCount === 0 ? (
              <li>
                No host origins —{' '}
                <Link href={`/chats/${chat.id}/settings`} className="underline">
                  add domains in Settings
                </Link>
              </li>
            ) : null}
            {readyCount === 0 ? (
              <li>
                No ready resources —{' '}
                <Link
                  href={`/chats/${chat.id}/resources`}
                  className="underline"
                >
                  add docs in Resources
                </Link>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-900 dark:text-white">
            Last 30 days
          </h2>
        </div>
        <div className="mt-3 border border-gray-200 dark:border-white/10 p-4">
          <OverviewChart series={overview.series} />
        </div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">
          {formatCount(overview.questions30d)} questions
          <span className="text-gray-300 dark:text-gray-600"> · </span>
          {formatCount(overview.conversations30d)} conversations
          {chat.lastUsedAt ? (
            <>
              <span className="text-gray-300 dark:text-gray-600"> · </span>
              last used {formatRelative(chat.lastUsedAt)}
            </>
          ) : null}
          {!chat.published ? (
            <>
              <span className="text-gray-300 dark:text-gray-600"> · </span>
              <span className="text-amber-700 dark:text-amber-400">draft</span>
            </>
          ) : null}
        </p>
      </section>

      <section>
        <div className="grid grid-cols-2 lg:grid-cols-3">
          <MetricTile
            label="Questions"
            value={formatCount(overview.questions30d)}
            subtitle={`today: ${formatCount(overview.questionsToday)}`}
            className="border-b border-r border-gray-100 dark:border-white/5 py-3 pr-4"
          />
          <MetricTile
            label="Conversations"
            value={formatCount(overview.conversations30d)}
            className="border-b border-gray-100 dark:border-white/5 py-3 pl-4 lg:border-r lg:pr-4"
          />
          <MetricTile
            label="Ready resources"
            value={formatCount(readyCount)}
            subtitle={
              inFlightCount > 0
                ? `in flight: ${formatCount(inFlightCount)}`
                : undefined
            }
            className="border-b border-r border-gray-100 dark:border-white/5 py-3 pr-4 lg:border-r-0 lg:pl-4"
          />
          <MetricTile
            label="Failed resources"
            value={formatCount(failedCount)}
            valueClassName={
              failedCount > 0 ? 'text-rose-600 dark:text-rose-400' : undefined
            }
            className="border-b border-gray-100 dark:border-white/5 py-3 pl-4 lg:pl-0 lg:pr-4 lg:border-b-0 lg:border-r"
          />
          <MetricTile
            label="Host origins"
            value={formatCount(hostOriginCount)}
            valueClassName={
              hostOriginCount === 0
                ? 'text-rose-600 dark:text-rose-400'
                : undefined
            }
            className="border-r border-gray-100 dark:border-white/5 py-3 pr-4 lg:pl-4 lg:pr-4"
          />
          <MetricTile
            label="Last used"
            value={chat.lastUsedAt ? formatRelative(chat.lastUsedAt) : 'Never'}
            className="py-3 pl-4"
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Failed resources
            </h3>
            <Link
              href={`/chats/${chat.id}/resources`}
              className="text-gray-400 dark:text-gray-500 hover:underline"
            >
              Resources
            </Link>
          </div>
          {failedCount > 0 ? (
            <ul className="mt-3 space-y-2">
              {failed.map((resource) => (
                <FailedResourceRow key={resource.id} resource={resource} />
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-gray-400 dark:text-gray-500">
              No failed resources.
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Setup checklist
            </h3>
            <Link
              href={`/chats/${chat.id}/setup`}
              className="text-gray-400 dark:text-gray-500 hover:underline"
            >
              Setup
            </Link>
          </div>
          <ul className="mt-3 space-y-2">
            <ChecklistItem
              ok={chat.published}
              label="Published"
              href={`/chats/${chat.id}/setup`}
            />
            <ChecklistItem
              ok={hostOriginCount > 0}
              label="At least one host origin"
              href={`/chats/${chat.id}/settings`}
            />
            <ChecklistItem
              ok={readyCount > 0}
              label="At least one ready resource"
              href={`/chats/${chat.id}/resources`}
            />
          </ul>
        </div>
      </section>
    </div>
  );
}

function MetricTile({
  label,
  value,
  subtitle,
  className,
  valueClassName,
}: {
  label: string;
  value: string;
  subtitle?: string;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={className}>
      <div className="text-gray-500 dark:text-gray-400">{label}</div>
      <div
        className={`text-xl font-semibold tabular-nums mt-0.5 text-gray-900 dark:text-white ${valueClassName ?? ''}`}
      >
        {value}
      </div>
      {subtitle ? (
        <div className="text-gray-400 dark:text-gray-500 tabular-nums">
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

function FailedResourceRow({ resource }: { resource: ChatResource }) {
  const label = resource.title?.trim() || resource.data || resource.id;
  return (
    <li className="text-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="text-gray-700 dark:text-gray-200 truncate">
          {label}
        </span>
        <span className="text-rose-600 dark:text-rose-400 shrink-0 tabular-nums">
          failed
        </span>
      </div>
      {resource.error ? (
        <p className="mt-0.5 text-gray-400 dark:text-gray-500 line-clamp-2">
          {resource.error}
        </p>
      ) : null}
    </li>
  );
}

function ChecklistItem({
  ok,
  label,
  href,
}: {
  ok: boolean;
  label: string;
  href: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="text-gray-600 dark:text-gray-300">{label}</span>
      {ok ? (
        <span className="text-gray-400 dark:text-gray-500 tabular-nums">
          done
        </span>
      ) : (
        <Link
          href={href}
          className="text-rose-600 dark:text-rose-400 underline shrink-0"
        >
          fix
        </Link>
      )}
    </li>
  );
}

export function OverviewChart({
  series,
}: {
  series: ChatOverviewDto['series'];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(960);
  const height = 192;
  const padLeft = 40;
  const padRight = 12;
  const padTop = 10;
  const padBottom = 28;
  const plotWidth = Math.max(1, width - padLeft - padRight);
  const plotHeight = height - padTop - padBottom;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const next = Math.round(el.getBoundingClientRect().width);
      if (next > 0) setWidth(next);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const maxRaw = Math.max(0, ...series.map((p) => p.questions));
  const yMax = niceUpperBound(Math.max(1, maxRaw));
  const yTicks = Array.from({ length: 5 }, (_, i) => (yMax * i) / 4);
  const xGridIndexes = evenlySpacedIndexes(
    series.length,
    Math.min(series.length, 15),
  );
  const xLabelIndexes = evenlySpacedIndexes(
    series.length,
    Math.min(series.length, 7),
  );

  const points = series.map((point, index) => {
    const x =
      padLeft +
      (series.length <= 1 ? 0 : (index / (series.length - 1)) * plotWidth);
    const y = padTop + plotHeight - (point.questions / yMax) * plotHeight;
    return { x, y, ...point };
  });

  const line = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  return (
    <div className="w-full">
      <div ref={containerRef} className="h-48 w-full">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="block w-full h-full"
          role="img"
          aria-label="Questions per day over the last 30 days"
        >
          {yTicks.map((tick) => {
            const y = padTop + plotHeight - (tick / yMax) * plotHeight;
            return (
              <g key={`y-${tick}`}>
                <line
                  x1={padLeft}
                  x2={width - padRight}
                  y1={y}
                  y2={y}
                  className="stroke-gray-950/[0.06] dark:stroke-white/[0.08]"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-gray-400 dark:fill-zinc-500"
                  fontSize="11"
                >
                  {formatCount(tick)}
                </text>
              </g>
            );
          })}

          {xGridIndexes.map((index) => {
            const point = points[index];
            if (!point) return null;
            return (
              <line
                key={`x-grid-${point.date}`}
                x1={point.x}
                x2={point.x}
                y1={padTop}
                y2={padTop + plotHeight}
                className="stroke-gray-950/[0.06] dark:stroke-white/[0.08]"
                strokeWidth="1"
              />
            );
          })}

          {xLabelIndexes.map((index) => {
            const point = points[index];
            if (!point) return null;
            return (
              <text
                key={`x-label-${point.date}`}
                x={point.x}
                y={height - 8}
                textAnchor="middle"
                className="fill-gray-400 dark:fill-zinc-500"
                fontSize="11"
              >
                {formatChartDay(point.date)}
              </text>
            );
          })}

          <path
            d={line}
            fill="none"
            className="stroke-emerald-400"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-400" />
          Questions
        </div>
      </div>
    </div>
  );
}

function niceUpperBound(value: number): number {
  if (value <= 1) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const nice =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}

function evenlySpacedIndexes(length: number, count: number): number[] {
  if (length <= 0) return [];
  if (length === 1) return [0];
  const n = Math.max(2, Math.min(count, length));
  const indexes = Array.from({ length: n }, (_, i) =>
    Math.round((i / (n - 1)) * (length - 1)),
  );
  return [...new Set(indexes)];
}

function formatChartDay(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function formatCount(n: number): string {
  return new Intl.NumberFormat().format(n);
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}
