const path = require('path');
const hyperdrive = require('hyperdrive');
const discovery = require('hyperdiscovery');
const storage = require('dat-storage');
// const Collections = require('./').default;
const createCollection = require('./').createCollection;
const openCollections = require('./').openCollections;

const key = '924cc21ce857f4776e11d7903f4855b276ae40bc172a28cd393dbe8a674e31fb';
const st = '.';
const archive = hyperdrive(storage(st), key, { latest: true, sparse: true });

function onconnection() {
  console.log('connected!');
}

archive.on('ready', () => {
  console.log(`Archive ready: ${archive.key.toString('hex')}`);
  console.log(`Discovery key: ${archive.discoveryKey.toString('hex')}`);
  discovery(archive, { live: true }).on('connection', onconnection);
});

/*
c.list().then(data => console.log(data)).catch(() => console.log('error'))
c.subcollections('bad things').then(data => console.log(data)).catch(() => console.log('error'))
c.items('good things').then(data => console.log('good things', data)).catch(() => console.log('error'))
c.items('bad things').then(data => console.log('bad things', data)).catch(() => console.log('error'))
c.items('bad things', 'could be good things').then(data => console.log('could be good things', data)).catch(() => console.log('error'))
c.allItems('bad things').then(data => console.log('all items', data)).catch(() => console.log('error'));
*/

archive.metadata.on('ready', () => {
  if (!archive.metadata.length) {
    archive.metadata.on('sync', () => {
      /*
      openCollections(archive, 'dat-collections')
      .then(colls => colls.list())
      .then(files => createCollection(archive, path.join('dat-collections', files[1])))
      .then((c) => {
        c.contents().then(d => console.log(d));
        c.subcollections().then(d => console.log(d));
      });
      */
      createCollection(archive, 'dat-collections/another collection')
      .then((c) => {
        c.title(['First subcollection', 'A sub-sub-collection']).then(d => console.log(d));
        c.description(['First subcollection', 'A sub-sub-collection']).then(d => console.log(d));
        c.contents(['First subcollection']).then(d => console.log(d));
        c.contents().then(d => console.log(d));
        c.subcollections().then(d => console.log(d));
        c.flatten().then(d => console.log(d));
      });
  } else {
    /*
    openCollections(archive, 'dat-collections')
    .then(colls => colls.list())
    .then(files => createCollection(archive, path.join('dat-collections', files[1])))
    .then((c) => {
      c.contents().then(d => console.log(d));
      c.subcollections().then(d => console.log(d));
    });
    */
    createCollection(archive, 'dat-collections/another collection')
    .then((c) => {
      c.title(['First subcollection', 'A sub-sub-collection']).then(d => console.log(d));
      c.description(['First subcollection', 'A sub-sub-collection']).then(d => console.log(d));
      c.contents(['First subcollection']).then(d => console.log(d));
      c.contents().then(d => console.log(d));
      c.subcollections().then(d => console.log(d));
      c.flatten().then(d => console.log(d));
    });
  }
});
