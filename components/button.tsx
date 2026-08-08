type ButtonProps = {
    text: string;
  };
  
  export default function Button({ text }: ButtonProps) {
    return (
      <button className="rounded-xl bg-blue-600 px-8 py-4 text-white font-semibold hover:bg-blue-500 transition">
        {text}
      </button>
    );
  }