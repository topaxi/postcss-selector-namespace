/**
 * Returns true if the rule selectors can be namespaces
 *
 * @param {postcss.Rule} rule The rule to check
 * @return {boolean} whether the rule selectors can be namespaced or not
 */
const canNamespaceSelectors = (rule) => {
  return hasParentRule(rule) || parentIsAllowedAtRule(rule)
}

/**
 * Returns true if any parent rule is of type 'rule'
 *
 * @param {postcss.Rule|postcss.Root|postcss.AtRule} rule The rule to check
 * @return {boolean} true if any parent rule is of type 'rule' else false
 */
const hasParentRule = (rule) => {
  if (!rule.parent) {
    return false
  }

  if (rule.parent.type === 'rule') {
    return true
  }

  return hasParentRule(rule.parent)
}

/**
 * Returns true if the parent rule is a not a media or supports atrule
 *
 * @param {postcss.Rule} rule The rule to check
 * @return {boolean} true if the direct parent is a keyframe rule
 */
const parentIsAllowedAtRule = (rule) => {
  return (
    rule.parent &&
    rule.parent.type === 'atrule' &&
    !/(?:media|supports|for)$/.test(rule.parent.name)
  )
}

/**
 * Newer javascript engines allow setting flags when passing existing regexp
 * to the RegExp constructor, until then, we extract the regexp source and
 * build a new object.
 *
 * @param {RegExp|string} regexp The regexp to modify
 * @return {RegExp} The new regexp instance
 */
const regexpToGlobalRegexp = (regexp) => {
  let source = regexp instanceof RegExp ? regexp.source : regexp

  return new RegExp(source, 'g')
}

module.exports = (options = {}) => {
  let {
    namespace = '.self',
    selfSelector = /:--namespace/,
    rootSelector = /:root/,
    ignoreRoot = true,
    dropRoot = true,
  } = options

  selfSelector = regexpToGlobalRegexp(selfSelector)

  const namespaceSelector = (selector, computedNamespace) => {
    if (hasSelfSelector(selector)) {
      return computedNamespace.split(',').map(namespace => selector.replace(selfSelector, namespace)).join(',');
    }

    if (hasRootSelector(selector)) {
      return dropRootSelector(selector)
    }

    return computedNamespace.split(',').map(namespace => `${namespace} ${selector}`).join(',');
  }

  const hasSelfSelector = (selector) => {
    selfSelector.lastIndex = 0

    return selfSelector.test(selector)
  }

  const hasRootSelector = (selector) => {
    return ignoreRoot && selector.search(rootSelector) === 0
  }

  const dropRootSelector = (selector) => {
    if (dropRoot) {
      return selector.replace(rootSelector, '').trim() || selector
    }

    return selector
  }

  return {
    postcssPlugin: 'postcss-selector-namespaces',
    Once (root, { result }) {
      const computedNamespace =
        typeof namespace === 'string'
          ? namespace
          : namespace(root.source.input.file)

      if (!computedNamespace) {
        return
      }

      root.walkRules(rule => {
        if (canNamespaceSelectors(rule)) {
          return
        }

        rule.selectors = rule.selectors.map(selector =>
          namespaceSelector(selector, computedNamespace),
        )
      })
    }
  }
}

module.exports.postcss = true
