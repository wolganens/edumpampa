var webpack = require('webpack')

module.exports = function(env) {
    return {
        entry: "./src/index.js",
        output: {
            path: __dirname + "./public/",
            filename: "app.js"
        },        
        module: {
            loaders: [
                {test: /\.html$/, loader: 'raw-loader', exclude: /node_modules/},
                {test: /\.css$/, loader: "style-loader!css-loader", exclude: /node_modules/},
                {test: /\.scss$/, loader: "style-loader!css-loader!sass-loader", exclude: /node_modules/},
                {test: /\.jpg($|\?)|\.png($|\?)|\.woff($|\?)|\.woff2($|\?)|\.ttf($|\?)|\.eot($|\?)|\.svg($|\?)|\.gif($|\?)/, loader: 'url-loader'},                
            ]
        },
    }
}