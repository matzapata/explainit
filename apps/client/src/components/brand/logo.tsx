import { Link } from '@/lib/router';

export default function Logo() {
  return (
    <Link href="/">
      <div className="flex items-center space-x-1 pt-1 cursor-pointer">
        <h1
          className="text-gray-800 dark:text-white  text-xl"
          style={{
            fontFamily: 'Poppins,sans-serif',
            fontWeight: 900,
          }}
        >
          EXPLAINIT.
        </h1>
      </div>
    </Link>
  );
}
