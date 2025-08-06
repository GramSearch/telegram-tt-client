import { defineConfig, rspack } from '@rsbuild/core';
import { rsbuildConfig } from './rsbuild.config';

import { PRODUCTION_URL } from './src/config';

import dotenv from 'dotenv';
dotenv.config();

// GitHub workflow uses an empty string as the default value if it's not in repository variables, so we cannot define a default value here
process.env.BASE_URL = process.env.BASE_URL || PRODUCTION_URL;

const {
  APP_ENV = 'production',
  BASE_URL,
} = process.env;

export default defineConfig({
  // mode: 'production',

  environments: {
    main: {
      source: {
        entry: {
          'main': './src/electron/main.ts',
        },
      },

      tools: {
        rspack: {
          target: 'electron-main',

          optimization: {
            splitChunks: false,
          },

          experiments: {
            outputModule: true
          },

          output: {
            module: true,
          },

          module: {
            rules: [
              {
                test: /\.wasm|\.node|\.data$/,
                type: 'asset/resource',
              },
            ],
          },

          plugins: [
            // @ts-expect-error
            new rspack.EnvironmentPlugin({
              APP_ENV,
              BASE_URL,
              IS_PREVIEW: false,
            }),

            // {
            //   apply(compiler) {
            //     const { RuntimeGlobals } = compiler.webpack;
            //     compiler.hooks.compilation.tap('CustomPlugin', compilation => {
            //       compilation.hooks.runtimeModule.tap(
            //         'CustomPlugin',
            //         (module, chunk) => {
            //           if (module.name === 'public_path' && chunk.name === 'main') {
            //             // const originSource = module.source.source.toString('utf-8');
            //             module.source.source = Buffer.from(
            //               `${RuntimeGlobals.publicPath} = "${__dirname}/electron/";\n`,
            //               'utf-8',
            //             );
            //           }
            //         },
            //       );
            //     });
            //   },
            // }
          ],

          ignoreWarnings: [/jieba/]
        }
      },

      output: {
        // assetPrefix: './',
        distPath: {
          root: 'electron',
          js: '.',
        },
      },
    },

    preload: {
      source: {
        entry: {
          'preload': './src/electron/preload.ts',
        }
      },

      tools: {
        rspack: {
          target: 'electron-preload',

          plugins: [
            // @ts-expect-error
            new rspack.EnvironmentPlugin({
              APP_ENV,
              BASE_URL,
              IS_PREVIEW: false,
            }),
          ]
        }
      },

      output: {
        distPath: {
          root: 'electron',
          js: '.',
        },
      },
    },

    renderer: {
      ...rsbuildConfig,

      tools: {
        rspack: {
          target: 'electron-renderer',

          plugins: [
            // @ts-expect-error
            new rspack.EnvironmentPlugin({
              APP_ENV,
              BASE_URL,
              IS_PREVIEW: false,
            }),
          ],

          ...rsbuildConfig.tools?.rspack,
        },
        ...rsbuildConfig.tools,
      }
    }
  },
});
