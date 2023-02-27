export default function Input({ type = 'text', id, placeholder, value, onChange }) {
  return (
    <input
      type={type}
      id={id}
      className="block w-full rounded-md py-2 px-4 border border-slate-400 sm:text-sm outline-blue-400"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
