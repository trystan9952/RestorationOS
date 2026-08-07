import Link from "next/link";

type ButtonProps = {
  text: string;
  href?: string;
};

export default function Button({ text, href }: ButtonProps) {
  if (href) {
    return (
      <Link
        href={href}
        className="inline-block rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white transition hover:bg-blue-500"
      >
        {text}
      </Link>
    );
  }

  return (
    <button className="rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white transition hover:bg-blue-500">
      {text}
    </button>
  );
}