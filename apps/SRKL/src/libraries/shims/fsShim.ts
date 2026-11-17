export const noop = () => {};
export const asyncNoop = async () => {};

export const promises = {
  readFile: async () => '',
  writeFile: async () => {},
  mkdir: async () => {},
  stat: async () => ({ isFile: () => true, isDirectory: () => false }),
  readdir: async () => [],
  mkdtemp: async () => '/tmp/mock',
  unlink: async () => {},
  rm: async () => {},
  rmdir: async () => {},
  copyFile: async () => {},
  access: async () => {},
};

export const readFile = (_p: any, o: any, cb: any) => { const fn = typeof o === 'function' ? o : cb; if (fn) fn(null, ''); };
export const readFileSync = () => '';
export const writeFile = (_p: any, _d: any, o: any, cb: any) => { const fn = typeof o === 'function' ? o : cb; if (fn) fn(null); };
export const writeFileSync = () => {};
export const existsSync = () => false;
export const statSync = () => ({ isFile: () => true, isDirectory: () => false });
export const mkdirSync = () => {};
export const mkdtemp = (_prefix: any, cb: any) => { if (typeof cb === 'function') cb(null, '/tmp/mock'); return '/tmp/mock'; };
export const mkdtempSync = () => '/tmp/mock';
export const unlink = (_p: any, cb: any) => { if (typeof cb === 'function') cb(null); };
export const unlinkSync = () => {};
export const rm = (_p: any, o: any, cb: any) => { const fn = typeof o === 'function' ? o : cb; if (fn) fn(null); };
export const rmSync = () => {};
export const rmdir = (_p: any, o: any, cb: any) => { const fn = typeof o === 'function' ? o : cb; if (fn) fn(null); };
export const rmdirSync = () => {};
export const readdir = (_p: any, o: any, cb: any) => { const fn = typeof o === 'function' ? o : cb; if (fn) fn(null, []); };
export const readdirSync = () => [];
export const copyFile = (_s: any, _d: any, cb: any) => { if (typeof cb === 'function') cb(null); };
export const copyFileSync = () => {};
export const access = (_p: any, m: any, cb: any) => { const fn = typeof m === 'function' ? m : cb; if (fn) fn(null); };
export const accessSync = () => {};
export const createReadStream = () => ({ pipe: () => ({ on: () => {} }), on: () => {} });
export const createWriteStream = () => ({ write: () => {}, end: () => {}, on: () => {} });
export const constants = { F_OK: 0, R_OK: 4, W_OK: 2, X_OK: 1 };

export default {
  promises,
  readFile,
  readFileSync,
  writeFile,
  writeFileSync,
  existsSync,
  statSync,
  mkdirSync,
  mkdtemp,
  mkdtempSync,
  unlink,
  unlinkSync,
  rm,
  rmSync,
  rmdir,
  rmdirSync,
  readdir,
  readdirSync,
  copyFile,
  copyFileSync,
  access,
  accessSync,
  createReadStream,
  createWriteStream,
  constants,
};
