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

## Options

### `namespace`

(default: `'.self'`)

The selector to prepend to each selector.

### `selfSelector`

(default: `:--namespace`)

The selector to use to apply rules directly to your namespace selector.

---

## [License](LICENSE)
