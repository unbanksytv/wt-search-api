# wt-search-api

[![Greenkeeper badge](https://badges.greenkeeper.io/windingtree/wt-search-api.svg)](https://greenkeeper.io/)

Work in progress. Discussion on https://groups.google.com/forum/#!topic/windingtree/J_6aRddPVWY

![Proposed architecture](https://github.com/windingtree/wt-search-api/raw/master/docs/wt-search-api.png "Proposed architecture")

**Ideal flow**

- Hotel writes its data to the platform with Write API.
- Write API sends notifications about hotel data changes via Update API.
- If a new hotel pops up, Subscriptions Management makes sure that the Search API is tracking all the hotel data changes.
- Subscription handler (or Resync cron job) tells the Crawler to collect the changed data via Read API (currently, the version 0.8.x is assumed).
- Crawler puts a copy of the data to Permanent storage.
- Crawler also bumps the Indexer and Price Computation components to start work with the changed data.
- Indexer re-indexes the hotel data from Permanent Storage to make search easier where possible (such as location data, description for fulltext etc.) and puts them to Indexed Storage.
- Price computation (silly name) re-computes all of the prices based on new hotel information from Permanent Storage and puts them to Price Storage. It's not really clear how it should know which prices it should compute though.
- OTAs (or other users of the system) are posting queries via Query API and they are getting quick responses

**Various notes**

- Prices (and all other guest-related) query results might be hard to pre-compute. It might be feasible to collect common query types and pre-compute appropriate data for that.
- There's yet no decision on how the Query API will communicate with the outside world. Contenders probably are: REST API with query strings, REST API with custom query language, GraphQL endpoint
- Query API has to offer ways of sorting the data and some relevance score for search results. Also we cannot forget about pagination.
- Resync CRON job has to be in place because there's no guarantee that the outside system is reliable and that every hotel uses Update API.
- Indexed and Price storages are fast, ideally in-memory databases.
- Permanent storage is in place if Indexed Storage and/or Price Storage get somehow corrupted or destroyed. The Search box can re-index the whole WT platform way faster than if it had to get all data from various distributed storages.
