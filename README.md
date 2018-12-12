[![Greenkeeper badge](https://badges.greenkeeper.io/windingtree/wt-search-api.svg)](https://greenkeeper.io/)
# WT Search API

API written in nodejs to fetch information from the Winding Tree platform.

Work in progress. Discussion on https://groups.google.com/forum/#!topic/windingtree/J_6aRddPVWY

## Requirements
- Nodejs >=10

### Getting stared
In order to install and run tests, we must:
```
git clone git@github.com:windingtree/wt-read-api.git
nvm install
npm install
npm test
```

### Running dev mode
With all the dependencies installed, you can start the dev server.

First step is to initialize the SQLite database used to store your data.
If you want to use a different database, feel free to change the connection
settings in the appropriate configuration file in `src/config/`.
```bash
npm run createdb-dev
```

If you'd like to start fresh later, just delete the `.dev.sqlite` file.

Now we can run our dev server.
```bash
npm run dev
```
By default, this will try to connect to an instance of [wt-read-api](https://github.com/windingtree/wt-read-api)
running locally on `http://localhost:3000` and index the hotels from there.
You can override the default in an appropriate config file in `src/config`.

Right after you start your node, it will try to sync and index all of the
data immediately.

### Running node against a live environment

- For our deployment on https://playground-api.windingtree.com, we use a Docker image.
- You can use it in your local environment by running the following commands:
```sh
$ docker build -t windingtree/wt-search-api .
$ docker run -p 8080:1918 -e WT_CONFIG=playground -e READ_API_URL=https://playground-api.windingtree.com -e BASE_URL=http://localhost:8080 windingtree/wt-search-api
```
- After that you can access the wt-search-api on local port `8080`.
- This deployment is using a Ropsten configuration that can be found in `src/config/playground.js`.
- This docker creates a database during image startup. That is pinned to SQLite for now.
You can skip this with `SKIP_DB_SETUP` environment variable.

## Examples

### Search and sort by location

The following command will get you the 3 closest hotels to 46.770066, 23.600819
sorted by distance from this point and no further than 30 kilometers.

```bash
curl -X GET "https://playground-search-api.windingtree.com/hotels?location=46.770066,23.600819:30&sortByDistance=46.770066,23.600819&limit=3" -H "accept: application/json"
```

You are not required to use both filters and sorts simultaneously, you can pick one or
the other or combine them.

## Proposed architecture

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
