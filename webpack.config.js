const path = require("path")
const webpack = require("webpack")

module.exports = {
  // tell webpack where our desired js folder lives
  entry: "./frontend-js/main.js",
  output: {
    filename: "main-bundled.js",

    // tell it where to export to (public folder)
    path: path.resolve(__dirname, "public")
  },
  mode: "production",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        // tell webpack any additional features we want to use, such as Babel
        // Babel takes whatever modern js we use and converts it
        // into industry-standard code that any browser / build can use
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"]
          }
        }
      }
    ]
  }
}
