# postcss-selector-namespace [![Build Status](https://travis-ci.org/topaxi/postcss-selector-namespace.svg?branch=master)](https://travis-ci.org/topaxi/postcss-selector-namespace)

# Installation

```bash
$ npm install postcss-selector-namespace
```

## Usage

```javascript
var postcss = require('postcss')
var selectorNamespace = require('postcss-selector-namespace')

var output = postcss()
  .use(selectorNamespace({ selfSelector: ':--component', namespace: 'my-component' }))
  .process(require('fs').readFileSync('input.css', 'utf8'))
  .css
```

`input.css`
```css
:--component {
  color: black;
}

:--component.danger {
  color: red;
}

h1, .h1 {
  font-weight: bold;
}
```

will output the following css:

```css
.my-component {
  color: black;
}

.my-component.danger {
  color: red;
}

.my-component h1, .my-component .h1 {
  font-weight: bold;
}
```

Prepending [`:root`](https://developer.mozilla.org/en-US/docs/Web/CSS/:root) to a selector prevents the selector from being namespaced:

```css
:root h1 {
  font-weight: bold;
}
```

will output the selector without any namespace:

```css
h1 {
  font-weight: bold;
}
```

## SCSS support

This plugin can also be process scss files and output scss again using the
[`postcss-scss`](https://github.com/postcss/postcss-scss) module.

```js
var postcss = require('postcss')
var postscss = require('postcss-scss')
var selectorNamespace = require('postcss-selector-namespace')

var output = postcss()
  .use(selectorNamespace({ selfSelector: '&', namespace: 'my-component' }))
  .process(require('fs').readFileSync('input.css', 'utf8'), { syntax: postscss })
  .css
```

```scss
$break = 320px;

& {
  float: left;
  width: 250px;
  h1 {
    font-weight: bold;
    font-size: 32px;
  }
  @media screen and (max-width: $break-small) {
    width: 100px;
    float: none;
    h1 {
      font-size: 24px;
    }
  }
}
```

outputs:

```scss
$break = 320px;

.my-component {
  float: left;
  width: 250px;
  h1 {
    font-weight: bold;
    font-size: 32px;
  }
  @media screen and (max-width: $break-small) {
    width: 100px;
    float: none;
    h1 {
      font-size: 24px;
    }
  }
}
```

## Options

### `namespace`

(default: `'.self'`)

The selector to prepend to each selector.

### `selfSelector`

(default: `:--namespace`)

The selector to use to apply rules directly to your namespace selector.

### `ignoreRoot`

(default: `true`)

Selector won't be namespaced if they start with the `:root` pseudo-class.

### `rootSelector`

(default: `:root`)

If prefixed with this selector, selectors won't be namespaced.

### `dropRoot`

(default: `true`)

If `true`, the `rootSelector` will be stripped from the output.

---

## [License](LICENSE)
