import CommonDialog from '@/Component/CommonDialog/index.vue';
import LazySelect from '@/Component/LazySelect/index.vue';
import TreeDialog from '@/Component/TreeDialog/index.vue';
import { createCommonDialog } from '@/Util/commonConfirm';
import { createCommonPrint } from '@/Util/commonPrint';
import { createCommonTreeDialog } from '@/Util/commonTreeDialog';
import { commonMerge, setNodeKey, treeFormatter } from '@/Util/commonMethods';

const components = {
  CommonDialog,
  LazySelect,
  TreeDialog,
};

const methods = {
  createCommonDialog,
  createCommonPrint,
  createCommonTreeDialog,
  commonMerge,
  setNodeKey,
  treeFormatter,
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
  createCommonDialog,
  createCommonPrint,
  createCommonTreeDialog,
  commonMerge,
  setNodeKey,
  treeFormatter
}
