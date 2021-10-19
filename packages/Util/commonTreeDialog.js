import Vue from 'vue';
import TreeDialog from '@/Component/TreeDialog/index';

const CustomTreeDialog = Vue.extend(TreeDialog);

/**
 * 自定义树组件弹框
 * @param props {data:{Array},selected:{Array},dialogConfig:{any},treeConfig:{any}}   是否自动关闭弹框
 *
 * @return dialogInstance {any} 弹框组件对象
 */
export function createCommonTreeDialog(
  props = { data: [], selected: [], dialogConfig: {}, treeConfig: {} }
) {
  const { listeners = {} } = props;
  const { confirm } = listeners;
  let clean = null;
  let dialogInstance = null;
  listeners.confirm = (selected) => {
    props.selected = selected;
    if (confirm) {
      confirm(selected, clean, dialogInstance);
    }
  };
  clean = () => {
    document.body.removeChild(dialogInstance.$el);
    dialogInstance.$destroy();
  };
  dialogInstance = new CustomTreeDialog({
    propsData: props
  });

  Object.keys(listeners).forEach((key) => {
    dialogInstance.$on(key, listeners[key]);
  });
  dialogInstance.$mount();
  document.body.appendChild(dialogInstance.$el);
  return dialogInstance;
}
