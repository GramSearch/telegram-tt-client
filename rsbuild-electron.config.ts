import { defineConfig, rspack } from '@rsbuild/core';
import dotenv from 'dotenv';

import { PRODUCTION_URL } from './src/config';
import { rsbuildConfig } from './rsbuild.config';

dotenv.config();

// GitHub workflow uses an empty string as the default value if it's not in repository variables, so we cannot define a default value here
process.env.BASE_URL = process.env.BASE_URL || PRODUCTION_URL;

const {
  APP_ENV = 'production',
  BASE_URL,
} = process.env;

export default defineConfig({
  // mode: 'production',

  // output: {
  //   cleanDistPath: false,
  // },

  environments: {
    main: {
      source: {
        entry: {
          main: './src/electron/main.ts',
        },
      },

      tools: {
        rspack: {
          target: 'electron-main',

          plugins: [
            // @ts-expect-error
            new rspack.EnvironmentPlugin({
              APP_ENV,
              BASE_URL,
              IS_PREVIEW: false,
            }),
          ],

          // externals: {
          //   electron: 'require("electron")',
          // },
        },
      },

      output: {
        distPath: {
          root: 'electron',
          js: '.',
        },
      },
    },

    preload: {
      source: {
        entry: {
          preload: './src/electron/preload.ts',
        },
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
          ],

          // externals: {
          //   electron: 'require("electron")',
          // },
        },
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

          // output: {
          //   clean: false
          // }

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
      },
    },
  },
});
