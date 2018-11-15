# OpenSearch for Algolia results

This is an experiment and has not yet been validated

1. `/` -> a html with the meta link to the opensearch
2. `/opensearch.xml` -> the description document with all links
3. `/suggest?query=XXX` -> JSON response for query suggestions ([docs](http://www.opensearch.org/Specifications/OpenSearch/Extensions/Suggestions/1.1#Declaring_a_JSON-formatted_search_suggestion_URL))
4. `/results?query=XXX` -> XML/RSS response results ([docs](https://github.com/dewitt/opensearch/blob/master/opensearch-1-1-draft-6.md#example-of-opensearch-response-elements-in-rss-20))

## Uses

- express
- algoliasearch
- Yarn index
- Yarn query suggestions index
