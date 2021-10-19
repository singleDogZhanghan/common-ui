const endOfLine = require('os').EOL;
const fs = require('fs');
const path = require('path');
const components = require('../packages/Component/index.json');
const methods = require('../packages/Util/index.json');

const OUTPUT_PATH = path.join(__dirname, '../packages/index.js');
// 组件配置
const componentsNames = Object.keys(components);
// 函数配置
const methodsNames = Object.keys(methods);
// 生成组件import字符串
const importComponentStr = componentsNames.map((e) => {
  return `import ${e} from '${components[e]}';`;
}).join(endOfLine) + endOfLine;
// 合并相同path的import
const methodMap = {};
methodsNames.forEach((key) => {
  const path = methods[key];
  if (methodMap[path]) {
    methodMap[path] = `${methodMap[path]}, ${key}`;
  } else {
    methodMap[path] = key;
  }
})
// 生成函数import字符串
const importMethodStr = Object.keys(methodMap).map((path) => {
  return `import { ${methodMap[path]} } from '${path}';`;
}).join(endOfLine) + endOfLine;

// 生成install函数和全局对象绑定
const installStr = `
const components = {
  ${componentsNames.join(`,${endOfLine}  `)},
};

const methods = {
  ${methodsNames.join(`,${endOfLine}  `)},
};

// 定义 install 方法，接收 Vue 作为参数。如果使用 use 注册插件，则所有的组件都将被注册
const install = function (Vue) {
  // 遍历注册全局组件
  Object.keys(components).forEach((key) => {
    Vue.component(components[key].name, components[key]);
  });
  Vue.prototype.$commonMethods = methods;
};

if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue);
}`
// 生成默认export字符串
const defaultExportStr = `
// 全部导入
export default {
  // 导出的对象必须具有 install，才能被 Vue.use() 方法安装
  install,
  ...components,
  ...methods
};

export {
  ${componentsNames.join(`,${endOfLine}  `)},
  ${methodsNames.join(`,${endOfLine}  `)}
}`
const templateStr = `${importComponentStr}${importMethodStr}${installStr}${defaultExportStr}
`
// fs.writeFileSync(OUTPUT_PATH, templateStr.join(endOfLine));
fs.writeFileSync(OUTPUT_PATH, templateStr);
// console.info(templateStr.join(endOfLine))
