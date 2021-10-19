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
  children = 'children'
) {
  if (!Array.isArray(target) || !key) {
    return target;
  }
  target.forEach((e, index) => {
    e[key] = keyValue + index;
    if (Array.isArray(e[children])) {
      setNodeKey(e[children], key, `${e[key]}-`, children);
    }
  });
  return target;
}

/**
 * 格式化：code转label
 * @param matchCode {string}   code值
 * @param treeData {Array}   code-label数组
 * @param treeCode {string}   code键值
 * @param treeLabel {string}  label键值
 *
 * @return {string}   label值
 */
export function treeFormatter(
  matchCode,
  treeData,
  treeCode = 'code',
  treeLabel = 'label'
) {
  let target = '';
  treeData.forEach((item) => {
    if (item[treeCode] === matchCode) {
      target = item[treeLabel];
    } else if (item.children) {
      target = treeFormatter(matchCode, item.children, treeCode, treeLabel) || target;
    }
  });
  return target;
}

/**
 * 过滤树结构：label/code
 * @param filterText {string}   匹配值
 * @param treeData {Array}   code-label数组
 * @param treeCode {string}   code键值
 * @param treeLabel {string}  label键值
 * @param treeChildren {string}  child键值
 * @param includeCode {boolean}  是否匹配code
 *
 * @return {Array}   label值
 */
export function treeFilter({
  filterText,
  treeData,
  treeCode = 'code',
  treeLabel = 'label',
  treeChildren = 'children',
  includeCode = false
}) {
  if (filterText === '') {
    return JSON.parse(JSON.stringify(treeData));
  }
  const result = [];
  treeData.forEach((e) => {
    const obj = {};
    if (
      e[treeLabel].includes(filterText)
            || (includeCode && e[treeCode].includes(filterText))
    ) {
      Object.assign(obj, e, { [treeChildren]: [] });
    }

    if (Array.isArray(e[treeChildren])) {
      const children = treeFilter({
        filterText,
        treeData: e[treeChildren],
        treeCode,
        treeLabel,
        treeChildren,
        includeCode
      });
      if (children.length) {
        Object.assign(obj, e, { [treeChildren]: children });
      }
    }

    if (Object.keys(obj).length) {
      result.push(obj);
    }
  });
  return result;
}
