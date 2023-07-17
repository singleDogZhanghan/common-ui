/**
 * 创建可拖拽页面分区（左右、上下）
 * @param isHorizontal
 * @param container
 * @param left
 * @param leftWidth
 * @param right
 * @param resize
 * @param top
 * @param topHeight
 * @param bottom
 */
export function createDoubleScreen({
  isHorizontal = true, // 是否水平布局
  container = 'container', // 外层容器ref 、dom元素
  left = 'left', // 左侧容器ref、dom元素
  leftWidth = '200px', // 左侧容器初始宽度
  right = 'right', // 右侧容器ref、dom元素
  resize = 'resize', // 调节按钮ref、dom元素
  top = 'top', // 顶部容器ref、dom元素
  topHeight = '50%', // 顶部容器初始高度
  bottom = 'bottom', // 底部容器ref、dom元素
} = {}) {
  const containerDom = container instanceof HTMLElement ? container : this.$refs[container];
  if (!containerDom) {
    return;
  }
  // 拖拽主区域最小宽高
  const minHeight = 50;
  const minWidth = 30;
  const leftDom = left instanceof HTMLElement ? left : this.$refs[left];
  const rightDom = right instanceof HTMLElement ? right : this.$refs[right];
  const resizeDom = resize instanceof HTMLElement ? resize : this.$refs[resize];
  const topDom = top instanceof HTMLElement ? top : this.$refs[top];
  const bottomDom = bottom instanceof HTMLElement ? bottom : this.$refs[bottom];

  Object.assign(containerDom.style, {
    width: '100%',
    height: '100%',
    display: 'grid',
    gridTemplateColumns: isHorizontal
      ? `${leftWidth} ${(resizeDom && '10px') || ''} auto`
      : '100%',
    gridTemplateRows: isHorizontal
      ? '100%'
      : `${topHeight} ${(resizeDom && '10px') || ''} auto`,
  });

  const commonStyle = {
    width: '100%',
    height: '100%',
    overflow: 'auto',
    minHeight: `${minHeight}px`,
    minWidth: `${minWidth}px`,
  };
  leftDom && Object.assign(leftDom.style, commonStyle);
  rightDom && Object.assign(rightDom.style, commonStyle);
  topDom && Object.assign(topDom.style, commonStyle);
  bottomDom && Object.assign(bottomDom.style, commonStyle);

  const dragState = {
    dragging: false,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
  };

  if (resizeDom) {
    const defaultColor = '#d6d6d6';
    const draggingColor = '#818181';

    Object.assign(resizeDom.style, {
      width: isHorizontal ? '10px' : '50px',
      height: isHorizontal ? '50px' : '10px',
      position: 'relative',
      top: isHorizontal ? '45%' : '0',
      left: isHorizontal ? '0' : '45%',
      borderRadius: '5px',
      cursor: isHorizontal ? 'col-resize' : 'row-resize',
      backgroundColor: defaultColor,
      transitionDuration: '0.3s',
    });

    const resizeDomMousedown = function (event) {
      event.preventDefault();
      event.stopPropagation();
      resizeDom.style.backgroundColor = draggingColor;
      const rect = (leftDom || topDom).getBoundingClientRect();
      Object.assign(dragState, {
        startX: event.clientX,
        startY: event.clientY,
        startWidth: rect.width,
        startHeight: rect.height,
      });
      const mousemove = function (e) {
        e.preventDefault();
        e.stopPropagation();
        const endWidth = Math.max(minWidth, dragState.startWidth + e.clientX - dragState.startX);
        const endHeight = Math.max(minHeight, dragState.startHeight + e.clientY - dragState.startY);
        Object.assign(containerDom.style, {
          gridTemplateColumns: isHorizontal
            ? `${endWidth}px ${(resizeDom && '10px') || ''}  auto`
            : '100%',
          gridTemplateRows: isHorizontal
            ? '100%'
            : `${endHeight}px ${(resizeDom && '10px') || ''}  auto`,
        });
      }

      const mouseup = function (e) {
        e.preventDefault();
        e.stopPropagation();
        resizeDom.style.backgroundColor = defaultColor;
        document.removeEventListener('mousemove', mousemove);
        document.removeEventListener('mouseup', mouseup);
      }

      document.addEventListener('mousemove', mousemove);
      document.addEventListener('mouseup', mouseup);
    }

    resizeDom.addEventListener('mousedown', resizeDomMousedown);
    return;
  }

  // TODO 性能消耗较高
  // 拖动元素自身时，鼠标与元素相对距离差值的有效范围
  const lazyDistance = 10;
  const domMousedown = function (event) {
    event.preventDefault();
    event.stopPropagation();
    const rect = (leftDom || topDom).getBoundingClientRect();
    const xDistance = rect.right - event.clientX;
    const yDistance = rect.bottom - event.clientY;
    const widthRange = Math.abs(xDistance) < lazyDistance;
    const heightRange = Math.abs(yDistance) < lazyDistance
    if (!widthRange && !heightRange) {
      return;
    }

    Object.assign(dragState, {
      dragging: true,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
    });

    const mouseup = function (e) {
      e.preventDefault();
      e.stopPropagation();
      document.body.style.cursor = '';
      dragState.dragging = false;
      // document.removeEventListener('mousemove', mousemove);
      document.removeEventListener('mouseup', mouseup);
    }
    document.addEventListener('mouseup', mouseup);
  };

  const mousemove = function (e) {
    e.preventDefault();
    e.stopPropagation();
    const rect = (leftDom || topDom).getBoundingClientRect();
    const xDistance = rect.right - e.clientX;
    const yDistance = rect.bottom - e.clientY;
    const widthRange = Math.abs(xDistance) < lazyDistance;
    const heightRange = Math.abs(yDistance) < lazyDistance

    if ((widthRange && isHorizontal) || (heightRange && !isHorizontal)) {
      document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';
    } else {
      document.body.style.cursor = '';
    }

    if (!dragState.dragging) {
      return;
    }
    const endWidth = Math.max(minWidth, dragState.startWidth + e.clientX - dragState.startX);
    const endHeight = Math.max(minHeight, dragState.startHeight + e.clientY - dragState.startY);
    Object.assign(containerDom.style, {
      gridTemplateColumns: isHorizontal
        ? `${endWidth}px ${(resizeDom && '10px') || ''}  auto`
        : '100%',
      gridTemplateRows: isHorizontal
        ? '100%'
        : `${endHeight}px ${(resizeDom && '10px') || ''}  auto`,
    });
  };

  leftDom && leftDom.addEventListener('mousedown', domMousedown);
  topDom && topDom.addEventListener('mousedown', domMousedown);
  (leftDom || topDom) && document.addEventListener('mousemove', mousemove);
}
