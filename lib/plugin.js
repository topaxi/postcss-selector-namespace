import postcss from 'postcss'

module.exports = postcss.plugin('postcss-selector-namespace', (options = {}) => {
  let {
    namespace    = '.self',
    selfSelector = /:--namespace/,
    rootSelector = /:root/,
    ignoreRoot   = true,
    dropRoot     = true
  } = options

  selfSelector = regexpToGlobalRegexp(selfSelector)

  return (css, result) => {
    css.walkRules(rule => {
      if (hasParentRule(rule)) {
        return
      }

      rule.selectors = rule.selectors.map(namespaceSelector)
    })
  }

  function namespaceSelector(selector) {
    if (hasSelfSelector(selector)) {
      return selector.replace(selfSelector, namespace)
    }

    if (hasRootSelector(selector)) {
      return dropRootSelector(selector)
    }

    return `${namespace} ${selector}`
  }

  function hasSelfSelector(selector) {
    selfSelector.lastIndex = 0
    return selfSelector.test(selector)
  }

  function hasRootSelector(selector) {
    return ignoreRoot && selector.search(rootSelector) === 0
  }

  function dropRootSelector(selector) {
    if (dropRoot) {
      return selector.replace(rootSelector, '').trim() || selector
    }

    return selector
  }
})

/**
 * Returns true if any parent rule is of type 'rule'
 *
 * @param {Rule} rule The rule to check
 * @return {boolean} true if any parent rule is of type 'rule' else false
 */
function hasParentRule(rule) {
  if (!rule.parent) {
    return false
  }

  if (rule.parent.type === 'rule') {
    return true
  }

  return hasParentRule(rule.parent)
}

/**
 * Newer javascript engines allow setting flags when passing existing regexp
 * to the RegExp constructor, until then, we extract the regexp source and
 * build a new object.
 *
 * @param {RegExp|string} regexp The regexp to modify
 * @return {RegExp} The new regexp instance
 */
function regexpToGlobalRegexp(regexp) {
  let source = regexp instanceof RegExp ? regexp.source : regexp
  return new RegExp(source, 'g')
}
