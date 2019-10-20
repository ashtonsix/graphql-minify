# graphql-minify

**Before**

```gql
{
  person(personID: 4) {
    name
    gender
    homeworld {
      name
    }
  }
}
```

**After**

```txt
{cT(cV:4){cHcgcn{cH}}}
```

## Motivation

- Most CDNs only cache GET requests
- Some browsers limit GET requests to 2047 charachters
- Some GraphQL queries are cacheable in theory, but exceed this limit

> psst! You can probably achieve even better results with
> [Automatic Persisted Queries](https://www.apollographql.com/docs/apollo-server/performance/apq/)

## Usage

```js
import introspectGraphQL from 'graphql-minify/introspect'
import {
  getUniqueNamesFromIntrospection,
  getUniqueNamesFromGQL,
  minifyQuery,
  expandQuery
} from 'graphql-minify'

const schema = await introspectGraphQL('http://localhost:3000/graphql')
const uniqueNames = getUniqueNamesFromIntrospection(schema)

const query = gql`
  query {
    person(personID: 4) {
      name
    }
  }
`

const minified = minfiyQuery(query, uniqueNames)
const expanded = expandQuery(query, uniqueNames) // restore the original query
```

Your full solution could involve adding `uniqueNames` to your bundle, or making
`uniqueNames` available via an API endpoint

An Express.js integration might look something like:

```js
app.use('/graphql/unique-names', (req, res) => {
  res.json(uniqueNames)
})

app.use('/graphql', (req, res, next) => {
  req.body.query = expandQuery(req.body.query, uniqueNames)
  next()
})

app.use('/graphql', handleGraphQL)
```

## Contributing

It'd be awesome if this library could help minify code (eg,
`babel-plugin-graphql-minify`)

Let me know how it goes if you decide to try this!

All other Pull Requests welcome too :)

## Authors

Created by [Ashton Six](https://twitter.com/ashtonsix)
