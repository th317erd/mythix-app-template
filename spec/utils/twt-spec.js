/* eslint-disable no-magic-numbers */

'use strict';

/* global describe, it, expect, fail */

const Utils = require('../../app/utils');

const encodedSecret = 'eyJzZWNyZXRLZXkiOiJmbWxGbXl0SzY5bFJmYl9rLTFsMm9oVG1HSjIyX25KMFdDUWR0YmVUQkRRPSIsIml2IjoieUZ0RHplemhTdFRTbFRwYThGSURTUT09In0=';
const opts = { encodedSecret };

describe('TWT', function() {
  const getNow = () => {
    return Math.floor(Date.now() / 1000.0);
  };

  it('should be able to generate and validate TWT', function() {
    let now = getNow();
    let token = Utils.generateTWT({ u: 'test' }, { ...opts });
    expect(token.length).toEqual(52);

    let claims = Utils.verifyTWT(token, opts);
    expect(claims.u).toEqual('test');
    expect(claims.validAt).toBeInstanceOf(Number);
    expect(Math.abs(claims.validAt - now) < 2).toEqual(true);
    expect(claims.expiresAt - claims.validAt).toEqual(2592000);
  });

  it('should be able to map claim keys', function() {
    let now = getNow();
    let token = Utils.generateTWT({ u: 'test' }, { ...opts });
    expect(token.length).toEqual(52);

    let claims = Utils.verifyTWT(token, { ...opts, keyMap: { u: 'userID' } });
    expect(claims.userID).toEqual('test');
    expect(claims.validAt).toBeInstanceOf(Number);
    expect(Math.abs(claims.validAt - now) < 2).toEqual(true);
    expect(claims.expiresAt - claims.validAt).toEqual(2592000);
  });

  it('should fail with bad cryptography shenanagins', function() {
    let token = Utils.generateTWT({ u: 'test' }, { ...opts });
    expect(token.length).toEqual(52);

    let badEncodedSecret = Utils.generateSalt();

    try {
      Utils.verifyTWT(token, { encodedSecret: badEncodedSecret });
      fail('unreachable');
    } catch (error) {
      expect(error).toBeInstanceOf(Utils.TWTError);
      expect(error.code).toEqual('EPARSE');
    }

    try {
      Utils.verifyTWT('t' + token, opts);
      fail('unreachable');
    } catch (error) {
      expect(error).toBeInstanceOf(Utils.TWTError);
      expect(error.code).toEqual('EPARSE');
    }

    try {
      Utils.verifyTWT('{"admin":true}', opts);
      fail('unreachable');
    } catch (error) {
      expect(error).toBeInstanceOf(Utils.TWTError);
      expect(error.code).toEqual('EPARSE');
    }
  });

  it('should fail with bad timestamps', function() {
    try {
      Utils.generateTWT({ u: 'test' }, { ...opts, validAt: getNow() - 1 });
      fail('unreachable');
    } catch (error) {
      expect(error).toBeInstanceOf(Utils.TWTError);
      expect(error.code).toEqual('EVALIDAT');
    }

    try {
      Utils.generateTWT({ u: 'test' }, { ...opts, validAt: getNow(), expiresAt: getNow() - 1 });
      fail('unreachable');
    } catch (error) {
      expect(error).toBeInstanceOf(Utils.TWTError);
      expect(error.code).toEqual('EEXPIRESAT');
    }

    try {
      Utils.generateTWT({ u: 'test' }, { ...opts, validAt: getNow() + 5, expiresAt: getNow() + 1 });
      fail('unreachable');
    } catch (error) {
      expect(error).toBeInstanceOf(Utils.TWTError);
      expect(error.code).toEqual('EEXPIRESAT');
    }
  });
});
