import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center gap-12 py-16">
      <section className="text-center">
        <h1 className="mb-4 text-5xl font-bold text-gray-900">
          Cambium Protocol
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600">
          A transparent, on-chain carbon credit marketplace built on
          Stellar/Soroban. Browse verified projects, trade credits with minimal
          friction, and retire offsets with cryptographic proof of legitimacy.
        </p>
      </section>

      <section className="grid w-full max-w-3xl grid-cols-1 gap-6 md:grid-cols-3">
        <Link
          href="/projects"
          className="rounded-lg border border-gray-200 p-6 text-center transition hover:shadow-md"
        >
          <h2 className="mb-2 text-lg font-semibold">Projects</h2>
          <p className="text-sm text-gray-500">
            Explore registered carbon projects by methodology and geography.
          </p>
        </Link>
        <Link
          href="/trade"
          className="rounded-lg border border-gray-200 p-6 text-center transition hover:shadow-md"
        >
          <h2 className="mb-2 text-lg font-semibold">Trade</h2>
          <p className="text-sm text-gray-500">
            Swap credits via AMM pools with live price quotes.
          </p>
        </Link>
        <Link
          href="/retire"
          className="rounded-lg border border-gray-200 p-6 text-center transition hover:shadow-md"
        >
          <h2 className="mb-2 text-lg font-semibold">Retire</h2>
          <p className="text-sm text-gray-500">
            Permanently retire credits for verifiable carbon offsets.
          </p>
        </Link>
      </section>

      <section className="max-w-2xl text-center text-sm text-gray-500">
        <p>
          Cambium Protocol uses zero-knowledge proofs and on-chain verification
          to ensure every credit is backed by real, additional, and permanent
          carbon sequestration. All retirement records are public and
          independently verifiable.
        </p>
      </section>
    </div>
  );
}
