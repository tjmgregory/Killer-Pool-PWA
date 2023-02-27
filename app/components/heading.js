const classMap = {
  1: 'text-3xl leading-tight font-bold mb-8',
  2: 'text-2xl leading-tight font-bold mb-4',
  3: 'text-xl leading-tight font-semibold mb-2',
  4: 'text-l leading-tight font-semibold',
};

export default function Heading({ children, level = '1', as: Tag = `h${level}` }) {
  return <Tag className={`font-sans block text-current ${classMap[level]}`}>{children}</Tag>;
}
