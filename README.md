# Dat collections

A utility for reading and writing `dat-collections.json` files in the dat root.

## Why?

A dat can have tens of thousands of files (or more) and it's occasionally useful to provide a way to make groupings of the contents. That's the whole purpose of dat-collections.json.

## Usage

So far, you can only list collections, get items in a collection, and getAll items in a collection and all of its subcollections. Eventually, I'd like to add writing data.

```javascript
const archive = new Hyperdrive('./some-hyperdrive');
const collections = new Collections(archive);

# Get all top-level collections
collections.list().then(theList => ...)

# Get a list of contents for a collection (but not its subcollections)
collections.get("collection name 1").then(aList => ...)

# Get a list of contents for a subcollection (but not _its_ subcollections)
collections.get("collection name 2", "subcollection name 1").then(aList => ...)

# Get a list of contents for a collection and all of its subcollections
collections.getAll("collection name 2").then(aList => ...)

```

## Format

The `dat-collections.json` file can only handle data formatted in a specific way. Right now it is like:

```json

{
  "collection name 1": [
    "path/to/item 1",
    "path/to/item 2",
    "path/to/item 3"
  ],
  "collection name 2": [
    "path/to/item A",
    "path/to/item 1",
    "path/to/item 2"
  ]
}

```

and actually there is a format where you can also make subcollections. In theory, you can make
as many levels of subcollections as you want, but I've only tested one level down.

```json

{
  "collection name 1": [
    "path/to/item 1",
    "path/to/item 2",
    "path/to/item 3"
  ],
  "collection name 2": {
    "subcollections": {
        "subcollection name 1": [
          "path/to/item 1",
          "path/to/item 2"
        ],
        "subcollection name 2": [
          "path/to/item 2",
          "path/to/item 3"
        ]
    },
    "items": [
      "path/to/item A",
      "path/to/item B"      
    ]
  }
}

```
