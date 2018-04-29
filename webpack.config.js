var webpack = require('webpack')
const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

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
                        'style-loader',
                        'css-loader',                        
                        'sass-loader',
                    ],
                    exclude: /node_modules/
                },            
                {
                    test: /\.jpg($|\?)|\.png($|\?)|\.woff($|\?)|\.woff2($|\?)|\.ttf($|\?)|\.eot($|\?)|\.svg($|\?)|\.gif($|\?)/,
                    use: ['url-loader']
                },
            ]
        },
        mode: 'development',
        plugins: [
            /*new MiniCssExtractPlugin({
              // Options similar to the same options in webpackOptions.output
              // both options are optional
              filename: "default.css",
              chunkFilename: "[id].css"
            })*/
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
                        'css-loader',                    
                        'postcss-loader',                    
                        'sass-loader',
                    ],
                    exclude: /node_modules/
                },            
                {
                    test: /\.jpg($|\?)|\.png($|\?)|\.woff($|\?)|\.woff2($|\?)|\.ttf($|\?)|\.eot($|\?)|\.svg($|\?)|\.gif($|\?)/,
                    use: ['url-loader']
                },
            ]
        },
        mode: 'development',
        plugins: [
            new MiniCssExtractPlugin({
              // Options similar to the same options in webpackOptions.output
              // both options are optional
              filename: "default.css",
              chunkFilename: "[id].css"
            })
        ],
    }
]