import { useId } from 'react';
import Input from './input';

export default function FormInput({ type = 'text', label, placeholder, value, onChange }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-slate-600">
        {label}
      </label>
      <Input type={type} id={id} placeholder={placeholder} value={value} onChange={onChange} />
    </div>
  );
}
