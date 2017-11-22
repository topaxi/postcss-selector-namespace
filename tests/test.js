import path from 'path'
import { transformSnapshot, compareFixture, expectUnchanged } from './helpers'

describe('Basic functionality', () => {
  it('should work', () => {
    compareFixture('basic.css', {
      selfSelector: /:--component/,
      namespace: '.namespaced',
    })
  })

  it('has a default namespace selector of :--namespace', () => {
    transformSnapshot(':--namespace {}', { namespace: '.my-component' })
  })

  it('has a default namespace .self', () => {
    transformSnapshot(':--namespace {}')
  })

  it('works with a regexp which matches multiple selectors', () => {
    compareFixture('multiself.css', {
      selfSelector: /&|:--component/,
      namespace: '.my-component',
    })
  })

  it('works with :--namespace not being the first selector', () => {
    transformSnapshot('.foo :--namespace {}', {
      namespace: '.my-component',
    })
  })

  it('can accept a function for the namespace option', () => {
    transformSnapshot(
      '.foo {}',
      { namespace: file => `.${path.basename(file, '.css')}` },
      { from: 'bar.css' },
    )
  })

  it('does not apply if computed namespace is falsy', () => {
    transformSnapshot('.foo {}', { namespace: file => !!file })
  })
})

describe(':root', () => {
  it('is configurable', () => {
    transformSnapshot(':root .foo {}:global .foo {}', {
      namespace: '.my-component',
      rootSelector: ':global',
    })
  })

  it('does not namespace :root selectors', () => {
    compareFixture('root.css', {
      selfSelector: /:--component/,
      namespace: '.my-component',
    })
  })

  it('does namespace :root selectors if ignoreRoot is false', () => {
    transformSnapshot(':root .foo {}', {
      namespace: '.my-component',
      ignoreRoot: false,
    })
  })

  it('does drop :root if dropRoot is true', () => {
    transformSnapshot(':root .foo {}', {
      namespace: '.my-component',
      dropRoot: false,
    })
  })

  it("does not drop :root if it's the only selector", () => {
    transformSnapshot(':root {}', {
      namespace: '.my-component',
      dropRoot: true,
    })
  })
})

describe('@keyframes', () => {
  it('does not transform keyframe definitions', () => {
    expectUnchanged(
      '@keyframes fadeout { from { opacity: 1 } to { opacity: 0 }}',
      { namespace: '.my-component' },
    )
  })

  it('does not transform vendor prefixed keyframe definitions', () => {
    expectUnchanged(
      '@-moz-keyframes fadeout { from { opacity: 1 } to { opacity: 0 }}',
      { namespace: '.my-component' },
    )
  })
})

describe('@supports', () => {
  it('does namespace in supports atrule', () => {
    transformSnapshot(
      '@supports (display: flex) { .bar { display: flex; } }',
      { namespace: '.my-component' },
    )
  })
})

describe('SCSS', function() {
  const syntax = require('postcss-scss')

  it('does transform basic nesting', () => {
    transformSnapshot(
      `
        & { .bar { color: red; } }
        .foo { color: blue }
      `,
      { selfSelector: '&', namespace: '.my-component' },
    )
  })

  it('does work with single line comments', () => {
    transformSnapshot(
      `
        & { .bar { color: red; } }
        //.foo { color: blue }
      `,
      { selfSelector: '&', namespace: '.my-component' },
      { syntax },
    )
  })

  it('does work with rules nested in nested media queries', () => {
    compareFixture(
      'nested-media-queries.scss',
      { namespace: '.my-component' },
      { syntax },
    )
  })

  it('works with :root selector', () => {
    transformSnapshot(':root { &.bar { color: red; } }', {
      selfSelector: '&',
      namespace: '.my-component',
      dropRoot: true,
    })
  })

  describe('@media nesting', () => {
    it('media with nested around properties', () => {
      transformSnapshot('& { .bar { @media (screen) { color: red; } } }', {
        selfSelector: '&',
        namespace: '.my-component',
      })
    })

    it('media with nested around selector', () => {
      transformSnapshot('& { @media (screen) { .bar { color: red; } } }', {
        selfSelector: '&',
        namespace: '.my-component',
      })
    })

    it('media with nested around namespaced selector', () => {
      transformSnapshot('@media (screen) { & { .bar { color: red; } } }', {
        selfSelector: '&',
        namespace: '.my-component',
      })
    })
  })

  describe('@include mixins', () => {
    it('works with pseudo elements', () => {
      transformSnapshot(
        `
          @mixin do-a-thing-with-pseudo-elements() {
            position: relative;
            &::before {
              content: '';
            }
          }
          .some-class {
            @include do-a-thing-with-pseudo-elements();
          }
        `,
        { selfSelector: '&', namespace: '.my-component' },
      )
    })
  })

  describe('@for', () => {
    it('does work with @for and nested @for rules', () => {
      compareFixture(
        'for.scss',
        { namespace: '.my-component', selfSelector: '&' },
        { syntax },
      )
    })
  })
})
