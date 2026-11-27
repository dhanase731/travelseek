[Skip to content](https://docs.protomaps.com/basemaps/layers#VPContent)

On this page

# Basemap Layers [​](https://docs.protomaps.com/basemaps/layers\#basemap-layers)

The Protomaps basemap is built on [OpenStreetMap](https://openstreetmap.org/) and [Natural Earth](https://naturalearthdata.com/) data. It does not include all data and tags from OSM; instead it is designed to strike a balance between tile size and completeness, for use as a general-purpose context map.

The organization of layers and tags is derived from the [open source Tilezen project](https://tilezen.readthedocs.io/en/latest/layers/). The scope of contents and choice of data inclusion at certain zoom levels is intended to mirror the reference implementations of Tilezen styles such as [Bubble Wrap](https://tangrams.github.io/bubble-wrap/).

The current version is **Version 4**.

## Common Tags [​](https://docs.protomaps.com/basemaps/layers\#common-tags)

| Key | Values | Description |
| --- | --- | --- |
| `name`, `name*`, `name:*`, `pgf:name:*`, `script*` | string | see [Localization](https://docs.protomaps.com/basemaps/localization) |
| `sort_rank` | integer | Importance ranking used for rendering |
| `min_zoom` | integer | Suggested zoom level to limit display |

## boundaries [​](https://docs.protomaps.com/basemaps/layers\#boundaries)

Use Ctrl + scroll to zoom the map

Use two fingers to move the map

[© OpenStreetMap](https://www.openstreetmap.org/copyright)

z=5

| Key | Values | Description |
| --- | --- | --- |
| `kind` | `country`, `region`, `county`, `locality` |  |
| `kind_detail` | integer | the minimum admin\_level from OSM |
| `brk_a3` |  | `brk_a3` value from Natural Earth |
| `disputed` | boolean |  |

## buildings [​](https://docs.protomaps.com/basemaps/layers\#buildings)

Use Ctrl + scroll to zoom the map

Use two fingers to move the map

[© OpenStreetMap](https://www.openstreetmap.org/copyright)

z=14

Buildings and address points from OpenStreetMap. z0-14 contains merged buildings, even disconnected ones. z15+ contains individual OSM equivalent buildings.

| Key | Values | Description |
| --- | --- | --- |
| `kind` | `address`, `building`, `building_part` | Whether it is an address point, whole building or one part. |
| `addr_housenumber` | string | Address number for `kind=address`. |
| `height` | number | May be quantized at low zoom levels. |
| `min_height` | number | May be quantized at low zoom levels. |
| `layer` | integer | Layer position relative to other buildings. |

## earth [​](https://docs.protomaps.com/basemaps/layers\#earth)

Use Ctrl + scroll to zoom the map

Use two fingers to move the map

[© OpenStreetMap](https://www.openstreetmap.org/copyright)

z=3

Polygons from the Natural Earth 50m `land` theme for z0-z4, 10m for z5, preprocessed land polygons from [OSMCoastline](https://osmdata.openstreetmap.de/) for z6+.

| Key | Values | Description |
| --- | --- | --- |
| `kind` | `earth` |  |

## landcover [​](https://docs.protomaps.com/basemaps/layers\#landcover)

Use Ctrl + scroll to zoom the map

Use two fingers to move the map

[© OpenStreetMap](https://www.openstreetmap.org/copyright)

z=2

Polygons from the Daylight distribution's [landcover](https://daylightmap.org/2023/10/11/landcover.html) theme, for z0-z7.

| Key | Values | Description |
| --- | --- | --- |
| `kind` | `barren`, `farmland`, `forest`, `glacier`, `grassland`, `scrub`, `urban_area` |  |

_NOTE: It's recommended to pair with **natural** layer polygons in from OpenStreetMap at mid- and high-zooms._

## landuse [​](https://docs.protomaps.com/basemaps/layers\#landuse)

Use Ctrl + scroll to zoom the map

Use two fingers to move the map

[© OpenStreetMap](https://www.openstreetmap.org/copyright)

z=13

Polygons from OpenStreetMap, from a curated subset of `aeroway`, `amenity`, `area:aeroway`, `boundary`, `highway`, `landuse`, `leisure`, `man_made`, `natural`, `place`, `railway`, `tourism` tags, for all zooms.

| Key | Values | Description |
| --- | --- | --- |
| `kind` | See below |  |
| `sport` | string | Which sports are played on a pitch. |

### Kinds [​](https://docs.protomaps.com/basemaps/layers\#kinds)

| Kind |
| --- |
| `aerodrome` |
| `attraction` |
| `bare_rock` |
| `beach` |
| `cafe` |
| `camp_site` |
| `cemetery` |
| `college` |
| `commercial` |
| `dog_park` |
| `farmland` |
| `farmyard` |
| `footway` |
| `forest` |
| `garden` |
| `glacier` |
| `golf_course` |
| `grass` |
| `grocery` |
| `hospital` |
| `hotel` |
| `industrial` |
| `kindergarten` |
| `library` |
| `marina` |
| `meadow` |
| `military` |
| `national_park` |
| `nature_reserve` |
| `neighbourhood` |
| `orchard` |
| `other` |
| `park` |
| `pedestrian` |
| `pier` |
| `pitch` |
| `platform` |
| `playground` |
| `post_office` |
| `protected_area` |
| `railway` |
| `recreation_ground` |
| `residential` |
| `runway` |
| `sand` |
| `school` |
| `scrub` |
| `stadium` |
| `supermarket` |
| `taxiway` |
| `townhall` |
| `university` |
| `wetland` |
| `wood` |
| `zoo` |

## places [​](https://docs.protomaps.com/basemaps/layers\#places)

Points from OpenStreetMap and Natural Earth, from a curated subset of place tags, for all zooms.

Use Ctrl + scroll to zoom the map

Use two fingers to move the map

[© OpenStreetMap](https://www.openstreetmap.org/copyright)

z=2

| Key | Values | Description |
| --- | --- | --- |
| `kind` | `country`, `region`, `locality`, `macrohood`, `neighbourhood` |  |
| `kind_detail` | `allotments`, `city`, `country`, `farm`, `hamlet`, `hamlet`, `isolated_dwelling`, `locality`, `neighbourhood`, `province`, `quarter`, `scientific_station`, `state`, `town`, `village` |  |
| `capital` | string |  |
| `population` | int |  |
| `population_rank` | int |  |
| `wikidata` | string |  |

## pois [​](https://docs.protomaps.com/basemaps/layers\#pois)

Points from OpenStreetMap, from a curated subset of aeroway, amenity, attraction, boundary, craft, highway, historic, landuse, leisure, natural, railway, shop, tourism tags, for all zooms.

Use Ctrl + scroll to zoom the map

Use two fingers to move the map

[© OpenStreetMap](https://www.openstreetmap.org/copyright)

z=16

| Key | Values | Description |
| --- | --- | --- |
| `kind` | See below |  |
| `cuisine` | string |  |
| `religion` | string |  |
| `sport` | string |  |
| `iata` | string |  |

_NOTE: The list of kind values is not comprehensive as some raw OSM tag values are passed through in the current version._

### Kinds [​](https://docs.protomaps.com/basemaps/layers\#kinds-1)

| kind | icon |
| --- | --- |
| `aerodrome` |  |
| `adult_gaming_centre` |  |
| `airfield` |  |
| `alpine_hut` |  |
| `amusement_ride` |  |
| `animal` |  |
| `art` |  |
| `artwork` |  |
| `atm` |  |
| `attraction` |  |
| `atv` |  |
| `baby_hatch` |  |
| `bakery` |  |
| `bbq` |  |
| `beach` |  |
| `beauty` |  |
| `bed_and_breakfast` |  |
| `bench` |  |
| `bicycle_parking` |  |
| `bicycle_rental` |  |
| `bicycle_repair_station` |  |
| `boat_storage` |  |
| `bookmaker` |  |
| `books` |  |
| `building` |  |
| `bureau_de_change` |  |
| `bus_stop` |  |
| `butcher` |  |
| `cafe` |  |
| `camp_site` |  |
| `car_parts` |  |
| `car_rental` |  |
| `car_repair` |  |
| `car_sharing` |  |
| `car_wash` |  |
| `car` |  |
| `carousel` |  |
| `cemetery` |  |
| `chalet` |  |
| `charging_station` |  |
| `childcare` |  |
| `clinic` |  |
| `clothes` |  |
| `college` |  |
| `computer` |  |
| `convenience` |  |
| `customs` |  |
| `dentist` |  |
| `district` |  |
| `doctors` |  |
| `dog_park` |  |
| `drinking_water` |  |
| `emergency_phone` |  |
| `fashion` |  |
| `firepit` |  |
| `fire_station` |  |
| `fishing` |  |
| `florist` |  |
| `forest` |  |
| `fuel` |  |
| `gambling` |  |
| `garden_centre` |  |
| `garden` |  |
| `gift` |  |
| `golf_course` |  |
| `golf` |  |
| `greengrocer` |  |
| `grocery` |  |
| `guest_house` |  |
| `hairdresser` |  |
| `hanami` |  |
| `harbourmaster` |  |
| `hifi` |  |
| `hospital` |  |
| `hostel` |  |
| `hotel` |  |
| `hunting_stand` |  |
| `information` |  |
| `jewelry` |  |
| `karaoke_box` |  |
| `karaoke` |  |
| `landmark` |  |
| `library` |  |
| `life_ring` |  |
| `lottery` |  |
| `marina` |  |
| `maze` |  |
| `memorial` |  |
| `military` |  |
| `mobile_phone` |  |
| `money_transfer` |  |
| `motorcycle_parking` |  |
| `motorcycle` |  |
| `national_park` |  |
| `nature_reserve` |  |
| `naval_base` |  |
| `newsagent` |  |
| `optician` |  |
| `park` |  |
| `parking` |  |
| `peak` |  |
| `perfumery` |  |
| `picnic_site` |  |
| `picnic_table` |  |
| `pitch` |  |
| `playground` |  |
| `post_box` |  |
| `post_office` |  |
| `ranger_station` |  |
| `recycling` |  |
| `roller_coaster` |  |
| `sanitary_dump_station` |  |
| `school` |  |
| `scuba_diving` |  |
| `shelter` |  |
| `ship_chandler` |  |
| `shower` |  |
| `slipway` |  |
| `snowmobile` |  |
| `social_facility` |  |
| `stadium` |  |
| `station` |  |
| `stationery` |  |
| `studio` |  |
| `summer_toboggan` |  |
| `supermarket` |  |
| `swimming_area` |  |
| `taxi` |  |
| `telephone` |  |
| `tobacco` |  |
| `toilets` |  |
| `townhall` |  |
| `trail_riding_station` |  |
| `travel_agency` |  |
| `university` |  |
| `viewpoint` |  |
| `waste_basket` |  |
| `waste_disposal` |  |
| `water_point` |  |
| `water_slide` |  |
| `watering_place` |  |
| `wayside_cross` |  |
| `wilderness_hut` |  |
| `zoo` |  |

### Ranking [​](https://docs.protomaps.com/basemaps/layers\#ranking)

Points of interest are sourced from OpenStreetMap, and the `wikidata` tag is joined with the [QRank](https://github.com/brawer/wikidata-qrank) dataset to determine their prominence. The determined QRank is then used to move prominent POIs to lower zoom levels.

For example, the station [Alexanderplatz](https://www.openstreetmap.org/node/3908141014) has Wikidata ID [Q698497](https://www.wikidata.org/wiki/Q698497) and a QRank of 37850. A neighboring station, [Jannowitzbrücke](https://www.openstreetmap.org/node/21487225) has Wikidata ID [Q1647893](https://www.wikidata.org/wiki/Q1647893) and a QRank of 11176. Alexanderplatz station thus appears at a lower zoom level than other stations.

To view or modify the mapping from QRank thresholds to zoom levels, see [Pois.java](https://github.com/protomaps/basemaps/blob/main/tiles/src/main/java/com/protomaps/basemap/layers/Pois.java).

## roads [​](https://docs.protomaps.com/basemaps/layers\#roads)

Linear transportation features designed for movement, including highways, streets, railways and piers from OpenStreetMap. This layer represents built infrastructure including railways. Refer to the [transit](https://docs.protomaps.com/basemaps/layers#transit) layer for passenger services.

Use Ctrl + scroll to zoom the map

Use two fingers to move the map

[© OpenStreetMap](https://www.openstreetmap.org/copyright)

z=13

| Key | Values | Description |
| --- | --- | --- |
| `kind` | See kinds below |  |
| `kind_detail` | `motorway`, `motorway_link`, `trunk`, `trunk_link`, `primary`, `primary_link`, `secondary`, `secondary_link`, `tertiary`, `tertiary_link`, `residential`, `service`, `unclassified`, `road`, `raceway`, `pedestrian`, `track`, `path`, `cycleway`, `bridleway`, `steps`, `corridor`, `sidewalk`, `crossing`, `driveway`, `parking_aisle`, `alley`, `drive-through`, `emergency_access`, `utility`, `irrigation`, `slipway`, `cable_car`, `pier`, `runway`, `taxiway`, `disused`, `funicular`, `light_rail`, `miniature`, `monorail`, `narrow_gauge`, `preserved`, `subway`, `tram` |  |
| `ref` | string |  |
| `shield_text` | string | see [shields](https://docs.protomaps.com/basemaps/layers#shields) |
| `network` | string | see [shields](https://docs.protomaps.com/basemaps/layers#shields) |
| `oneway` | string |  |
| `service` | `siding`, `crossover`, `yard` |  |
| `is_link` | boolean |  |
| `is_tunnel` | boolean |  |
| `is_bridge` | boolean |  |

### Kinds [​](https://docs.protomaps.com/basemaps/layers\#kinds-2)

| kind |
| --- |
| `highway` |
| `major_road` |
| `minor_road` |
| `path` |
| `aerialway` |
| `ferry` |
| `pier` |
| `rail` |
| `aeroway` |

### Shields [​](https://docs.protomaps.com/basemaps/layers\#shields)

The `network` and `shield_text` are designed for displaying localized highway shields. The values are derived from the OpenStreetMap `ref` tag, and a spatial join with administrative boundaries.

Example `network` values:

| Value | Sprite | Description |
| --- | --- | --- |
| `US:US` |  | United States [Numbered Highway System](https://en.wikipedia.org/wiki/United_States_Numbered_Highway_System) |
| `US:I` |  | United States [Interstate Highway System](https://en.wikipedia.org/wiki/Interstate_Highway_System) |
| `NL:S-road` |  | Dutch S-road network |

```
                                                                                 |
                                                                                  |
```

For example, an [OpenStreetMap way](https://www.openstreetmap.org/way/584348895) with the tag `ref=S100` where the way is contained within the Netherlands polygon as defined by [ideditor.codes](https://ideditor.codes/) will gain the tags `network=NL:S-road`, `shield_text=S100`.

## transit [​](https://docs.protomaps.com/basemaps/layers\#transit)

Lines representing scheduled passenger services suitable for rendering on the map, even at lower zoom levels. For physical infrastructure, like highways and railways, see the [roads](https://docs.protomaps.com/basemaps/layers#roads) layer.

This layer is currently empty.

| Key | Values | Description |
| --- | --- | --- |
| `kind_detail` |  |  |
| `ref` | string |  |
| `network` | string |  |
| `layer` | int |  |
| `route` | string |  |
| `service` | string |  |

## water [​](https://docs.protomaps.com/basemaps/layers\#water)

Use Ctrl + scroll to zoom the map

Use two fingers to move the map

[© OpenStreetMap](https://www.openstreetmap.org/copyright)

z=6

- Polygons, lines and point labels from OpenStreetMap.

- Polygons from the Natural Earth 50m `lakes` and `ocean` themes for z0-z4, 10m for z5, preprocessed land polygons from [OSMCoastline](https://osmdata.openstreetmap.de/) for z6+.


| Key | Values | Description |
| --- | --- | --- |
| `kind` | `water`, `lake`, `playa`, `ocean`, `other` |  |
| `kind_detail` | `basin`, `canal`, `ditch`, `dock`, `drain`, `lake`, `reservoir`, `river`, `riverbank`, `stream` |  |
| `reservoir` | boolean |  |
| `alkaline` | boolean |  |
| `intermittent` | boolean |  |
| `bridge` | string |  |
| `tunnel` | string |  |
| `layer` | int |  |