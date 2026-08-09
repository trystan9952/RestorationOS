type HeaderProps = {
  title: string;
  subtitle: string;
};

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <div className="mb-10">
      <p className="uppercase tracking-[0.3em] text-sm font-semibold text-blue-400">
        RestorationOS
      </p>

      <h1 className="mt-4 text-5xl font-bold">{title}</h1>

      <p className="mt-3 text-slate-400">{subtitle}</p>
    </div>
  );
}
