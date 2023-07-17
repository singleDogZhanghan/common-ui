import AifpDialog from './Components/AifpDialog/index.vue';
import LazySelect from './Components/LazySelect/index.vue';
import TransferTree from './Components/TransferTree/index.vue';
import AifpView from './Components/AifpView/index.vue';
import AifpFlowChart from './Components/AifpFlowChart/index.vue';
import AifpCronInput from './Components/AifpCronInput/index.vue';
import LazyTree from './Components/LazyTree/LazyTree.vue';
import { createConfirmDialog } from './Utils/commonConfirm.js';
import { commonMerge, setNodeKey, loadMore } from './Utils/commonMethods.js';
import { createCommonPrint } from './Utils/commonPrint.js';
import { createDoubleScreen } from './Utils/commonDoubleScreen.js';
import { commonLoading } from './Utils/commonLoading.js';
import { getIP } from './Utils/getIP.js';
import { draggable } from './Utils/draggable.js';

import packageConfig from '../package.json';

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
console.log('%cAifpUIVersion %c'.concat(packageConfig.version), r, i);

const components = {
  AifpDialog,
  LazySelect,
  TransferTree,
  AifpView,
  AifpFlowChart,
  AifpCronInput,
  LazyTree,
};

const methods = {
  createConfirmDialog,
  commonMerge,
  setNodeKey,
  createCommonPrint,
  createDoubleScreen,
  loadMore,
  commonLoading,
  getIP,
  draggable,
};

const commonMethods = methods;

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
  ...methods,
  commonMethods
};

export {
  AifpDialog,
  LazySelect,
  TransferTree,
  AifpView,
  AifpFlowChart,
  AifpCronInput,
  LazyTree,
  createConfirmDialog,
  commonMerge,
  setNodeKey,
  createCommonPrint,
  createDoubleScreen,
  loadMore,
  commonLoading,
  getIP,
  draggable,
  commonMethods,
}
