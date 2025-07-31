module.exports = {
  presets: ['@vue/cli-plugin-babel/preset'],
  plugins: [
    '@babel/plugin-proposal-nullish-coalescing-operator',
    '@babel/plugin-proposal-optional-chaining',
    [
      'import',
      {
        libraryName: 'ant-design-vue',
        style: 'css', // or 'css'
      },
      'ant-design-vue',
    ],
    [
      'import',
      {
        libraryName: '@ant-design/icons-vue',
        libraryDirectory: 'lib/icons',
        camel2DashComponentName: false,
      },
      '@ant-design/icons-vue',
    ],
  ],
};
