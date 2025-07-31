import 'webpack-dev-server';

import type { Compiler, Configuration } from '@rspack/core';
import {
  ContextReplacementPlugin,
  DefinePlugin,
  EnvironmentPlugin,
  NormalModuleReplacementPlugin,
  ProvidePlugin
} from '@rspack/core';
import dotenv from 'dotenv';
import { GitRevisionPlugin } from 'git-revision-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';

import { createRequire } from 'module';
import { PRODUCTION_URL } from './src/config.ts';
import pkg from './package.json' with { type: 'json' };
const { version: appVersion } = pkg;

const {
  HEAD,
  APP_ENV = 'production',
  APP_MOCKED_CLIENT = '',
  IS_PACKAGED_ELECTRON,
} = process.env;

dotenv.config();

const DEFAULT_APP_TITLE = `Telegram${APP_ENV !== 'production' ? ' Beta' : ''}`;

// GitHub workflow uses an empty string as the default value if it's not in repository variables, so we cannot define a default value here
process.env.BASE_URL = process.env.BASE_URL || PRODUCTION_URL;

const {
  BASE_URL,
  ELECTRON_HOST_URL = 'https://telegram-a-host',
  APP_TITLE = DEFAULT_APP_TITLE,
} = process.env;

const CSP = `
  default-src 'self';
  connect-src 'self' wss://*.web.telegram.org ws://localhost:3000 blob: http: https: ${APP_ENV === 'development' ? 'wss:' : ''};
  script-src 'self' 'wasm-unsafe-eval' https://t.me/_websync_ https://telegram.me/_websync_;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://ss3.4sqi.net/img/categories_v2/
  ${IS_PACKAGED_ELECTRON ? `${BASE_URL}/` : ''};
  media-src 'self' blob: data: ${IS_PACKAGED_ELECTRON ? [`${BASE_URL}/`, ELECTRON_HOST_URL].join(' ') : ''};
  object-src 'none';
  frame-src http: https:;
  base-uri 'none';
  form-action 'none';`
  .replace(/\s+/g, ' ').trim();


const require = createRequire(import.meta.url);

