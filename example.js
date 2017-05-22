var hyperdrive = require('hyperdrive')
var discovery = require('hyperdiscovery')
var storage = require('dat-storage')
var o = require('./')

var key = 'ea17a8f2a05b6dc7f8556ec76b77b966004dec711c313bb8564a4895e2955cc0'
var archive = hyperdrive(storage('.'), key, {latest: true, sparse: true})

archive.on('ready', function () {
  discovery(archive, {live: true}).on('connection', onconnection)
})

function onconnection() {
  console.log('connected!');
}

var c = new o.Collections(archive)
/*
c.list().then(data => console.log(data)).catch(() => console.log('error'))
c.subcollections('bad things').then(data => console.log(data)).catch(() => console.log('error'))
c.items('good things').then(data => console.log('good things', data)).catch(() => console.log('error'))
c.items('bad things').then(data => console.log('bad things', data)).catch(() => console.log('error'))
c.items('bad things', 'could be good things').then(data => console.log('could be good things', data)).catch(() => console.log('error'))
*/
archive.metadata.on('ready', function() {
  console.log('metadata ready')
  c.flatten().each(item => console.log(item[0],item[1])).catch(() => console.log('error'));
  // c.allItems('bad things').then(data => console.log('all items', data)).catch(() => console.log('error'));
})


c.on('updated', function() {
  c.get('good things').then(data => console.log(data))
})
