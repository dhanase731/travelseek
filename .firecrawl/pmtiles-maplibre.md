[Skip to content](https://docs.protomaps.com/pmtiles/maplibre#VPContent)

On this page

# PMTiles for MapLibre GL [​](https://docs.protomaps.com/pmtiles/maplibre\#pmtiles-for-maplibre-gl)

PMTiles is designed to be read directly in the browser by the MapLibre GL renderer, for either thematic overlay tilesets or basemap tilesets.

For a guide on integrating the Protomaps basemap tileset into MapLibre GL, see [Basemaps for MapLibre](https://docs.protomaps.com/basemaps/maplibre).

## Installation [​](https://docs.protomaps.com/pmtiles/maplibre\#installation)

For reading PMTiles directly from cloud storage, you'll need the `pmtiles` JavaScript library.

The JavaScript library includes a plugin for MapLibre GL that uses its [`addProtocol` feature.](https://maplibre.org/maplibre-gl-js/docs/API/functions/addProtocol/)

bash

```
npm install pmtiles
```

js

```
import { Protocol } from "pmtiles";
```

js

```
let protocol = new Protocol();
maplibregl.addProtocol("pmtiles",protocol.tile);
```

json

```
{
  "sources": {
    "protomaps": {
        "type": "vector",
        "url": "pmtiles://https://example.com/example.pmtiles",
    }
  }
}
```

Using the `pmtiles://` protocol will automatically derive a `minzoom` and `maxzoom` for your `Source`.

## React [​](https://docs.protomaps.com/pmtiles/maplibre\#react)

`addProtocol` works best if it is **only called once** in the lifecycle of your application. A way to accomplish this in React is with a hook like this at the **root component:**

js

```
import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';

...

useEffect(() => {
    let protocol = new Protocol();
    maplibregl.addProtocol("pmtiles",protocol.tile);
    return () => {
      maplibregl.removeProtocol("pmtiles");
    }
  }, []);
```

See this [CodeSandbox example](https://codesandbox.io/s/black-dream-oycvf2?file=/src/App.js) for a minimal working setup.

## Raster or Terrain PMTiles [​](https://docs.protomaps.com/pmtiles/maplibre\#raster-or-terrain-pmtiles)

For raster tiles you'll just need to change the `type` of your source to `raster`:

json

```
{
  "sources": {
    "protomaps": {
        "type": "raster",
        "url": "pmtiles://https://example.com/example.pmtiles",
    }
  }
}
```

Protomaps also [distributes terrain tilesets](https://docs.protomaps.com/basemaps/downloads#terrain) in the [Terrarium RGB encoding](https://github.com/tilezen/joerd/blob/master/docs/formats.md). These have a special source type in MapLibre GL:

json

```
{
  "sources": {
    "protomaps": {
        "type": "raster-dem",
        "url": "pmtiles://https://example.com/example.pmtiles",
        "encoding": "terrarium"
    }
  }
}
```

## Next Steps [​](https://docs.protomaps.com/pmtiles/maplibre\#next-steps)

- Integrating [Basemap Styles](https://docs.protomaps.com/basemaps/maplibre) into MapLibre