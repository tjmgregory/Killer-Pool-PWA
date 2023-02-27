export default function Button({ children, onClick, ...props }) {
  return (
    <button {...props} onClick={onClick} className="px-4 py-2 text-white bg-slate-800 rounded-md hover:bg-slate-600">
      {children}
    </button>
  );
}
