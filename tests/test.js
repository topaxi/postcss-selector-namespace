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

  it('works with a regexp which matches multiple selectors', () => {
    let { css } = transform(
      fs.readFileSync(`${__dirname}/fixtures/multiself.css`),
      { selfSelector: /&|:--component/, namespace: '.my-component' }
    )

    let expected = fs.readFileSync(`${__dirname}/expected/multiself.css`)

    expect(String(css)).to.equal(String(expected))
  })
})
