import fs from 'fs'
import chai, { expect } from 'chai'
import chaiJestSnapshot from 'chai-jest-snapshot'
import postcss from 'postcss'
import postcssSelectorNamespace from '../lib/plugin'

chai.use(chaiJestSnapshot)

before(() => chaiJestSnapshot.resetSnapshotRegistry())
beforeEach(function() {
  chaiJestSnapshot.configureUsingMochaContext(this)
})

export function transform(input, options, postcssOptions = {}) {
  return postcss()
    .use(postcssSelectorNamespace(options))
    .process(input, postcssOptions)
}

export function transformSnapshot(
  input,
  options,
  postcssOptions = {},
  update = false,
) {
  let res = transform(input, options, postcssOptions)

  expect(res.css).to.matchSnapshot(update)

  return res
}

export function compareFixture(name, options, postcssOptions, update = false) {
  let { css } = transform(
    fs.readFileSync(`${__dirname}/fixtures/${name}`),
    options,
    postcssOptions,
  )

  expect(css).to.matchSnapshot(update)
}

export function expectUnchanged(input, options, postcssOptions) {
  let { css } = transform(input, options, postcssOptions)

  expect(String(css)).to.equal(input)
}
