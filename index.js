const {Source} = require('graphql/language/source')
const {createLexer} = require('graphql/language/lexer')

const standardUniqueNames = [
  'query',
  'mutation',
  'subscription',
  'fragment',
  'on',
  'true',
  'false'
]

const getUniqueNamesFromIntrospection = schema => {
  if (schema.data) schema = schema.data.__schema
  const allNames = standardUniqueNames.slice()
  schema.directives.forEach(d => {
    allNames.push(d.name)
    d.args.forEach(da => allNames.push(da.name))
  })
  schema.types.forEach(t => {
    allNames.push(t.name)
    if (t.enumValues) {
      t.enumValues.forEach(ev => allNames.push(ev.name))
    }
    if (t.fields) {
      t.fields.forEach(f => {
        allNames.push(f.name)
        f.args.forEach(a => allNames.push(a.name))
      })
    }
  })
  const uniqueNames = Array.from(new Set(allNames)).sort()
  return uniqueNames
}

const getUniqueNamesFromGQL = input => {
  const allNames = standardUniqueNames.slice()
  const lexer = createLexer(new Source(input))
  while (true) {
    const token = lexer.advance()
    if (token.kind === '<EOF>') break
    if (token.kind === 'Name') allNames.push(token.value)
  }
  const uniqueNames = Array.from(new Set(allNames)).sort()
  return uniqueNames
}

const punchArray = (arr, punch) => {
  const punchSet = new Set(punch)
  const result = []
  arr.forEach(v => {
    if (!punchSet.has(v)) result.push(v)
  })
  return result
}

const toBaseX = (value, alphabet) => {
  const base = alphabet.length
  let remainder = value
  let result = ''
  while (remainder > 0) {
    result = alphabet[remainder % base] + result
    remainder = Math.floor(remainder / base)
  }
  return result || alphabet[0]
}

const getMinifyDictionary = uniqueNames => {
  const alphabet =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'
  let wordLength = 0
  const base = alphabet.length
  let remainder = uniqueNames.length
  while (remainder > 0) {
    wordLength++
    remainder = Math.floor(remainder / base)
  }
  const dictionary = {}
  uniqueNames.forEach((n, i) => {
    dictionary[n] = toBaseX(i, alphabet).padStart(wordLength, alphabet[0])
  })

  return dictionary
}

const getExpandDictionary = uniqueNames => {
  const minifyDictionary = getMinifyDictionary(uniqueNames)
  const expandDictionary = {}
  for (const k in minifyDictionary) {
    const v = minifyDictionary[k]
    expandDictionary[v] = k
  }
  return expandDictionary
}

const minifyQuery = (input, uniqueNames = []) => {
  const extraUniqueNames = punchArray(getUniqueNamesFromGQL(input), uniqueNames)
  uniqueNames = uniqueNames.concat(extraUniqueNames)

  const minifyDictionary = getMinifyDictionary(uniqueNames)

  let output = extraUniqueNames.join(' ') + '\n'

  const lexer = createLexer(new Source(input))
  while (true) {
    const token = lexer.advance()

    if (token.kind === 'Name') {
      output += minifyDictionary[token.value]
    } else if (token.kind === '<EOF>') break
    else if (token.kind === 'Comment') continue
    else if (token.kind === 'String') output += '"' + token.value + '"'
    else if (token.kind === 'BlockString') output += '"""' + token.value + '"""'
    else if (token.value) output += token.value
    else output += token.kind
  }

  return output
}

const expandQuery = (input, uniqueNames = []) => {
  {
    let [extraUniqueNames, ...inputLines] = input.split('\n')
    extraUniqueNames = extraUniqueNames.split(' ')
    input = inputLines.join('\n')
    uniqueNames = uniqueNames.concat(extraUniqueNames)
  }

  const expandDictionary = getExpandDictionary(uniqueNames)

  const wordLength = Object.keys(expandDictionary)[0].length || 999999
  const split = new RegExp('.{' + wordLength + '}', 'g')

  let output = ''

  const lexer = createLexer(new Source(input))
  while (true) {
    const token = lexer.advance()

    if (token.kind === 'Name') {
      const names = token.value.match(split)
      const namesExpanded = names.map(n => expandDictionary[n])
      output += namesExpanded.join(' ')
    } else if (token.kind === '<EOF>') break
    else if (token.kind === 'Comment') continue
    else if (token.kind === 'String') output += '"' + token.value + '"'
    else if (token.kind === 'BlockString') output += '"""' + token.value + '"""'
    else if (token.value) output += token.value
    else output += token.kind
  }

  return output
}

module.exports = {
  getUniqueNamesFromIntrospection,
  getUniqueNamesFromGQL,
  minifyQuery,
  expandQuery
}

// comment

// tried unique parents and more complicated lexing, for single charachter. relay node limitation over 63
// 2047 max url length for GET (use base64 encode in client link)
// base 63 fields [_0-9a-zA-Z]
// anonymous benchmarking:
//   1%
//   performance.now()
//   query before / after
//   minifySchema size
//   generate ID in postinstall
