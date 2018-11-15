const express = require('express');
const algoliasearch = require('algoliasearch');
const app = express();
const port = 3000;

const searchClient = algoliasearch(
  'OFCNCOG2CU',
  '2ecf81d560c9d884964cb7237fff6bd8'
);
const suggestionsIndex = searchClient.initIndex('npm_search_query_suggestions');
const resultsIndex = searchClient.initIndex('npm-search');

app.get('/suggest', async (req, res) => {
  try {
    const { query } = req.query;
    const { hits } = await suggestionsIndex.search({
      query,
      attributesToRetrieve: ['query', 'npm-search'],
      attributesToHighlight: [],
    });

    res.type('json');
    res.send([
      query,
      hits.map(({ query }) => query),
      hits.map(
        ({ 'npm-search': { exact_nb_hits } }) =>
          `${exact_nb_hits.toLocaleString('en-US')} result${
            exact_nb_hits === 1 ? '' : 's'
          }`
      ),
      hits.map(({ query }) => `https://yarnpkg.com/en/packages?q=${query}`),
    ]);
  } catch ({ message }) {
    res.status(500);
    res.type('json');
    res.send({
      message,
    });
  }
});

app.get('/results', async (req, res) => {
  try {
    const { query = '' } = req.query;
    const { hits, nbHits, page, hitsPerPage } = await resultsIndex.search({
      query,
      attributesToRetrieve: ['name'],
      attributesToSnippet: ['description'],
      attributesToHighlight: [],
    });
    res.type('xml');
    res.send(
      `
      <?xml version="1.0" encoding="UTF-8"?>
      <rss
        version="2.0"
        xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/"
        xmlns:atom="http://www.w3.org/2005/Atom"
      >
        <channel>
          <title>Yarn Search: ${query}</title>
          <link>https://yarnpkg.com/en/packages?q=${query}</link>
          <description>Search results for "${query}" at Yarnpkg.com</description>
          <opensearch:totalResults>${nbHits}</opensearch:totalResults>
          <opensearch:startIndex>${page * hitsPerPage}</opensearch:startIndex>
          <opensearch:itemsPerPage>${hitsPerPage}</opensearch:itemsPerPage>
          <atom:link
            rel="search"
            type="application/opensearchdescription+xml"
            href="http://example.com/opensearchdescription.xml"
          />
          <opensearch:Query
            role="request"
            searchTerms="${query}"
            startPage="${page + 1}"
          />
          ${hits
            .map(
              ({ name, _snippetResult: { description } }) => `
                <item>
                  <title>${name}</title>
                  <link>https://yarnpkg.com/en/package/${name}</link>
                  <description>${description.value}</description>
                </item>
              `
            )
            .join('\n')}
        </channel>
      </rss>
    `.trim()
    );
  } catch ({ message }) {
    res.type('json');
    res.send({
      message,
    });
  }
});

app.get('/opensearch.xml', (req, res) => {
  // res.type('application/opensearchdescription+xml');
  res.type('xml');
  res.send(
    `
    <OpenSearchDescription
      xmlns="http://a9.com/-/spec/opensearch/1.1/"
      xmlns:moz="http://www.mozilla.org/2006/browser/search/"
    >
      <ShortName>Yarn</ShortName>
      <Description>Package Search</Description>
      <Url
        type="text/html"
        method="get"
        template="https://www.yarnpkg.com/en/packages?q={searchTerms}"
      />
      <Url
        type="application/rss+xml"
        indexOffset="0"
        rel="results"
        template="/results?query={searchTerms}"
      />
      <Url
        type="application/json"
        rel="suggestions"
        template="/suggest?query={searchTerms}"
      />
      <InputEncoding>UTF-8</InputEncoding>
      <Image height="32" width="32" type="image/x-icon">
        https://yarnpkg.com/favicon.ico
      </Image>
    </OpenSearchDescription>
  `.trim()
  );
});

app.get('/', (req, res) => {
  res.type('html');
  res.send(`
    <!doctype html>
    <html>
      <head>
        <link
          rel="search"
          href="/opensearch.xml"
          type="application/opensearchdescription+xml"
          title="Yarn"
        />
      </head>
      <p>Hello! (try adding this page to "search engines")</p>
    </html>
  `);
});

app.listen(port, () =>
  console.log(`Example app listening on http://localhost:${port}!`)
);
