/**
 * 判断元素是否超出目标元素显示区域
 * 基于元素绝对位置，判断上下左右是否超出目标元素
 * @param source
 * @param target
 * @returns {boolean}
 */
function ifOverView(source, target) {
  if (!source || !target) {
    return true;
  }
  const sourceRect = source.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  return sourceRect.left < targetRect.left
        || sourceRect.top < targetRect.top
        || sourceRect.right > targetRect.right
        || sourceRect.bottom > targetRect.bottom;
}

/**
 * 操作元素可拖拽
 * @param dom {HTMLElement|MouseEvent} 拖拽元素、或鼠标点击的事件参数
 * @param mode {string} 拖拽模式：move：拖动元素本身  copy：拖动元素拷贝
 * @param placeTarget {HTMLElement} 可放置区域：有值时，会限制放置是否成功
 * @param dragLimit {HTMLElement} 拖拽限制区域：有值时，会限制拖拽时元素无法超出该范围
 * @param lazy {number}缓冲距离：距离拖拽限制区域边界的长度（内边界）
 * @param startCallback  {function} 拖动开始  阴影模式下返回相对窗口的绝对位置，否则返回元素style的left、top属性
 * @param movingCallback  {function} 拖动中
 * @param endCallback  {function} 拖动结束
 * @param dragShadow  {boolean} 是否拖拽阴影元素 是：position:fixed  否：position: absolute
 * @param disableArea  {HTMLElement|String} 禁止触发拖拽区域，在元素中划分不可触发拖动操作的区域
 * @param appendToBody  {boolean|String} 阴影元素挂载至body
 */
