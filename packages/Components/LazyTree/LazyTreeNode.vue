<template>
  <div
      class="el-tree-node"
      @click.stop="handleClick"
      @contextmenu="($event) => this.handleContextMenu($event)"
      v-show="node.visible"
      :class="{
      'is-expanded': expanded,
      'is-current': node.isCurrent,
      'is-hidden': !node.visible,
      'is-focusable': !node.disabled,
      'is-checked': !node.disabled && node.checked,
      'is-header':isHeader,
      'is-excel':isExcelStyle,
    }"
      role="treeitem"
      tabindex="-1"
      :aria-expanded="expanded"
      :aria-disabled="node.disabled"
      :aria-checked="node.checked"
      :draggable="tree.draggable"
      @dragstart.stop="handleDragStart"
      @dragover.stop="handleDragOver"
      @dragend.stop="handleDragEnd"
      @drop.stop="handleDrop"
      ref="node"
  >
    <div
        class="el-tree-node__content"
        :style="{ 'padding-left': contentPadding+'px'}"
    >

            <span
                v-if="!isHeader"
                @click.stop="handleExpandIconClick"
                :class="[
                {
                  'is-leaf': node.isLeaf,
                  expanded: !node.isLeaf && expanded,
                  'is-first-level':node.level===1,
                },
                'el-tree-node__expand-icon',
                tree.iconClass ? tree.iconClass : 'el-icon-caret-right'
              ]"
            />

      <el-checkbox
          v-if="showCheckbox&&!isExcelStyle"
          v-model="node.checked"
          :indeterminate="node.indeterminate"
          :disabled="!!node.disabled"
          @click.native.stop
          @change="handleCheckChange"
      />
      <span
          v-if="node.loading"
          class="el-tree-node__loading-icon el-icon-loading"
      />
      <template v-if="columnConfig">
        <div v-if="isHeader" class="tree-table-header" :style="rowStyle">
          <span v-for="(item,index) in columnConfig"
                class="column-title"
                :key="item.prop"
                :ref="item.prop"
                :style="getCellStyle(index)"
                @mousemove="mousemove($event,item,index)"
                @mousedown="mouseDown"
          >
            {{ item.label }}
          </span>
        </div>

        <div v-else class="tree-table-row" :style="rowStyle">
          <span v-for="(item,index) in columnConfig"
                class="tree-table-cell"
                :key="'row-'+index+'-'+item.prop"
                :style="getCellStyle(index)"
                @mouseenter="openTooltip"
                @mouseleave="closeTooltip"
          >
            <tableCellContent :node="node" :prop="item.prop"/>
          </span>
        </div>
      </template>

      <node-content :node="node" v-else/>

    </div>
    <el-collapse-transition>
      <div
          class="el-tree-node__children"
          v-if="!renderAfterExpand || childNodeRendered"
          v-show="expanded"
          role="group"
          :aria-expanded="expanded"
      >
        <div v-if="isExcelStyle" class="excel-line" :style="excelLineStyle"></div>

        <template v-for="child in showChildNodes">
          <LazyTreeNode
              :render-content="renderContent"
              :render-after-expand="renderAfterExpand"
              :show-checkbox="showCheckbox"
              :key="getNodeKey(child)"
              :node="child"
              :show-nodes="showNodes"
              @node-expand="handleChildNodeExpand"
              :theme="theme"
              :column-config="columnConfig"
          />
        </template>
      </div>
    </el-collapse-transition>
  </div>
</template>

<script>
import { Tree } from 'element-ui';

