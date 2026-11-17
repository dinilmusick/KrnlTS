export const join = (...args: any[]) => args.filter(Boolean).join('/');
export const resolve = (...args: any[]) => args.filter(Boolean).join('/');
export const dirname = (p: string) => p.split('/').slice(0, -1).join('/') || '.';
export const basename = (p: string) => p.split('/').pop() || '';
export const extname = (p: string) => {
  const b = basename(p);
  const idx = b.lastIndexOf('.');
  return idx > 0 ? b.slice(idx) : '';
};
export default { join, resolve, dirname, basename, extname };
