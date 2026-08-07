type HeaderProps = {
    title: string;
    subtitle: string;
  };
  
  export default function Header({ title, subtitle }: HeaderProps) {
    return (
      <div className="mb-10">
        <p className="uppercase tracking-[0.3em] text-blue-400 text-sm font-semibold">
          RestorationOS
        </p>
  
        <h1 className="mt-4 text-5xl font-bold">
          {title}
        </h1>
  
        <p className="mt-3 text-slate-400">
          {subtitle}
        </p>
      </div>
    );
  }