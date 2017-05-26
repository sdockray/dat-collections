const hyperdrive = require('hyperdrive');
const discovery = require('hyperdiscovery');
const storage = require('dat-storage');
const Collections = require('./').default;

const key = 'ea17a8f2a05b6dc7f8556ec76b77b966004dec711c313bb8564a4895e2955cc0';
const archive = hyperdrive(storage('.'), key, { latest: true, sparse: true });

function onconnection() {
  console.log('connected!');
}

archive.on('ready', () => {
  discovery(archive, { live: true }).on('connection', onconnection);
});

const c = new Collections(archive);
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
      c.flatten().each(item => console.log(item[0], item[1]));
    });
  } else {
    c.flatten().each(item => console.log(item[0], item[1]));
  }
});

c.on('updated', () => {
  // c.get('good things').then(data => console.log(data))
});
