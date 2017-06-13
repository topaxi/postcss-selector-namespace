'use strict';

var _postcss = require('postcss');

var _postcss2 = _interopRequireDefault(_postcss);

var _postcssSelectorParser = require('postcss-selector-parser');

var _postcssSelectorParser2 = _interopRequireDefault(_postcssSelectorParser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = _postcss2.default.plugin('postcss-selector-namespace', function () {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var _options$namespace = options.namespace,
      namespace = _options$namespace === undefined ? '.self' : _options$namespace,
      _options$selfSelector = options.selfSelector,
      selfSelector = _options$selfSelector === undefined ? /:--namespace/ : _options$selfSelector,
      _options$rootSelector = options.rootSelector,
      rootSelector = _options$rootSelector === undefined ? /:root/ : _options$rootSelector,
      _options$ignoreRoot = options.ignoreRoot,
      ignoreRoot = _options$ignoreRoot === undefined ? true : _options$ignoreRoot,
      _options$dropRoot = options.dropRoot,
      dropRoot = _options$dropRoot === undefined ? true : _options$dropRoot,
      _options$processHtmlT = options.processHtmlTagSpecifically,
      processHtmlTagSpecifically = _options$processHtmlT === undefined ? false : _options$processHtmlT;


  selfSelector = regexpToGlobalRegexp(selfSelector);

  return function (css, result) {
    var computedNamespace = typeof namespace === 'string' ? namespace : namespace(css.source.input.file);

    if (!computedNamespace) {
      return;
    }

    css.walkRules(function (rule) {
      if (canNamespaceSelectors(rule)) {
        return;
      }

      rule.selectors = rule.selectors.map(function (selector) {
        if (processHtmlTagSpecifically) {
          var hasHtml = false;
          var htmltString = '';
          (0, _postcssSelectorParser2.default)(function (pSelectors) {
            pSelectors.walk(function (pSelector) {
              if (pSelector.value === undefined) return;

              if (pSelector.type === 'tag' && pSelector.value === 'html') {
                hasHtml = true;
                htmltString += '' + pSelector.value + computedNamespace;

                return true;
              }

              htmltString += pSelector.value;
            });
          }).process(selector).result;

          if (hasHtml) return htmltString;
        }

        return namespaceSelector(selector, computedNamespace);
      });
    });
  };

  function namespaceSelector(selector, computedNamespace) {
    if (hasSelfSelector(selector)) {
      return selector.replace(selfSelector, computedNamespace);
    }

    if (hasRootSelector(selector)) {
      return dropRootSelector(selector);
    }

    return computedNamespace + ' ' + selector;
  }

  function hasSelfSelector(selector) {
    selfSelector.lastIndex = 0;

    return selfSelector.test(selector);
  }

  function hasRootSelector(selector) {
    return ignoreRoot && selector.search(rootSelector) === 0;
  }

  function dropRootSelector(selector) {
    if (dropRoot) {
      return selector.replace(rootSelector, '').trim() || selector;
    }

    return selector;
  }
}

/**
 * Returns true if the rule selectors can be namespaces
 *
 * @param {Rule} rule The rule to check
 * @return {boolean} whether the rule selectors can be namespaced or not
 */
);function canNamespaceSelectors(rule) {
  return hasParentRule(rule) || parentIsAllowedAtRule(rule);
}

/**
 * Returns true if the parent rule is a not a media or supports atrule
 *
 * @param {Rule} rule The rule to check
 * @return {boolean} true if the direct parent is a keyframe rule
 */
function parentIsAllowedAtRule(rule) {
  return rule.parent && rule.parent.type === 'atrule' && !/(?:media|supports|for)$/.test(rule.parent.name);
}

/**
 * Returns true if any parent rule is of type 'rule'
 *
 * @param {Rule} rule The rule to check
 * @return {boolean} true if any parent rule is of type 'rule' else false
 */
function hasParentRule(rule) {
  if (!rule.parent) {
    return false;
  }

  if (rule.parent.type === 'rule') {
    return true;
  }

  return hasParentRule(rule.parent);
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
  var source = regexp instanceof RegExp ? regexp.source : regexp;

  return new RegExp(source, 'g');
}