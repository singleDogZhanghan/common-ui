<template>
  <div
      class="tree-transfer"
      :class="{'single-tree':!isTransfer}"
  >
    <div class="left-tree tree-content">
      <span
          class="title"
          v-if="defaultTreeConfig.left.title"
      >
        {{ defaultTreeConfig.left.title }}
        <span
            class="title-suffix"
            v-if="defaultTreeConfig.left.titleSuffix"
        >
          {{ defaultTreeConfig.left.titleSuffix }}
        </span>
      </span>
      <div
          class="table-row header"
          v-if="tableConfig"
      >
        <span
            class="el-tree-node__label main-label"
            :style="{'width':maxMainLabelWidth}"
            @mousemove="handleMouseMove($event,tableConfig[0],true)"
            @mousedown="handleMouseDown($event,tableConfig[0],true)"
        >
          {{ tableConfig[0].label }}
        </span>

        <div class="extra-label">
          <template v-for="(item,index) in tableConfig">
            <span
                v-if="index!==0"
                class="el-tree-node__label"
                :style="{'width':item.labelWidth}"
                :key="'header-'+index"
                @mousemove="handleMouseMove($event,item)"
                @mousedown="handleMouseDown($event,item)"
            >
              {{ item.label }}
            </span>
          </template>
        </div>
      </div>
      <el-tree
          ref="left"
          v-bind="defaultTreeConfig.left"
          :data="leftData"
      >
        <template v-slot:default="{node,data}">
          <slot
              name="left"
              v-bind="{node,data,maxLevel,indent,updateMaxLevel}"
          >
            <div class="table-row">
              <template v-if="tableConfig">
                <span
                    class="el-tree-node__label main-label"
                    :style="{'width':tableConfig[0].labelWidth+(maxLevel - node.level) * indent+'px'}"
                >
                  <slot
                      name="leftMainField"
                      v-bind="{prop:tableConfig[0].name,data,node}"
                  >
                    {{ data[tableConfig[0].name] }}
                  </slot>
                  {{ updateMaxLevel(node) }}
                </span>
                <div class="extra-label">
                  <template v-for="(item,index) in tableConfig">
                    <span
                        v-if="index!==0"
                        class="el-tree-node__label"
                        :style="{'width':item.labelWidth}"
                        :key="index+'-node-'+data[defaultTreeConfig.left['node-key']]"
                    >
                      <slot
                          name="leftField"
                          v-bind="{prop:item.name,data,node}"
                      >
                        {{ data[item.name] }}
                      </slot>
                    </span>
                  </template>
                </div>
              </template>

              <template v-else>
                <span class="el-tree-node__label main-label">
                  {{ node.label }}{{ updateMaxLevel(node) }}
                </span>
              </template>
            </div>
          </slot>
        </template>
      </el-tree>
    </div>

    <div
        class="center"
        v-if="isTransfer"
    >
      <el-image
          :src="arrowIcon"
          fit="contain"
      />
    </div>

    <div
        class="right-tree tree-content"
        v-if="isTransfer"
    >
      <span
          class="title"
          v-if="defaultTreeConfig.right.title"
      >
        {{ defaultTreeConfig.right.title }}
        <span
            class="title-suffix"
            v-if="defaultTreeConfig.right.titleSuffix"
        >
          {{ defaultTreeConfig.right.titleSuffix }}
        </span>
      </span>
      <div
          class="table-row header"
          v-if="tableConfig"
      >
        <span
            class="el-tree-node__label main-label"
            :style="{'width':maxMainLabelWidth}"
        >
          {{ tableConfig[0].label }}
        </span>

        <div class="extra-label">
          <template v-for="(item,index) in tableConfig">
            <span
                v-if="index!==0"
                class="el-tree-node__label"
                :style="{'width':item.labelWidth}"
                :key="'header-'+index"
            >
              {{ item.label }}
            </span>
          </template>
        </div>
      </div>

      <el-tree
          ref="right"
          v-bind="defaultTreeConfig.right"
          :data="rightData"
      >
        <template v-slot:default="{node,data}">
          <slot
              name="right"
              v-bind="{node,data,maxLevel,indent,updateMaxLevel}"
          >
            <div class="table-row">
              <template v-if="tableConfig">
                <span
                    class="el-tree-node__label main-label"
                    :style="{'width':tableConfig[0].labelWidth+(maxLevel - node.level) * indent+'px'}"
                >
                  {{ updateMaxLevel(node) }}
                  <slot
                      name="rightMainField"
                      v-bind="{prop:tableConfig[0].name,data,node}"
                  >
                    {{ data[tableConfig[0].name] }}
                  </slot>

                </span>
                <div class="extra-label">
                  <template v-for="(item,index) in tableConfig">
                    <span
                        v-if="index!==0"
                        class="el-tree-node__label"
                        :style="{'width':item.labelWidth}"
                        :key="index+'-node-'+data[defaultTreeConfig.right['node-key']]"
                    >
                      <slot
                          name="rightField"
                          v-bind="{prop:item.name,data,node}"
                      >
                        {{ data[item.name] }}
                      </slot>
                    </span>
                  </template>
                </div>
              </template>

              <template v-else>
                <span class="el-tree-node__label main-label">
                  {{ node.label }}{{ updateMaxLevel(node) }}
                </span>
              </template>
            </div>
          </slot>
        </template>
      </el-tree>
    </div>
  </div>
