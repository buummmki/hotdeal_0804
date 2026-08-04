'use client';

export default function Error({
  error, reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-lg font-bold">문제가 발생했습니다</h1>
      <p className="mt-1.5 break-words text-[13px] text-muted">{error.message}</p>
      <button
        onClick={reset}
        className="mt-5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white"
      >
        다시 시도
      </button>
    </main>
  );
}
