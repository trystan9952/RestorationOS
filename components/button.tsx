import Link from "next/link";

type ButtonProps = {
  text: string;
  href?: string;
  onClick?: () => void;
};

export default function Button({
  text,
  href,
  onClick,
}: ButtonProps) {
  if (href) {
    return (
      <Link
        href={href}
        className="inline-block rounded-xl bg-blue-600 px-8 py-4 text-white font-semibold transition hover:bg-blue-500"
      >
        {text}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className="rounded-xl bg-blue-600 px-8 py-4 text-white font-semibold transition hover:bg-blue-500"
    >
      {text}
    </button>
  );
}