</template>
<script>
import { cloneDeep } from 'lodash';
import { removeClass } from 'element-ui/src/utils/dom';
import { commonMerge } from '../../Utils/commonMethods.js';

export default {
  name: 'TransferTree',
  props: {
    arrowIcon: {
      type: String, // 穿梭树图标
    },
    isTransfer: { // 是否为穿梭树（true：渲染穿梭树，false：仅渲染单个树）
      type: Boolean,
      default: true,
    },
    isCopy: { // 是否复制左侧节点（true：抓取后保留左侧树节点，false：抓取后删除左侧树节点）
      type: Boolean,
      default: true,
    },
    autoTransfer: { // 右侧无数据时，是否自动保存抓取的节点
      type: Boolean,
      default: true,
    },
    leftData: {
      type: Array,
      default: () => ([]),
    },
    rightData: {
      type: Array,
      default: () => ([]),
    },
    leftTreeConfig: { // 树组件默认配置
      type: Object,
      default: () => ({}),
    },
    rightTreeConfig: { // 右侧树组件默认配置
      type: Object,
      default: () => ({}),
    },
    tableConfig: {
      type: Array,
    },
  },
  data() {
    return {
      doCopy: false,
      maxLevel: 0,
      indent: 18,
      dragConfig: {
        dragging: false,
        draggingColumn: null,
        state: {
          startMouseLeft: 0,
          startLeft: 0,
          startColumnLeft: 0,
          actualWidth: 0,
        }
      }
    }
  },
  computed: {
    defaultTreeConfig() {
      const config = {
        'node-key': 'node-key',
        props: {
          label: 'label',
          children: 'children',
          isLeaf: 'isLeaf',
        },
        'highlight-current': true,
        'expand-on-click-node': false,
        draggable: true,
      };
      return {
        left: commonMerge(this.leftTreeConfig, config, true, 'target'),
        right: commonMerge(this.rightTreeConfig, { ...config, 'allow-drop': this.allowDrop }, true, 'target'),
      }
    },
    maxMainLabelWidth() {
      if (!this.tableConfig) {
        return '';
      }
      return `${this.tableConfig[0].labelWidth + (this.maxLevel - 1) * this.indent + 24}px`
    }
  },
  mounted() {
    const { left, right } = this.$refs;
    this.indent = left.indent;
    if (!this.isTransfer) {
      return;
    }
    // 抓取左侧树节点时，同步节点至右侧树
    left.$on('tree-node-drag-start', (event, treeNode) => {
      right.dragState.draggingNode = treeNode;
      this.doCopy = this.isCopy; // 判定节点是否需要复制
    })

    // 放下节点时，触发右侧树drag-end事件
    left.$on('tree-node-drag-end', (event) => {
      // 右侧树无数据时，若开启自动传递，则为右侧树添加当前抓取节点
      if (!this.rightData.length && this.autoTransfer) {
        const { data } = right.dragState.draggingNode.node;
        const draggingNodeCopy = this.doCopy ? cloneDeep(data) : data;
        this.rightData.push(draggingNodeCopy);
        Object.assign(right.dragState, {
          showDropIndicator: false,
          draggingNode: null,
          dropNode: null,
          allowDrop: true,
        })
        right.$emit('node-drop', { data: draggingNodeCopy }, null, 'inner', event, this.doCopy);
        this.doCopy = false;
        return;
      }
      right.$emit('tree-node-drag-end', event);
    })

    // 屏蔽左侧树drag-over事件
    left.$off('tree-node-drag-over');

    // 屏蔽右侧树drag-end事件
    right.$off('tree-node-drag-end');

    // 重新绑定右侧树drag-end事件
    right.$on('tree-node-drag-end', (event) => {
      const { draggingNode, dropType, dropNode } = right.dragState;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';

      if (draggingNode && dropNode) {
        // 判断是否需要复制节点
        const draggingNodeCopy = { data: this.doCopy ? cloneDeep(draggingNode.node.data) : draggingNode.node.data };
        draggingNode.node.data = draggingNodeCopy.data; // 替换data对象，刷新引用
        if (dropType !== 'none' && !this.doCopy) {
          draggingNode.node.remove(); // 无需复制节点时，清除左侧树抓取的节点
        }
        if (dropType === 'before') {
          dropNode.node.parent.insertBefore(draggingNodeCopy, dropNode.node);
        } else if (dropType === 'after') {
          dropNode.node.parent.insertAfter(draggingNodeCopy, dropNode.node);
        } else if (dropType === 'inner') {
          dropNode.node.insertChild(draggingNodeCopy);
        }
        if (dropType !== 'none') {
          right.store.registerNode(draggingNodeCopy);
        }

        removeClass(dropNode.$el, 'is-drop-inner');

        right.$emit('node-drag-end', draggingNode.node, dropNode.node, dropType, event);
        if (dropType !== 'none') {
          right.$emit('node-drop', draggingNode.node, dropNode.node, dropType, event, this.doCopy);
        }
      }
      if (draggingNode && !dropNode) {
        right.$emit('node-drag-end', draggingNode.node, null, dropType, event);
      }

      Object.assign(right.dragState, {
        showDropIndicator: false,
        draggingNode: null,
        dropNode: null,
        allowDrop: true,
      })

      this.doCopy = false; // 右侧树自身节点拖动时存在冲突，需重置节点复制标记
    });
  },
  methods: {
    handleMouseDown(event, config, isFirst = false) {
      if (!this.dragConfig.draggingColumn) {
        return;
      }
      const rect = event.target.getBoundingClientRect();
      this.dragConfig.dragging = true;
      this.dragConfig.state = {
        startMouseLeft: event.clientX,
        startLeft: rect.right,
        startColumnLeft: rect.left,
      }
      document.onselectstart = function () {
        return false;
      };
      document.ondragstart = function () {
        return false;
      };

      const handleMouseMove = (event) => {
        const { startMouseLeft, startLeft, startColumnLeft } = this.dragConfig.state
        const width = event.clientX - startMouseLeft + startLeft - startColumnLeft;
        const actualWidth = Math.max(30, width);
        config.labelWidth = isFirst ? actualWidth : `${actualWidth}px`;
      };

      const handleMouseUp = () => {
        if (this.dragConfig.dragging) {
          document.body.style.cursor = '';
          this.dragConfig.draggingColumn = null;
          this.dragConfig.dragging = null;
        }
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.onselectstart = null;
        document.ondragstart = null;
      }

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    handleMouseMove(event, config) {
      const rect = event.target.getBoundingClientRect();
      const bodyStyle = document.body.style;
      if (rect.width > 12 && rect.right - event.pageX < 8 && rect.right - event.pageX > 2) {
        bodyStyle.cursor = 'col-resize';
        this.dragConfig.draggingColumn = config;
      } else if (!this.dragConfig.dragging) {
        bodyStyle.cursor = '';
        this.dragConfig.draggingColumn = null;
      }
    },
    updateMaxLevel({ level }) {
      this.maxLevel = level > this.maxLevel ? level : this.maxLevel;
      return '';
    },
    // 判定右侧树是否允许放入节点（当前规则，node-key重复时，禁止放入）
    allowDrop(draggingNode, dropNode, type) {
      const nodeKey = this.rightTreeConfig['node-key'];
      const childrenKey = this.rightTreeConfig.props.children;

      const id = draggingNode.data[nodeKey];
      const children = dropNode.data[childrenKey];

      const { level, parent } = dropNode;

      if (type === 'inner') { // 放入节点内部时，判定其子节点集合
        return !(Array.isArray(children) && children.find(e => e[nodeKey] === id))
      } else {
        if (level === 1) { // 与顶级节点平级时，判定父级集合
          return !(parent.data.find(e => e[nodeKey] === id));
        }
        // 与放入节点平级时，判定父级的子节点集合
        return !(parent.data[childrenKey].find(e => e[nodeKey] === id));
      }
    }
  }
};
</script>

<style lang="scss">
.tree-transfer {
  width: 100%;
  height: 100%;
  padding: 8px;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 1fr 60px 1fr;
  grid-template-rows: 1fr;

  &.single-tree {
    grid-template-columns: 1fr;
  }

  .left-tree, .right-tree {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: 1fr;
    //grid-template-rows: 40px 1fr;
    //border: 1px solid #02a7f0;
    place-content: start;
    //box-shadow: 0 2px 12px 0 #02a7f0;
    border-radius: 12px;
    overflow-x: auto;

    .title {
      border-top-left-radius: 12px;
      border-top-right-radius: 12px;
      width: 100%;
      height: 35px;
      display: grid;
      grid-template-columns: auto 1fr;
      place-items: center start;
      font-size: 16px;
      font-weight: bold;
      line-height: 100%;
      background: #fff;
      padding-left: 8px;

      .title-suffix {
        color: #9f9f9f;
        font-size: 12px;
        padding-left: 12px;
      }
    }

    .header {
      height: 35px !important;
      width: auto !important;
      overflow: visible;
      //border: 1px solid #000;
      border-bottom: none;
      background: #b3d8ff !important;

      .main-label {
        line-height: 35px;
        text-align: center;
        font-size: 15px;
        font-weight: 600;
      }

      .extra-label span {
        line-height: 35px;
        font-size: 15px;
        font-weight: 600;
      }
    }

    .el-tree {
      width: 100%;
      height: 100%;
      border-top: 1px solid #dddfe0;
      overflow: hidden auto;
      display: flex;
      flex-wrap: wrap;
      align-content: flex-start;

      .el-tree-node {
        width: 100%;
        flex: 1 1 auto;
      }

      .el-tree-node__content {
        border: 1px solid #dddfe0;
        border-left: none;
        border-top: none;
      }
    }

    .table-row {
      height: 100%;
      width: 100%;
      display: flex;
      flex: 1 1 auto;
      overflow: visible;
    }

    .main-label {
      flex: 0 0 auto;
      line-height: 25px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      word-break: break-all;
    }

    .extra-label {
      flex: 1 1 auto;
      display: flex;

      & > span {
        flex: 1 1 auto;
        text-align: center;
        line-height: 25px;
        border-left: 1px solid #dddfe0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }

  }

  .center {
    display: grid;
    grid-template-rows: 40px;
    row-gap: 8px;
    width: 100%;
    height: 100%;
    place-items: center;
    place-content: start center;
    font-size: 40px;
    color: #909399;
    padding-top: 35px;

    .el-icon-right {
      font-weight: bold;
    }

    .el-image {
      width: 30px;
      height: auto;
      display: grid;
      place-items: center;
    }
  }

}
</style>
