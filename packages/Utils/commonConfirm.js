import Vue from 'vue';
import AifpDialog from '../Components/AifpDialog/index.vue';

const CustomConfirmDialog = Vue.extend(AifpDialog);

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
 * @param zIndex {number}  遮罩层层级
 * @param confirmText {string}  确认按钮文本
 * @param confirmCallback {function}  弹框确认回调
 * @param cancelText {string}  取消按钮文本
 * @param cancelCallback {function}  弹框取消回调
 * @param closedCallback {function}  弹框完全关闭回调
 * @param message {string}  弹框信息
 * @param icon {string}  图标信息
 * @param slots {Object}  弹框内部插槽,可传入自定义组件或者文本
 * @param events {{string:function}}  弹框事件监听
 * @param openMode {string}  弹框动画样式名称（参照element-ui transition）
 *
 * @return dialog {any} 弹框组件对象
 */
export function createConfirmDialog(
  {
    icon = '',
    autoClose = true,
    visible = true,
    showFooter = true,
    showCloseButton = true,
    showFullScreen = true,
    zIndex,
    width = '400px',
    minWidth = 'auto',
    height = '200px',
    minHeight = 'auto',
    title = '提示',
    confirmText = '确认',
    confirmCallback = null,
    cancelText = '取消',
    cancelCallback = null,
    closedCallback = null,
    message = '',
    slots = {},
    events = {},
    openMode = 'el-fade-in',
  }
) {
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
    router: this.$router,
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
      zIndex,
      confirmText,
      confirmCallback: confirm,
      cancelText,
      cancelCallback: cancel,
      closedCallback,
      message,
      icon,
      openMode,
    },
  });

  clean = () => {
    clean.aifpDialogClosed = true;
    if (this.$router) {
      setTimeout(() => {
        this.$router.afterHooks = this.$router.afterHooks.filter(e => !e.aifpDialogClosed);
      }, 1);
    }
    dialog.visible = false;
    dialog.$forceUpdate();
  };

  dialog.$on('closed', () => {
    document.body.removeChild(dialog.$el);
    dialog.$destroy();
  });

  this.$router && this.$router.afterHooks.push(clean);
  Object.keys(events).forEach((e) => {
    if (typeof events[e] === 'function') {
      dialog.$on(e, events[e]);
    }
  });

  Object.entries(slots).forEach(([key, config]) => {
    const VNodeType = this.$createElement().constructor;
    // text node
    if (typeof config === 'string') {
      dialog.$slots[key] = config;
      return;
    }
    // JSX对象 、 VNode 类型
    if (config instanceof VNodeType) {
      dialog.$slots[key] = [config];
      return;
    }

    // 过滤非object类型
    if (!config || typeof config !== 'object') {
      return;
    }

    // vue option
    const { component, props = {}, events = {}, bind } = config;
    // 定义渲染函数
    const render = () => {
      dialog.$slots[key] = [
        dialog.$createElement(component, {
          props,
          on: events,
        }),
      ];
    };

    // 模拟v-bind机制
    if (!bind) {
      render();
      return;
    }
    // 子组件更新函数
    const updateChild = () => {
      Object.assign(props, this[bind] || {});
      render();
      this.$nextTick(() => {
        dialog.$forceUpdate();
      })
    }
    // 监听父组件属性，更新子组件
    this.$watch(bind, updateChild, { deep: true, immediate: true, });

    // 模拟sync
    const bindData = this[bind] || {};
    Object.keys(bindData).forEach((propsKey) => {
      const updateKey = `update:${propsKey}`;
      const updateProps = (val) => {
        this[bind][propsKey] = val;
      }
      events[updateKey] = events[updateKey] || updateProps;
    })
  });
  dialog.$mount();
  // 挂载ref
  Object.entries(slots).forEach(([key, config]) => {
    const ref = config.props && config.props.ref;
    if (ref) {
      this.$refs[ref] = dialog.$slots[key][0].componentInstance;
    }
  });
  document.body.appendChild(dialog.$el);
  return dialog;
}
