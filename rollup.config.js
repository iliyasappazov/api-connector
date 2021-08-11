import { babel } from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'lib/index.js',
  output: {
    file: 'dist/api-connector.js',
    format: 'umd',
    name: 'api-connector',
    exports: 'default',
    globals: {
      axios: 'axios',
    },
  },
  plugins: [
    babel({
      babelrc: false,
      exclude: 'node_modules/**',
      presets: [
        [
          '@babel/preset-env',
          {
            modules: false,
          },
        ],
      ],
      plugins: [
        '@babel/plugin-proposal-object-rest-spread',
      ],
      babelHelpers: 'bundled',
    }),
    terser(),
  ],
  external: ['axios'],
};
