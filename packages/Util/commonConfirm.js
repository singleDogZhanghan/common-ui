import Vue from 'vue';
import CommonDialog from '@/Component/CommonDialog/index';

const CustomConfirmDialog = Vue.extend(CommonDialog);
const body = document.querySelector('body');

/**
 * 自定义弹窗
 * @param autoClose {boolean}   是否自动关闭弹框
 * @param visible {boolean}   是否显示弹框
 * @param showFooter {boolean}   是否显示底部内容
 * @param showCloseButton {boolean}   是否显示右上角关闭按钮
 * @param showFullScreen {boolean}   是否显示右上角全屏按钮
 * @param width {string,number}   弹框宽度
 * @param minWidth {string,number}   弹框最小宽度
 * @param height {string,number}   弹框高度
 * @param minHeight {string,number}  弹框最小高度
 * @param title {string}  标题
 * @param confirmText {string}  确认按钮文本
 * @param confirmCallback {function}  弹框确认回调
 * @param cancelText {string}  取消按钮文本
 * @param cancelCallback {function}  弹框取消回调
 * @param message {string}  弹框信息
 * @param icon {string}  图标信息
 * @param slots {{string:{component:object|string,props,events}}}  弹框内部插槽,可传入自定义组件或者文本
 * @param events {{string:function}}  弹框事件监听
 * @param openMode {string}  弹框动画样式名称（参照element-ui transition）
 *
 * @return dialog {any} 弹框组件对象
 */
export function createCommonDialog({
  icon = '',
  autoClose = true,
  visible = true,
  showFooter = true,
  showCloseButton = true,
  showFullScreen = true,
  width = '400px',
  minWidth = 'auto',
  height = '200px',
  minHeight = 'auto',
  title = '提示',
  confirmText = '确认',
  confirmCallback = null,
  cancelText = '取消',
  cancelCallback = null,
  message = '',
  slots = {},
  events = {},
  openMode = 'el-fade-in'
}) {
  let clean = () => {
  };
  const cancel = () => {
    clean();
    if (cancelCallback) {
      cancelCallback(clean);
    }
  };
  const confirm = () => {
    if (autoClose) {
      clean();
    }
    if (confirmCallback) {
      confirmCallback(clean);
    }
  };
  const dialog = new CustomConfirmDialog({
    propsData: {
      visible,
      showFooter,
      showCloseButton,
      showFullScreen,
      width,
      minWidth,
      height,
      minHeight,
      title,
      confirmText,
      confirmCallback: confirm,
      cancelText,
      cancelCallback: cancel,
      message,
      icon,
      openMode
    }
  });
  clean = () => {
    body.removeChild(dialog.$el);
    dialog.$destroy();
  };
  Object.keys(events).forEach((e) => {
    if (typeof events[e] === 'function') {
      dialog.$on(e, events[e]);
    }
  });
  Object.keys(slots).forEach((e) => {
    const typeName = slots[e].constructor.name;
    if (typeName === 'VNode') {
      // JSX对象
      dialog.$slots[e] = [slots[e]];
    } else if (typeName === 'Object') {
      // vue option
      dialog.$slots[e] = [
        dialog.$createElement(slots[e].component, {
          props: slots[e].props,
          on: slots[e].events
        })
      ];
    } else if (typeName === 'String') {
      // text node
      dialog.$slots[e] = slots[e];
    }
  });
  dialog.$mount();
  body.appendChild(dialog.$el);
  return dialog;
}
