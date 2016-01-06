import postcss from 'postcss'

export default postcss.plugin('postcss-selector-namespace', (options = {}) => {
  let {
    namespace    = '.self',
    selfSelector = /:--namespace/
  } = options

  selfSelector = new RegExp(options.selfSelector, 'g')

  return (css, result) => {
    css.walkRules(rule => {
      rule.selectors = rule.selectors.map(selector => {
        if (selfSelector.test(selector)) {
          return selector.replace(selfSelector, namespace)
        }

        return `${namespace} selector`
      })
    })
  }
})
