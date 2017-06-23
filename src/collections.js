import path from 'path';
import Promise from 'bluebird';
import get from 'lodash/get';

// Error handling for JSON parsing
function jsonParse(str) {
  try {
    return JSON.parse(str)
  } catch (error) {
    return null;
  }
}

const hasTitle = (arr, title) => arr.title === title;

// Given a path (through subcollections) in array form
// ["collection A", "subcollection B", "subcollection C"]
// Get the object at A/B/C
export function navigateJson(data, paths, lastBranch = 'contents', defaultVal = '') {
  if (!data) return {};
  if (typeof paths === 'string') return navigateJson(data, [], paths, lastBranch);
  if (!Array.isArray(paths) || paths.length === 0) return data[lastBranch] || defaultVal;
  const subcollectionPaths = paths.reduce((p, path) => {
    p.push('subcollections');
    const idx = get(data, p).findIndex(element => element.title === path);
    if (idx >= 0) p.push(idx);
    return p;
  }, []);
  const result = get(data, subcollectionPaths);
  return result[lastBranch] || defaultVal;
}


export class Collection {
  constructor(archive, filename) {
    this.archive = archive;
    this.filename = filename;
    this.data = {};
  }
  init() {
    console.log('initializing');
    return this.loadData().then(() => this);
  }

  title(...path) {
    return this.ensureData()
    .then(data => navigateJson(data, ...path, 'title', ''));
  }

  description(...path) {
    return this.ensureData()
    .then(data => navigateJson(data, ...path, 'description', ''));
  }

  // Gets the items for a given (sub)collection. It won't get any items inside
  // its subcollections. It only returns items at this level
  contents(...path) {
    return this.ensureData()
    .then(data => navigateJson(data, ...path, 'contents', []));
  }

  // Gets the subcollections at a certain path
  subcollections(...path) {
    return this.ensureData()
    .then(data => navigateJson(data, ...path, 'subcollections', []))
    .map(subcollection => subcollection.title);
  }

  // A flat array of  [{item: path}, ...] which is helpful for building reverse lookup index
  flatten(...path) {
    const theItems = [];
    return this.contents(path)
      .map(item => [item, path])
      .then(items => theItems.push(...items))
      .then(() => this.subcollections(path))
      .map(subcollection => this.flatten(...path, subcollection))
      .each(subItems => theItems.push(...subItems))
      .then(() => theItems);
  }

  // add(filename, subcollection) {}

  // remove(filename) {}

  // Private
  // Every data access method should ensure that the data exists
  ensureData() {
    if (this.data) {
      return Promise.resolve(this.data);
    } else {
      return this.loadData();
    }
  }

  // Loads the file into the data object
  loadData() {
    const readAsync = Promise.promisify(this.archive.readFile, { context: this.archive });
    return readAsync(this.filename, 'utf-8')
    .then((data) => {
      this.data = jsonParse(data);
      return this.data;
    });
  }

}

// Default export class
export default class Collections {
  constructor(archive, dirname) {
    this.archive = archive;
    this.directory = dirname;
    this.data = [];
  }

  init() {
    console.log('initializing');
    return this.list()
    .then(files => console.log(`Found ${files.length} collections.`))
    .then(() => this);
  }

  list() {
    const readdirAsync = Promise.promisify(this.archive.readdir, { context: this.archive });
    return readdirAsync(this.directory)
      .catch(() => console.log(`There is no collections directory here: ${this.filesDir}`));
  }

  loadCollection(filename) {
    return createCollection(this.archive, path.join(this.directory, filename));
  }

}

// There are 3 ways a collection can be created:
// A. Archive is writeable, filename doesn't exist
// B. Archive is writeable, filename already exists
// C. Archive is not writeable, filename exists
export function createCollection(archive, filename) {
  const statAsync = Promise.promisify(archive.stat, { context: archive });
  return statAsync(filename)
  .then((stat) => {
    // It exists!
    if (stat.isFile()) {
      console.log('collection exists, loading');
      const c = new Collection(archive, filename);
      return c.init();
    }
    // It's a directory...
    console.log('Error: this is a directory');
    return Promise.reject();
  })
  .catch(() => {
    // It doesn't exist, but it is our archive, so let's create it
    if (archive.writeable) {
      console.log('collection does not exist, creating');
      const writeAsync = Promise.promisify(archive.writeFile, { context: archive });
      writeAsync(filename, '', 'utf-8')
      .then(() => {
        const c = new Collection(archive, filename);
        return c.init();
      });
    }
    // It doesn't exist and we don't have write access to it
    console.log('collection does not exist, no permission to create');
    return Promise.reject();
  });
}

export function openCollections(archive, dir) {
  const statAsync = Promise.promisify(archive.stat, { context: archive });
  return statAsync(dir)
  .then((stat) => {
    // It exists!
    if (stat.isDirectory()) {
      console.log('collections directory exists, loading');
      const c = new Collections(archive, dir);
      return c.init();
    }
    // It's not a directory...
    console.log('Error: this is not a directory');
    return Promise.reject();
  })
  .catch(() => {
    // It doesn't exist, but it is our archive, so let's create it
    if (archive.writeable) {
      console.log('collections directory does not exist, creating');
      // @TODO
    }
    // It doesn't exist and we don't have write access to it
    console.log('collections directory does not exist, no permission to create');
    return Promise.reject();
  });
}
