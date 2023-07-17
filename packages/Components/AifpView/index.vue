<template>
  <div
      class="aifp-view"
      :class="containerClassObj"
      :style="containerStyleObj"
      ref="aifpView"
  >
    <div class="shadow-box">
      <div class="table-head" v-if="hasHeader">
        <div class="title">{{ title }}</div>
        <div class="fixed-operation">
          <span v-if="checkBoxConfig.visible&&checkBoxConfig.showTips"
                class="checkbox-tips"
>已选择：{{ currentSelected.length }} </span>
          <el-button
              v-for="(operation,index) in fixedOperations"
              :key="'fixed-operation'+index"
              size="mini"
              type="text"
              :class="{active:activeFixedOptions.includes(operation)}"
              @click="fixedOperateCallback(operation)"
          >
            {{ operation }}
          </el-button>
        </div>
      </div>
      <el-table
          v-bind.sync="tableConfig"
          v-on="defaultTableConfig.listeners"
          :data="showTableData"
      >
        <!--勾选框-->
        <AifpTableColumn
            v-if="checkBoxConfig.visible"
            v-bind="checkBoxConfig"
            type="selection"
        />

        <!--序号-->
        <AifpTableColumn
            v-if="indexBoxConfig.visible"
            v-bind="indexBoxConfig"
            type="index"
        >
          <template #default="rowData">
            <slot
                name="index"
                v-bind="rowData"
            >
              {{ rowData.$index + 1 }}
            </slot>
          </template>
        </AifpTableColumn>

        <!--默认插槽-->
        <slot
            name="default"
            v-bind="columnConfig"
        >
          <AifpTableColumn
              v-for="item in columnConfig"
              v-bind="item"
              :key="item.prop"
          >
            <template #default="rowData">
              <slot
                  :name="item.prop"
                  v-bind="rowData"
              >
                {{ rowData.column.type === 'index' ? rowData.$index + 1 : rowData.row[item.prop] }}
              </slot>
            </template>
          </AifpTableColumn>
        </slot>

        <!--操作列-->
        <AifpTableColumn
            v-if="operateConfig.visible"
            v-bind="operateConfig"
        >
          <template #default="rowData">
            <slot
                name="buttons"
                v-bind="rowData"
            >
              <template v-for="(button,index) in [...globalButtons,...formatButtons(rowData.row.buttons)]">
                <el-button
                    :key="'row-button-'+index"
                    v-bind="button"
                    @click="rowOperateCallback(button,rowData.row,rowData)"
                >
                  {{ button.name }}
                </el-button>
              </template>

            </slot>
          </template>
        </AifpTableColumn>


        <!--table append插槽-->
        <template #append>
          <slot name="append"/>
        </template>
      </el-table>
      <el-pagination
          v-if="paginationConfig.visible"
          v-bind="paginationConfig"
          v-on="defaultPaginationConfig.listeners"
      >
        <slot name="pagination"/>
      </el-pagination>
      <div class="resize-button" @mousedown="resizeContainer"></div>
    </div>
  </div>
</template>
<script>
import { TableColumn } from 'element-ui';
import { commonMerge } from '../../Utils/commonMethods';
import { commonLoading } from '../../Utils/commonLoading';

// 自定义列配置
const AifpTableColumn = {
  extends: TableColumn,
  props: {
    align: {
      type: String,
      default: 'left',
    },
    showOverflowTooltip: {
      type: Boolean,
      default: true,
    },
  },
};

