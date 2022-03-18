<!-- 组织架构 -->
<template>
  <CommonDialog v-bind.sync="dialogConfig">
    <template #content>
      <div class="common-org">
        <div class="left">
          <el-input
              size="small"
              v-model="filterText"
              prefix-icon="el-icon-search"
              placeholder="请输入搜索内容..."
              clearable
          />

          <el-tree
              :data="data"
              v-bind="treeConfig"
              @node-click="sourceNodeClick"
              @check="sourceNodeCheck"
              ref="sourceTree"
              :filter-node-method="sourceNodeFilter"
          />

          <el-checkbox-group v-model="currentSelected">
            <el-checkbox
                :label="item"
                v-for="(item,index) in currentCheckedNode"
                :key="index+'-checkbox'"
                :disabled="item.disabled"
            >
              {{ item.label }}
            </el-checkbox>
          </el-checkbox-group>
        </div>

        <div class="selected">
          <el-tag
              v-for="(item,index) in currentSelected"
              :key="index+'-tag'"
              :closable="!item.disabled"
              @close="currentSelected.splice(index,1);"
          >
            {{ item[defaultTreeConfig.props.label] }}
          </el-tag>
        </div>
      </div>
    </template>
  </CommonDialog>
</template>


<script>
import CommonDialog from '../CommonDialog/index.vue';
import { commonMerge, setNodeKey } from '../../Util/commonMethods.js';

export default {
  name: 'TreeDialog',
  components: { CommonDialog },
  props: {
    data: {
      type: Array,
      default: () => ([]),
    },
    dialogConfig: {
      type: Object,
      default: () => ({}),
    },
    treeConfig: {
      type: Object,
      default: () => ({}),
    },
    selected: {
      type: Array,
      default: () => ([]),
    },
  },
  data() {
    return {
      filterText: '',
      defaultDialogConfig: {
        title: '组织架构',
        visible: false,
        minWidth: 800,
        minHeight: 600,
        confirmCallback: () => {
          this.$emit('confirm', this.currentSelected);
        },
      },
      defaultTreeConfig: {
        props: {
          children: 'children',
          label: 'label',
          code: 'code',
        },
        nodeKey: 'node-key',
        showCheckbox: true,
        highlightCurrent: true,
        filterType: [],
        typeIndex: 'type',
      },
      currentCheckedNode: [], // 当前选中的节点
      currentSelected: [], // 当前选中的数据
    };
  },
  watch: {
    filterText(val) {
      this.$refs.sourceTree.filter(val);
    },
    selected(val) {
      this.currentSelected = val;
    },
    currentSelected(val) {
      this.$refs.sourceTree.setCheckedKeys(val.map(e => e[this.treeConfig.nodeKey]));
      this.$emit('update:selected', val);
    },
    data: {
      handler() {
        setNodeKey(this.data, this.treeConfig.nodeKey)
        this.$nextTick(() => {
          this.currentSelected = this.selected;
        });
      },
      immediate: true
    }
  },
  created() {
    delete this.dialogConfig.confirmCallback; // 清除旧的事件回调
    commonMerge(this.dialogConfig, this.defaultDialogConfig, true, 'target');
    commonMerge(this.treeConfig, this.defaultTreeConfig, true, 'target');
  },
  methods: {
    sourceNodeClick(data) {
      const { filterType, typeIndex } = this.treeConfig;
      this.currentCheckedNode = this.getAllNodes(data);
      this.currentCheckedNode = filterType.length ? this.currentCheckedNode.filter(e => filterType.includes(e[typeIndex])) : this.currentCheckedNode;
    },
    sourceNodeCheck(node, { checkedNodes }) {
      const { filterType, typeIndex } = this.treeConfig;
      this.sourceNodeClick(node);
      this.currentSelected = filterType.length ? checkedNodes.filter(e => filterType.includes(e[typeIndex])) : checkedNodes;
    },
    sourceNodeFilter(value, data) {
      if (!value) return true;
      const { code, label } = this.treeConfig.props;
      return (data[label] && data[label].includes(value)) || (data[code] && data[code].includes(value));
    },
    getAllNodes(data) {
      const list = [];
      if (!data) {
        return list;
      }
      list.push(data);
      const { children } = this.treeConfig.props;
      if (!data[children]) {
        return list;
      }
      data[children].forEach((e) => {
        list.push(...this.getAllNodes(e));
      })
      return list;
    }
  },
};
</script>
<style lang='scss' scoped>
/deep/ .a-dialog-block .a-dialog-toolbar {
  line-height: 24px;
}

.common-org {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: grid;
  grid-template-columns: 2.5fr 1fr;
  grid-template-rows: 100%;
  column-gap: 20px;

  .left, .selected {
    width: 100%;
    height: 100%;
    display: grid;
  }

  .left {
    grid-template-columns: 2fr 1.5fr;
    grid-template-rows: 40px auto;
    grid-gap: 8px 20px;

    .el-input {
      grid-column-start: span 2;
      height: 32px;
      width: 100%;
      border: none;

      /deep/ input {
        background: #F4F4F4;
        border: none;
        border-radius: 0;
      }
    }

    .el-tree, .el-checkbox-group {
      padding-top: 8px;
      background: #F4F4F4;
      height: auto !important;
      overflow: auto;
    }

    /deep/ .el-tree {
      .el-tree-node__expand-icon {
        padding: 0 6px;
      }

      .el-tree-node__content {
        display: grid;
        grid-template-columns: 16px 14px auto;
        column-gap: 8px;
        place-items: start;
        margin-bottom: 4px;

        .el-checkbox {
          line-height: 14px;
        }
      }

      .el-tree-node__label {
        white-space: break-spaces;
        text-align: left;
      }
    }

    .el-checkbox-group {
      padding: 8px;
      box-sizing: border-box;
      display: grid;
      place-items: start;
      place-content: start;
      row-gap: 8px;
    }

  }

  .selected {
    padding: 8px;
    box-sizing: border-box;
    background: #f2f2f2;
    place-items: start;
    place-content: start;
    row-gap: 8px;
    overflow-y: auto;

    .el-tag {
      border: none;
      cursor: pointer;
    }
  }
}
</style>
