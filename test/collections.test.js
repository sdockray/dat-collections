import chai from 'chai';
import { navigateJson } from '../src/collections';

const expect = chai.expect;

describe('navigateJson function', () => {
  const collectionJson = {
    'collection name 1': [
      'path/to/item 1',
      'path/to/item 2',
      'path/to/item 3',
    ],
    'collection name 2': {
      subcollections: {
        'subcollection name 1': [
          'path/to/item 1',
          'path/to/item 2',
        ],
        'subcollection name 2': [
          'path/to/item 2',
          'path/to/item 3',
        ],
      },
      items: [
        'path/to/item A',
        'path/to/item B',
      ],
    },
  };

  it('returns the array of items if passed the path at root collection or tip of subcollections', () => {
    expect(navigateJson(collectionJson, ['collection name 1']))
      .to.eql([
        'path/to/item 1',
        'path/to/item 2',
        'path/to/item 3',
      ]);
    expect(navigateJson(collectionJson, ['collection name 2', 'subcollection name 2']))
      .to.eql([
        'path/to/item 2',
        'path/to/item 3',
      ]);
  });

  it('returns subcollection object by reference if path has subcollection', () => {
    expect(navigateJson(collectionJson, ['collection name 2']))
      .to.be.a('object')
      .and.have.all.keys([
        'subcollection name 1',
        'subcollection name 2',
      ]);
  });

  it('optionally returns specific key of the subcollection object if present at path', () => {
    expect(navigateJson(collectionJson, ['collection name 2'], 'items'))
      .to.eql([
        'path/to/item A',
        'path/to/item B',
      ]);
  });

  it('returns empty object if first argument is falsy', () => {
    expect(navigateJson()).to.eql({});
    expect(navigateJson(false)).to.eql({});
    expect(navigateJson(0)).to.eql({});
  });

  it('returns first arguement if path is not an array or is empty', () => {
    expect(navigateJson({ a: 'a' }, [])).to.eql({ a: 'a' });
    expect(navigateJson(collectionJson, 1)).to.eql(collectionJson);
    expect(navigateJson('woo', 'hello')).to.eql('woo');
  });

});