// 默认按钮配置
const defaultButton = {
  name: '',
  type: 'text',
  size: 'mini',
  callback: null,
  visible: true,
}
export default {
  name: 'AifpView',
  components: { AifpTableColumn },
  props: {
    value: Object, // 自动绑定组件默认参数
    easySelect: { // 快捷勾选：单击行数据后，勾选对应数据
      type: Boolean,
    },
    resizeHeight: {
      type: Number, // 多表格场景下，主表初始高度默认420px
    },
    autoPaging: {
      type: Boolean,
      default: false,
    },
    theme: {
      type: String,
      default: 'normal', // normal  mini
    },
    title: String, // 表格左上角标题
    fixedOperation: Boolean, // 表格右上角固定按钮（基于data.buttons交集）
    defaultRequestConfig: {
      type: Object,
      default() {
        return {
          dataInterface: null,
          requestParams: {},
          successCallback: null,
          failCallback: null,
          pageNoIndex: 'pageNo',
          pageSizeIndex: 'pageSize',
          totalIndex: 'total',
        };
      },
    },
    defaultTableConfig: {
      type: Object,
      default() {
        return {
          ref: 'table',
          data: [],
          height: '100%',
          stripe: false,
          border: true,
          size: 'mini',
          fit: true,
          showHeader: true,
          highlightCurrentRow: true,
          emptyText: '暂无数据',
          defaultExpandAll: false,
          showSummary: false,
          sumText: '合计',
          selectOnIndeterminate: true,
          indent: 16,
          treeProps: {
            hasChildren: 'hasChildren',
            children: 'children',
          },
          listeners: {
            select: (...args) => {
              const [, data] = args;
              // 用户手动操作后，清空快捷勾选的记录
              if (this.currentSelectedByClick === data) {
                this.currentSelectedByClick = null;
              }
              this.$emit('select', ...args);
            },
            'select-all': (...args) => {
              // 用户手动全选后，清空快捷勾选的记录
              this.currentSelectedByClick = null;
              this.$emit('select-all', ...args);
            },
            'selection-change': (...args) => {
              this.currentSelected = args[0];
              this.$emit('selection-change', ...args);
            },
            'cell-mouse-enter': (...args) => {
              this.$emit('cell-mouse-enter', ...args);
            },
            'cell-mouse-leave': (...args) => {
              this.$emit('cell-mouse-leave', ...args);
            },
            'cell-click': (...args) => {
              this.$emit('cell-click', ...args);
            },
            'cell-dblclick': (...args) => {
              this.$emit('cell-dblclick', ...args);
            },
            'row-click': (...args) => {
              this.$emit('row-click', ...args);
              // 快捷勾选功能
              if (!this.easySelect) {
                return;
              }
              const [data] = args;
              // 重复单击场景不做操作
              if (data === this.currentClicked) {
                return;
              }
              this.currentClicked = data;

              // 存在快捷勾选的数据，清空选中状态
              if (this.currentSelectedByClick) {
                this.$refs[this.tableConfig.ref].toggleRowSelection(this.currentSelectedByClick, false);
                this.currentSelectedByClick = null;
              }

              // 已勾选的数据中不包含当前单击行，则该行切换为选中状态，并缓存快捷勾选的数据
              if (!this.currentSelected.includes(data)) {
                this.currentSelectedByClick = data;
                this.$refs[this.tableConfig.ref].toggleRowSelection(this.currentSelectedByClick, true);
              }
            },
            'row-contextmenu': (...args) => {
              this.$emit('row-contextmenu', ...args);
            },
            'row-dblclick': (...args) => {
              this.$emit('row-dblclick', ...args);
            },
            'header-click': (...args) => {
              this.$emit('header-click', ...args);
            },
            'header-contextmenu': (...args) => {
              this.$emit('header-contextmenu', ...args);
            },
            'sort-change': (...args) => {
              this.$emit('sort-change', ...args);
            },
            'filter-change': (...args) => {
              this.$emit('filter-change', ...args);
            },
            'current-change': (...args) => {
              this.$emit('current-change', ...args);
            },
            'header-dragend': (...args) => {
              this.$emit('header-dragend', ...args);
            },
            'expand-change': (...args) => {
              this.$emit('expand-change', ...args);
            },
          },
        };
      },
    },
    defaultPaginationConfig: {
      type: Object,
      default() {
        return {
          visible: true,
          ref: 'pagination',
          small: false,
          background: true,
          pageSize: 10,
          total: 0,
          pagerCount: 7,
          currentPage: 1,
          // layout: 'total, sizes, prev, pager, next, jumper',
          layout: 'total, sizes,->, prev, pager, next, jumper',
          pageSizes: [10, 20, 30, 40, 50, 100],
          popperClass: '',
          listeners: {
            'size-change': (...args) => {
              this.paginationConfig.pageSize = args[0];
              this.paginationConfig.currentPage = 1; // 分页大小变更时，重置当前页码
              this.$emit('size-change', ...args);
            },
            'current-change': (...args) => {
              this.paginationConfig.currentPage = args[0];
              this.$emit('current-change', ...args);
            },
            'prev-click': (...args) => {
              this.$emit('prev-click', ...args);
            },
            'next-click': (...args) => {
              this.$emit('next-click', ...args);
            },
          },
        };
      },
    },
    requestConfig: {
      type: Object,
      default: () => ({}),
    },
    tableConfig: {
      type: Object,
      default: () => ({}),
    },
    paginationConfig: {
      type: Object,
      default: () => ({}),
    },
    columnConfig: {
      type: Array,
      default: () => [],
    },
    defaultCheckBoxConfig: {
      type: Object,
      default: () => ({
        visible: false,
        width: '55',
        fixed: 'left',
        showTips: false,
      }),
    },
    checkBoxConfig: {
      type: Object,
      default: () => ({}),
    },
    defaultIndexBoxConfig: {
      type: Object,
      default: () => ({
        visible: true,
        width: '55',
        fixed: 'left',
        label: '序号',
      }),
    },
    indexBoxConfig: {
      type: Object,
      default: () => ({}),
    },
    defaultOperateConfig: {
      type: Object,
      default: () => ({
        visible: false,
        width: '100',
        fixed: 'right',
        label: '操作',
      }),
    },
    operateConfig: {
      type: Object,
      default: () => ({}),
    },
    buttons: {
      type: [Array, Function],
      default: () => ([]),
    },
    loadingConfig: {
      type: Object,
      default: () => ({
        visible: true,
        appendToBody: true,
      })
    }
  },
  data() {
    return {
      paginationSlots: ['total', 'sizes', 'prev', 'pager', 'next', 'jumper'],
      currentSelected: [], // 当前所有选中的数据
      currentSelectedByClick: null, // 通过单击选中的数据
      currentClicked: null, // 当前单击的数据
      resizeConfig: {
        x: 0,
        y: 0,
      },
    };
  },
  computed: {
    containerStyleObj() {
      return {
        height: this.resizeHeight ? `${this.resizeHeight + this.resizeConfig.y}px` : '100%',
      };
    },
    isMini() {
      return this.theme === 'mini';
    },
    hasHeader() {
      return this.title || this.fixedOperations.length || (this.checkBoxConfig.visible && this.checkBoxConfig.showTips);
    },
    fixedOperations() {
      if (!this.fixedOperation) {
        return [];
      }
      const globalButtonNames = this.globalButtons.map(e => e.name);
      const dataButtonNames = this.getDataButtonNames(this.showTableData);
      return [...globalButtonNames, ...dataButtonNames];
    },
    activeFixedOptions() {
      if (!this.fixedOperation || !this.currentSelected.length) {
        return [];
      }
      const globalButtonNames = this.globalButtons.map(e => e.name);
      const allButtonNames = this.getDataButtonNames(this.currentSelected);
      const formatCurrentSelected = this.currentSelected.map(data => this.formatButtons(data.buttons).map(e => e.name));
      const activeButtonNames = allButtonNames.filter(e => formatCurrentSelected.every(names => names.includes(e)));
      return [...globalButtonNames, ...activeButtonNames];
    },
    showTableData() {
      const { data } = this.tableConfig;
      const {
        currentPage,
        pageSize
      } = this.paginationConfig;
      if (!this.autoPaging) {
        return data;
      }
      return data.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    },
    requestParams() {
      const {
        pageNoIndex,
        pageSizeIndex,
        requestParams,
      } = this.requestConfig;
      const {
        pageSize,
        currentPage,
      } = this.paginationConfig;
      return {
        [pageNoIndex]: currentPage,
        [pageSizeIndex]: pageSize,
        ...requestParams,
      };
    },
    containerClassObj() {
      return {
        'has-pagination': this.paginationConfig.visible,
        'has-header': this.hasHeader,
        'is-mini': this.isMini,
        resizeable: !!this.resizeHeight,
      };
    },
    globalButtons() {
      return this.formatButtons(this.buttons);
    }
  },
  watch: {
    requestParams: {
      handler() {
        this.getData();
      },
      deep: true,
    },
    columnConfig() {
      requestAnimationFrame(() => {
        this.$refs[this.tableConfig.ref] && this.$refs[this.tableConfig.ref].doLayout();
      });
    },
    'tableConfig.data': function (val) {
      this.$emit('data-change', val);
      requestAnimationFrame(() => {
        this.$refs[this.tableConfig.ref] && this.$refs[this.tableConfig.ref].doLayout();
      });
    },
  },
  created() {
    const mergeConfig = [
      [this.tableConfig, this.defaultTableConfig],
      [this.paginationConfig, this.defaultPaginationConfig],
      [this.requestConfig, this.defaultRequestConfig],
      [this.checkBoxConfig, this.defaultCheckBoxConfig],
      [this.indexBoxConfig, this.defaultIndexBoxConfig],
      [this.operateConfig, this.defaultOperateConfig],
    ];
    mergeConfig.forEach(([target, source]) => {
      commonMerge(target, source, true, 'target')
    })
    delete this.tableConfig.listeners;
    delete this.paginationConfig.listeners;

    const updatePropKeys = ['tableConfig', 'paginationConfig', 'requestConfig', 'checkBoxConfig', 'indexBoxConfig', 'operateConfig']
    if (this.value) {
      const updateValue = { ...this.value };
      updatePropKeys.forEach((key) => {
        updateValue[key] = { ...this[key] }
      });
      this.$emit('input', updateValue)
    } else {
      updatePropKeys.forEach((key) => {
        this.$emit(`update:${key}`, { ...this[key] });
      })
    }

    // TODO 自动分页模式下，默认调用一次接口
    if (this.autoPaging) {
      this.$nextTick(() => {
        this.getData(false);
      });
    }
  },
  mounted() {
    // 兼容弹框场景下布局错乱问题
    setTimeout(() => {
      this.$refs[this.tableConfig.ref] && this.$refs[this.tableConfig.ref].doLayout();
    }, 50);
  },
  methods: {
    resizeContainer(e) {
      if (!this.resizeHeight) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const {
        clientX: startX,
        clientY: startY
      } = e;
      const {
        x,
        y
      } = this.resizeConfig;
      const mousemove = (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.resizeConfig = {
          x: x + event.clientX - startX,
          y: y + event.clientY - startY,
        };
      };
      const mouseup = (event) => {
        event.preventDefault();
        event.stopPropagation();
        document.removeEventListener('mousemove', mousemove);
        document.removeEventListener('mouseup', mouseup);
      };
      document.addEventListener('mousemove', mousemove);
      document.addEventListener('mouseup', mouseup);
    },
    getData(autoPaging = this.autoPaging) {
      if (autoPaging) {
        return;
      }
      const {
        dataInterface,
        successCallback,
        failCallback,
      } = this.requestConfig;
      if (!dataInterface) {
        return;
      }
      if (Array.isArray(dataInterface)) {
        this.tableConfig.data = dataInterface;
        return;
      }
      if (typeof dataInterface !== 'function') {
        console.error(new Error('接口参数异常'));
        return;
      }

      if (this.loadingConfig.visible) {
        const target = this.loadingConfig.appendToBody ? document.body : this.$refs[this.tableConfig.ref].$refs.bodyWrapper;
        commonLoading.open({ target, ...this.loadingConfig });
      }
      dataInterface(this.requestParams)
        .then((res) => {
          commonLoading.close();
          if (successCallback) {
            const result = successCallback(res);
            if (!result) {
              return;
            }
            const {
              data,
              total,
            } = result;
            this.tableConfig.data = data;
            this.paginationConfig.total = total;
            return;
          }
          if (res.data.code === 200) {
            this.tableConfig.data = res.data.result.data || [];
            this.paginationConfig.total = res.data.result[this.requestConfig.totalIndex];
          }
        })
        .catch((e) => {
          commonLoading.close();
          if (failCallback) {
            failCallback(e);
          }
          console.error(e);
        });
    },
    rowOperateCallback(button, row, index) {
      this.$emit('row-operation', button, row, index);
      if (typeof button.callback === 'function') {
        button.callback(button, row, index);
      }
    },
    fixedOperateCallback(buttonName) {
      this.$emit('fixed-operation', buttonName, this.currentSelected, this.activeFixedOptions.includes(buttonName));
    },
    // 获取去重后的数据按钮并集
    getDataButtonNames(data = []) {
      const dataButtons = data.reduce((pre, cur) => ([...pre, ...(cur.buttons || [])]), []);
      const names = this.formatButtons(dataButtons).map(e => e.name);
      return [...new Set(names)];
    },
    // 基于defaultButton格式化按钮数据，支持string或object数组，并基于visible属性过滤
    formatButtons(buttons = []) {
      if (!Array.isArray(buttons)) {
        return [];
      }
      return buttons.map((e) => {
        const type = typeof e;
        const typeMap = {
          string: { name: e },
          object: e,
        }
        const button = typeMap[type];
        if (!e || !button) {
          return null
        }
        return { ...defaultButton, ...button };
      }).filter(e => !!e && e.visible);
    },
  },
};
</script>
<style lang="scss" scoped>
.aifp-view {
  width: 100%;
  height: 100%;
  overflow: auto;

  .shadow-box {
    width: 100%;
    height: 100%;
    overflow: hidden;
    box-shadow: 0 2px 20px -10px rgba(0, 0, 0, 1);
    box-sizing: border-box;
  }

  .table-head {
    width: 100%;
    height: 31px;
    display: grid;
    grid-template-columns: 300px 1fr;
    padding: 0 20px;
    background: #e5e5e5;
    border-bottom: 1px solid #e6e6e6;
    box-sizing: border-box;

    .title {
      width: 100%;
      height: 100%;
      display: grid;
      place-items: center start;
      font-size: 15px;
      font-weight: 800;
      color: #666666;
    }

    .fixed-operation {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: flex-end;
      align-items: center;

      .el-button--text {
        height: 100%;
        color: #adc4dc;
        transition: color ease-in .2s;
        border: none;
        padding-top: 9px;

        &.active {
          color: #409EFF;
        }
      }

      .checkbox-tips {
        font-size: 12px;
        color: #999999;
        margin-right: 16px;
        line-height: 30px;
      }
    }
  }


  .el-table {
    height: 100% !important;
  }


  &.has-pagination .el-table {
    height: calc(100% - 40px) !important;
  }

  &.has-header .el-table {
    height: calc(100% - 30px) !important;
  }

  &.has-pagination.has-header .el-table {
    height: calc(100% - 70px) !important;
  }

  ::v-deep .el-pagination {
    margin: 4px;

    &.is-background .el-pager li:not(.disabled).active {
      background-color: #73a4d5;
    }
  }

  &.resizeable .resize-button {
    width: 300px;
    height: 4px;
    position: absolute;
    left: calc(50% - 150px);
    cursor: row-resize;
  }
}

