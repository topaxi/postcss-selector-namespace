import postcss from 'postcss'
import parser  from 'postcss-selector-parser'

module.exports = postcss.plugin('postcss-selector-namespace', (options = {}) => {
  let {
    namespace    = '.self',
    selfSelector = /:--namespace/,
    rootSelector = /:root/,
    ignoreRoot   = true,
    dropRoot     = true,
	addNameSpaceToHtml = false
  } = options

  selfSelector = regexpToGlobalRegexp(selfSelector)

  return (css, result) => {
    const computedNamespace = typeof namespace === 'string' ?
      namespace :
      namespace(css.source.input.file)

    if (!computedNamespace) {
      return
    }

    css.walkRules(rule => {
      if (canNamespaceSelectors(rule)) {
        return
      }

		rule.selectors = rule.selectors.map(selector => {
			if(addNameSpaceToHtml) {
				let hasHtml = false;

				const htmltString = parser((pSelectors) => {
					pSelectors.walk((pSelector) => {

						if(pSelector.value === undefined) return;
						
						if (pSelector.type === 'tag' && pSelector.value === 'html') {
							
							hasHtml = true;							
							pSelector.replaceWith(`${pSelector.value}${computedNamespace}`)
			
							return true;
						}
					});
				}).process(selector).result
				

				if(hasHtml) return htmltString;
			}
			
			return namespaceSelector(selector, computedNamespace)
		})
    })
  }

  function namespaceSelector(selector, computedNamespace) {
    if (hasSelfSelector(selector)) {
      return selector.replace(selfSelector, computedNamespace)
    }

    if (hasRootSelector(selector)) {
      return dropRootSelector(selector)
    }

    return `${computedNamespace} ${selector}`
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
 * Returns true if the rule selectors can be namespaces
 *
 * @param {Rule} rule The rule to check
 * @return {boolean} whether the rule selectors can be namespaced or not
 */
function canNamespaceSelectors(rule) {
  return (hasParentRule(rule) || parentIsAllowedAtRule(rule))
}

/**
 * Returns true if the parent rule is a not a media or supports atrule
 *
 * @param {Rule} rule The rule to check
 * @return {boolean} true if the direct parent is a keyframe rule
 */
function parentIsAllowedAtRule(rule) {
  return rule.parent &&
    rule.parent.type === 'atrule' &&
    !/(?:media|supports|for)$/.test(rule.parent.name)
}

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
