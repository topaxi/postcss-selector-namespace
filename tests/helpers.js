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

export function unpad([ str ]) {
  let lines = str.split('\n')
  let m = lines[1] !== void 0 && lines[1].match(/^\s+/)

  if (!m) {
    return str
  }

  let spaces = m[0].length

  return lines.map(line => line.slice(spaces)).join('\n').trim()
}
