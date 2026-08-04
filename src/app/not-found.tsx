import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-4xl font-extrabold text-accent">404</p>
      <h1 className="mt-2 text-lg font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="mt-1.5 text-[13px] text-muted">
        딜이 삭제되었거나 주소가 잘못되었을 수 있습니다.
      </p>
      <Link
        href="/"
        className="mt-5 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white"
      >
        메인으로
      </Link>
    </main>
  );
}
