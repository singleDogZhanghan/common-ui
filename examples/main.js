import Vue from 'vue'
import ElementUI from 'element-ui'
import locale from 'element-ui/lib/locale/lang/zh-CN'
import 'element-ui/lib/theme-chalk/index.css'
import App from './App.vue'
// lang i18n
Vue.use(ElementUI, { locale })
Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
