[Skip to content](https://docs.protomaps.com/guide/getting-started#VPContent)

On this page

# Getting Started [​](https://docs.protomaps.com/guide/getting-started\#getting-started)

## 1\. Install the CLI [​](https://docs.protomaps.com/guide/getting-started\#_1-install-the-cli)

The **pmtiles CLI tool** is a single binary you can download at [GitHub Releases](https://github.com/protomaps/go-pmtiles/releases).

## 2\. Find the latest daily planet [​](https://docs.protomaps.com/guide/getting-started\#_2-find-the-latest-daily-planet)

Go to [maps.protomaps.com/builds](https://maps.protomaps.com/builds/) and find a recent daily basemap build.

Use the pmtiles CLI to inspect that archive:

bash

```
pmtiles show https://build.protomaps.com/20261125.pmtiles
```

txt

```
...
planetiler:osm:osmosisreplicationtime 2026-11-25T05:00:00Z
...
```

The above metadata shows that the file contains [OpenStreetMap](http://openstreetmap.org/) data up to that day.

## 3\. Extract any area [​](https://docs.protomaps.com/guide/getting-started\#_3-extract-any-area)

We can now create a subset of the planet file, `my_area.pmtiles`, with just tiles matching the bounding box `4.742883,51.830755,5.552837,52.256198` centered around Utrecht, Netherlands.

bash

```
pmtiles extract https://build.protomaps.com/20261125.pmtiles my_area.pmtiles --bbox=4.742883,51.830755,5.552837,52.256198
```

> **Note:** You can find the bounding box of your own area, using tools, such as [http://bboxfinder.com/](http://bboxfinder.com/#51.830755,4.742883,52.256198,5.552837)

We can also create a subset of the whole planet that is only zoom levels 0 to 6 and ~60 MB:

bash

```
pmtiles extract https://build.protomaps.com/20261125.pmtiles planet_z6.pmtiles --maxzoom=6
```

## 4\. View the basemap [​](https://docs.protomaps.com/guide/getting-started\#_4-view-the-basemap)

[maps.protomaps.com](https://maps.protomaps.com/) is a viewer for basemaps. Drag our file `my_area.pmtiles` or `planet_z6.pmtiles` onto the `Drop Zone` to view the map:

![utrecht image](https://docs.protomaps.com/assets/utrecht.Bc9N7gRh.png)

## Next Steps [​](https://docs.protomaps.com/guide/getting-started\#next-steps)

- Upload your tiles to cloud storage: [Cloud Storage](https://docs.protomaps.com/pmtiles/cloud-storage)
- Change the appearance of the basemap: [Basemap Styles](https://docs.protomaps.com/basemaps/flavors)
- Bring your own datasets: [Creating PMTiles](https://docs.protomaps.com/pmtiles/create)