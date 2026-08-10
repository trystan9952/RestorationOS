type InputProps = {
  label: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  id?: string;
  disabled?: boolean;
};

export function Input({
  label,
  placeholder,
  value,
  onChange,
  id,
  disabled,
}: InputProps) {
  return (
    <div className="mb-6">
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-slate-300"
      >
        {label}
      </label>

      <input
        id={id}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={
          onChange ? (event) => onChange(event.target.value) : undefined
        }
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500 disabled:opacity-60"
      />
    </div>
  );
}