.aifp-view.is-mini {
  padding: 10px;
  box-sizing: border-box;
  background: #f6f6f6;


  &.has-pagination .el-table {
    height: calc(100% - 28px) !important;
  }

  &.has-pagination.has-header .el-table {
    height: calc(100% - 58px) !important;
  }

  .el-table {

    ::v-deep thead {
      tr {
        th {
          padding: 0;
          background: #e5e5e5;
          color: #868383;
        }
      }
    }

    ::v-deep .el-table__cell {
      padding: 3px 0;
    }

    ::v-deep th.el-table__cell .cell {
      width: 100%;
      height: 100%;
      overflow: hidden;
      white-space: nowrap;
      word-break: break-all;
      text-overflow: ellipsis;
    }
  }

  ::v-deep .el-pagination {
    background: #e5e5e5;
    margin: 0;
    padding: 0 16px;
    box-sizing: border-box;

    .el-pagination__total {
      font-size: 12px !important;
    }

    .el-pagination__sizes .el-input .el-input__inner, .el-pagination__jump {
      font-size: 12px;
      height: 20px;
      line-height: 20px;
    }

    .el-pagination__rightwrapper {
      margin-top: 3px;
    }

    .el-pagination__jump {
      .el-pagination__editor {
        &.el-input {
          height: 20px;

          .el-input__inner {
            font-size: 12px;
            height: 20px;
          }
        }
      }
    }


    .el-pager li, .btn-prev, .btn-next {
      height: 22px;
      line-height: 22px;
      min-width: 22px;
    }
  }
}
</style>