function draggable(dom, {
  mode = 'move',
  placeTarget = null,
  dragLimit = null,
  lazy = 2,
  startCallback = null,
  movingCallback = null,
  endCallback = null,
  dragShadow = true,
  disableArea = null,
  appendToBody = false,
} = {}) {
  if (!dom) {
    return;
  }

  // 复制模式下，强制使用阴影元素
  if (mode === 'copy') {
    dragShadow = true;
  }

  // 获取要拖动的dom
  const targetDom = dom.target || dom;

  // 获取禁止拖动区域
  disableArea = disableArea instanceof HTMLElement ? disableArea : targetDom.querySelector(disableArea);

  // 拖动开始
  function dragStart({ target, clientX, clientY }) {
    // 如果触发事件的元素在禁止拖动区域内部，则停止操作
    if (disableArea && disableArea.contains(target)) {
      return;
    }
    // 当前事件的target可能来自于targetDom内部，为避免内部元素被拖动，需修正target
    target = targetDom;

    // 获取元素绝对位置，尺寸信息
    const { left, top, width, height } = target.getBoundingClientRect();

    // 计算元素相对鼠标位置
    // const innerX = clientX - left;
    // const innerY = clientY - top;

    // 获取限制区域绝对位置、绝对尺寸信息
    let {
      // eslint-disable-next-line prefer-const
      width: widthLimit = Infinity,
      // eslint-disable-next-line prefer-const
      height: heightLimit = Infinity,
      left: leftLimit = -Infinity,
      top: topLimit = -Infinity,
      right: rightLimit = Infinity,
      bottom: bottomLimit = Infinity,
    } = dragLimit ? dragLimit.getBoundingClientRect() : {};
    /**
         * 因为元素位置由left、right属性控制
         * fixed定位时，位置相对窗口，边界为限制区域绝对位置
         *      左边界 + lazy <  left  < 右边界 - 元素宽度 - lazy
         *      上边界 + lazy <  top   < 下边界 - 元素高度 - lazy
         *
         * absolute定位时，位置相对父容器：边界为限制区域尺寸大小
         *      0 + lazy <  left  < 区域宽度 - 元素宽度 - lazy
         *      0 + lazy <  top   < 区域高度 - 元素高度 - lazy
         */
    if (dragShadow) {
      leftLimit += lazy;
      rightLimit = rightLimit - width - lazy;
      topLimit += lazy;
      bottomLimit = bottomLimit - height - lazy;
    } else {
      leftLimit = lazy;
      rightLimit = widthLimit - width - lazy;
      topLimit = lazy;
      bottomLimit = heightLimit - height - lazy;
    }

    // 创建阴影dom，copy模式下，拖拽阴影dom  move模式下，拖拽原始dom
    const shadowDom = dragShadow ? target.cloneNode(true) : target;
    // 备份zIndex，移动时需提高zIndex值，防止被遮挡
    const oldZIndex = shadowDom.style.zIndex;

    // 初始化样式信息，固定元素尺寸，避免自适应尺寸影响
    Object.assign(shadowDom.style, {
      width: `${width}px`,
      height: `${height}px`,
      opacity: 0.8,
      position: 'absolute',
      zIndex: 99999,
    })
    // 拖拽原始dom时，position为absolute，left、right属性不用修改
    // 拖拽阴影dom时，position为fixed，   left、right属性需重置为相对窗口的绝对位置
    if (dragShadow) {
      Object.assign(shadowDom.style, {
        left: `${left}px`,
        top: `${top}px`,
        position: 'fixed',
      })
    }

    // 记录鼠标起始位置 X、Y
    const startX = clientX;
    const startY = clientY;
    // 记录元素起始位置信息 left、right
    const startLeft = Number(shadowDom.style.left.replace('px', ''));
    const startTop = Number(shadowDom.style.top.replace('px', ''));

    // 拖拽过程
    function dragging(e) {
      // 获取鼠标位置
      const { clientX, clientY } = e;
      // 定义元素位置
      let draggingLeft;
      let draggingTop;

      e.preventDefault();

      /**
             * 位置计算：
             *      方案1： 元素位置 = 鼠标位置 - 元素相对鼠标位置  ，由于鼠标位置值相对于窗口，只适合绝对定位fixed
             *      方案2： 元素位置 = 元素起始位置(left/right) + 鼠标移动距离 ，由于相对计算，适合fixed和absolute，前提要保证left、right在两种定位下的初始值正确
             */
      // 采用方案2，left、right已重置
      draggingLeft = startLeft + clientX - startX;
      draggingTop = startTop + clientY - startY;

      // 基于限制区域进行校正（上下左右）
      // 大于左边界
      draggingLeft = Math.max(leftLimit, draggingLeft);
      // 小于右边界
      draggingLeft = Math.min(draggingLeft, rightLimit);
      // 大于上边界
      draggingTop = Math.max(topLimit, draggingTop);
      // 小于下边界
      draggingTop = Math.min(draggingTop, bottomLimit);


      // 修改元素位置
      Object.assign(shadowDom.style, {
        left: `${draggingLeft}px`,
        top: `${draggingTop}px`,
      })
      // 执行回调
      movingCallback && movingCallback({ clientX: draggingLeft, clientY: draggingTop, target, shadowDom });
    }

    // 拖拽结束
    const dragEnd = function (e) {
      e.preventDefault();
      document.removeEventListener('mousemove', dragging);
      document.removeEventListener('mouseup', dragEnd);
      // 修正元素样式
      shadowDom.style.opacity = 1;
      shadowDom.style.zIndex = oldZIndex;

      const { left, top } = shadowDom.style;
      const leftSize = Number(left.replace('px', ''));
      const topSize = Number(top.replace('px', ''));

      // 元素超出可放置区域，撤销本次操作
      if (placeTarget && ifOverView(shadowDom, placeTarget)) {
        dragShadow && shadowDom.parentElement.removeChild(shadowDom);
        endCallback && endCallback({
          clientX: leftSize,
          clientY: topSize,
          target,
          shadowDom,
          success: false
        });
        return;
      }

      // 移动模式：修改实际目标的位置，移除备份元素
      if (mode === 'move') {
        Object.assign(target.style, {
          left,
          top,
          position: 'absolute',
        });
        dragShadow && shadowDom.parentElement.removeChild(shadowDom);
      }

      endCallback && endCallback({ clientX: leftSize, clientY: topSize, target, shadowDom, success: true });
    }
    if (appendToBody) {
      document.body.appendChild(shadowDom);
    } else {
      target.parentElement.appendChild(shadowDom);
    }
    document.addEventListener('mousemove', dragging);
    document.addEventListener('mouseup', dragEnd);
    startCallback && startCallback({ clientX, clientY, target, shadowDom });
  }

  // 点击事件形式
  if (dom instanceof MouseEvent && dom.type === 'mousedown') {
    dragStart(dom);
    return true;
  }

  // dom形式
  if (dom instanceof HTMLElement) {
    dom.addEventListener('mousedown', dragStart)
    return true;
  }
  return false;
}

export { draggable };
