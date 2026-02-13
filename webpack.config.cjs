const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const webpack = require('webpack');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const isSingleHtml = process.env.BUILD_SINGLE_HTML === 'true';
  const isCDN = process.env.BUILD_CDN === 'true';
  const isSingleJS = process.env.BUILD_SINGLE_JS === 'true';

  // 单JS模式 / CDN模式 / 单HTML模式下，CSS通过style-loader内联到JS中
  // 普通production模式下，CSS通过MiniCssExtractPlugin提取为独立文件
  const cssLoader = (isSingleJS || isSingleHtml || isCDN)
    ? 'style-loader'
    : isProduction
      ? MiniCssExtractPlugin.loader
      : 'style-loader';

  // 单JS模式 / CDN模式 / 单HTML模式下，资源内联为base64
  const useInlineAssets = isSingleJS || isSingleHtml || isCDN;

  return {
    entry: './src/main.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: (isSingleJS || isCDN)
        ? 'GameDevTycoon.js'
        : isSingleHtml
          ? 'js/[name].js'
          : isProduction
            ? 'js/app.js'
            : 'js/[name].js',
      // 生产模式使用相对路径，兼容 GitHub Pages 子目录部署
      publicPath: isProduction ? './' : '/',
      clean: true,
    },
    resolve: {
      extensions: ['.ts', '.js', '.vue', '.json'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    // CDN模式：将Vue/VueRouter/Pinia设为外部依赖，从全局变量加载
    // 注意：单JS模式不使用externals，所有依赖打包进单个JS文件
    ...(isCDN ? {
      externals: {
        'vue': 'Vue',
        'vue-router': 'VueRouter',
        'pinia': 'Pinia',
      },
    } : {}),
    // 单JS模式 / CDN模式 / 单HTML模式下禁用代码分割，确保只生成一个JS bundle
    ...((isSingleJS || isSingleHtml || isCDN)
      ? {
          optimization: {
            splitChunks: false,
            runtimeChunk: false,
          },
        }
      : {}),
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader',
        },
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          options: {
            appendTsSuffixTo: [/\.vue$/],
            transpileOnly: true,
          },
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [cssLoader, 'css-loader'],
        },
        {
          test: /\.scss$/,
          use: [cssLoader, 'css-loader', 'sass-loader'],
        },
        {
          test: /\.(png|jpe?g|gif|svg|webp|ico)$/i,
          // 单JS/CDN/单HTML模式下将图片转为内联base64 data URL
          type: useInlineAssets ? 'asset/inline' : 'asset/resource',
          ...(useInlineAssets
            ? {}
            : {
                generator: {
                  filename: 'images/[name].[hash:8][ext]',
                },
              }),
        },
        {
          test: /\.(woff2?|eot|ttf|otf)$/i,
          // 单JS/CDN/单HTML模式下将字体转为内联base64 data URL
          type: useInlineAssets ? 'asset/inline' : 'asset/resource',
          ...(useInlineAssets
            ? {}
            : {
                generator: {
                  filename: 'fonts/[name].[hash:8][ext]',
                },
              }),
        },
      ],
    },
    plugins: [
      new VueLoaderPlugin(),
      // 单JS模式：生成极简HTML加载器（仙途格式）
      // CDN模式：使用专用模板
      // 单HTML模式：输出独立HTML文件
      // 普通模式：标准HTML
      new HtmlWebpackPlugin(
        isSingleJS
          ? {
              templateContent: `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>AI游戏开发商</title>
  <style>#app,body,html{margin:0;padding:0;width:100%;height:100%;box-sizing:border-box;overflow:auto}</style>
</head>
<body>
  <div id="app"></div>
</body>
</html>`,
              filename: 'index.html',
              inject: 'body',
              minify: {
                collapseWhitespace: true,
                removeComments: true,
                removeRedundantAttributes: true,
                useShortDoctype: true,
              },
            }
          : {
              template: isCDN ? './index.cdn.html' : './index.html',
              filename: isSingleHtml ? 'game-dev-tycoon-standalone.html' : 'index.html',
              title: 'AI游戏开发商模拟器',
              inject: isCDN ? false : 'body',
              ...(isSingleHtml
                ? {
                    minify: {
                      collapseWhitespace: true,
                      removeComments: true,
                      removeRedundantAttributes: true,
                      useShortDoctype: true,
                      removeEmptyAttributes: true,
                      removeStyleLinkTypeAttributes: true,
                      keepClosingSlash: true,
                      minifyCSS: true,
                      minifyJS: false,
                    },
                  }
                : {}),
            }
      ),
      new webpack.DefinePlugin({
        __VUE_OPTIONS_API__: JSON.stringify(true),
        __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false),
      }),
      // 单HTML模式：使用HtmlInlineScriptPlugin将JS内联到HTML中
      ...(isSingleHtml ? [new HtmlInlineScriptPlugin()] : []),
      // 普通production模式：提取CSS为独立文件（单JS/CDN/单HTML模式不需要）
      ...(isProduction && !isSingleJS && !isSingleHtml && !isCDN
        ? [
            new MiniCssExtractPlugin({
              filename: 'css/app.css',
            }),
          ]
        : []),
    ],
    devServer: {
      port: 8080,
      hot: true,
      open: true,
      historyApiFallback: true,
    },
    // 单JS/CDN/单HTML模式下不生成source map
    devtool: (isSingleJS || isSingleHtml || isCDN) ? false : isProduction ? 'source-map' : 'eval-source-map',
    performance: {
      // 单JS/CDN/单HTML模式下放宽文件大小限制
      hints: (isSingleJS || isSingleHtml || isCDN) ? false : isProduction ? 'warning' : false,
      maxAssetSize: (isSingleJS || isSingleHtml || isCDN) ? 10 * 1024 * 1024 : 512000,
      maxEntrypointSize: (isSingleJS || isSingleHtml || isCDN) ? 10 * 1024 * 1024 : 512000,
    },
  };
};
