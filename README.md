# Comp Planner

Comp Planner helps organizers choose events for a new WCA competition.

The first tool finds competitions near a city. Choose an as-of date and a
radius in miles, or search the entire selected state. For cities in Alaska,
Washington, and Oregon, you can also search the Pacific Northwest.

The app lists each event by its most recent nearby competition and counts how
many times the event was held in the previous 12 months.

Results start as one row per event and are sorted from least recently held to
most recently held. Use the view switch to group events under their latest
competition instead.

The search reads the previous 24 months of competition history. This lookback
keeps the result fast while it gives the event list useful recent context.

## Run the app

Install the packages:

```sh
yarn install
```

Start the development server:

```sh
yarn dev
```

Start Storybook to preview the components:

```sh
yarn storybook
```

The app reads competition data from the public WCA API. It uses the Photon
OpenStreetMap geocoder to turn a city name into coordinates. Normalized WCA
competition results are cached in memory and in local storage for 24 hours,
and concurrent searches reuse the same request.
