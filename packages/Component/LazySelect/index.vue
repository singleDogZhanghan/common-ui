<template>
  <el-select v-bind="attrs"
             v-on="listeners"
             v-model="selectValue"
             v-load-more="{init:initWrap,update:updateOptions}"
             :filter-method="filterMethod"
             :remote-method="remoteMethod"
             :loading="loading"
             clearable
             filterable
             @change="selectChange"
             @visible-change="visibleChange"
             ref="select"
  >
    <template v-for="(option) in lazyLoadOptions">
      <el-option :key="'lazy-option-'+option[codeIndex]"
                 :label="option.labelTemplateStr"
                 :value="option[codeIndex]"
      />
    </template>
  </el-select>
</template>
<script>

export default {
  name: 'LazySelect',
  directives: {
    loadMore: {
      bind(el, binding) {
        const wrap = el.querySelector('.el-select-dropdown .el-select-dropdown__wrap');
        binding.value.init(wrap);
        wrap.addEventListener('scroll', (e) => {
          binding.value.update(e.target, wrap);
        });
      },
    },
  },
  props: {
    value: null,
    attrs: {
      type: Object
    },
    listeners: {
      type: Object
    },
    options: {
      type: Array,
      default: () => []
    },
    codeIndex: {
      type: String,
      default: 'code'
    },
    labelIndex: {
      type: String,
      default: 'label'
    },
    labelTemplateStr: {
      type: [String, Function],
      default: '$code $label'
    },
    lazyConfig: {
      type: Object,
      default: () => ({
        lazyHeight: 50, // 懒加载响应高度
        showNum: 20, // 默认显示数量
        lazyNum: 2, // 懒加载数量
        pageNum: 8, // 下拉框每页默认显示个数
      })
    },
    dataInterface: {
      type: Function
    },
    requestParams: {
      type: Object,
      default: () => ({
        pageNo: 1,
        pageSize: 999,
        queryKey: '',
        // exists: this.attrs.multiple ? [...this.value] : [this.value],
      })
    }
  },
  data() {
    return {
      selectValue: null,
      start: 0,
      showOptions: [],
      currentWrapElement: null,
      loading: false,
      scrollTop: 0,
    };
  },
  computed: {
    lazyLoadOptions() {
      return this.showOptions.slice(this.start, this.start + this.lazyConfig.showNum);
      // return this.showOptions.slice(0, this.start + this.lazyConfig.showNum);
      // return this.showOptions.filter((e, index) => index < this.start + this.lazyConfig.showNum);
    }
  },
  watch: {
    selectValue(val) {
      this.$emit('update:value', val);
    },
    value: {
      handler(val) {
        if (this.selectValue !== val) {
          this.selectValue = val;
        }
      },
      immediate: true
    },
    options: {
      handler() {
        this.initOptions();
        this.showOptions = this.options;
        const matchIndex = this.options.findIndex(e => e[this.codeIndex] === (Array.isArray(this.value) && this.value.length ? this.value[0] : this.value));
        const minIndex = this.options.length - this.lazyConfig.showNum;
        this.start = Math.max(Math.min(matchIndex - this.lazyConfig.lazyNum, minIndex), 0);
      },
      immediate: true,
    },
    requestParams: {
      handler() {
        if (!this.dataInterface) {
          return;
        }
        const params = {
          ...this.requestParams,
          exists: this.attrs.multiple ? [...this.value] : [this.value]
        }
        this.loading = true;
        this.dataInterface(params).then((res) => {
          this.loading = false;
          if (res.data.code === 200) {
            this.$emit('update:options', res.data.result || []);
          } else {
            this.$emit('update:options', []);
          }
        }).catch((e) => {
          console.error(e)
          this.loading = false;
        })
      },
      deep: true,
    }
  },
  created() {
    this.initOptions();
    this.showOptions = this.options;
  },
  methods: {
    visibleChange(val) { // 下拉框显示、隐藏
      this.$emit('visible-change', val);
      if (!val) {
        this.showOptions = this.options;
        this.requestParams.queryKey = ''; // 清除搜索缓存
      } else {
        // 打开下拉框时，判断当前滚动条位置
        const maxIndex = this.options.length - this.lazyConfig.showNum;
        const matchIndex = this.options.findIndex(e => e[this.codeIndex] === (Array.isArray(this.value) && this.value.length ? this.value[0] : this.value));
        // start位置根据匹配index、maxIndex、lazyNum确定
        this.start = Math.max(Math.min(matchIndex - this.lazyConfig.lazyNum, maxIndex), 0);
        setTimeout(() => {
          // 调整滚动条位置，默认情况滚动lazyHeight
          let scrollHeight = this.lazyConfig.lazyHeight;
          if (this.start === 0) { // start为0时，无需滚动
            scrollHeight = 0;
          } else if (this.start === maxIndex) { // start 到达最大时，若匹配数据不在可视区域，向下滚动相应距离
            const currentDom = this.currentWrapElement.querySelector('.selected');
            console.log(currentDom)
            scrollHeight = Math.max(this.lazyConfig.lazyHeight, (currentDom && currentDom.offsetTop) || 0 - this.currentWrapElement.clientHeight + currentDom.clientHeight * 2)
          }
          this.currentWrapElement.scroll(0, scrollHeight);
          // this.currentWrapElement.scroll(0, this.start === 0 ? 0 : this.lazyConfig.lazyHeight);
        }, 10)
      }
    },
    selectChange(val) {
      this.$emit('change', val);
    },
    initWrap(el) {
      this.currentWrapElement = el;
    },
    updateOptions({ scrollTop, clientHeight, scrollHeight, }, el) { // 更新下拉选项内容
      this.currentWrapElement = el;
      const { lazyHeight, showNum, lazyNum } = this.lazyConfig
      const maxStart = this.showOptions.length - showNum;
      if (scrollTop > this.scrollTop && scrollTop + clientHeight >= scrollHeight - lazyHeight) { // 向下
        this.start = this.start + lazyNum;
        if (this.start < maxStart) {
          el.scroll(0, scrollTop - lazyHeight); // 预留滚动空间
        } else {
          this.start = maxStart;
        }
      } else if (scrollTop < this.scrollTop && scrollTop < lazyHeight) {
        this.start = Math.max(0, this.start - lazyNum);
        el.scroll(0, this.start === 0 ? 0 : lazyHeight); // 预留滚动空间
      }
      this.scrollTop = scrollTop;
    },
    filterMethod(val) { // 筛选选项
      this.start = 0;
      this.showOptions = val ? this.options.filter(e => e.labelTemplateStr.includes(val)) : this.options
      this.currentWrapElement.scroll(0, 0);
    },
    remoteMethod(query) {
      this.requestParams.queryKey = query;
    },
    initOptions() {
      this.options.forEach((e) => {
        e.labelTemplateStr = this.getTemplateStr(e);
      })
    },
    getTemplateStr(data) {
      if (!data) {
        return ''
      }
      if (typeof this.labelTemplateStr === 'string') {
        return this.labelTemplateStr.replace('$code', data[this.codeIndex]).replace('$label', data[this.labelIndex])
      }
      return this.labelTemplateStr(data);
    },
  },
};
</script>
<style lang="scss">
</style>
