import fs                       from 'fs'
import { expect }               from 'chai'
import postcss                  from 'postcss'
import postcssSelectorNamespace from '../lib/plugin'

export function transform(input, options = {}, postcssOptions = {}) {
  return postcss()
    .use(postcssSelectorNamespace(options))
    .process(input, postcssOptions)
}

describe('Basic functionality', () => {
  it('should work', () => {
    let { css } = transform(
      fs.readFileSync(`${__dirname}/fixtures/basic.css`),
      { selfSelector: /:--component/, namespace: '.namespaced' }
    )

    let expected = fs.readFileSync(`${__dirname}/expected/basic.css`)

    expect(String(css)).to.equal(String(expected))
  })

  it('has a default namespace selector of :--namespace', () => {
    let { css } = transform(
      ':--namespace {}',
      { namespace: '.my-component' }
    )

    expect(String(css)).to.equal(String('.my-component {}'))
  })

  it('works with a regexp which matches multiple selectors', () => {
    let { css } = transform(
      fs.readFileSync(`${__dirname}/fixtures/multiself.css`),
      { selfSelector: /&|:--component/, namespace: '.my-component' }
    )

    let expected = fs.readFileSync(`${__dirname}/expected/multiself.css`)

    expect(String(css)).to.equal(String(expected))
  })
})

describe(':root', () => {
  it('is configurable', () => {
    let { css } = transform(
      ':root .foo {}:global .foo {}',
      { namespace: '.my-component', rootSelector: ':global' }
    )

    expect(String(css)).to.equal(String('.my-component :root .foo {}.foo {}'))
  })

  it('does not namespace :root selectors', () => {
    let { css } = transform(
      fs.readFileSync(`${__dirname}/fixtures/root.css`),
      { selfSelector: /:--component/, namespace: '.my-component' }
    )

    let expected = fs.readFileSync(`${__dirname}/expected/root.css`)

    expect(String(css)).to.equal(String(expected))
  })

  it('does namespace :root selectors if ignoreRoot is false', () => {
    let { css } = transform(
      ':root .foo {}',
      { namespace: '.my-component', ignoreRoot: false }
    )

    expect(String(css)).to.equal(String('.my-component :root .foo {}'))
  })

  it('does drop :root if dropRoot is true', () => {
    let { css } = transform(
      ':root .foo {}',
      { namespace: '.my-component', dropRoot: false }
    )

    expect(String(css)).to.equal(String(':root .foo {}'))
  })
})

describe('SCSS', function() {
  const syntax = require('postcss-scss')

  it('does transform basic nesting', () => {
    let { css } = transform(
      ':--namespace { .bar { color: red; } }\n' +
      '.foo { color: blue }',
      { namespace: '.my-component' }
    )

    expect(String(css)).to.equal(
      String('.my-component { .bar { color: red; } }\n' +
             '.my-component .foo { color: blue }')
    )
  })

  it('does work with single line comments', () => {
    let { css } = transform(
      ':--namespace { .bar { color: red; } }\n' +
      '//.foo { color: blue }',
      { namespace: '.my-component' },
      { syntax }
    )

    expect(String(css)).to.equal(
      String('.my-component { .bar { color: red; } }\n' +
             '//.foo { color: blue }')
    )
  })

  it('does work with rules nested in nested media queries', () => {
    let { css } = transform(`
      $break-small: 320px;
      $break-large: 1200px;

      :--namespace {
        float: left;
        width: 250px;
        h1 {
          font-weight: bold;
        }
        @media screen and (max-width: $break-small) {
          width: 100px;
          float: none;
          h1 {
            font-size: 32px;
          }
        }
        @media screen and (min-width: $break-large) {
          float: right;
          h1 {
            font-size: 48px;
          }
        }
      }`,
      { namespace: '.my-component' },
      { syntax }
    )

    expect(String(css)).to.equal(`
      $break-small: 320px;
      $break-large: 1200px;

      .my-component {
        float: left;
        width: 250px;
        h1 {
          font-weight: bold;
        }
        @media screen and (max-width: $break-small) {
          width: 100px;
          float: none;
          h1 {
            font-size: 32px;
          }
        }
        @media screen and (min-width: $break-large) {
          float: right;
          h1 {
            font-size: 48px;
          }
        }
      }`)
  })
})
