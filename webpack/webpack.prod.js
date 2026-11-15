const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

// `npm run build -- --env analyze` opens a map of what is inside the bundles
const analyze = process.argv.includes('analyze');

module.exports = {
  mode: 'production',
  // No source maps in production: build/ is deployed as-is, and maps would publish the full source
  devtool: false,
  optimization: {
    minimizer: ['...', new CssMinimizerPlugin()],
    // The runtime and the big libraries go in their own files. They rarely change, so returning
    // visitors keep them in cache when only the app's own code changes.
    runtimeChunk: 'single',
    moduleIds: 'deterministic',
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|@remix-run|react-redux|redux|@reduxjs)[\\/]/,
          name: 'react',
          priority: 30,
        },
        firebase: {
          test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
          name: 'firebase',
          priority: 25,
        },
        mui: {
          test: /[\\/]node_modules[\\/](@mui|@emotion)[\\/]/,
          name: 'mui',
          priority: 20,
        },
      },
    },
  },
  performance: {
    // Warn when a single file a page needs gets heavy
    maxEntrypointSize: 600 * 1024,
    maxAssetSize: 600 * 1024,
  },
  plugins: [
    analyze && new (require('webpack-bundle-analyzer').BundleAnalyzerPlugin)(),
  ].filter(Boolean),
};
