import postcss from 'postcss'

module.exports = postcss.plugin('postcss-selector-namespace', (options = {}) => {
  let {
    namespace    = '.self',
    selfSelector = /:--namespace/,
    rootSelector = /:root/,
    ignoreRoot   = true
  } = options

  selfSelector = regexpToGlobalRegexp(selfSelector)

  return (css, result) => {
    css.walkRules(rule => {
      rule.selectors = rule.selectors.map(selector => {
        selfSelector.lastIndex = 0
        if (selfSelector.test(selector)) {
          return selector.replace(selfSelector, namespace)
        }

        if (ignoreRoot && selector.search(rootSelector) === 0) {
          return selector
        }

        return `${namespace} ${selector}`
      })
    })
  }
})

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
