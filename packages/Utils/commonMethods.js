/**
 * 通用对象合并（内容浅拷贝，如需深拷贝，可自行拷贝后入参）
 * @param target {any} 目标对象
 * @param source {any} 合并源数据
 * @param fullMerge {boolean} 是否完全合并。否：只合并target中存在的属性
 * @param preferredValue {string} 合并属性相同（冲突）时，使用target值还是source值
 * @param objectList {Array} 已合并内容，防止重复引用
 *
 * @return {any}  修改目标对象并返回
 */
export function commonMerge(
  target,
  source,
  fullMerge = true,
  preferredValue = 'source',
  objectList = []
) {
  const type1 = Object.prototype.toString.call(source);
  const type2 = Object.prototype.toString.call(target);
  if (type1 === '[object Object]') {
    if (type2 !== type1) {
      if (type2 !== '[object Undefined]' && preferredValue === 'target') {
        return target;
      }
      return source;
    }
    let keys = [];
    if (fullMerge) {
      keys = Object.keys(source);
    } else {
      Object.keys(source).forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(target, key)) {
          keys.push(key);
        }
      });
    }

    objectList.push(target);
    keys.forEach((key) => {
      if (objectList.find(e => e === target[key])) {
        throw new Error('Repeated reference');
      }
      target[key] = commonMerge(
        target[key],
        source[key],
        fullMerge,
        preferredValue,
        objectList
      );
    });
    return target;
  } else if (type2 !== '[object Undefined]' && preferredValue === 'target') {
    return target;
  } else {
    return source;
  }
}

/**
 * 设置树结构数据的node-key
 *
 */
export function setNodeKey(
  target,
  key = 'node-key',
  keyValue = '',
  children = 'children',
  allNodes = [],
  isLeaf = 'leaf',
) {
  if (!Array.isArray(target) || !key) {
    return target;
  }
  target.forEach((e, index) => {
    allNodes.push(e);
    e[key] = keyValue + index;
    if (Array.isArray(e[children])) {
      e[isLeaf] = !e[children].length;
      setNodeKey(e[children], key, `${e[key]}-`, children, allNodes);
    } else {
      e[isLeaf] = true;
    }
  });
  return target;
}

export const loadMore = {
  inserted(el, binding, vnode) {
    const selectWrap = el.querySelector('.el-table__body-wrapper');
    selectWrap.addEventListener('scroll', function () {
      const scrollDistance = this.scrollHeight - this.scrollTop - this.clientHeight;
      if (scrollDistance <= 0 && vnode.context.isShow) {
        vnode.context.isShow = false;
        binding.value();
      }
    });
  },
}
