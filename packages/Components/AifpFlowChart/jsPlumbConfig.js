export default {
  // 全局默认配置
  defaultSetting: {
    // 动态锚点、位置自适应
    Anchors: ['Top', 'TopCenter', 'TopRight', 'TopLeft', 'Right', 'RightMiddle', 'Bottom', 'BottomCenter', 'BottomRight', 'BottomLeft', 'Left', 'LeftMiddle'],
    // 连线的样式，直线或者曲线等，可选值:  StateMachine、Flowchart，Bezier、Straight
    Connector: ['Flowchart', { stub: 20, gap: 1 }],
    // 鼠标不能拖动删除线
    ConnectionsDetachable: false,
    // 删除线的时候节点不删除
    DeleteEndpointsOnDetach: false,
    // 圆形端点
    Endpoint: ['Dot', {
      radius: 3, // 圆点半径
    }],
    // Endpoint: ['Blank', { Overlays: '' }], // 不显示端点
    // 节点端点样式
    EndpointStyle: {
      fill: '#999999', // 颜色值，为空不显示
      outlineWidth: 1, // 外边线宽度
      width: 2,
      height: 2
    },
    // 是否打开jsPlumb的内部日志记录
    LogEnabled: false,
    // 连线的样式
    PaintStyle: {
      stroke: '#5A6984', // 线的颜色
      strokeWidth: 2, // 线的粗细，值越大线越粗
      outlineStroke: 'transparent', // 设置外边线的颜色，默认设置透明，这样别人就看不见了，点击线的时候可以不用精确点击，参考 https://blog.csdn.net/roymno2/article/details/72717101
      outlineWidth: 10 // 线外边的宽，值越大，线的点击范围越大
    },
    DragOptions: { cursor: 'pointer', zIndex: 2000 },
    //  叠加 参考： https://www.jianshu.com/p/d9e9918fd928
    Overlays: [
      // 箭头叠加
      ['Arrow', {
        width: 8, // 箭头尾部的宽度
        length: 10, // 从箭头的尾部到头部的距离
        location: 1, // 位置，建议使用0～1之间
        direction: 1, // 方向，默认值为1（表示向前），可选-1（表示向后）
        foldback: 0.623 // 折回，也就是尾翼的角度，默认0.623，当为1时，为正三角
      }],
      ['Label', {
        label: '',
        location: 0.1,
        cssClass: 'aLabel'
      }]
    ],
    // 绘制图的模式 svg、canvas
    RenderMode: 'svg',
    // 鼠标滑过线的样式
    HoverPaintStyle: { stroke: '#04def3', strokeWidth: 1 },
    // 滑过锚点效果
    EndpointHoverStyle: { fill: '#04def3' },
  },
  // 连线参数
  connectOptions: {
    isSource: false,
    isTarget: false,
    // 动态锚点、提供了4个方向 Continuous、AutoDefault
    anchor: ['Left', 'Right'],
  },
  // 动态锚点默认配置参数
  dynamicEndPointConfig: {
    filter: '.chart-flow-node-connect-area', // 过滤拖拽、连线操作，该class的dom可以连线，无法拖拽（解决连线时元素跟随移动问题）
    filterExclude: false,
    anchor: 'Continuous', // 动态锚点
    allowLoopback: false, // 是否允许自己连接自己
    maxConnections: -1, // 最大连线数量
    // onMaxConnections(info, e) {
    //   console.log(`超过了最大值连线: ${info.maxConnections}`)
    // },
    dropOptions: { hoverClass: 'ef-drop-hover' }
  },
  // 源点静态锚点默认配置
  staticSourceEndPointConfig: {
    anchors: ['Right'],
    isSource: true,
    isTarget: false,
  },
  // 目标静态锚点默认配置
  staticTargetEndPointConfig: {
    anchors: ['Left'],
    isSource: false,
    isTarget: true,
  },
}
