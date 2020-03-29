import {Cookies, JsonObject} from '../src/index';

/** Tests the [[Cookies]] class. */
describe('Cookies', () => {
  // Returns a map of the native cookies.
  function getNativeCookies(): Map<string, string> {
    const nativeCookies = new Map<string, string>();
    if (document.cookie.length) for (const value of document.cookie.split(';')) {
      const index = value.indexOf('=');
      nativeCookies.set(value.substring(0, index), value.substring(index + 1));
    }

    return nativeCookies;
  }

  describe('.keys', () => {
    it('should return an empty array if the current document has no associated cookie', () => {
      const cookies = new Cookies;
      expect(Array.isArray(cookies.keys)).toBe(true);
      expect(cookies.keys.length).toEqual([...getNativeCookies().keys()].length);
    });

    it('should return the keys of the cookies associated with the current document', () => {
      document.cookie = 'key1=foo';
      document.cookie = 'key2=bar';

      const cookies = new Cookies;
      expect(Array.isArray(cookies.keys)).toBe(true);
      expect(cookies.keys).toContain('key1');
      expect(cookies.keys).toContain('key2');
    });
  });

  describe('.length', () => {
    it('should return zero if the current document has no associated cookie', () => {
      expect(new Cookies().length).toEqual([...getNativeCookies().entries()].length);
    });

    it('should return the number of cookies associated with the current document', () => {
      const count = [...getNativeCookies().entries()].length;
      document.cookie = 'length1=foo';
      document.cookie = 'length2=bar';
      expect(new Cookies().length).toEqual(count + 2);
    });
  });

  describe('.onChanges', () => {
    it('should trigger an event when a cookie is added', done => {
      document.cookie = 'onChanges=; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      const cookies = new Cookies;
      const subscription = cookies.onChanges.subscribe(changes => {
        const keys = Object.keys(changes);
        expect(keys.length).toEqual(1);
        expect(keys[0]).toEqual('onChanges');

        const [record] = Object.values(changes);
        expect(record.currentValue).toEqual('foo');
        expect(record.previousValue).toBeUndefined();

        done();
      }, done);

      cookies.set('onChanges', 'foo');
      subscription.unsubscribe();
    });

    it('should trigger an event when a cookie is updated', done => {
      document.cookie = 'onChanges=foo';

      const cookies = new Cookies;
      const subscription = cookies.onChanges.subscribe(changes => {
        const keys = Object.keys(changes);
        expect(keys.length).toEqual(1);
        expect(keys[0]).toEqual('onChanges');

        const [record] = Object.values(changes);
        expect(record.currentValue).toEqual('bar');
        expect(record.previousValue).toEqual('foo');

        done();
      }, done);

      cookies.set('onChanges', 'bar');
      subscription.unsubscribe();
    });

    it('should trigger an event when a cookie is removed', done => {
      document.cookie = 'onChanges=bar';

      const cookies = new Cookies;
      const subscription = cookies.onChanges.subscribe(changes => {
        const keys = Object.keys(changes);
        expect(keys.length).toEqual(1);
        expect(keys[0]).toEqual('onChanges');

        const [record] = Object.values(changes);
        expect(record.currentValue).toBeUndefined();
        expect(record.previousValue).toEqual('bar');

        done();
      }, done);

      cookies.remove('onChanges');
      subscription.unsubscribe();
    });

    it('should trigger an event when all the cookies are removed', done => {
      document.cookie = 'onChanges1=foo';
      document.cookie = 'onChanges2=bar';

      const cookies = new Cookies;
      const subscription = cookies.onChanges.subscribe(changes => {
        const entries = Object.entries(changes);
        expect(entries.length).toBeGreaterThanOrEqual(2);

        let records = entries.filter(entry => entry[0] == 'onChanges1').map(entry => entry[1]);
        expect(records.length).toEqual(1);
        expect(records[0].currentValue).toBeUndefined();
        expect(records[0].previousValue).toEqual('foo');

        records = entries.filter(entry => entry[0] == 'onChanges2').map(entry => entry[1]);
        expect(records.length).toEqual(1);
        expect(records[0].currentValue).toBeUndefined();
        expect(records[0].previousValue).toEqual('bar');

        done();
      }, done);

      cookies.clear();
      subscription.unsubscribe();
    });
  });

  describe('.[Symbol.iterator]()', () => {
    it('should return a done iterator if the current document has no associated cookie', () => {
      const cookies = new Cookies;
      cookies.clear();
      const iterator = cookies[Symbol.iterator]();
      expect(iterator.next().done).toBe(true);
    });

    it('should return a value iterator if the current document has associated cookies', () => {
      const cookies = new Cookies;
      cookies.clear();

      const iterator = cookies[Symbol.iterator]();
      document.cookie = 'iterator1=foo';
      document.cookie = 'iterator2=bar';

      let next = iterator.next();
      expect(next.done).toBe(false);
      expect(Array.isArray(next.value)).toBe(true);
      expect(next.value[0]).toEqual('iterator1');
      expect(next.value[1]).toEqual('foo');

      next = iterator.next();
      expect(next.done).toBe(false);
      expect(next.value[0]).toEqual('iterator2');
      expect(next.value[1]).toEqual('bar');
      expect(iterator.next().done).toBe(true);
    });

    it('should allow the "iterable" protocol', () => {
      const cookies = new Cookies;
      cookies.clear();

      document.cookie = 'iterator1=foo';
      document.cookie = 'iterator2=bar';

      let index = 0;
      for (const [key, value] of cookies) {
        if (index == 0) {
          expect(key).toEqual('iterator1');
          expect(value).toEqual('foo');
        }
        else if (index == 1) {
          expect(key).toEqual('iterator2');
          expect(value).toEqual('bar');
        }
        else fail('More than two iteration rounds.');
        index++;
      }
    });
  });

  describe('.clear()', () => {
    it('should remove all the cookies associated with the current document', () => {
      document.cookie = 'clear1=foo';
      document.cookie = 'clear2=bar';

      new Cookies().clear();
      expect(document.cookie).not.toContain('clear1');
      expect(document.cookie).not.toContain('clear2');
    });
  });

  describe('.get()', () => {
    it('should properly get the cookies associated with the current document', () => {
      const cookies = new Cookies;
      expect(cookies.get('foo')).toBeUndefined();
      expect(cookies.get('foo', '123')).toEqual('123');

      document.cookie = 'get1=foo';
      expect(cookies.get('get1')).toEqual('foo');

      document.cookie = 'get2=123';
      expect(cookies.get('get2')).toEqual('123');
    });
  });

  describe('.getObject()', () => {
    it('should properly get the deserialized cookies associated with the current document', () => {
      const cookies = new Cookies;
      expect(cookies.getObject('foo')).toBeUndefined();
      expect(cookies.getObject('foo', {key: 'value'})).toEqual({key: 'value'});

      document.cookie = 'getObject1=123';
      expect(cookies.getObject('getObject1')).toEqual(123);

      document.cookie = 'getObject2=%22bar%22';
      expect(cookies.getObject('getObject2')).toEqual('bar');

      document.cookie = 'getObject3=%7B%22key%22%3A%22value%22%7D';
      expect(cookies.getObject('getObject3')).toEqual({key: 'value'});
    });

    it('should return the default value if the value can\'t be deserialized', () => {
      document.cookie = 'getObject4=bar';
      expect(new Cookies().getObject('getObject4', 'defaultValue')).toEqual('defaultValue');
    });
  });

  describe('.has()', () => {
    it('should return `false` if the current document has an associated cookie with the specified key', () => {
      expect(new Cookies().has('foo')).toBe(false);
    });

    it('should return `true` if the current document does not have an associated cookie with the specified key', () => {
      document.cookie = 'has1=foo';
      document.cookie = 'has2=bar';

      const cookies = new Cookies;
      expect(cookies.has('has1')).toBe(true);
      expect(cookies.has('has2')).toBe(true);
      expect(cookies.has('foo')).toBe(false);
      expect(cookies.has('bar')).toBe(false);
    });
  });

  describe('.putIfAbsent()', () => {
    it('should add a new entry if it does not exist', () => {
      const cookies = new Cookies;
      expect(document.cookie).not.toContain('putIfAbsent1');
      expect(cookies.putIfAbsent('putIfAbsent1', () => 'foo')).toEqual('foo');
      expect(document.cookie).toContain('putIfAbsent1=foo');
    });

    it('should not add a new entry if it already exists', () => {
      const cookies = new Cookies;
      document.cookie = 'putIfAbsent2=foo';
      expect(cookies.putIfAbsent('putIfAbsent2', () => 'bar')).toEqual('foo');
      expect(document.cookie).toContain('putIfAbsent2=foo');
    });
  });

  describe('.putObjectIfAbsent()', () => {
    it('should add a new entry if it does not exist', () => {
      const cookies = new Cookies;
      expect(document.cookie).not.toContain('putObjectIfAbsent1');
      expect(cookies.putObjectIfAbsent('putObjectIfAbsent1', () => 123)).toEqual(123);
      expect(document.cookie).toContain('putObjectIfAbsent1=123');
    });

    it('should not add a new entry if it already exists', () => {
      const cookies = new Cookies;
      document.cookie = 'putObjectIfAbsent2=123';
      expect(cookies.putObjectIfAbsent('putObjectIfAbsent2', () => 456)).toEqual(123);
      expect(document.cookie).toContain('putObjectIfAbsent2=123');
    });
  });

  describe('.remove()', () => {
    it('should properly remove the cookies associated with the current document', () => {
      const cookies = new Cookies;
      document.cookie = 'remove1=foo';
      document.cookie = 'remove2=bar';

      cookies.remove('remove1');
      expect(document.cookie).not.toContain('remove1');
      expect(document.cookie).toContain('remove2=bar');

      cookies.remove('remove2');
      expect(document.cookie).not.toContain('remove2');
    });
  });

  describe('.set()', () => {
    it('should properly set the cookies associated with the current document', () => {
      const cookies = new Cookies;
      expect(document.cookie).not.toContain('set1');
      expect(document.cookie).not.toContain('set2');

      cookies.set('set1', 'foo');
      expect(document.cookie).toContain('set1=foo');
      expect(document.cookie).not.toContain('set2');

      cookies.set('set2', 'bar');
      expect(document.cookie).toContain('set1=foo');
      expect(document.cookie).toContain('set2=bar');

      cookies.set('set1', '123');
      expect(document.cookie).toContain('set1=123');
      expect(document.cookie).toContain('set2=bar');
    });

    it('should throw an error if the specified key is empty', () => {
      expect(() => new Cookies().set('', 'foo')).toThrowError(TypeError);
    });
  });

  describe('.setObject()', () => {
    it('should properly serialize and set the cookies associated with the current document', () => {
      const cookies = new Cookies;
      expect(document.cookie).not.toContain('setObject1');
      expect(document.cookie).not.toContain('setObject2');

      cookies.setObject('setObject1', 123);
      expect(document.cookie).toContain('setObject1=123');
      expect(document.cookie).not.toContain('setObject2');

      cookies.setObject('setObject2', 'foo');
      expect(document.cookie).toContain('setObject1=123');
      expect(document.cookie).toContain('setObject2=%22foo%22');

      cookies.setObject('setObject1', {key: 'value'});
      expect(document.cookie).toContain('setObject1=%7B%22key%22%3A%22value%22%7D');
      expect(document.cookie).toContain('setObject2=%22foo%22');
    });

    it('should throw an error if the specified key is empty', () => {
      expect(() => new Cookies().setObject('', 'foo')).toThrowError(TypeError);
    });
  });

  describe('.toJSON()', () => {
    it('should return an empty map if the current document has no associated cookie', () => {
      const cookies = new Cookies;
      cookies.clear();
      expect(cookies.toJSON()).toEqual({} as JsonObject);
    });

    it('should return a non-empty map if the current document has associated cookies', () => {
      const cookies = new Cookies;
      cookies.clear();
      cookies.set('toJSON1', 'foo').set('toJSON2', 'bar');
      expect(cookies.toJSON()).toEqual({toJSON1: 'foo', toJSON2: 'bar'} as JsonObject);
    });
  });

  describe('.toString()', () => {
    it('should be the same value as `document.cookie` global property', () => {
      expect(String(new Cookies())).toEqual(document.cookie);
    });
  });
});
