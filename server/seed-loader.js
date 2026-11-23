// Lets Node import src/data/*.js, which import images (Vite assets): they resolve to their file name.
import { registerHooks } from 'node:module';
import { basename } from 'node:path';

registerHooks({
  load(url, ctx, next) {
    if (/\.(jpe?g|png|webp|svg)$/i.test(url)) {
      return { format: 'module', shortCircuit: true, source: `export default ${JSON.stringify(basename(url))};` };
    }
    return next(url, ctx);
  },
});
