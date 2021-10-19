const basicRules = {
  /** import/export相关 https://github.com/benmosher/eslint-plugin-import/tree/master/docs/rules */
  // 必须写明文件类型：取消
  'import/extensions': 0,
  // 路径必须可以被本地文件系统解析：取消
  'import/no-unresolved': 0,
  // 只能引用package.json声明的依赖：取消 TBD
  'import/no-extraneous-dependencies': 0,
  // 优先使用 export default: 取消
  'import/prefer-default-export': 0,

  /** 基础语法规则 https://eslint.org/docs/rules/ */
  // 禁止 console.log：取消
  'no-console': 0,
  // 禁止变量声明与外层作用域的变量同名：取消
  'no-shadow': 0,
  // 禁止未使用过的表达式：取消
  'no-unused-expressions': 0,
  // 禁止变量定义前使用：警告, 函数除外
  'no-use-before-define': ['warn', { functions: false }],
  // 禁止直接调用 Object.prototypes 的内置属性：警告
  'no-prototype-builtins': 1,
  // 禁止匿名函数：取消
  'func-names': 0,
  // 箭头函数必须使用大括号：取消
  'arrow-body-style': 0,
  // 优先使用解构：取消
  'prefer-destructuring': 0,
  // 禁止对函数参数进行重新赋值：警告
  'no-param-reassign': 1,
  // 函数必须有返回值：取消 TBD
  'consistent-return': 0,
  // 对象声明是否换行：取消
  'object-curly-newline': 0,
  // 禁用特定的全局变量：取消
  'no-restricted-globals': 0,
  // 禁止 if 语句中 return 语句之后有 else 块：取消
  'no-else-return': 0,
  // 禁止在 return 语句中使用赋值语句：取消 TBD  ref={formRef => form = formRef}
  'no-return-assign': 0,
  // 禁止在return语句中使用await：取消
  'no-return-await': 0,
  // 禁止 ++ --: 取消
  'no-plusplus': 0,
  // 禁止使用 new 关键字: 取消
  'no-new': 0,

  // 分号结尾：不要求
  semi: 0,
  // 结尾逗号：不要求
  'comma-dangle': 0,
  // 声明未使用：warning
  'no-unused-vars': 1,
  // 缩进：强制两空格
  indent: ['error', 2, { SwitchCase: 1, flatTernaryExpressions: true, }],
  // 强制一行的最大长度：不限制
  'max-len': 0,
  quotes: ['error', 'single'],
  'linebreak-style': 'off',
}
module.exports = {
  root: true,
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: 'babel-eslint',
    ecmaVersion: 2018,
    ecmaFeatures: {
      jsx: true,
    },
  },
  extends: ['plugin:vue/recommended', 'prettier', 'airbnb-base'],
  env: {
    es6: true,
    browser: true,
    node: true,
  },
  rules: {
    ...basicRules,
    // vue 相关
    'vue/no-v-html': 0,
    'vue/attributes-order': 0,
    'vue/require-v-for-key': 0,
    'vue/require-default-prop': 0,
    'vue/no-unused-components': 0,
    'vue/singleline-html-element-content-newline': 0,
    'vue/name-property-casing': ['error', 'PascalCase'],
    'vue/component-name-in-template-casing': ['error', 'PascalCase'],
    'vue/html-closing-bracket-newline': 2,
    'vue/no-side-effects-in-computed-properties': 0,
  },
};
