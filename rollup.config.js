import babel from 'rollup-plugin-babel';
import { uglify } from 'rollup-plugin-uglify';

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
      presets: [
        [
          'env',
          {
            modules: false,
          },
        ],
      ],
      plugins: ['external-helpers', 'transform-object-rest-spread'],
      runtimeHelpers: true,
    }),
    uglify(),
  ],
  external: ['axios'],
};
