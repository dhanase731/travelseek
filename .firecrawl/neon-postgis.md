[Skip to main content](https://neon.com/docs/extensions/postgis#main-content) [Neon Object Storage: your files now branch with your database\\
![](https://neon.com/_next/image?url=%2F_next%2Fstatic%2Fimmutable%2Fmedia%2Fleft-pattern.1r8zj-a78ramo.png&w=2048&q=100)![](https://neon.com/_next/image?url=%2F_next%2Fstatic%2Fimmutable%2Fmedia%2Fright-pattern.0beltgepwnkg8.png&w=2048&q=100)![](https://neon.com/_next/image?url=%2F_next%2Fstatic%2Fimmutable%2Fmedia%2Fleft-pattern-xl.3ctmi_g720-l-.png&w=1920&q=100)![](https://neon.com/_next/image?url=%2F_next%2Fstatic%2Fimmutable%2Fmedia%2Fright-pattern-xl.40fsuq7hsruhi.png&w=1080&q=100)![](https://neon.com/_next/image?url=%2F_next%2Fstatic%2Fimmutable%2Fmedia%2Fleft-pattern-lg.3x0z01wu2ryjj.png&w=828&q=100)![](https://neon.com/_next/image?url=%2F_next%2Fstatic%2Fimmutable%2Fmedia%2Fright-pattern-lg.2c1sieabha5im.png&w=640&q=100)![](https://neon.com/_next/image?url=%2F_next%2Fstatic%2Fimmutable%2Fmedia%2Fleft-pattern-sm.10li6f2g85v-g.png&w=1080&q=100)![](https://neon.com/_next/image?url=%2F_next%2Fstatic%2Fimmutable%2Fmedia%2Fright-pattern-sm.0va46e0-z4r0s.png&w=640&q=100)![](https://neon.com/_next/image?url=%2F_next%2Fstatic%2Fimmutable%2Fmedia%2Fleft-pattern-xs.1_fakll3dgenf.png&w=640&q=100)](https://neon.com/blog/add-files-to-your-branches)

Search...⌘K

Ask AI

[Documentation home](https://neon.tech/unify?a=67e8d32b-6473-47e9-8a3c-ba1a3eacf83a&n=docs)/ [Postgres](https://neon.tech/unify?a=67e8d32b-6473-47e9-8a3c-ba1a3eacf83a&n=docs/postgres/overview)/ [Postgres extensions](https://neon.tech/unify?a=67e8d32b-6473-47e9-8a3c-ba1a3eacf83a&n=docs/extensions/pg-extensions)/postgis

# The postgis extension

Work with geospatial data in Postgres using PostGIS

Copy page

[View as Markdown](https://neon.tech/unify?a=67e8d32b-6473-47e9-8a3c-ba1a3eacf83a&n=docs/extensions/postgis.md) Set up agent

Last updated on Jun 5, 2026

The `postgis` extension provides support for spatial data - coordinates, maps and polygons, encompassing geographical and location-based information. It introduces new data types, functions, and operators to manage and analyze spatial data effectively.

![](https://neon.com/_next/image?url=%2F_next%2Fstatic%2Fimmutable%2Fmedia%2Fpattern.0f2sshrf3n3qc.png&w=384&q=75)

Try it on Neon!

Neon is Serverless Postgres built for the cloud. Explore Postgres features and functions in our user-friendly SQL editor. Sign up for a free account to get started.

[Sign Up](https://neon.tech/unify?a=67e8d32b-6473-47e9-8a3c-ba1a3eacf83a&n=signup)

This guide introduces you to the `postgis` extension - how to enable it, store and query spatial data, and perform geospatial analysis with real-world examples. Geospatial data is crucial in fields like urban planning, environmental science, and logistics.

#### note

PostGIS is an open-source extension for Postgres that can be installed on any Neon Project using the instructions below. Detailed installation instructions and compatibility information can be found at [PostGIS Documentation](https://postgis.net/documentation/).

For information about PostGIS-related extensions, including `pgrouting`, H3\_PostGIS, PostGIS SFCGAL, and PostGIS Tiger Geocoder, see [PostGIS-related extensions](https://neon.tech/unify?a=67e8d32b-6473-47e9-8a3c-ba1a3eacf83a&n=docs/extensions/postgis-related-extensions).

**Version availability:**

Please refer to the [list of all extensions](https://neon.tech/unify?a=67e8d32b-6473-47e9-8a3c-ba1a3eacf83a&n=docs/extensions/pg-extensions) available in Neon for up-to-date information.

## Enable the`postgis`extension [Link to Enable the postgis extension](https://neon.com/docs/extensions/postgis\#enable-the-postgis-extension)

You can enable the extension by running the following `CREATE EXTENSION` statement in the Neon **SQL Editor** or from a client such as `psql` that is connected to Neon.

```
CREATE EXTENSION IF NOT EXISTS postgis;
```

For information about using the Neon SQL Editor, see [Query with Neon's SQL Editor](https://neon.tech/unify?a=67e8d32b-6473-47e9-8a3c-ba1a3eacf83a&n=docs/get-started/query-with-neon-sql-editor). For information about using the `psql` client with Neon, see [Connect with psql](https://neon.tech/unify?a=67e8d32b-6473-47e9-8a3c-ba1a3eacf83a&n=docs/connect/query-with-psql-editor).

## Example usage [Link to Example usage](https://neon.com/docs/extensions/postgis\#example-usage)

**Create a table with spatial data**

Suppose you're managing a city's public transportation system. You can create a table to store the locations of bus stops.

```
CREATE TABLE bus_stops (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    location GEOGRAPHY(Point)
);
```

Here, the location column is of type `GEOGRAPHY(Point)`, which is a spatial data type provided by the `postgis` extension and used to store points on the Earth's surface.

**Inserting data**

Data can be inserted into the table using regular `INSERT` statements.

```
INSERT INTO bus_stops (name, location)
VALUES
    ('Main St & 3rd Ave', ST_Point(-73.935242, 40.730610)),
    ('Elm St & 5th Ave', ST_Point(-73.991070, 40.730824));
```

The `ST_Point` function is used to create a point from the specified longitude and latitude.

**Querying spatial data**

Now, we can perform spatial queries using the built-in functions provided by `PostGIS`. For example, below we try to find points within a certain distance from a reference.

Query:

```
SELECT name FROM bus_stops
WHERE ST_DWithin(location, ST_Point(-73.95, 40.7305)::GEOGRAPHY, 2000);
```

This query returns the following:

```
| name               |
|--------------------|
| Main St & 3rd Ave  |
```

The `ST_DWithin` function returns true if the distance between two points is less than or equal to the specified distance (when used with the `GEOGRAPHY` type, the unit is meters).

## Spatial data types [Link to Spatial data types](https://neon.com/docs/extensions/postgis\#spatial-data-types)

PostGIS extends Postgres data types to handle spatial data. The primary spatial types are:

- **GEOMETRY**: A flexible type for spatial data, supporting various shapes. It models shapes in the cartesian coordinate plane. Each `GEOMETRY` value is also associated with a spatial reference system (SRS), which defines the coordinate system and units of measurement.
- **GEOGRAPHY**: Specifically designed for large-scale spatial operations on the Earth's surface, factoring in the Earth's curvature. The coordinates for a `GEOGRAPHY` shape are specified in degrees of longitude and latitude.

The actual shapes are stored as a set of coordinates. For example, a point is stored as a pair of coordinates, a line as a set of points, and a polygon as a set of lines.

## Longer example [Link to Longer example](https://neon.com/docs/extensions/postgis\#longer-example)

PostGIS provides a number of other functions for spatial analysis - area, distance, intersection, and more. To illustrate, we'll create dataset representing a small set of landmarks and roads in a fictional city and run spatial queries on it.

**Creating the test dataset**

```
CREATE TABLE landmarks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    location GEOMETRY(Point)
);

CREATE TABLE roads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    path GEOMETRY(LineString)
);

INSERT INTO landmarks (name, location)
VALUES
    ('Park', ST_Point(100, 200)),
    ('Museum', ST_Point(200, 300)),
    ('Library', ST_Point(300, 200));

INSERT INTO roads (name, path)
VALUES
    ('Main Street', ST_MakeLine(ST_Point(100, 200), ST_Point(200, 300))),
    ('Second Street', ST_MakeLine(ST_Point(200, 300), ST_Point(300, 200)));
```

**Nearest landmark to a given point**

Finding the nearest places to a given point is a common spatial query. We can use the `ST_Distance` function to find the distance between two points and order the results by distance.

```
SELECT name, ST_Distance(location, ST_GeomFromText('POINT(150 250)')) AS distance
FROM landmarks
ORDER BY distance
LIMIT 1;
```

This query returns the following:

```
| name   | distance |
|--------|----------|
| Park   | 70.7107  |
```

**Intersection of Roads**

We can use the `ST_Intersects` function to find if two roads intersect. To ensure we don't get duplicate pairs of roads, we filter out pairs where the first road has a higher `id` than the second road.

```
SELECT a.name, b.name
FROM roads a AS name_A, roads b AS name_B
WHERE a.id < b.id AND ST_Intersects(a.path, b.path);
```

This query returns the following:

```
| name_A         | name_B         |
|----------------|----------------|
| Main Street    | Second Street  |
```

**Buffer zone around a landmark**

Say, the municipal council wants to create a buffer zone of 50 units around landmarks and check which roads intersect these zones. `ST_Buffer` computes an area around the given point with the specified radius.

```
SELECT l.name AS landmark, r.name AS road
FROM landmarks l, roads r
WHERE ST_Intersects(r.path, ST_Buffer(l.location, 50));
```

This query returns the following:

```
| landmark | road          |
|----------|---------------|
| Park     | Main Street   |
| Museum   | Main Street   |
| Museum   | Second Street |
| Library  | Second Street |
```

**Line of Sight Between Landmarks**

To check if there's a direct line of sight (no roads intersecting) between two landmarks, we can combine two `postgis` functions.

```
SELECT
    'No direct line of sight' AS info
FROM
    landmarks l1, landmarks l2, roads r
WHERE
    l1.name = 'Park' AND l2.name = 'Library' AND
    ST_Intersects(ST_MakeLine(l1.location, l2.location), r.path)
LIMIT 1;
```

This query returns the following:

```
| info                     |
|--------------------------|
| No direct line of sight  |
```

This tells us there's no direct line of sight between the Park and the Library.

## Performance considerations [Link to Performance considerations](https://neon.com/docs/extensions/postgis\#performance-considerations)

When working with PostGIS, thinking about performance is crucial, especially when dealing with large datasets or complex spatial queries.

### Indexing [Link to Indexing](https://neon.com/docs/extensions/postgis\#indexing)

**GIST** (Generalized Search Tree) is the default spatial index in PostGIS. GiST indexes are well-suited for multidimensional data, like points, lines, and polygons. It can significantly improve query performance, especially for spatial search operations and joins.

```
CREATE INDEX spatial_index_name ON landmarks USING GIST(location);
```

### Query optimization [Link to Query optimization](https://neon.com/docs/extensions/postgis\#query-optimization)

- **Unnecessary Casting**: `GEOMETRY` and `GEOGRAPHY` are the two primary data types in `postgis`, and a lot of functions are overloaded to work with both. However, casting between the two types can be expensive, so it's best to store data in the more frequently used type.
- **Use Appropriate Precision**: Reducing the precision of coordinates can often improve performance without significantly impacting the results.

## Conclusion [Link to Conclusion](https://neon.com/docs/extensions/postgis\#conclusion)

These examples provide a quick introduction to handling and analyzing spatial data in PostgresQL. We saw how to create tables with spatial data, insert data, and perform spatial queries using the `postgis` extension. It offers a powerful set of tools, with functions for calculating distances, identifying spatial relationships, and aggregating spatial data.

## Resources [Link to Resources](https://neon.com/docs/extensions/postgis\#resources)

- [PostGIS Documentation](https://postgis.net/documentation)
- [PostGIS Intro Workshop](https://postgis.net/workshops/postgis-intro/)

## Need help? [Link to Need help?](https://neon.com/docs/extensions/postgis\#need-help)

Join our [Discord Server](https://neon.com/discord) to ask questions or see what others are doing with Neon. For paid plan support options, see [Support](https://neon.tech/unify?a=67e8d32b-6473-47e9-8a3c-ba1a3eacf83a&n=docs/introduction/support).

Was this page helpful?

YesNo

Thank you for your feedback!

[Edit on GitHub](https://github.com/neondatabase/website/tree/main/content/docs/extensions/postgis.md)

[Previousplv8](https://neon.tech/unify?a=67e8d32b-6473-47e9-8a3c-ba1a3eacf83a&n=docs/extensions/plv8) [Nextpostgis-related](https://neon.tech/unify?a=67e8d32b-6473-47e9-8a3c-ba1a3eacf83a&n=docs/extensions/postgis-related-extensions)

### On this page

- [Enable the `postgis` extension](https://neon.com/docs/extensions/postgis#enable-the-postgis-extension)
- [Example usage](https://neon.com/docs/extensions/postgis#example-usage)
- [Spatial data types](https://neon.com/docs/extensions/postgis#spatial-data-types)
- [Longer example](https://neon.com/docs/extensions/postgis#longer-example)
- [Performance considerations](https://neon.com/docs/extensions/postgis#performance-considerations)
- [Conclusion](https://neon.com/docs/extensions/postgis#conclusion)
- [Resources](https://neon.com/docs/extensions/postgis#resources)
- [Need help?](https://neon.com/docs/extensions/postgis#need-help)

Neon Docs