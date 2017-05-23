import Promise from 'bluebird';
import EventEmitter from 'events';
import pda from 'pauls-dat-api';

// Error handling for JSON parsing
function jsonParse(str) {
  let parsed = null;
  try {
    parsed = JSON.parse(str)
  } catch (error) {}
  return parsed;
}

// Given a path (through subcollections) in array form
// ["collection A", "subcollection B", "subcollection C"]
// Get the object at A/B/C
function navigateJson(data, path, lastBranch = 'subcollections') {
  if (!data) {
    return {};
  }
  if (path.length===0) {
    return (lastBranch === 'subcollections') ? data : [];
  }
  let obj = data;
  const lastPath = path.pop();
  // Navigate the tree, following the path up until the last part
  for (const p of path) {
    if (p in obj && 'subcollections' in obj[p]) {
      obj = obj[p].subcollections;
    } else {
      obj = [];
    }
  }
  // Get into position for going down the last branch
  if (lastPath && lastPath in obj) {
    obj = obj[lastPath];
  } else if (lastPath) {
    obj = [];
  }
  if (lastBranch === 'subcollections' && obj && lastBranch in obj) {
    obj = obj.subcollections;
  } else if (obj && lastBranch in obj) {
    obj = obj[lastBranch];
  }
  return Promise.resolve(obj);
}

// Default export class
class Collections  extends EventEmitter {
  constructor(archive, opts) {
    super();
    if (!opts) opts = {}
    this.archive = archive;
    this.fileName = opts.file ? '/' + opts.file : '/dat-collections.json';
    this.data = false;
    this.tree = {};
    this.listen();
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

  // Loads the data
  async loadData() {
    try {
      const contents = await pda.readFile(this.archive, this.fileName);
      this.data = jsonParse(contents);
      return this.data;
    } catch (error) {
      console.log('unable to load data from ' + this.fileName);
      // console.log(error);
    }
  }

  listen() {
    const fas = pda.createFileActivityStream(this.archive, this.fileName);
    fas.on('data', ([event, args]) => {
      if (event === 'changed') {
        this.loadData()
          .then(() => this.emit('updated', this));
      }
    });
  }

}

export default Collections;
