import { Link } from '@/lib/router';

export default function Logo() {
  return (
    <Link href="/" aria-label="Homepage" className="flex items-center text-sm font-semibold">
      Explainit
    </Link>
  );
}