export default {
  name: 'LazyTreeNode',
  componentName: 'LazyTreeNode',
  components: {
    tableCellContent: {
      props: {
        node: Object,
        prop: String,
      },
      render() {
        const tree = this.$parent.tree;
        const data = this.node.data;
        const slotFn = tree.$scopedSlots[this.prop];
        return (slotFn ? slotFn(this.node) : <span>{data[this.prop]}</span>);
      }
    }
  },
  extends: Tree.components.ElTreeNode,
  props: {
    showNodes: Array, // 懒加载计算后可展示节点
    columnConfig: Array, // 表格列配置
    isHeader: Boolean, // 是否为表格头
    theme: String, // 主题【‘excel'】
  },
  data() {
    return {
      checkboxSpace: 22, // 勾选框占位宽度
      expandIconSpace: 24, // 展开按钮占位宽度
      dragConfig: {
        // 可拖拽、拖拽中
        draggable: false,
        dragging: false,
        // 鼠标经过元素
        overTarget: null,
        overLeft: 0,
        overRight: 0,
        // 更新目标、相邻目标（右侧）
        data: null,
        target: null,
        nextData: null,
        nextTarget: null,
        // 位置信息
        left: 0,
        startX: 0,
        endX: 0,
        minWidth: 20,
        dragSpaceWidth: 8, // 可拖拽区域宽度
        cursor: 'col-resize',
      }
    }
  },
  computed: {
    // 首列补偿宽度
    headerPaddingSpace() {
      const hasCheckBox = !this.isExcelStyle && !this.isHeader && this.showCheckbox;
      const hasExpandIcon = !this.isHeader;
      let space = 0;
      if (hasCheckBox) {
        space += this.checkboxSpace;
      }
      if (hasExpandIcon) {
        space += this.expandIconSpace;
      }
      // 常规风格，无展开按钮
      return space;
    },
    // 是否Excel风格
    isExcelStyle() {
      return this.theme === 'excel';
    },
    // 过滤可展示的子节点
    showChildNodes() {
      return this.node.childNodes.filter(e => this.showNodes.includes(e));
    },
    // 计算层级左侧留白
    contentPadding() {
      if (!this.node || !this.tree) {
        return 0;
      }
      return (this.node.level - 1) * this.tree.indent;
    },
    // 计算表格列宽度，首列默认200px，剩余列均分
    rowStyle() {
      if (this.columnConfig.length === 1) {
        return {
          gridTemplateColumns: '1fr',
        }
      }
      const defaultWidth = `${(100 / this.columnConfig.length).toFixed(2)}fr`;
      return {
        gridTemplateColumns: `auto ${this.columnConfig.slice(1).map(e => (e.width || defaultWidth).replace('%', 'fr')).join(' ')}`,
      }
    },
    // 竖形线条高度（Excel风格）
    excelLineStyle() {
      const { childNodes = [] } = this.node || {};
      let height;
      if (!childNodes.length) {
        height = '0';
        return {
          height,
          '--excel-column-height': height,
        }
      }

      const start = childNodes[0];
      const end = childNodes[childNodes.length - 1];
      let count = 0;
      // eslint-disable-next-line no-restricted-syntax
      for (const e of this.showNodes) {
        if (e === start) {
          count++;
        }

        if (e === end) {
          break;
        }

        if (this.includeChildNode(e.parent)) {
          count++;
        }
      }
      height = `${26 * count - 8}px`;
      return {
        height,
        '--excel-column-height': height,
        left: `${this.contentPadding + 12}px`,
      }
    }
  },
  methods: {
    // 根据元素宽度判断是否展示tooltip
    openTooltip(e) {
      e.preventDefault();

      if (!this.tree.showTooltip) {
        return;
      }

      const { target } = e;
      const child = target.children[0];
      const { tooltip } = this.tree.$refs;
      if (!child || !tooltip) {
        return;
      }

      // 容器实际宽度
      const containerWidth = target.getBoundingClientRect().width;
      // 容器内边距
      const getComputedStyle = window.getComputedStyle;
      const paddingWidth = (parseInt(getComputedStyle(target).paddingLeft, 10) || 0) + (parseInt(getComputedStyle(target).paddingRight, 10) || 0);
      // 内容实际宽度
      const contentWidth = child.getBoundingClientRect().width;

      // 增加冗余宽度
      const space = 1;
      // 校验是否超出
      if (containerWidth - paddingWidth - space >= contentWidth) {
        return;
      }

      // 绑定文本，展示tooltip
      this.tree.tooltipConfig.content = child.innerText || child.textContent;
      tooltip.referenceElm = child;
      tooltip.doDestroy();
      tooltip.setExpectedState(true);
      requestAnimationFrame(() => {
        tooltip.handleShowPopper();
      })
    },
    // 关闭tooltip
    closeTooltip(e) {
      e.preventDefault();
      if (!this.tree.showTooltip) {
        return;
      }
      const { tooltip } = this.tree.$refs;
      if (tooltip) {
        tooltip.setExpectedState(false);
        tooltip.handleClosePopper();
      }
    },
    mousemove(e, data, index) {
      e.preventDefault();
      // 校验拖拽状态，阻止更新拖拽源数据
      if (this.dragConfig.dragging) {
        return;
      }
      // 当前鼠标经过元素
      const overTarget = e.target;
      // 屏蔽最后一列拖拽
      if (index === this.columnConfig.length - 1) {
        overTarget.style.cursor = '';
        this.dragConfig.draggable = false;
        return;
      }

      // 校验是否同一个元素触发，避免重复获取dom几何信息
      if (this.dragConfig.overTarget !== overTarget) {
        const { left, right } = overTarget.getBoundingClientRect();
        // 缓存几何信息
        Object.assign(this.dragConfig, {
          overTarget,
          overLeft: left,
          overRight: right,
        })
      }

      // 获取位置信息
      const { overLeft, overRight, dragSpaceWidth, cursor } = this.dragConfig;
      const { clientX } = e;
      // 鼠标位于拖拽区域左侧
      const inLeft = overRight - dragSpaceWidth <= clientX && clientX <= overRight;
      // 鼠标位于拖拽区域右侧
      const inRight = overLeft <= clientX && clientX <= overLeft + dragSpaceWidth;

      // 鼠标在边界线右侧时，实际操作列为左侧列，排除首列场景
      if (inRight && index === 0) {
        overTarget.style.cursor = '';
        this.dragConfig.draggable = false;
        return;
      }

      // 更新可拖拽状态
      const draggable = inLeft || inRight;
      // 更新鼠标样式
      overTarget.style.cursor = draggable ? cursor : '';

      // 修正操作数据 ，实际操作左侧列，并同步修改相邻（右侧）列
      data = inRight ? this.columnConfig[index - 1] : this.columnConfig[index];
      const nextData = inRight ? this.columnConfig[index] : this.columnConfig[index + 1];

      // 缓存实际拖拽dom的位置信息
      const ref = this.$refs[data.prop]
      const target = Array.isArray(ref) ? ref[0] : ref;
      const nextRef = this.$refs[nextData.prop];
      const nextTarget = Array.isArray(nextRef) ? nextRef[0] : nextRef;

      // 更新位置信息缓存
      if (target !== this.dragConfig.target) {
        this.dragConfig.left = target.getBoundingClientRect().left;
      }
      Object.assign(this.dragConfig, {
        draggable,
        data,
        nextData,
        target,
        nextTarget,
        startX: clientX,
      })
    },
    // 基于dom几何信息，切换列宽单位为绝对值或响应值 px -> fr  ，首列除外
    initColumnResponsive(responsive) {
      const suffix = responsive ? '%' : 'px';
      const firstColumnIndex = 0;
      this.columnConfig.forEach((e, index) => {
        const ref = this.$refs[e.prop];
        const target = Array.isArray(ref) ? ref[0] : ref;
        const width = target.getBoundingClientRect().width;
        this.$set(e, 'width', width + (index === firstColumnIndex ? 'px' : suffix));
      })
    },
    mouseDown(e) {
      e.preventDefault();
      const { draggable, startX, target, minWidth, left } = this.dragConfig;
      // 校验可拖拽状态
      if (!draggable) {
        return;
      }
      // 更新可拖拽样式
      this.dragConfig.dragging = true;
      // 触发拖拽后，移除响应式固定所有列宽为绝对值px
      this.initColumnResponsive(false);

      // 创建拖拽提示线条
      const div = document.createElement('div');
      const style = div.style;
      Object.assign(style, {
        position: 'fixed',
        top: `${target.getBoundingClientRect().top}px`,
        left: `${startX}px`,
        height: `${this.tree.$el.getBoundingClientRect().height}px`, // 顶层容器高度
        borderLeft: '1px dotted #666666',
        zIndex: '99999'
      })
      document.body.appendChild(div);

      // 鼠标移动时更新位置信息endX
      const mousemove = (e) => {
        e.preventDefault();
        const endX = Math.max(e.clientX, left + minWidth);// 限制拖拽最小宽度
        this.dragConfig.endX = endX;
        style.left = `${endX}px`;
      }

      // 鼠标放开后更新target和nextTarget宽度，并恢复响应式布局
      const mouseup = (e) => {
        e.preventDefault();

        const { startX, endX, data, target, nextData, nextTarget } = this.dragConfig;

        // 鼠标移动距离
        const distance = endX - startX;

        // 计算dom实时宽度，更新至配置对象
        const width = target.getBoundingClientRect().width + distance;
        const nextWidth = nextTarget.getBoundingClientRect().width - distance;
        this.$set(data, 'width', `${width}px`);
        this.$set(nextData, 'width', `${nextWidth}px`);
        Object.assign(this.dragConfig, {
          overTarget: null,
          target: null,
          dragging: false,
        })
        // 恢复表格列响应式
        requestAnimationFrame(() => {
          this.initColumnResponsive(true);
        })

        // 移除提示线条
        document.body.removeChild(div);
        // 移除全局事件监听
        document.removeEventListener('mousemove', mousemove);
        document.removeEventListener('mouseup', mouseup);
      }
      document.addEventListener('mousemove', mousemove);
      document.addEventListener('mouseup', mouseup);
    },
    // 校验是否为当前节点的后代
    includeChildNode(parent) {
      if (!parent) {
        return false;
      }
      if (parent === this.node) {
        return true;
      }
      return this.includeChildNode(parent.parent);
    },
    handleChildNodeExpand(nodeData, node, instance) {
      this.broadcast('LazyTreeNode', 'tree-node-expand', node);
      this.tree.$emit('node-expand', nodeData, node, instance);
    },
    // 获取首列单元格样式，设置宽度优先，默认值200px，
    getCellStyle(index) {
      if (index !== 0) {
        return {};
      }
      if (this.columnConfig.length === 1) {
        return {
          width: '100%',
        }
      }
      const defaultWidth = '200px';
      const firstCell = this.columnConfig[0];
      const space = this.headerPaddingSpace; // 首列留白
      return {
        width: `calc(${firstCell.width || defaultWidth} - ${this.contentPadding + space}px)`
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.is-header {
  position: sticky;
  top: 0;
  z-index: 2;
  height: 36px;

  .el-tree-node__content {
    height: 100%;

    .tree-table-header {
      background: #cdddfd;

      .column-title {
        line-height: 36px;
        font-size: 14px;
        color: #333;
        border: none;
      }
    }
  }
}

.tree-table-header, .tree-table-row {
  width: 100%;
  height: 100%;
  display: grid;
  gap: 2px;

  .column-title, .tree-table-cell {
    height: 100%;
    width: 100%;
    display: block;
    padding: 0 8px;
    box-sizing: border-box;
    text-align: left;
    line-height: 26px;
    overflow: hidden;
    white-space: nowrap;
    word-break: break-all;
    text-overflow: ellipsis;
  }

  .tree-table-cell:nth-child(1) {
    padding-left: 0;
  }
}


.is-excel {

  @keyframes excel-column-mark {
    0% {
      height: 0;
    }
    100% {
      height: var(--excel-column-height);
    }
  }

  .excel-line {
    border-left: 1px solid #333333;
    position: absolute;
    width: 0;
    transform: translateY(-6px);
    animation: 0.3s ease-in-out excel-column-mark;
  }

  .el-tree-node__expand-icon.expanded {
    transform: none;
  }

  .el-icon-caret-right {
    padding: 5px;

    &:before {
      display: block;
      content: '+';
      font-size: 13px;
      line-height: 12px;
      width: 14px;
      height: 14px;
      color: #000;
      text-align: center;
      border: 1px solid #333;
    }

    &.expanded:before {
      content: '-';
      line-height: 10px;
      font-size: 20px;
    }

    &.is-leaf:before {
      content: '';
      border: none;
    }

    @keyframes excel-row-mark {
      0% {
        width: 0;
      }
      50% {
        width: 0;
      }
      100% {
        width: 12px;
      }
    }

    &:after {
      content: '';
      display: block;
      width: 12px;
      height: 1px;
      transform: translate(-12px, -8px);
      background-color: #333333;
      animation: 0.6s ease-in-out excel-row-mark;
    }

    &.is-first-level:after {
      display: none;
    }
  }

}


</style>
