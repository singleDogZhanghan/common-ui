<template>
  <el-select v-bind="attrs"
             v-on="listeners"
             v-model="selectValue"
             v-load-more="{init:initWrap,update:updateOptions}"
             :filter-method="filterOptions"
             clearable
             filterable
             @change="selectChange"
             @visible-change="visibleChange"
             ref="select"
  >
    <template v-for="(option,index) in showOptions">
      <el-option :key="option[codeIndex]"
                 :label="option.labelTemplateStr"
                 :value="option[codeIndex]"
                 v-if="index>=start&&index<start+lazyConfig.showNum"
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
      type: String,
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
  },
  data() {
    return {
      selectValue: null,
      start: 0,
      showOptions: [],
      currentWrapElement: null,
      changeValue: this.value,
    };
  },
  computed: {
    currentIndex() {
      return this.options.findIndex(e => e[this.codeIndex] === this.changeValue)
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
          this.changeValue = val;
        }
      },
      immediate: true
    },
    options() {
      this.initOptions();
      this.showOptions = this.options;
      this.initStart();
    }
  },
  created() {
    this.initOptions();
    this.showOptions = this.options;
    this.initStart();
    // setTimeout(()=>{
    //   this.selectValue=89;
    //   this.changeValue=89;
    // },3000)
  },
  methods: {
    scrollToOption() {
      setTimeout(() => {
        const overView = this.currentIndex > this.start + this.lazyConfig.pageNum - 1;
        const isBlank = this.currentWrapElement && this.start !== 0 && !overView;
        if (isBlank) { // 需要为滚动条留白
          this.currentWrapElement.scroll(0, this.lazyConfig.lazyHeight / this.lazyConfig.lazyNum);
          return;
        }

        const option = this.$refs.select.options.find(e => e.value === this.selectValue);
        if (!option) {
          return;
        }
        this.$refs.select.scrollToOption(option);
      }, 100)
    },
    async visibleChange(val) { // 下拉框显示、隐藏
      this.selectValue = this.changeValue; // 恢复选中值
      await this.$nextTick();
      this.$emit('visible-change', val);
      this.initStart();
      if (val) {
        this.scrollToOption();
      } else {
        setTimeout(() => {
          this.showOptions = this.options;
        }, 100);
      }
    },
    selectChange(val) {
      this.changeValue = val;
      this.$nextTick(() => {
        this.$emit('change', val);
      });
    },
    initWrap(el) {
      this.currentWrapElement = el;
    },
    updateOptions({ scrollTop, clientHeight, scrollHeight, }, el) { // 更新下拉选项内容
      this.currentWrapElement = el;
      const { lazyHeight, showNum, lazyNum } = this.lazyConfig
      if (scrollTop + clientHeight >= scrollHeight - lazyHeight) { // 向下
        this.start = this.start + lazyNum;
        this.initStart(this.start);
        const maxStart = this.showOptions.length - showNum;
        if (this.start < maxStart) {
          el.scroll(0, scrollTop - lazyHeight); // 预留滚动空间
        }
      } else if (scrollTop === 0) { // 向上
        this.start = this.start - lazyNum;
        this.initStart(this.start);
        if (this.start !== 0) {
          el.scroll(0, lazyHeight);// 预留滚动空间
        }
      }
    },
    filterOptions(val) { // 筛选选项
      this.start = 0;
      this.showOptions = val ? this.options.filter(e => e.labelTemplateStr.includes(val)) : this.options
      this.$nextTick(() => {
        if (this.currentWrapElement) {
          this.currentWrapElement.scroll(0, 0);
        }
      })
    },
    initStart(start = false) {
      const maxStart = this.showOptions.length - this.lazyConfig.showNum;
      const minStart = 0;
      start = start === false ? this.currentIndex - this.lazyConfig.lazyNum : start;
      start = start > maxStart ? maxStart : start;
      start = start < minStart ? minStart : start;
      this.start = start;
    },
    initOptions() {
      this.options.forEach((e) => {
        e.labelTemplateStr = this.labelTemplateStr.replace('$code', e[this.codeIndex]).replace('$label', e[this.labelIndex]);
      })
    }
  }
};
</script>
<style lang="scss">
</style>
