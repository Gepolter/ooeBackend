const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './app.js',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'api.bundle.js',
  },
  target: 'node',
  plugins: [
    new webpack.DefinePlugin({
      //ENVIRONMENT: JSON.stringify('production'),
      PORT: JSON.stringify('3000'),
      GREETING_MESSAGE: JSON.stringify('API Running In Development Environment'),
      API_WORKS_MESSAGE: JSON.stringify('API_WORKS_MESSAGE'),
      DB_USERNAME: JSON.stringify('DB_USERNAME'),
      DB_PASSWORD: JSON.stringify('DB_PASSWORD'),
      DB_CONNECTION_STR: JSON.stringify('mongodb+srv://Gepolter:KrummeMhrGoDB239$@mhrgodb.h9kql.mongodb.net/MhrGoTestData?retryWrites=true&w=majority'),
     // 'process.env.NODE_ENV': JSON.stringify('production')
    }),
  ],
  mode:'production',
};