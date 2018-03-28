var webpack = require('webpack')
const path = require('path');

module.exports = {    
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
                test: /\.css$/,
                use: [
                    "style-loader",
                    "css-loader"
                ],
                exclude: /node_modules/
            },
            {
                test: /\.scss$/,
                use: [
                    "style-loader",
                    "css-loader",
                    "sass-loader"
                ],
                exclude: /node_modules/
            },
            {
                test: /\.jpg($|\?)|\.png($|\?)|\.woff($|\?)|\.woff2($|\?)|\.ttf($|\?)|\.eot($|\?)|\.svg($|\?)|\.gif($|\?)/,
                use: ['url-loader']
            },
        ]
    },
    mode: 'development'  
}