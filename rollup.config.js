import babel from "rollup-plugin-babel";
import {uglify} from "rollup-plugin-uglify";

export default {
    input: "lib/index.js",
    output: {
        file: "dist/api-connector.js",
        format: "cjs",
        exports: "named",
    },
    plugins: [
        babel({
            babelrc: false,
            presets: [
                "es2015-rollup"
            ],
            plugins: ["transform-object-rest-spread"],
            runtimeHelpers: true
        }),
        uglify(),
    ],
    external: ["axios"]
}
