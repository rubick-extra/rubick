const path = require('path');
const UnoCSS = require('@unocss/webpack').default

module.exports = {
  css: {
    extract: true,
    // 配置css模块
    loaderOptions: {
      // 向预处理器 Loader 传递配置选项
      less: {
        // 配置less（其他样式解析用法一致）
        javascriptEnabled: true, // 设置为true
      },
    },
  },
  configureWebpack: {
    plugins: [
      UnoCSS()
    ],
    module: {
      rules: [
        {
          test: /\.m?js$/,
          include: /vue-markdown-render/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
              plugins: ['@babel/plugin-proposal-nullish-coalescing-operator', '@babel/plugin-proposal-optional-chaining'],
            }
          }
        }
      ]
    }
  },
  chainWebpack(config) {
    config.module.rule('vue').uses.delete('cache-loader')
    config.module.rule('tsx').uses.delete('cache-loader')
    config.merge({
      cache: false
    })
  },
  productionSourceMap: false,
  outputDir: path.join(__dirname, '../public/feature'),
  publicPath: process.env.NODE_ENV === 'production' ? '' : '/',
  // chainWebpack: (config) => {
  //   // 查看打包文件体积大小
  //   config
  //     .plugin('webpack-bundle-analyzer')
  //     .use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin);
  // },
};
