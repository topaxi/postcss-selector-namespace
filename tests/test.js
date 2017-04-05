import path       from 'path'
import { expect } from 'chai'
import {
  unpad,
  transform,
  compareFixture,
  expectUnchanged
} from './helpers'

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

  it('can accept a function for the namespace option', () => {
    let { css } = transform(
      '.foo {}',
      { namespace: file => `.${path.basename(file, '.css')}` },
      { from: 'bar.css' }
    )
    expect(String(css)).to.equal('.bar .foo {}')
  })

  it('does not apply if computed namespace is falsy', () => {
    let { css } = transform(
      '.foo {}',
      { namespace: file => !!file }
    )
    expect(String(css)).to.equal('.foo {}')
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
      unpad`
        & { .bar { color: red; } }
        .foo { color: blue }
      `,
      { selfSelector: '&', namespace: '.my-component' }
    )

    expect(String(css)).to.equal(unpad`
      .my-component { .bar { color: red; } }
      .my-component .foo { color: blue }
    `)
  })

  it('does work with single line comments', () => {
    let { css } = transform(
      unpad`
        & { .bar { color: red; } }
        //.foo { color: blue }
      `,
      { selfSelector: '&', namespace: '.my-component' },
      { syntax }
    )

    expect(String(css)).to.equal(unpad`
      .my-component { .bar { color: red; } }
      //.foo { color: blue }
    `)
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
        unpad`
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
        { selfSelector: '&', namespace: '.my-component' }
      )

      expect(String(css)).to.equal(unpad`
        @mixin do-a-thing-with-pseudo-elements() {
          position: relative;
          &::before {
            content: '';
          }
        }
        .my-component .some-class {
          @include do-a-thing-with-pseudo-elements();
        }
      `)
    })
  })

  describe('@for', () => {
    it('does work with @for and nested @for rules', () => {
      compareFixture('for.scss',
        { namespace: '.my-component', selfSelector: '&' },
        { syntax }
      )
    })
  })
})
