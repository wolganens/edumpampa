var webpack = require('webpack')
const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = [
    {    
        entry: "./assets/src/index.js",
        output: {
            path: path.resolve(__dirname, 'public'),
            filename: 'app.js',
        },        
        module: {
            rules: [
                {
                    test: /\.html$/,
                    use: ['raw-loader'], 
                    exclude: /node_modules/
                },
                {
                    test: /\.s?[ac]ss$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        { loader: 'css-loader', options: { minimize: true } },
                        { loader: 'sass-loader', options: { minimize: true } },
                    ],
                    exclude: /node_modules/
                },            
                {
                    test: /\.jpg($|\?)|\.png($|\?)|\.woff($|\?)|\.woff2($|\?)|\.ttf($|\?)|\.eot($|\?)|\.svg($|\?)|\.gif($|\?)/,
                    use: ['url-loader']
                },
            ]
        },
        optimization: {
            splitChunks: {
                chunks: "async",
                minSize: 30000,
                minChunks: 1,
                maxAsyncRequests: 5,
                maxInitialRequests: 3,
                name: true,
                cacheGroups: {
                    default: {
                        minChunks: 2,
                        priority: -20,
                        reuseExistingChunk: true,
                    },
                    vendors: {
                        test: /[\\/]node_modules[\\/]/,
                        priority: -10
                    }
                }
            }
        },
        mode: 'production',
        plugins: [            
            new UglifyJSPlugin(),
            new webpack.DefinePlugin({
                'process.env': {
                  'NODE_ENV': JSON.stringify('production')
                }
            }),
            new MiniCssExtractPlugin({
              // Options similar to the same options in webpackOptions.output
              // both options are optional
              filename: "default.css",
              chunkFilename: "[id].css"
            }),          
        ],
    },
    {    
        entry: "./assets/src/index2.js",
        output: {
            path: path.resolve(__dirname, 'public'),
            filename: 'app-contrast.js',
        },        
        module: {
            rules: [
                {
                    test: /\.html$/,
                    use: ['raw-loader'], 
                    exclude: /node_modules/
                },
                {
                    test: /\.s?[ac]ss$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        { loader: 'css-loader', options: { minimize: true } },
                        { loader: 'sass-loader', options: { minimize: true } },
                    ],
                    exclude: /node_modules/
                },            
                {
                    test: /\.jpg($|\?)|\.png($|\?)|\.woff($|\?)|\.woff2($|\?)|\.ttf($|\?)|\.eot($|\?)|\.svg($|\?)|\.gif($|\?)/,
                    use: ['url-loader']
                },
            ]
        },
        optimization: {
            splitChunks: {
                chunks: "async",
                minSize: 30000,
                minChunks: 1,
                maxAsyncRequests: 5,
                maxInitialRequests: 3,
                name: true,
                cacheGroups: {
                    default: {
                        minChunks: 2,
                        priority: -20,
                        reuseExistingChunk: true,
                    },
                    vendors: {
                        test: /[\\/]node_modules[\\/]/,
                        priority: -10
                    }
                }
            }
        },
        mode: 'production',
        plugins: [            
            new UglifyJSPlugin(),
            new webpack.DefinePlugin({
                'process.env': {
                  'NODE_ENV': JSON.stringify('production')
                }
            }),
            new MiniCssExtractPlugin({
              // Options similar to the same options in webpackOptions.output
              // both options are optional
              filename: "contrast.css",
              chunkFilename: "[id].css"
            }),          
        ],
    },
]