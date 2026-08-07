type InputProps = {
    label: string;
    placeholder?: string;
  };
  
  export default function Input({ label, placeholder }: InputProps) {
    return (
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-slate-300">
          {label}
        </label>
  
        <input
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
        />
      </div>
    );
  }