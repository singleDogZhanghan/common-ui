<template>
  <el-select v-bind="attrs"
             v-on="listeners"
             v-model="selectValue"
             :filter-method="filterMethod"
             :remote-method="remoteMethod"
             clearable
             filterable
             @change="selectChange"
             @visible-change="visibleChange"
             ref="select"
             @keypress.native="stopRemoteQuery"
  >
    <template v-for="(option,index) in lazyLoadOptions">
      <el-option :key="'lazy-option-'+index+'-'+option[codeIndex]"
                 v-bind="option"
                 :label="option.labelTemplateStr"
                 :value="option[codeIndex]"
      />
    </template>
    <p class="el-select-dropdown__empty" v-if="!lazyLoadOptions.length&&!loading">
      暂无数据
    </p>
    <el-option v-loading="true" ref="endOption" v-show="!toEnd || loading" style="width:calc(100% - 20px)"></el-option>
  </el-select>
</template>
<script>

const runnerMap = new WeakMap();
const windowObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const runner = runnerMap.get(entry.target);
    if (typeof runner === 'function') {
      runner(entry);
    }
  });
});

export default {
  name: 'LazySelect',
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
    remoteIndex: { // 远程搜索参数name
      type: String,
      default: 'queryKey'
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
    requestSuccessCallback: { // 请求成功后回调，需返回options选项
      type: Function
    },
    beforeRequestCallback: { // 调用接口前置回调，返回false时不执行后续接口调用
      type: Function
    },
    pageNoIndex: { // 分页搜索页码name
      type: String,
      default: 'pageNo'
    },
    requestParams: {
      type: Object,
      default: () => ({
        pageNo: 1,
        pageSize: 999,
        queryKey: '',
        // exists: this.attrs.multiple ? [...this.value] : [this.value],
      })
    },
    reformatRequestParams: { // 格式化请求参数（与内置格式不一致时可使用该方法）
      type: Function
    },
  },
  data() {
    return {
      selectValue: null,
      start: 0,
      showOptions: [],
      loading: false, // 加载状态
      optionVisible: false, // 选项是否展开
      getDataInstance: null, // 请求promise实例
      loadTimer: null, // loading选项常显时，定时循环加载数据
      beforeRemote: { // 远程搜索后还原选项状态
        active: false,
        pageNo: 0,
        start: 0,
        toEnd: false,
        useCache: false,
      }
    };
  },
  computed: {
    lazyLoadOptions() {
      // return this.showOptions.slice(this.start, this.start + this.lazyConfig.showNum);
      return this.showOptions.slice(0, this.start + this.lazyConfig.showNum);
      // return this.showOptions.filter((e, index) => index < this.start + this.lazyConfig.showNum);
    },
    maxStart() {
      return Math.max(this.showOptions.length - this.lazyConfig.showNum, 0);
    },
    toEnd() { // 是否触底
      return this.start === this.maxStart;
    },
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
        this.initOptions(this.options);
        this.showOptions = this.options;
      },
      immediate: true,
    },
    requestParams: {
      handler() {
        this.$emit('beforeLoad');
        this.getData();
      },
      deep: true,
      immediate: true,
    },
    toEnd(val) {
      // 未开启远程搜索
      if (!this.attrs.remote) {
        return;
      }
      // 正在加载数据
      if (this.loading) {
        return;
      }
      // 触底后加载下一页
      if (val) {
        this.requestParams[this.pageNoIndex] += 1;
      }
    }
  },
  created() {
    this.initOptions(this.options);
    this.showOptions = this.options;
  },
  mounted() {
    this.observeEndOption();
  },
  beforeDestroy() {
    this.unObserveEndOption();
  },
  methods: {
    // loading状态下禁止用户输入
    stopRemoteQuery(e) {
      if (this.loading) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    // 监听endOption
    observeEndOption() {
      const dom = this.$refs.endOption.$el;
      windowObserver.observe(dom);
      const runner = (entry) => {
        // 下拉框收起时，跳过后续逻辑
        if (!this.optionVisible) {
          return;
        }
        // 进入视口
        if (entry.isIntersecting) {
          // 避免重复请求
          if (this.loading) {
            return;
          }
          // 向下加载
          this.loadEnd();
        } else {
          // 离开视口
          clearTimeout(this.loadTimer);
          this.loadTimer = null;
        }
      }
      runnerMap.set(dom, runner);
    },
    unObserveEndOption() {
      const dom = this.$refs.endOption.$el;
      windowObserver.unobserve(dom);
    },
    // 加载底部，启动定时器，循环加载，直至loading元素离开视口（手动拖拽滚动条场景）
    loadEnd() {
      if (this.loadTimer) {
        return;
      }
      this.loadTimer = setTimeout(() => {
        this.updateStartIndex('end');
        this.loadTimer = null;
        this.loadEnd();
      }, 200);
    },
    // start向上、向下移动
    updateStartIndex(direct = 'end') {
      const { lazyNum } = this.lazyConfig;
      const addNum = direct === 'end' ? lazyNum : -lazyNum;
      const newStart = this.start + addNum;
      this.start = Math.max(Math.min(this.maxStart, newStart), 0);
    },
    getData() {
      if (!this.dataInterface) {
        return;
      }

      // 存在缓存时，跳过数据请求逻辑
      if (this.beforeRemote.useCache) {
        this.beforeRemote.useCache = false;
        return;
      }

      // 参数校验
      if (this.beforeRequestCallback && !this.beforeRequestCallback(this)) {
        return;
      }
      const params = this.reformatRequestParams ? this.reformatRequestParams(this) : {
        ...this.requestParams,
        exists: this.attrs.multiple ? [...this.value] : [this.value]
      }

      // 标记loading
      this.loading = true;
      const getDataInstance = this.dataInterface(params).then((res) => {
        // 异步关闭loading（options选项由外部传入，响应到当前组件存在时间差）
        requestAnimationFrame(() => {
          this.loading = false;
        })
        // 请求顺序控制，过滤最后一次请求
        if (getDataInstance !== this.getDataInstance) {
          return;
        }

        // 原选项数据，远程搜索且页码为1时，清空数据，否则为追加
        const oldOptions = this.attrs.remote && (params[this.pageNoIndex] === 1) ? [] : this.options;
        // 更新选项
        const newOptions = typeof this.requestSuccessCallback === 'function' ? this.requestSuccessCallback(res) : (res.data.code === 200 && (res.data.result.data || res.data.result || [])) || [];
        // 缓存信息生效时，表明正在进行远程模糊搜索，此时修改showOptions，否则修改options
        if (this.beforeRemote.active) {
          this.initOptions(newOptions);
          this.showOptions.push(...newOptions);
        } else {
          this.$emit('update:options', [...oldOptions, ...newOptions]);
        }

        // 成功返回后，触发一次向下加载
        requestAnimationFrame(() => {
          this.updateStartIndex('end');
        })
      }).catch((e) => {
        this.loading = false;
        console.error(e)
      })

      this.getDataInstance = getDataInstance;
    },
    // 下拉框显示、隐藏
    visibleChange(val) {
      // 缓存下拉框状态
      this.optionVisible = val;
      this.$emit('visible-change', val);

      // 关闭下拉框，且有缓存时，恢复数据
      if (!val && this.beforeRemote.active) {
        const { start, toEnd, pageNo } = this.beforeRemote;
        // 恢复状态
        this.start = start;
        this.showOptions = this.options;
        // 取消最后一次请求
        this.getDataInstance = null;
        // 极限情况下，start达到最大值时被缓存，此时恢复数据会导致toEnd计算错误
        if (toEnd) {
          this.updateStartIndex('top');
        }

        //  标记使用缓存
        Object.assign(this.beforeRemote, {
          useCache: true,
          active: false,
        })

        // 更新条件
        this.$emit('update:requestParams', {
          ...this.requestParams,
          [this.pageNoIndex]: pageNo,
          [this.remoteIndex]: ''
        });
      }
    },
    selectChange(val) {
      this.$emit('change', val);
    },
    // 常规模糊搜索
    filterMethod(val) {
      this.start = 0;
      this.showOptions = val ? this.options.filter(e => e.labelTemplateStr.includes(val)) : this.options
    },
    // 远程模糊搜索
    remoteMethod(query) {
      // 首次触发远程搜索时，缓存当前分页信息
      if (!this.beforeRemote.active) {
        const pageNo = this.requestParams[this.pageNoIndex];
        Object.assign(this.beforeRemote, {
          active: true,
          // pageNo: pageNo,
          // 若缓存时，存在loading，表明正在请求下一页数据，回退页码
          pageNo: this.loading ? Math.max(pageNo - 1, 1) : pageNo,
          start: this.start,
          toEnd: this.toEnd,
        })
      }

      this.start = 0;
      this.showOptions = [];
      this.$emit('update:requestParams', {
        ...this.requestParams,
        [this.pageNoIndex]: 1,
        [this.remoteIndex]: query
      });
    },
    // 格式化选项label
    initOptions(options = []) {
      options.forEach((e) => {
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
  }
};
</script>
<style lang="scss">
</style>
