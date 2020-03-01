import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
import { terser } from 'rollup-plugin-terser';

const buildPlugins = opts => [
    json(),
    resolve({
      preferBuiltins: true,
      ...opts.resolve
    }),
    commonjs({
      namedExports: {
        'node_modules/@rollup/plugin-commonjs/node_modules/resolve/index.js': [ 'isCore', 'sync' ],
        'node_modules/async/dist/async.js': [ 'eachSeries' ],
        ...opts.commonjs.namedExports
      }
    }),
  ];


// Requires the following patch:
//
// --- node_modules/rollup-plugin-node-builtins/src/es6/path.js
// +export var posix = {
// +  relative: relative,
// +  join: join,
// +  isAbsolute: isAbsolute,
// +  normalize: normalize,
// +  resolve: resolve
// +};
//  export default {

const config = {
  input  : 'espruino-rollup.js',
  output : {
    file: 'espruino-rollup.browser.js',
    name: 'espruinoRollup',
    format: 'umd',
  },
  plugins: [
    alias({
      entries: {
        rollup: require.resolve('rollup/dist/rollup.browser'),
        fs: require.resolve('memfs'),
        debug: require.resolve('./debug-shim')
      }
    }),
    ...buildPlugins({
      resolve: {
        browser: true,
      },
      commonjs: {
        namedExports: {
          'node_modules/memfs/lib/index.js': [
            'existsSync',
            'statSync', 'lstatSync', 'realpathSync',
            'mkdirSync', 'readdirSync',
            'readFileSync',
            'writeFile', 'writeFileSync',
            'watch',
          ]
        }
      }
    }),
    builtins({crypto: true}),
    globals({
        dirname: false
    }),
    terser(),
  ]
};

// console.log( config );
export default config;
