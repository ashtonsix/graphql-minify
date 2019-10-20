const fs = require('fs')
const path = require('path')
const {
  getUniqueNamesFromIntrospection,
  getUniqueNamesFromGQL,
  minifyQuery,
  expandQuery
} = require('./index')

const readJSON = path => JSON.parse(fs.readFileSync(path, 'utf8'))
const artsySchema = readJSON('./fixtures/artsy.json')
const countriesSchema = readJSON('./fixtures/countries.json')
const swapiSchema = readJSON('./fixtures/swapi.json')

const readAll = paths => paths.map(p => fs.readFileSync(p, 'utf8'))
const artsyQueries = readAll([
  './fixtures/artsy0.gql',
  './fixtures/artsy1.gql',
  './fixtures/artsy2.gql',
  './fixtures/artsy3.gql'
])
const countriesQueries = readAll([
  './fixtures/countries0.gql',
  './fixtures/countries1.gql'
])
const swapiQueries = readAll([
  './fixtures/swapi0.gql',
  './fixtures/swapi1.gql',
  './fixtures/swapi2.gql',
  './fixtures/swapi3.gql',
  './fixtures/swapi4.gql',
  './fixtures/swapi5.gql',
  './fixtures/swapi6.gql',
  './fixtures/swapi7.gql'
])

const artsyUniqueNames = getUniqueNamesFromIntrospection(artsySchema)
const countriesUniqueNames = getUniqueNamesFromIntrospection(countriesSchema)
const swapiUniqueNames = getUniqueNamesFromIntrospection(swapiSchema)

test('does not crash', () => {
  artsyQueries.forEach(query => {
    expandQuery(minifyQuery(query, artsyUniqueNames), artsyUniqueNames)
  })

  countriesQueries.forEach(query => {
    expandQuery(minifyQuery(query, countriesUniqueNames), countriesUniqueNames)
  })

  swapiQueries.forEach(query => {
    expandQuery(minifyQuery(query, swapiUniqueNames), swapiUniqueNames)
  })
})

test('makes queries smaller', () => {
  const query = artsyQueries[0]
  const minified = minifyQuery(query, artsyUniqueNames)
  expect(minified.length).toBeLessThan(query.length)
})

test('restores queries to their original state', () => {
  const withoutSpaces = s => s.replace(/\s/g, '')
  const query = artsyQueries[0]
  const aun = artsyUniqueNames
  const restored = expandQuery(minifyQuery(query, aun), aun)
  expect(withoutSpaces(query)).toEqual(withoutSpaces(restored))
})
