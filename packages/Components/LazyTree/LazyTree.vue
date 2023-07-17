<template>
  <div
      class="el-tree"
      :class="{
      'el-tree--highlight-current': highlightCurrent,
      'is-dragging': !!dragState.draggingNode,
      'is-drop-not-allow': !dragState.allowDrop,
      'is-drop-inner': dragState.dropType === 'inner',
      'has-border':border,
    }"
      role="tree"
  >
    <LazyTreeNode
        v-if="columnConfig"
        :node="{visible:true,isLeaf:true,level:1}"
        :props="props"
        :show-checkbox="false"
        key="tree-table-header"
        is-header
        :column-config="columnConfig"
    />
    <template v-for="child in root.childNodes">
      <LazyTreeNode
          v-if="showNodes.includes(child)"
          :node="child"
          :props="props"
          :render-after-expand="renderAfterExpand"
          :show-checkbox="showCheckbox"
          :key="getNodeKey(child)"
          :render-content="renderContent"
          :show-nodes="showNodes"
          @node-expand="handleNodeExpand"
          :theme="theme"
          :column-config="columnConfig"
      />
    </template>

    <div
        class="el-tree__empty-block"
        v-if="isEmpty"
    >
      <span class="el-tree__empty-text">{{ emptyText }}</span>
    </div>
    <div
        v-show="dragState.showDropIndicator"
        class="el-tree__drop-indicator"
        ref="dropIndicator"
    />

    <el-tooltip v-if="showTooltip" v-bind="tooltipConfig" ref="tooltip"/>
  </div>
</template>
<script>
import { Tree } from 'element-ui';
import { findNearestComponent } from 'element-ui/packages/tree/src/model/util';
import { addClass, removeClass } from 'element-ui/src/utils/dom';
import LazyTreeNode from './LazyTreeNode';