export default function createConfig(
  _: any,
  { mode = 'production' }: { mode: 'none' | 'development' | 'production' },
): Configuration {
  return {
    mode,
    entry: './src/index.tsx',
    target: 'web',

    devServer: {
      port: 1234,
      host: '0.0.0.0',
      allowedHosts: 'all',
      hot: false,
      static: [
        {
          directory: path.resolve(import.meta.dirname, 'public'),
        },
        {
          directory: path.resolve(import.meta.dirname, 'node_modules/emoji-data-ios'),
        },
        {
          directory: path.resolve(import.meta.dirname, 'node_modules/opus-recorder/dist'),
        },
        {
          directory: path.resolve(import.meta.dirname, 'src/lib/webp'),
        },
        {
          directory: path.resolve(import.meta.dirname, 'src/lib/rlottie'),
        },
        {
          directory: path.resolve(import.meta.dirname, 'src/lib/video-preview'),
        },
        {
          directory: path.resolve(import.meta.dirname, 'src/lib/secret-sauce'),
        },
      ],
      devMiddleware: {
        stats: 'minimal',
      },
      headers: {
        'Content-Security-Policy': CSP,
      },
    },

    output: {
      filename: '[name].[contenthash].js',
      chunkFilename: '[id].[chunkhash].js',
      assetModuleFilename: '[name].[contenthash][ext]',
      path: path.resolve(import.meta.dirname, 'dist'),
      clean: true,
    },

    module: {
      rules: [
        {
          test: /\.(j|t)s$/,
          exclude: [/[\\/]node_modules[\\/]/],
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
              },
              externalHelpers: true,
              transform: {
                react: {
                  runtime: 'automatic',
                  development: mode === 'development',
                  refresh: mode === 'development',
                },
              },
            },
            env: {
              targets: 'Chrome >= 48',
            },
          },
        },
        {
          test: /\.(j|t)sx$/,
          loader: 'builtin:swc-loader',
          exclude: [/[\\/]node_modules[\\/]/],
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
              },
              transform: {
                react: {
                  runtime: 'automatic',
                  development: mode === 'development',
                  refresh: mode === 'development',
                },
              },
              externalHelpers: true,
            },
            env: {
              targets: 'Chrome >= 48', // browser compatibility
            },
          },
        },
        {
          test: /\.(sass|scss)$/,
          type: 'css/auto', // 👈
          use: ['sass-loader'],
        },
        {
          test: /\.(woff(2)?|ttf|eot|svg|png|jpg|tgs)(\?v=\d+\.\d+\.\d+)?$/,
          type: 'asset/resource',
        },
        {
          test: /\.wasm$/,
          type: 'asset/resource',
        },
        {
          test: /\.(txt|tl|strings)$/i,
          type: 'asset/source',
        },
      ],
    },

    resolve: {
      extensions: ['.js', '.ts', '.tsx'],
      fallback: {
        path: require.resolve('path-browserify'),
        os: require.resolve('os-browserify/browser'),
        buffer: require.resolve('buffer/'),
        fs: false,
        crypto: false,
      },
    },

    stats: {
      warnings: false
    },

    plugins: [
      // Clearing of the unused files for code highlight for smaller chunk count
      new ContextReplacementPlugin(
        /highlight\.js[\\/]lib[\\/]languages/,
        /^((?!\.js\.js).)*$/,
      ),
      ...(APP_MOCKED_CLIENT === '1' ? [new NormalModuleReplacementPlugin(
        /src[\\/]lib[\\/]gramjs[\\/]client[\\/]TelegramClient\.js/,
        './MockClient.ts',
      )] : []),
      new HtmlWebpackPlugin({
        appTitle: APP_TITLE,
        appleIcon: APP_ENV === 'production' ? 'apple-touch-icon' : 'apple-touch-icon-dev',
        mainIcon: APP_ENV === 'production' ? 'icon-192x192' : 'icon-dev-192x192',
        manifest: APP_ENV === 'production' ? 'site.webmanifest' : 'site_dev.webmanifest',
        baseUrl: BASE_URL,
        csp: CSP,
        template: 'src/index.html',
      }),
      new EnvironmentPlugin({
        APP_ENV,
        APP_MOCKED_CLIENT,
        // eslint-disable-next-line no-null/no-null
        APP_NAME: null,
        APP_TITLE,
        RELEASE_DATETIME: Date.now(),
        TELEGRAM_API_ID: undefined,
        TELEGRAM_API_HASH: undefined,
        // eslint-disable-next-line no-null/no-null
        TEST_SESSION: null,
        IS_PACKAGED_ELECTRON: false,
        ELECTRON_HOST_URL,
        BASE_URL,
      }),
      // Updates each dev re-build to provide current git branch or commit hash
      new DefinePlugin({
        APP_VERSION: JSON.stringify(appVersion),
        // TODO
        // APP_REVISION: DefinePlugin.runtimeValue(() => {
        //   const { branch, commit } = getGitMetadata();
        //   const shouldDisplayCommit = APP_ENV === 'staging' || !branch || branch === 'HEAD';
        //   return JSON.stringify(shouldDisplayCommit ? commit : branch);
        // }, mode === 'development' ? true : []),
      }),
      new ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      }),
      // TODO
      // new StatoscopeWebpackPlugin({
      //   statsOptions: {
      //     context: import.meta.dirname,
      //   },
      //   saveReportTo: path.resolve('./public/statoscope-report.html'),
      //   saveStatsTo: path.resolve('./public/build-stats.json'),
      //   normalizeStats: true,
      //   open: 'file',
      //   extensions: [new WebpackContextExtension()], // eslint-disable-line @typescript-eslint/no-use-before-define
      // }),
    ],

    devtool: APP_ENV === 'production' && IS_PACKAGED_ELECTRON ? undefined : 'source-map',

    optimization: {
      splitChunks: {
        cacheGroups: {
          sharedComponents: {
            name: 'shared-components',
            test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
          },
        },
      },
      ...(APP_ENV === 'staging' && {
        chunkIds: 'named',
      }),
    },

    experiments: {
      css: true
    },

    ignoreWarnings: [/sass/, _ => false],
  };
}

function getGitMetadata() {
  const gitRevisionPlugin = new GitRevisionPlugin();
  const branch = HEAD || gitRevisionPlugin.branch();
  const commit = gitRevisionPlugin.commithash()?.substring(0, 7);
  return { branch, commit };
}

class WebpackContextExtension {
  context: string;

  constructor() {
    this.context = '';
  }

  handleCompiler(compiler: Compiler) {
    this.context = compiler.context;
  }

  getExtension() {
    return {
      descriptor: { name: 'custom-webpack-extension-context', version: '1.0.0' },
      payload: { context: this.context },
    };
  }
}
