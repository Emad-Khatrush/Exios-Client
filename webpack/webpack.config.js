const { merge } = require('webpack-merge')
const commonConfig = require('./webpack.common.js')

module.exports = (envVars) => {
  const { env, qa } = envVars
  const envConfig = require(`./webpack.${env}.js`)
  // `--env qa` (npm run build:qa): a production build for the QA site, talking to the QA API
  const config = merge(commonConfig(env, { qa: !!qa }), envConfig)
  return config
}
