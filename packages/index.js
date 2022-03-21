import CommonDialog from './Component/CommonDialog/index.vue';
import LazySelect from './Component/LazySelect/index.vue';
import TreeDialog from './Component/TreeDialog/index.vue';
import TransferTree from './Component/TransferTree/index.vue';
import { createCommonDialog } from './Util/commonConfirm.js';
import { createCommonPrint } from './Util/commonPrint.js';
import { createCommonTreeDialog } from './Util/commonTreeDialog.js';
import { commonMerge, setNodeKey } from './Util/commonMethods.js';

import packageConfig from '../package.json'

const r = [
  'color: #fff',
  'border-top-left-radius:3px',
  'border-bottom-left-radius:3px',
  'background-color: #564b4f',
  'padding: 5px'
].join(';');
const i = [
  'color: #fff',
  'border-top-right-radius:3px',
  'border-bottom-right-radius:3px',
  'background-color: #4fc08d',
  'padding: 5px'
].join(';');
console.log('%cCommonUIVersion %c'.concat(packageConfig.version), r, i);

const components = {
  CommonDialog,
  LazySelect,
  TreeDialog,
  TransferTree,
};

const methods = {
  createCommonDialog,
  createCommonPrint,
  createCommonTreeDialog,
  commonMerge,
  setNodeKey,
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
}
// 全部导入
export default {
  // 导出的对象必须具有 install，才能被 Vue.use() 方法安装
  install,
  ...components,
  ...methods
};

export {
  CommonDialog,
  LazySelect,
  TreeDialog,
  TransferTree,
  createCommonDialog,
  createCommonPrint,
  createCommonTreeDialog,
  commonMerge,
  setNodeKey
}
