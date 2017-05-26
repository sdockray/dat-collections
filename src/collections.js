import Promise from 'bluebird';
import EventEmitter from 'events';
import pda from 'pauls-dat-api/es5';
import get from 'lodash/get';

// Error handling for JSON parsing
function jsonParse(str) {
  try {
    return JSON.parse(str)
  } catch (error) {
    return null;
  }
}

// Given a path (through subcollections) in array form
// ["collection A", "subcollection B", "subcollection C"]
// Get the object at A/B/C
export function navigateJson(data, paths, lastBranch = 'subcollections') {
  if (!data) return {};
  if (!Array.isArray(paths) || paths.length === 0 ) return data;
  const subcollectionPaths = paths.reduce((p, path, index) => {
    if (index < paths.length - 1) p.push(path, 'subcollections');
    else p.push(path);
    return p;
  }, []);
  const result = get(data, subcollectionPaths);
  return  result[lastBranch] || result;
}

// Default export class
export default class Collections extends EventEmitter {
  constructor(archive, opts) {
    super();
    if (!opts) opts = {}
    this.archive = archive;
    this.fileName = opts.file ? '/' + opts.file : '/dat-collections.json';
    this.data = false;
    this.pollingInterval = 1000;
    // Initialize data and listener
    this.archive.metadata.on('ready', () => {
      if (this.archive.metadata.length) {
        this.listen();
        this.loadData();
      } else {
        this.archive.metadata.once('sync', () => this.listen());
        this.archive.metadata.on('sync', () => this.loadData());
      }
    });
  }

  // Gets a list of top level collections
  list() {
    return this.ensureData().then(data => Object.keys(this.data));
  }

  // Gets all items below a certain point in subcollection tree
  allItems(...path) {
    const theItems = [];
    return this.items(...path)
      .then(items => theItems.push(...items))
      .then(() => this.subcollections(...path))
      .map(subcollection => this.allItems(...path, subcollection))
      .each(subItems => theItems.push(...subItems))
      .then(() => theItems);
  }

  // Gets the items for a given (sub)collection. It won't get any items inside
  // its subcollections. It only returns items at this level
  items(...path) {
    return this.ensureData()
      .then(data => navigateJson(data, path, 'items'));
  }

  // Gets the subcollections at a certain path
  subcollections(...path) {
    return this.ensureData()
      .then(data => navigateJson(data, path))
      .then(obj => (!!obj && obj.constructor === Object) ? Object.keys(obj) : []);
  }

  // Gets the entire contents (items & subcollections) of a single collection
  get(name) {
    return this.ensureData().then(data => data[name]);
  }

  // A flat array of  [{item: path}, ...] which is helpful for building reverse lookup index
  flatten(...path) {
    const theItems = [];
    return this.items(...path)
      .map(item => [item, path])
      .then(items => theItems.push(...items))
      .then(() => this.subcollections(...path))
      .map(subcollection => this.flatten(...path, subcollection))
      .each(subItems => theItems.push(...subItems))
      .then(() => theItems);
  }

  // Private
  // Every data access method should ensure that the data exists
  ensureData() {
    if (this.data) {
      return Promise.resolve(this.data);
    } else {
      return this.loadData();
    }
  }

  async loadData() {
    try {
      const contents = await pda.readFile(this.archive, this.fileName);
      this.data = jsonParse(contents);
      this.emit('loaded', this)
      return this.data;
    } catch (NotFoundError) {
      console.log('File not found in archive: ' + this.fileName);
      console.log('If the hyperdrive has just been created, this could be a bug where dat-collections isn\'t waiting for the metadata to be loaded');
      return [];
      // console.log(error);
    }
  }

  listen() {
    try {
      const fas = pda.createFileActivityStream(this.archive, this.fileName);
      console.log(`listening for changes to ${this.fileName}`);
      if (fas) {
        fas.on('data', ([event, args]) => {
          if (event === 'changed') {
            this.loadData()
              .then(() => this.emit('updated', this));
          }
        });
      }
    } catch (e) {
      this.archive.on('ready', () => this.listen());
    }
  }

}
