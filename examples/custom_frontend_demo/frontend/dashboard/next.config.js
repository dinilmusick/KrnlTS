const original = require('./next.config.original.js');
module.exports = {
  ...original,
  basePath: process.env.NEXT_PUBLIC_KRNL_BASE_PATH || original.basePath || '',
};
