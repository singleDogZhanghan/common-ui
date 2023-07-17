<template>
  <!-- 容器内部屏蔽右键默认行为 -->
  <div
      class="aifp-flow-chart"
      ref="container"
      @contextmenu="$event.preventDefault();"
  >
    <template v-for="node in data">
      <!-- 为节点创建容器，执行拖动、右键菜单功能 -->
      <div
          class="chart-node-container"
          ref="chartNode"
          :key="node.domId"
          @mousedown="$event.stopPropagation();$emit('nodeClick', node);"
          @contextmenu="createDeleteBtn($event,node,'node');"
      >
        <!-- 默认插槽，允许自定义节点内容  -->
        <slot v-bind="node">
          <!--  插槽默认内容 -->
          <div class="node">
            {{ node.label }}
          </div>
        </slot>
      </div>
    </template>
  </div>
</template>
<script>
import 'jsplumb/dist/js/jsplumb.min.js';
import config from './jsPlumbConfig.js';
import { draggable } from '../../Utils/draggable.js';

export default {
  name: 'AifpFlowChart',
  props: {
    editable: {
      type: Boolean,
      default: true,
    },
    // 流程图数据，与页面双向绑定，实时更新需增加修饰符.sync
    data: {
      type: Array,
      default: () => ([])
    },
    // 流程图全局默认配置，参照jsplumb
    defaultSetting: {
      type: Object,
      default: () => (config.defaultSetting)
    },
    // 允许双击删除连线
    autoDeleteConnect: {
      type: Boolean,
      default: true,
    },
    // 允许节点连接自己
    allowConnectSelf: {
      type: Boolean,
      default: false,
    },
    // 允许节点之间重复连接
    allowConnectRepeat: {
      type: Boolean,
      default: false,
    },
    // 节点内部连线区域class，该区域无法触发拖动操作，只能触发连线操作，参照jsplumb
    connectAreaClass: {
      type: String,
      default: () => (config.dynamicEndPointConfig.filter.replaceAll('.', ''))
    },
    // 自动更新（根据流程图数据，按照默认配置，创建可拖拽连线的节点，并以动态锚点自动连线）
    autoUpdate: {
      type: Boolean,
      default: true,
    },
    // 鼠标右键点击删除节点、连线
    rightClickDelete: {
      type: Boolean,
      default: true,
    },
    // 自定义连接前校验
    connectCheck: Function,
  },
  data() {
    return {
      instance: null, // jsplumb实例
      uuid: 0, // 自动生成domId（自增数字+时间戳）
      cachedNodeList: new Set(), // 缓存转化过的节点dom
      cachedEndPoint: new Set(), // 缓存添加过动态锚点的节点dom，重复执行创建动态锚点会导致卡顿
      contextMenuDom: null, // 右键菜单dom
    }
  },
  watch: {
    // 监听数据变化，初始化domId，异步更新流程图
    data(val = []) {
      val.forEach((e) => {
        // 生成元素Id，优先使用节点数据的Id
        e.domId = e.domId || `${this.uuid++}-chart-flow-node-${new Date().getTime()}`;
      })
      requestAnimationFrame(() => {
        this.autoUpdate && this.update();
      })
    }
  },
  beforeDestroy() {
    // 销毁全局事件监听
    document.removeEventListener('click', this.cleanMenuDom);
  },
  mounted() {
    // 全局监听单击事件，清除右键菜单dom
    document.addEventListener('click', this.cleanMenuDom);
    // 初始化流程图实例 + 更新流程图信息
    requestAnimationFrame(() => {
      this.init();
      this.autoUpdate && this.update();
    })
  },
  methods: {
    // 初始化流程图实例
    init() {
      if (!this.$refs.container) {
        return;
      }

      // 获取jsPlumb实例
      this.instance = window.jsPlumb.getInstance();
      // 导入全局默认配置
      this.instance.importDefaults(this.defaultSetting);
      // 绑定容器dom
      this.instance.setContainer(this.$refs.container);

      // 双击删除连线
      this.instance.bind('dblclick', (conn) => {
        if (this.editable && this.autoDeleteConnect) {
          this.instance.deleteConnection(conn);
        }
      })

      // 连线前校验，可基于dom判断，也可基于data:{connections以自身为起点的连接, endConnections以自身为终点的连接}判断
      this.instance.bind('beforeDrop', (conn) => {
        // 获取所有连线
        const allConnections = this.instance.getAllConnections();
        // 获取连线起点dom、终点dom
        const { connection: { source, target } } = conn;
        // 基于dom获取对应data
        const sourceData = this.data.find(e => e.dom === source);
        const targetData = this.data.find(e => e.dom === target);

        // 允许连接自己
        const ifConnectSelf = source === target;
        if (!this.allowConnectSelf && ifConnectSelf) {
          return false;
        }

        // 允许相同起始点重复连接
        const ifConnectRepeat = allConnections.find(e => e.source === source && e.target === target);
        if (!this.allowConnectRepeat && ifConnectRepeat) {
          return false;
        }

        // 自定义连接校验
        if (this.connectCheck) {
          return this.connectCheck({ ...conn, sourceData, targetData }, allConnections);
        }

        return true;
      })

      // 连线后数据维护：以自身为起点的连接：connections  以自身为终点的连接：endConnections
      this.instance.bind('connection', (conn) => {
        // 更新连线信息
        this.updateNodeConnections(conn, true);
        // 为连接绑定右键点击删除
        conn.connection.bind('contextmenu', (connection, e) => {
          this.createDeleteBtn(e, connection, 'connection');
        })
        this.$emit('update:data', [...this.data]);
      })

      // 断线后数据维护：以自身为起点的连接：connections  以自身为终点的连接：endConnections
      this.instance.bind('connectionDetached', (conn) => {
        // 更新连线信息
        this.updateNodeConnections(conn, false);
        this.$emit('update:data', [...this.data]);
      })

      return this.instance;
    },
    // 连接起点source：增加连接信息connections   连接终点target：增加连接信息endConnections
    updateNodeConnections(conn, isAdd = true) {
      const { source, target, sourceId, targetId } = conn;

      const connectionList = [];

      // 收集source connection
      const matchSource = this.data.find(e => e.dom === source);
      matchSource && connectionList.push(matchSource.connections);

      // 收集target endConnection
      const matchTarget = this.data.find(e => e.dom === target);
      matchTarget && connectionList.push(matchTarget.endConnections);

      // 更新
      connectionList.forEach((list) => {
        // 查找起点数据是否存在相同连接，由于数据初次向dom转换时，只存在基本连接信息，没有dom信息，故此处按照domId进行匹配
        const matchIndex = list.findIndex(e => e.sourceId === sourceId && e.targetId === targetId);
        const matchConn = list[matchIndex];
        if (isAdd) {
          matchConn ? Object.assign(matchConn, conn) : list.push(conn);
        } else {
          matchConn && list.splice(matchIndex, 1);
        }
      })
    },
    // 基于传入数据进行同步，按默认配置进行视图更新
    update() {
      // 获取视图内部节点，为保证正确获取节点，update函数需异步执行
      // 确认单个节点时，ref也是集合
      const nodes = this.$refs.chartNode;

      // 流程图添加节点时，会对节点dom进行缓存，数据更新时，需过滤已移除的数据，将对应的dom相关连线清除
      const deletedNodes = Array.from(this.cachedNodeList).filter(e => !nodes.includes(e));
      this.deleteNode(deletedNodes);

      // 收集节点连接信息
      const connections = [];
      // 遍历数据，为数据绑定dom，将dom转化为流程图节点，创建动态锚点
      this.data.forEach((data, index) => {
        // 初始化连接信息
        data.connections = data.connections || [];
        data.endConnections = data.endConnections || [];
        connections.push(...data.connections);

        // 绑定dom
        const dom = nodes[index];
        // 创建流程图节点
        this.addNode(data, dom);
        // 创建连线锚点
        this.addEndPoint(dom);
      });

      // 遍历连接信息，创建节点连线
      connections.forEach(({ sourceId, targetId, connection, label }) => {
        // 过滤已有连接，避免重复创建
        if (connection) {
          return;
        }
        // 基于domId过滤错误数据
        const source = this.data.find(e => e.domId === sourceId);
        const target = this.data.find(e => e.domId === targetId);
        if (!source || !target) {
          return;
        }
        // 创建连线
        this.instance.connect({
          source: source.dom,
          target: target.dom,
          overlays: label ? [
            ['Label', {
              label,
              location: 0.5,
              cssClass: 'line-label',
              labelStyle: {
                fill: '#F2F5F9',
                padding: '10px'
              }
            }]
          ] : []
        });
      })
    },
    // 初始化流程图节点：绑定domId、统一dom样式、创建连线区域、增加拖动功能
    addNode(data = {}, dom, {
      easyConnect = true, // 创建连线区域，用于区分拖拽区域，适用于动态锚点场景
      nodeDraggable = true, // 是否使节点可拖动，默认限制拖拽区域为实例所属容器
    } = {}) {
      // 校验dom缓存，避免重复处理
      if (this.cachedNodeList.has(dom)) {
        return;
      }
      // 缓存已初始化dom
      this.cachedNodeList.add(dom);

      // 获取容器dom
      const container = this.instance.getContainer();

      // 绑定dom信息
      data.dom = dom;
      dom.id = data.domId;

      // 初始化dom位置（流程图容器内部强制使用相对定位absolute）
      Object.assign(dom.style, {
        position: 'absolute',
        left: `${data.clientX}px`,
        top: `${data.clientY}px`,
      })

      // 为dom创建快捷连线区域
      let connectArea = null;
      if (this.editable && easyConnect) {
        connectArea = document.createElement('div');
        connectArea.className = `${this.connectAreaClass} connect-area`;
        dom.appendChild(connectArea);
      }

      // 为dom增加拖动功能
      if (this.editable && nodeDraggable) {
        draggable(dom, {
          mode: 'move', // 流程图节点固定为移动模式
          dragShadow: false,
          dragLimit: container, // 限制拖动区域为容器
          disableArea: connectArea, // 连线区域不可拖动
          movingCallback: () => {
            this.instance.repaintEverything(); // 拖动过程中重新绘制流程图
          },
          endCallback: ({ clientX, clientY }) => {
            Object.assign(data, { clientX, clientY });
            this.$emit('update:data', [...this.data]);
          }
        })
      }
      return data;
    },
    // 创建连线锚点，默认根据全局配置创建动态锚点
    addEndPoint(dom, {
      isDynamic = true,
      sourceOptions,
      targetOptions,
    } = {}) {
      // 初始化锚点配置
      if (!sourceOptions) {
        sourceOptions = isDynamic ? config.dynamicEndPointConfig : config.staticSourceEndPointConfig;
      }
      if (!targetOptions) {
        targetOptions = isDynamic ? config.dynamicEndPointConfig : config.staticTargetEndPointConfig;
      }

      // 创建动态锚点
      if (isDynamic) {
        // 过滤处理过的dom，重复创建动态锚点会导致卡顿
        if (this.cachedEndPoint.has(dom)) {
          return;
        }
        // 缓存dom
        this.cachedEndPoint.add(dom);
        // 创建
        this.instance.makeSource(dom, sourceOptions);
        this.instance.makeTarget(dom, targetOptions);
      } else {
        // 创建静态锚点
        this.instance.addEndpoint(dom, sourceOptions);
        this.instance.addEndpoint(dom, targetOptions);
      }
    },
    // 删除节点（批量），只在数据变更后，清除dom节点相关的连接
    deleteNode(dom) {
      dom = Array.isArray(dom) ? dom : [dom];
      dom.forEach((e) => {
        // 清除节点连线
        this.instance.deleteConnectionsForElement(e);
        // 清除缓存
        this.cachedNodeList.delete(e);
        this.cachedEndPoint.delete(e);
      })
    },
    // 获取简化后的流程图数据，只包含基本元信息、节点信息（domId、connections、endConnections)
    transferChartData() {
      return this.data.map((e) => {
        const { connections = [], endConnections = [] } = e;
        return {
          ...e,
          dom: null,
          connections: connections.map(({ sourceId, targetId }) => ({ sourceId, targetId })),
          endConnections: endConnections.map(({ sourceId, targetId }) => ({ sourceId, targetId }))
        }
      })
    },
    // 清除菜单dom
    cleanMenuDom() {
      if (!this.contextMenuDom) {
        return;
      }
      this.contextMenuDom.parentElement.removeChild(this.contextMenuDom);
      this.contextMenuDom = null;
    },
    // 创建删除按钮（节点、连接）
    createDeleteBtn(e, data, type = 'connection') {
      e.stopPropagation();
      e.preventDefault();
      if (!this.editable || !data || !this.rightClickDelete) {
        return;
      }

      // 定义按钮位置
      let left;
      let top;
      // 删除节点时，按钮在节点右下角
      if (type === 'node') {
        const { right, bottom } = data.dom.getBoundingClientRect();
        left = right - 12;
        top = bottom;
      } else {
        // 其余场景，按钮跟随鼠标落点位置
        left = e.clientX;
        top = e.clientY;
      }

      // 清除已存在的按钮dom，保证容器内部同时只存在一个按钮
      this.cleanMenuDom();

      // 创建按钮dom、绑定样式、位置信息
      this.contextMenuDom = document.createElement('i');
      this.contextMenuDom.className = 'el-icon-delete';
      Object.assign(this.contextMenuDom.style, {
        zIndex: 9999,
        position: 'absolute',
        left: `${left + 14}px`,
        top: `${top - 2}px`,
        background: '#e2dfdf',
        fontSize: '22px',
        padding: '2px',
        boxSizing: 'border-box',
        borderRadius: '4px',
        cursor: 'pointer',
      })

      // 按钮绑定点击删除事件
      this.contextMenuDom.addEventListener('click', (e) => {
        e.preventDefault();
        // 点击后，清除按钮dom
        this.cleanMenuDom();

        // 删除连线
        if (type === 'connection') {
          this.instance.deleteConnection(data);
          this.$emit('connectionDelete', data);
        }
        // 删除节点（流程图不直接删除或创建节点dom，而是通过变更数据动态渲染dom）
        if (type === 'node') {
          const index = this.data.indexOf(data);
          index > -1 && this.data.splice(index, 1);
          this.deleteNode(data.dom);
          this.$emit('nodeDelete', data);
        }

        // 强制触发数据变更
        this.$emit('update:data', [...this.data]);
      })
      document.body.appendChild(this.contextMenuDom);
    },
  }
};
</script>

<style lang="scss" scoped>
.aifp-flow-chart {
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 1px dashed #CED4DF;
  position: relative;
  background: #F2F5F9;

  .node {
    width: 140px;
    height: 36px;
    overflow: hidden;
    cursor: pointer;
    background: #2C6ED5;
    padding: 0 8px;
    box-sizing: border-box;
    border-radius: 3px;
    color: #FFFFFF;
    font-size: 14px;
    line-height: 36px;
  }

  // 固定连线区域样式
  ::v-deep .connect-area {
    width: 20%;
    min-width: 30px;
    height: 100%;
    position: absolute;
    left: auto !important;
    right: 0 !important;
    top: 0 !important;

    &:hover {
      cursor: crosshair
    }
  }

}
</style>
