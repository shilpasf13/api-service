const path = require("path");
const AwsSamPlugin = require("aws-sam-webpack-plugin");
const nodeExternals = require("webpack-node-externals");

const awsSamPlugin = new AwsSamPlugin();

module.exports = {
  entry: () => awsSamPlugin.entry(),

  output: {
    filename: (chunkData) => awsSamPlugin.filename(chunkData),
    libraryTarget: "commonjs2",
    path: path.resolve("."),
  },

  // Create source maps
  devtool: "source-map",

  // Resolve .ts and .js extensions
  resolve: {
    extensions: [".ts", ".js", ".mjs"],
  },

  // Target node
  target: "node",

  // externals: process.env.NODE_ENV === "development" ? [] : ["aws-sdk"],
  // externals: [nodeExternals()],
  // Set the webpack mode
  mode: process.env.NODE_ENV || "production",

  // Add the TypeScript loader
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: "ts-loader",
        options: {
          // disable type checker - we will use it in fork plugin
          transpileOnly: true,
        },
      },
    ],
  },

  // Add the AWS SAM Webpack plugin
  plugins: [awsSamPlugin],
};
