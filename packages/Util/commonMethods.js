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
 * @param target {Array} 目标对象
 * @param nodeKey {String} node-key属性名
 * @param keyValue {String} node-key默认值
 * @param childrenKey {String} children属性名
 * @param parentKey {String} parent属性名
 * @param allNodes {Array} 树结构展开集合
 * @param setParent {Boolean|Object} 是否设置parent引用
 *
 * @return {Array}  修改后的目标对象
 */
export function setNodeKey({
  target,
  nodeKey = 'node-key',
  keyValue = '',
  childrenKey = 'children',
  parentKey = 'parent',
  allNodes = [],
  setParent = false,
}) {
  if (!Array.isArray(target) || !nodeKey) {
    return target;
  }
  target.forEach((e, index) => {
    allNodes.push(e);
    if (setParent) {
      e[parentKey] = setParent;
    }
    e[nodeKey] = keyValue + index;
    if (Array.isArray(e[childrenKey])) {
      setNodeKey({
        target: e[childrenKey],
        nodeKey,
        keyValue: `${e[nodeKey]}-`,
        childrenKey,
        parentKey,
        allNodes,
        setParent: setParent && e
      });
    }
  });
  return target;
}

/**
 * 过滤树结构：label/code
 * @param filterText {string}   匹配值
 * @param treeData {Array}   code-label数组
 * @param codeKey {string}   code键值
 * @param labelKey {string}  label键值
 * @param childrenKey {string}  child键值
 * @param includeCode {boolean}  是否匹配code
 *
 * @return {Array}   label值
 */
export function treeFilter({
  filterText,
  treeData,
  codeKey = 'code',
  labelKey = 'label',
  childrenKey = 'children',
  includeCode = false
}) {
  if (filterText === '') {
    return JSON.parse(JSON.stringify(treeData));
  }
  const result = [];
  treeData.forEach((e) => {
    const obj = {};
    if (
      e[labelKey].includes(filterText)
            || (includeCode && e[codeKey].includes(filterText))
    ) {
      Object.assign(obj, e, { [childrenKey]: [] });
    }

    if (Array.isArray(e[childrenKey])) {
      const children = treeFilter({
        filterText,
        treeData: e[childrenKey],
        codeKey,
        labelKey,
        childrenKey,
        includeCode
      });
      if (children.length) {
        Object.assign(obj, e, { [childrenKey]: children });
      }
    }

    if (Object.keys(obj).length) {
      result.push(obj);
    }
  });
  return result;
}