// 基于element-ui@2.13.2复写懒加载树组件
export default {
  name: 'LazyTree',
  componentName: 'LazyTree',
  components: { LazyTreeNode },
  extends: Tree,
  props: {
    columnConfig: Array, // 树表格列配置 {prop,label,width}
    columnConfigCacheKey: String, // 列宽配置缓存key，默认缓存至localstorage，初始化恢复
    border: Boolean, // 单元格边框
    theme: String, // 主题 【'excel'】
    showTooltip: Boolean, // 文字过长时显示tooltip
  },
  data() {
    return {
      visibleNodes: [],
      lazyConfig: {
        startIndex: 0, // 当前显示节点的起始位置
        showNum: 50, // 节点最大加载数量
        lazyNum: 5, // 每次懒加载的节点数量
        triggerHeight: 30, // 滚动条底部距离对应高度时触发懒加载
        scrollTop: 0, // 当前滚动距离
        disabled: false, // 禁止滚动事件触发懒加载逻辑
        disabledTime: 200, // 最大禁止时间ms
      },
      tooltipConfig: {
        effect: 'dark',
        content: '',
        placement: 'top',
      },
    }
  },
  computed: {
    // 展示节点
    showNodes() {
      const {
        startIndex,
        showNum
      } = this.lazyConfig;
      return this.visibleNodes.slice(0, startIndex + showNum);
    }
  },
  watch: {
    columnConfig: {
      handler(val) {
        if (!this.columnConfigCacheKey || !val) {
          return;
        }
        localStorage.setItem(this.columnConfigCacheKey, JSON.stringify(val));
      },
      deep: true,
    },
    'root.childNodes': {
      handler(val) {
        // 更新可视节点
        const newList = this.updateNodeVisible(val, true);
        const oldList = this.visibleNodes;
        // 可视节点数量变化时，dom元素重新渲染，导致滚动条抽搐，增加禁止懒加载逻辑，可根据场景调整禁止时长
        if (oldList.length && newList.length !== oldList.length) {
          this.lazyConfig.disabled = true;
          setTimeout(() => {
            this.lazyConfig.disabled = false;
          }, this.lazyConfig.disabledTime);
        }
        this.visibleNodes = newList;
      },
      deep: true,
      immediate: true,
    }
  },
  created() {
    // 从缓存中恢复列宽配置
    if (this.columnConfigCacheKey && this.columnConfig) {
      const cachedConfig = JSON.parse(localStorage.getItem(this.columnConfigCacheKey) || '[]');

      cachedConfig.forEach((cache) => {
        const matchConfig = this.columnConfig.find(e => e.prop === cache.prop);
        if (matchConfig) {
          this.$set(matchConfig, 'width', cache.width || matchConfig.width);
        }
      })
    }

    const dragState = this.dragState;

    this.$on('tree-node-drag-over', (event) => {
      const dropNode = findNearestComponent(event.target, 'LazyTreeNode');
      const oldDropNode = dragState.dropNode;
      if (oldDropNode && oldDropNode !== dropNode) {
        removeClass(oldDropNode.$el, 'is-drop-inner');
      }
      const draggingNode = dragState.draggingNode;
      if (!draggingNode || !dropNode) return;

      let dropPrev = true;
      let dropInner = true;
      let dropNext = true;
      let userAllowDropInner = true;
      if (typeof this.allowDrop === 'function') {
        dropPrev = this.allowDrop(draggingNode.node, dropNode.node, 'prev');
        // eslint-disable-next-line no-multi-assign
        userAllowDropInner = dropInner = this.allowDrop(draggingNode.node, dropNode.node, 'inner');
        dropNext = this.allowDrop(draggingNode.node, dropNode.node, 'next');
      }
      event.dataTransfer.dropEffect = dropInner ? 'move' : 'none';
      if ((dropPrev || dropInner || dropNext) && oldDropNode !== dropNode) {
        if (oldDropNode) {
          this.$emit('node-drag-leave', draggingNode.node, oldDropNode.node, event);
        }
        this.$emit('node-drag-enter', draggingNode.node, dropNode.node, event);
      }

      if (dropPrev || dropInner || dropNext) {
        dragState.dropNode = dropNode;
      }

      if (dropNode.node.nextSibling === draggingNode.node) {
        dropNext = false;
      }
      if (dropNode.node.previousSibling === draggingNode.node) {
        dropPrev = false;
      }
      if (dropNode.node.contains(draggingNode.node, false)) {
        dropInner = false;
      }
      if (draggingNode.node === dropNode.node || draggingNode.node.contains(dropNode.node)) {
        dropPrev = false;
        dropInner = false;
        dropNext = false;
      }

      const targetPosition = dropNode.$el.getBoundingClientRect();
      const treePosition = this.$el.getBoundingClientRect();

      let dropType;
      // eslint-disable-next-line no-nested-ternary
      const prevPercent = dropPrev ? (dropInner ? 0.25 : (dropNext ? 0.45 : 1)) : -1;
      // eslint-disable-next-line no-nested-ternary
      const nextPercent = dropNext ? (dropInner ? 0.75 : (dropPrev ? 0.55 : 0)) : 1;

      let indicatorTop = -9999;
      const distance = event.clientY - targetPosition.top;
      if (distance < targetPosition.height * prevPercent) {
        dropType = 'before';
      } else if (distance > targetPosition.height * nextPercent) {
        dropType = 'after';
      } else if (dropInner) {
        dropType = 'inner';
      } else {
        dropType = 'none';
      }

      const iconPosition = dropNode.$el.querySelector('.el-tree-node__expand-icon')
        .getBoundingClientRect();
      const dropIndicator = this.$refs.dropIndicator;
      if (dropType === 'before') {
        indicatorTop = iconPosition.top - treePosition.top;
      } else if (dropType === 'after') {
        indicatorTop = iconPosition.bottom - treePosition.top;
      }
      dropIndicator.style.top = `${indicatorTop}px`;
      dropIndicator.style.left = `${iconPosition.right - treePosition.left}px`;

      if (dropType === 'inner') {
        addClass(dropNode.$el, 'is-drop-inner');
      } else {
        removeClass(dropNode.$el, 'is-drop-inner');
      }

      dragState.showDropIndicator = dropType === 'before' || dropType === 'after';
      dragState.allowDrop = dragState.showDropIndicator || userAllowDropInner;
      dragState.dropType = dropType;
      this.$emit('node-drag-over', draggingNode.node, dropNode.node, event);
    });
  },
  mounted() {
    this.$el.addEventListener('scroll', this.updateShowNodes);
  },
  methods: {
    updateShowNodes(e) {
      e.preventDefault();
      e.stopPropagation();
      const el = e.target;
      const {
        scrollTop: newScrollTop,
        clientHeight,
        scrollHeight
      } = el;
      const {
        startIndex: oldStartIndex,
        lazyNum,
        triggerHeight,
        scrollTop: oldScrollTop,
        disabled,
      } = this.lazyConfig;
      // 最大滚动距离，超过时触发懒加载
      const maxScrollTop = scrollHeight - clientHeight - triggerHeight;
      // 当前滚动方向
      const scrollDirection = newScrollTop > oldScrollTop ? 'down' : 'up';
      // 是否触发懒加载更新
      // 双向懒加载 TODO
      // const needUpdate = scrollDirection === 'down' ? newScrollTop >= maxScrollTop : newScrollTop <= triggerHeight;
      // 单向懒加载 TODO
      const needUpdate = scrollDirection === 'down' && newScrollTop > maxScrollTop;

      // 缓存滚动位置
      this.lazyConfig.scrollTop = newScrollTop;

      if (!needUpdate || disabled) {
        return;
      }

      const maxStartIndex = Math.max(this.visibleNodes.length - lazyNum, 0);
      const minStartIndex = 0;
      const newStartIndex = Math.max(minStartIndex, Math.min(maxStartIndex, oldStartIndex + (scrollDirection === 'down' ? +lazyNum : -lazyNum)));
      this.lazyConfig.startIndex = newStartIndex;
    },
    // 判断可视节点：父节点展开、父节点visible、子节点visible
    updateNodeVisible(nodes = [], showChild, visibleList = []) {
      if (!showChild) {
        return;
      }
      nodes.forEach((node) => {
        if (node.visible) {
          visibleList.push(node);

          if (node.expanded) {
            this.updateNodeVisible(node.childNodes, true, visibleList);
          }
        }
      })
      return visibleList;
    },
    handleNodeExpand(nodeData, node, instance) {
      this.broadcast('LazyTreeNode', 'tree-node-expand', node);
      this.$emit('node-expand', nodeData, node, instance);
    },
  }
};
</script>

<style lang="scss" scoped>
.el-tree {
  height: 100%;
  overflow: auto;
}

.has-border {
  ::v-deep .el-tree-node {
    .el-tree-node__content {
      border-bottom: 1px solid #EBEEF5;
      border-left: 1px solid #EBEEF5;

      .column-title, .tree-table-cell {
        border-right: 1px solid #EBEEF5;
      }
    }

    &:nth-child(1) {
      .el-tree-node__content {
        border-top: 1px solid #EBEEF5;
      }
    }
  }
}
</style>
