const Dotenv = require('dotenv-webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { DefinePlugin } = require('webpack');

// The app's version: the app knows its own, and /version.json (never cached) tells it the newest
// one deployed (src/utils/appUpdate.ts reloads when they differ)
class VersionFilePlugin {
  constructor(version) { this.version = version; }
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('VersionFilePlugin', (compilation) => {
      compilation.hooks.processAssets.tap({ name: 'VersionFilePlugin', stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL }, () => {
        compilation.emitAsset('version.json', new compiler.webpack.sources.RawSource(JSON.stringify({ version: this.version })));
      });
    });
  }
}

const root = (...p) => path.resolve(__dirname, '..', ...p);

// `env` comes from the npm scripts (--env env=dev | env=prod). NODE_ENV is never set by them, so it
// must not be used to tell development from production here.
module.exports = (env, { qa = false } = {}) => {
  const isDev = env !== 'prod';

  // Plain CSS and SCSS: Sass compiles first, then PostCSS (Tailwind + Autoprefixer) runs on real CSS.
  // Development injects styles for instant updates; production writes real .css files so the page
  // is styled before the JavaScript runs.
  const styleLoader = isDev ? 'style-loader' : MiniCssExtractPlugin.loader;
  // One per build; 'dev' turns the update checks off on the dev server
  const appVersion = isDev ? 'dev' : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  return {
    entry: root('src/index.tsx'),
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.(ts|js)x?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              // Rebuilds reuse the previous compile of files that did not change
              cacheDirectory: true,
              plugins: [isDev && require.resolve('react-refresh/babel')].filter(Boolean),
            },
          },
        },
        {
          test: /\.css$/,
          use: [styleLoader, { loader: 'css-loader', options: { importLoaders: 1 } }, 'postcss-loader'],
        },
        {
          test: /\.s[ac]ss$/,
          use: [styleLoader, { loader: 'css-loader', options: { importLoaders: 2 } }, 'postcss-loader', 'sass-loader'],
        },
        {
          // Images: small ones are inlined (one request fewer), the rest get a content hash so they
          // can be cached for a year
          test: /\.(png|jpe?g|gif|webp|avif|svg)$/i,
          type: 'asset',
          parser: { dataUrlCondition: { maxSize: 8 * 1024 } },
          generator: { filename: 'assets/images/[name].[contenthash:8][ext]' },
        },
        {
          test: /\.(woff2?|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: { filename: 'assets/fonts/[name].[contenthash:8][ext]' },
        },
        {
          test: /\.(pdf|ico)$/i,
          type: 'asset/resource',
          generator: { filename: 'assets/files/[name].[contenthash:8][ext]' },
        },
      ],
    },
    output: {
      path: root(qa ? 'build-qa' : 'build'),
      filename: isDev ? '[name].js' : 'assets/js/[name].[contenthash:8].js',
      chunkFilename: isDev ? '[name].chunk.js' : 'assets/js/[name].[contenthash:8].chunk.js',
      publicPath: '/',
      // Old bundles never pile up in build/ (and get deployed) after a new build
      clean: true,
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: root('public/index.html'),
      }),
      new Dotenv({
        path: root(qa ? '.env.qa' : env === 'prod' ? '.env.production' : '.env'),
      }),
      // Files that must be served from the site root as-is (SEO, favicon, and the installable app)
      new CopyWebpackPlugin({
        patterns: [
          'robots.txt', 'sitemap.xml', 'favicon.ico', 'icon-192.png', 'apple-touch-icon.png', 'og-image.jpg',
          'manifest.webmanifest', 'sw.js', 'icon-512.png', 'icon-maskable-512.png', 'badge-96.png',
        ].map((file) => ({
          from: root('public', file),
          to: file,
        })),
      }),
      new DefinePlugin({ __APP_VERSION__: JSON.stringify(appVersion) }),
      !isDev && new VersionFilePlugin(appVersion),
      !isDev && new MiniCssExtractPlugin({
        filename: 'assets/css/[name].[contenthash:8].css',
        chunkFilename: 'assets/css/[name].[contenthash:8].chunk.css',
      }),
    ].filter(Boolean),
    // Webpack's own cache on disk: a second build or dev start only redoes what changed
    // (one per mode, so `npm run build` while `npm start` is running never shares the dev cache)
    cache: { type: 'filesystem', name: isDev ? 'dev' : qa ? 'qa' : 'prod', buildDependencies: { config: [__filename] } },
    stats: 'errors-warnings',
  };
};
