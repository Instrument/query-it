var CopyWebpackPlugin = require('copy-webpack-plugin');
var path = require('path');

module.exports = {
  cache: false,
  entry: './src/scripts/app.js',
  output: {
    filename: 'main.js',
    publicPath: '/',
    path: __dirname + '/serve',
  },
  devServer: {
    publicPath: '/',
    contentBase: "./serve",
  },
  devtool: "#inline-source-map",
  module: {
    loaders: [{
      test: /\.(js)$/,
      exclude: /node_modules/,
      loader: 'babel',
      query: {
        presets: ["es2015", "stage-0"],
        plugins: ["transform-decorators-legacy"]
      }
      },
      {
        test:/\.json$/,
        loader: "json-loader",
      },
      {
        test: /\.(png|wav)$/,
        loaders: ["file-loader"]
      }, {
        test: /\.(sass|scss)$/,
        loader: 'style!css!sass'
      }
    ]
  },
  resolve: {
    modulesDirectories: ['node_modules', 'src'],
    extensions: ['', '.js'],
    root: [
      path.resolve('..'),
    ],
    modulesDirectories: [
      'node_modules'
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
      // Copy directory contents to {output}/to/directory/
      { from: 'src/viz', to: 'viz' },
      { from: 'src/data', to: 'data' },
      { from: 'src/index.html', to: 'index.html' },

    ])
  ]
};



