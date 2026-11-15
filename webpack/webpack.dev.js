const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  devServer: {
    hot: true,
    open: true,
    // 3000 is the admin app; the client app runs on 8080
    port: 8080,
    // Any path (/orders, /order/123…) serves index.html so the app's router can handle it
    historyApiFallback: true,
    client: {
      // Show compile errors over the page, but not runtime warnings
      overlay: { errors: true, warnings: false },
    },
  },
  plugins: [new ReactRefreshWebpackPlugin()],
};
