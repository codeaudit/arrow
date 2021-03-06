<!---
  Licensed to the Apache Software Foundation (ASF) under one
  or more contributor license agreements.  See the NOTICE file
  distributed with this work for additional information
  regarding copyright ownership.  The ASF licenses this file
  to you under the Apache License, Version 2.0 (the
  "License"); you may not use this file except in compliance
  with the License.  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing,
  software distributed under the License is distributed on an
  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, either express or implied.  See the License for the
  specific language governing permissions and limitations
  under the License.
-->

[![Build Status](https://travis-ci.org/graphistry/arrow.svg?branch=master)](https://travis-ci.org/graphistry/arrow)

# [Apache Arrow](https://github.com/apache/arrow) in JS
Loading big native dataframes in JavaScript is finally awesome. `apache-arrow` provides an easy, modern, and efficient zero-copy JS interface to parse, iterate, and access [Apache Arrow](https://github.com/apache/arrow) columnar data on CPUs (GPU support via [GoAI](http://gpuopenanalytics.com/) is occurring in parallel).

`apache-arrow` is tested on Apache's sample Arrow files and [MapD Core's](https://www.mapd.com/platform/core/) Arrow output, and powers much of [Graphistry's](https://www.graphistry.com) GPU visual analytics platform. It is in active development by Graphistry for its GPU client/cloud visual graph analytics platform.

***This project has been developed outside the Apache Software Foundation, but an effort to transfer IP and ownership to the ASF is underway.***

## install
`npm install apache-arrow`

# What's Arrow?
Apache Arrow is a columnar memory layout specification for encoding vectors and table-like containers of flat and nested data. The Arrow spec aligns columnar data in memory to maximize caches and take advantage of the latest SIMD (Single input multiple data) and GPU operations on modern processors.

Apache Arrow is the emerging standard for large in-memory columnar data ([Spark](https://spark.apache.org/), [Pandas](http://wesmckinney.com/blog/pandas-and-apache-arrow/), [Drill](https://drill.apache.org/), ...). By standardizing on a common interchange format, big data systems can reduce the costs and friction associated with cross-system communication.

# Related Projects
* [Apache Arrow](https://github.com/apache/arrow) -- Arrow columnar format
* [GoAI](http://gpuopenanalytics.com/) -- Arrow standard extensions for GPUs
* [rxjs-mapd](https://github.com/graphistry/rxjs-mapd) -- Library for querying MapD Core in node

# Examples

## Get a table from an Arrow file on disk
```es6
import { readFileSync } from 'fs';
import { Table } from 'apache-arrow';

const arrow = readFileSync('simple.arrow');
const table = Table.from(arrow);

console.log(table.toString());

/*
 foo,  bar,  baz
   1,    1,   aa
null, null, null
   3, null, null
   4,    4,  bbb
   5,    5, cccc
*/
```

## Create a Table when the Arrow file is split across buffers
```es6
import { readFileSync } from 'fs';
import { Table } from 'apache-arrow';

const table = Table.from(...[
    'latlong/schema.arrow',
    'latlong/records.arrow'
].map((file) => readFileSync(file)));

console.log(table.toString());

/*
        origin_lat,         origin_lon
35.393089294433594,  -97.6007308959961
35.393089294433594,  -97.6007308959961
35.393089294433594,  -97.6007308959961
29.533695220947266, -98.46977996826172
29.533695220947266, -98.46977996826172
*/
```

## Columns are what you'd expect
```es6
import { readFileSync } from 'fs';
import { Table } from 'apache-arrow';

const table = Table.from(...[
    'latlong/schema.arrow',
    'latlong/records.arrow'
].map(readFileSync));

const column = table.getColumn('origin_lat');
const typed = column.slice();

assert(typed instanceof Float32Array);

for (let i = -1, n = column.length; ++i < n;) {
    assert(column.get(i) === typed[i]);
}
```

## Use with MapD Core

```es6
import MapD from 'rxjs-mapd';
import { Table } from 'apache-arrow';

const port = 9091;
const host = `localhost`;
const encrypted = false;
const username = `mapd`;
const password = `HyperInteractive`;
const dbName = `mapd`, timeout = 5000;

MapD.open(host, port, encrypted)
    .connect(dbName, username, password, timeout)
    .flatMap((session) =>
        session.queryDF(`
            SELECT origin_city
            FROM flights
            WHERE dest_city ILIKE 'dallas'
            LIMIT 5`
        ).disconnect()
  )
  .map(([schema, records]) =>
      Table.from(schema, records))
  .subscribe((table) => console.log(
      table.toString({ index: true })));
/*
Index,   origin_city
    0, Oklahoma City
    1, Oklahoma City
    2, Oklahoma City
    3,   San Antonio
    4,   San Antonio
*/
```

# Contribute

See [develop.md](https://github.com/graphistry/arrow/blob/master/develop.md)

Please create an issue if you encounter any bugs!

PR's welcome! Here's some ideas:

* API docs
* More Tests/Benchmarks
* Performance optimizations
* Arrows from node-streams and async-iterators
* GPU Arrows from node-opencl and node-cuda buffers
* Bindings to [libgdf](https://github.com/gpuopenanalytics/libgdf)

### packaging
`apache-arrow` is written in TypeScript, but the project is compiled to multiple JS versions and common module formats. The base `apache-arrow` package includes all the compilation targets for convenience, but if you're conscientious about your `node_modules` footprint, don't worry -- we got you. The targets are also published under the `@apache-arrow` namespace:
```sh
npm install @apache-arrow/es5-cjs # ES5 CommonJS target
npm install @apache-arrow/es5-esm # ES5 ESModules target
npm install @apache-arrow/es5-umd # ES5 UMD target
npm install @apache-arrow/es2015-cjs # ES2015 CommonJS target
npm install @apache-arrow/es2015-esm # ES2015 ESModules target
npm install @apache-arrow/es2015-umd # ES2015 UMD target
npm install @apache-arrow/esnext-esm # ESNext CommonJS target
npm install @apache-arrow/esnext-esm # ESNext ESModules target
npm install @apache-arrow/esnext-umd # ESNext UMD target
```

### why do we package like this?
The JS community is a diverse group with a varied list of target environments and tool chains. Publishing multiple packages accommodates projects of all types. Friends targeting the latest JS runtimes can pull in the ESNext + ESM build. Friends needing wide browser support and small download size can use the UMD bundle, which has been run through Google's Closure Compiler with advanced optimizations.

If you think we missed a compilation target and it's a blocker for adoption, please open an issue. We're here for you ❤️.

# License

[Apache 2.0](https://github.com/graphistry/arrow/blob/master/LICENSE)
