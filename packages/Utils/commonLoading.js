import { Loading } from 'element-ui';

export const commonLoading = {
  instance: null,
  open(options = {}) {
    this.instance = Loading.service(options);
  },
  close() {
    if (this.instance) {
      this.instance.close();
    }
  },
  install(Vue) {
    Vue.prototype.$commonLoading = commonLoading;
  },
};
