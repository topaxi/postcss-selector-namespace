import fs                       from 'fs'
import { expect }               from 'chai'
import postcss                  from 'postcss'
import postcssSelectorNamespace from '../lib/plugin'

export function transform(input, options = {}, postcssOptions = {}) {
  return postcss()
    .use(postcssSelectorNamespace(options))
    .process(input, postcssOptions)
}

export function compareFixture(name, options, postcssOptions) {
  let { css } = transform(
    fs.readFileSync(`${__dirname}/fixtures/${name}`),
    options,
    postcssOptions
  )

  let expected = fs.readFileSync(`${__dirname}/expected/${name}`)

  expect(String(css)).to.equal(String(expected))
}

export function expectUnchanged(input, options, postcssOptions) {
  let { css } = transform(input, options, postcssOptions)

  expect(String(css)).to.equal(input)
}

describe('Basic functionality', () => {
  it('should work', () => {
    compareFixture('basic.css', {
      selfSelector: /:--component/,
      namespace: '.namespaced'
    })
  })

  it('has a default namespace selector of :--namespace', () => {
    let { css } = transform(
      ':--namespace {}',
      { namespace: '.my-component' }
    )

    expect(String(css)).to.equal('.my-component {}')
  })

  it('works with a regexp which matches multiple selectors', () => {
    compareFixture('multiself.css', {
      selfSelector: /&|:--component/,
      namespace: '.my-component'
    })
  })

  it('works with :--namespace not being the first selector', () => {
    let { css } = transform(
      '.foo :--namespace {}',
      { namespace: '.my-component' }
    )

    expect(String(css)).to.equal('.foo .my-component {}')
  })
})

describe(':root', () => {
  it('is configurable', () => {
    let { css } = transform(
      ':root .foo {}:global .foo {}',
      { namespace: '.my-component', rootSelector: ':global' }
    )

    expect(String(css)).to.equal('.my-component :root .foo {}.foo {}')
  })

  it('does not namespace :root selectors', () => {
    compareFixture('root.css', {
      selfSelector: /:--component/,
      namespace: '.my-component'
    })
  })

  it('does namespace :root selectors if ignoreRoot is false', () => {
    let { css } = transform(
      ':root .foo {}',
      { namespace: '.my-component', ignoreRoot: false }
    )

    expect(String(css)).to.equal('.my-component :root .foo {}')
  })

  it('does drop :root if dropRoot is true', () => {
    let { css } = transform(
      ':root .foo {}',
      { namespace: '.my-component', dropRoot: false }
    )

    expect(String(css)).to.equal(':root .foo {}')
  })

  it('does not drop :root if it\'s the only selector', () => {
    let { css } = transform(
      ':root {}',
      { namespace: '.my-component', dropRoot: true }
    )

    expect(String(css)).to.equal(':root {}')
  })
})

describe('@keyframes', () => {
  it('does not transform keyframe definitions', () => {
    expectUnchanged(
      '@keyframes fadeout { from { opacity: 1 } to { opacity: 0 }}',
      { namespace: '.my-component' }
    )
  })

  it('does not transform vendor prefixed keyframe definitions', () => {
    expectUnchanged(
      '@-moz-keyframes fadeout { from { opacity: 1 } to { opacity: 0 }}',
      { namespace: '.my-component' }
    )
  })
})

describe('@supports', () => {
  it('does namespace in supports atrule', () => {
    let { css } = transform(
      '@supports (display: flex) { .bar { display: flex; } }',
      { namespace: '.my-component' }
    )

    expect(String(css)).to.equal(
      '@supports (display: flex) { .my-component .bar { display: flex; } }'
    )
  })
})

describe('SCSS', function() {
  const syntax = require('postcss-scss')

  it('does transform basic nesting', () => {
    let { css } = transform(
      '& { .bar { color: red; } }\n' +
      '.foo { color: blue }',
      { selfSelector: '&', namespace: '.my-component' }
    )

    expect(String(css)).to.equal(
      '.my-component { .bar { color: red; } }\n' +
      '.my-component .foo { color: blue }'
    )
  })

  it('does work with single line comments', () => {
    let { css } = transform(
      '& { .bar { color: red; } }\n' +
      '//.foo { color: blue }',
      { selfSelector: '&', namespace: '.my-component' },
      { syntax }
    )

    expect(String(css)).to.equal(
      '.my-component { .bar { color: red; } }\n' +
      '//.foo { color: blue }'
    )
  })

  it('does work with rules nested in nested media queries', () => {
    compareFixture('nested-media-queries.scss',
      { namespace: '.my-component' },
      { syntax }
    )
  })

  it('works with :root selector', () => {
    let { css } = transform(
      ':root { &.bar { color: red; } }',
      { selfSelector: '&', namespace: '.my-component', dropRoot: true }
    )

    expect(String(css)).to.equal(':root { &.bar { color: red; } }')
  })

  describe('@media nesting', () => {
    it('media with nested around properties', () => {
      let { css } = transform(
        '& { .bar { @media (screen) { color: red; } } }',
        { selfSelector: '&', namespace: '.my-component' }
      )

      expect(String(css)).to.equal(
        '.my-component { .bar { @media (screen) { color: red; } } }'
      )
    })

    it('media with nested around selector', () => {
      let { css } = transform(
        '& { @media (screen) { .bar { color: red; } } }',
        { selfSelector: '&', namespace: '.my-component' }
      )

      expect(String(css)).to.equal(
        '.my-component { @media (screen) { .bar { color: red; } } }'
      )
    })

    it('media with nested around namespaced selector', () => {
      let { css } = transform(
        '@media (screen) { & { .bar { color: red; } } }',
        { selfSelector: '&', namespace: '.my-component' }
      )

      expect(String(css)).to.equal(
        '@media (screen) { .my-component { .bar { color: red; } } }'
      )
    })
  })

  describe('@include mixins', () => {
    it('works with pseudo elements', () => {
      let { css } = transform(
        '@mixin do-a-thing-with-pseudo-elements() {\n' +
        '  position: relative;\n' +
        '  &::before {\n' +
        '    content: \'\';\n' +
        '  }\n' +
        '}\n' +
        '.some-class {\n' +
        '  @include do-a-thing-with-pseudo-elements();\n' +
        '}\n',
        { selfSelector: '&', namespace: '.my-component' }
      )

      expect(String(css)).to.equal(
        '@mixin do-a-thing-with-pseudo-elements() {\n' +
        '  position: relative;\n' +
        '  &::before {\n' +
        '    content: \'\';\n' +
        '  }\n' +
        '}\n' +
        '.my-component .some-class {\n' +
        '  @include do-a-thing-with-pseudo-elements();\n' +
        '}\n',
      )
    })

    describe('@for', () => {
      it('does work with rules nested in nested media queries', () => {
        compareFixture('for.scss',
          { namespace: '.my-component', selfSelector: '&' },
          { syntax }
        )
      })
    })
  })
})
