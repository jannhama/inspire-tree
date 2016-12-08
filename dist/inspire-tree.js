(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('lodash')) :
	typeof define === 'function' && define.amd ? define(['lodash'], factory) :
	(global.InspireTree = factory(global._$1));
}(this, (function (_$1) { 'use strict';

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');
}



function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

// Unique ID creation requires a high quality random # generator.  In the
// browser this is a little complicated due to unknown quality of Math.random()
// and inconsistent support for the `crypto` API.  We do the best we can via
// feature-detection
var rng$1;

var crypto = commonjsGlobal.crypto || commonjsGlobal.msCrypto; // for IE 11
if (crypto && crypto.getRandomValues) {
  // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
  var rnds8 = new Uint8Array(16);
  rng$1 = function whatwgRNG() {
    crypto.getRandomValues(rnds8);
    return rnds8;
  };
}

if (!rng$1) {
  // Math.random()-based (RNG)
  //
  // If all else fails, use Math.random().  It's fast, but is of unspecified
  // quality.
  var  rnds = new Array(16);
  rng$1 = function() {
    for (var i = 0, r; i < 16; i++) {
      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
      rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return rnds;
  };
}

var rngBrowser = rng$1;

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
var byteToHex = [];
for (var i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1);
}

function bytesToUuid$1(buf, offset) {
  var i = offset || 0;
  var bth = byteToHex;
  return  bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]];
}

var bytesToUuid_1 = bytesToUuid$1;

// Unique ID creation requires a high quality random # generator.  We feature
// detect to determine the best RNG source, normalizing to a function that
// returns 128-bits of randomness, since that's what's usually required
var rng = rngBrowser;
var bytesToUuid = bytesToUuid_1;

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html

// random #'s we need to init node and clockseq
var _seedBytes = rng();

// Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
var _nodeId = [
  _seedBytes[0] | 0x01,
  _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
];

// Per 4.2.2, randomize (14 bit) clockseq
var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

// Previous uuid creation time
var _lastMSecs = 0;
var _lastNSecs = 0;

// See https://github.com/broofa/node-uuid for API details
function v1$1(options, buf, offset) {
  var i = buf && offset || 0;
  var b = buf || [];

  options = options || {};

  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

  // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
  var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();

  // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock
  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

  // Time since last uuid creation (in msecs)
  var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

  // Per 4.2.1.2, Bump clockseq on clock regression
  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  }

  // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval
  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  }

  // Per 4.2.1.2 Throw error if too many uuids are requested
  if (nsecs >= 10000) {
    throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq;

  // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
  msecs += 12219292800000;

  // `time_low`
  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff;

  // `time_mid`
  var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff;

  // `time_high_and_version`
  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
  b[i++] = tmh >>> 16 & 0xff;

  // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
  b[i++] = clockseq >>> 8 | 0x80;

  // `clock_seq_low`
  b[i++] = clockseq & 0xff;

  // `node`
  var node = options.node || _nodeId;
  for (var n = 0; n < 6; ++n) {
    b[i + n] = node[n];
  }

  return buf ? buf : bytesToUuid(b);
}

var v1_1 = v1$1;

var rng$2 = rngBrowser;
var bytesToUuid$2 = bytesToUuid_1;

function v4$1(options, buf, offset) {
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options == 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || rng$2)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ++ii) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || bytesToUuid$2(rnds);
}

var v4_1 = v4$1;

var v1 = v1_1;
var v4 = v4_1;

var uuid = v4;
uuid.v1 = v1;
uuid.v4 = v4;

var index = uuid;

/**
 * Reset a node's state to the tree default.
 *
 * @private
 * @param {TreeNode} node Node object.
 * @returns {TreeNode} Node object.
 */
function resetState(node) {
    _.each(node._tree.defaultState, function (val, prop) {
        node.state(prop, val);
    });

    return node;
}

/**
 * Stores repetitive state change logic for most state methods.
 *
 * @private
 * @param {string} prop State property name.
 * @param {boolean} value New state value.
 * @param {string} verb Verb used for events.
 * @param {TreeNode} node Node object.
 * @param {string} deep Optional name of state method to call recursively.
 * @return {TreeNode} Node object.
 */
function baseStateChange(prop, value, verb, node, deep) {
    if (node.state(prop) !== value) {
        node._tree.dom.batch();

        if (node._tree.config.nodes.resetStateOnRestore && verb === 'restored') {
            resetState(node);
        }

        node.state(prop, value);

        node._tree.emit('node.' + verb, node);

        if (deep && node.hasChildren()) {
            node.children.recurseDown(function (child) {
                baseStateChange(prop, value, verb, child);
            });
        }

        node.markDirty();
        node._tree.dom.end();
    }

    return node;
}

var es6Promise = createCommonjsModule(function (module, exports) {
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
 * @version   4.0.5
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof undefined === 'function' && undefined.amd ? undefined(factory) :
    (global.ES6Promise = factory());
}(commonjsGlobal, (function () { 'use strict';

function objectOrFunction(x) {
  return typeof x === 'function' || typeof x === 'object' && x !== null;
}

function isFunction$$1(x) {
  return typeof x === 'function';
}

var _isArray = undefined;
if (!Array.isArray) {
  _isArray = function (x) {
    return Object.prototype.toString.call(x) === '[object Array]';
  };
} else {
  _isArray = Array.isArray;
}

var isArray$$1 = _isArray;

var len = 0;
var vertxNext = undefined;
var customSchedulerFn = undefined;

var asap = function asap(callback, arg) {
  queue[len] = callback;
  queue[len + 1] = arg;
  len += 2;
  if (len === 2) {
    // If len is 2, that means that we need to schedule an async flush.
    // If additional callbacks are queued before the queue is flushed, they
    // will be processed by this flush that we are scheduling.
    if (customSchedulerFn) {
      customSchedulerFn(flush);
    } else {
      scheduleFlush();
    }
  }
};

function setScheduler(scheduleFn) {
  customSchedulerFn = scheduleFn;
}

function setAsap(asapFn) {
  asap = asapFn;
}

var browserWindow = typeof window !== 'undefined' ? window : undefined;
var browserGlobal = browserWindow || {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && ({}).toString.call(process) === '[object process]';

// test for web worker but not in IE10
var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';

// node
function useNextTick() {
  // node version 0.10.x displays a deprecation warning when nextTick is used recursively
  // see https://github.com/cujojs/when/issues/410 for details
  return function () {
    return process.nextTick(flush);
  };
}

// vertx
function useVertxTimer() {
  if (typeof vertxNext !== 'undefined') {
    return function () {
      vertxNext(flush);
    };
  }

  return useSetTimeout();
}

function useMutationObserver() {
  var iterations = 0;
  var observer = new BrowserMutationObserver(flush);
  var node = document.createTextNode('');
  observer.observe(node, { characterData: true });

  return function () {
    node.data = iterations = ++iterations % 2;
  };
}

// web worker
function useMessageChannel() {
  var channel = new MessageChannel();
  channel.port1.onmessage = flush;
  return function () {
    return channel.port2.postMessage(0);
  };
}

function useSetTimeout() {
  // Store setTimeout reference so es6-promise will be unaffected by
  // other code modifying setTimeout (like sinon.useFakeTimers())
  var globalSetTimeout = setTimeout;
  return function () {
    return globalSetTimeout(flush, 1);
  };
}

var queue = new Array(1000);
function flush() {
  for (var i = 0; i < len; i += 2) {
    var callback = queue[i];
    var arg = queue[i + 1];

    callback(arg);

    queue[i] = undefined;
    queue[i + 1] = undefined;
  }

  len = 0;
}

function attemptVertx() {
  try {
    var r = commonjsRequire;
    var vertx = r('vertx');
    vertxNext = vertx.runOnLoop || vertx.runOnContext;
    return useVertxTimer();
  } catch (e) {
    return useSetTimeout();
  }
}

var scheduleFlush = undefined;
// Decide what async method to use to triggering processing of queued callbacks:
if (isNode) {
  scheduleFlush = useNextTick();
} else if (BrowserMutationObserver) {
  scheduleFlush = useMutationObserver();
} else if (isWorker) {
  scheduleFlush = useMessageChannel();
} else if (browserWindow === undefined && typeof commonjsRequire === 'function') {
  scheduleFlush = attemptVertx();
} else {
  scheduleFlush = useSetTimeout();
}

function then(onFulfillment, onRejection) {
  var _arguments = arguments;

  var parent = this;

  var child = new this.constructor(noop$$1);

  if (child[PROMISE_ID] === undefined) {
    makePromise(child);
  }

  var _state = parent._state;

  if (_state) {
    (function () {
      var callback = _arguments[_state - 1];
      asap(function () {
        return invokeCallback(_state, child, callback, parent._result);
      });
    })();
  } else {
    subscribe(parent, child, onFulfillment, onRejection);
  }

  return child;
}

/**
  `Promise.resolve` returns a promise that will become resolved with the
  passed `value`. It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    resolve(1);
  });

  promise.then(function(value){
    // value === 1
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.resolve(1);

  promise.then(function(value){
    // value === 1
  });
  ```

  @method resolve
  @static
  @param {Any} value value that the returned promise will be resolved with
  Useful for tooling.
  @return {Promise} a promise that will become fulfilled with the given
  `value`
*/
function resolve(object) {
  /*jshint validthis:true */
  var Constructor = this;

  if (object && typeof object === 'object' && object.constructor === Constructor) {
    return object;
  }

  var promise = new Constructor(noop$$1);
  _resolve(promise, object);
  return promise;
}

var PROMISE_ID = Math.random().toString(36).substring(16);

function noop$$1() {}

var PENDING = void 0;
var FULFILLED = 1;
var REJECTED = 2;

var GET_THEN_ERROR = new ErrorObject();

function selfFulfillment() {
  return new TypeError("You cannot resolve a promise with itself");
}

function cannotReturnOwn() {
  return new TypeError('A promises callback cannot return that same promise.');
}

function getThen(promise) {
  try {
    return promise.then;
  } catch (error) {
    GET_THEN_ERROR.error = error;
    return GET_THEN_ERROR;
  }
}

function tryThen(then, value, fulfillmentHandler, rejectionHandler) {
  try {
    then.call(value, fulfillmentHandler, rejectionHandler);
  } catch (e) {
    return e;
  }
}

function handleForeignThenable(promise, thenable, then) {
  asap(function (promise) {
    var sealed = false;
    var error = tryThen(then, thenable, function (value) {
      if (sealed) {
        return;
      }
      sealed = true;
      if (thenable !== value) {
        _resolve(promise, value);
      } else {
        fulfill(promise, value);
      }
    }, function (reason) {
      if (sealed) {
        return;
      }
      sealed = true;

      _reject(promise, reason);
    }, 'Settle: ' + (promise._label || ' unknown promise'));

    if (!sealed && error) {
      sealed = true;
      _reject(promise, error);
    }
  }, promise);
}

function handleOwnThenable(promise, thenable) {
  if (thenable._state === FULFILLED) {
    fulfill(promise, thenable._result);
  } else if (thenable._state === REJECTED) {
    _reject(promise, thenable._result);
  } else {
    subscribe(thenable, undefined, function (value) {
      return _resolve(promise, value);
    }, function (reason) {
      return _reject(promise, reason);
    });
  }
}

function handleMaybeThenable(promise, maybeThenable, then$$) {
  if (maybeThenable.constructor === promise.constructor && then$$ === then && maybeThenable.constructor.resolve === resolve) {
    handleOwnThenable(promise, maybeThenable);
  } else {
    if (then$$ === GET_THEN_ERROR) {
      _reject(promise, GET_THEN_ERROR.error);
    } else if (then$$ === undefined) {
      fulfill(promise, maybeThenable);
    } else if (isFunction$$1(then$$)) {
      handleForeignThenable(promise, maybeThenable, then$$);
    } else {
      fulfill(promise, maybeThenable);
    }
  }
}

function _resolve(promise, value) {
  if (promise === value) {
    _reject(promise, selfFulfillment());
  } else if (objectOrFunction(value)) {
    handleMaybeThenable(promise, value, getThen(value));
  } else {
    fulfill(promise, value);
  }
}

function publishRejection(promise) {
  if (promise._onerror) {
    promise._onerror(promise._result);
  }

  publish(promise);
}

function fulfill(promise, value) {
  if (promise._state !== PENDING) {
    return;
  }

  promise._result = value;
  promise._state = FULFILLED;

  if (promise._subscribers.length !== 0) {
    asap(publish, promise);
  }
}

function _reject(promise, reason) {
  if (promise._state !== PENDING) {
    return;
  }
  promise._state = REJECTED;
  promise._result = reason;

  asap(publishRejection, promise);
}

function subscribe(parent, child, onFulfillment, onRejection) {
  var _subscribers = parent._subscribers;
  var length = _subscribers.length;

  parent._onerror = null;

  _subscribers[length] = child;
  _subscribers[length + FULFILLED] = onFulfillment;
  _subscribers[length + REJECTED] = onRejection;

  if (length === 0 && parent._state) {
    asap(publish, parent);
  }
}

function publish(promise) {
  var subscribers = promise._subscribers;
  var settled = promise._state;

  if (subscribers.length === 0) {
    return;
  }

  var child = undefined,
      callback = undefined,
      detail = promise._result;

  for (var i = 0; i < subscribers.length; i += 3) {
    child = subscribers[i];
    callback = subscribers[i + settled];

    if (child) {
      invokeCallback(settled, child, callback, detail);
    } else {
      callback(detail);
    }
  }

  promise._subscribers.length = 0;
}

function ErrorObject() {
  this.error = null;
}

var TRY_CATCH_ERROR = new ErrorObject();

function tryCatch(callback, detail) {
  try {
    return callback(detail);
  } catch (e) {
    TRY_CATCH_ERROR.error = e;
    return TRY_CATCH_ERROR;
  }
}

function invokeCallback(settled, promise, callback, detail) {
  var hasCallback = isFunction$$1(callback),
      value = undefined,
      error = undefined,
      succeeded = undefined,
      failed = undefined;

  if (hasCallback) {
    value = tryCatch(callback, detail);

    if (value === TRY_CATCH_ERROR) {
      failed = true;
      error = value.error;
      value = null;
    } else {
      succeeded = true;
    }

    if (promise === value) {
      _reject(promise, cannotReturnOwn());
      return;
    }
  } else {
    value = detail;
    succeeded = true;
  }

  if (promise._state !== PENDING) {
    // noop
  } else if (hasCallback && succeeded) {
      _resolve(promise, value);
    } else if (failed) {
      _reject(promise, error);
    } else if (settled === FULFILLED) {
      fulfill(promise, value);
    } else if (settled === REJECTED) {
      _reject(promise, value);
    }
}

function initializePromise(promise, resolver) {
  try {
    resolver(function resolvePromise(value) {
      _resolve(promise, value);
    }, function rejectPromise(reason) {
      _reject(promise, reason);
    });
  } catch (e) {
    _reject(promise, e);
  }
}

var id = 0;
function nextId() {
  return id++;
}

function makePromise(promise) {
  promise[PROMISE_ID] = id++;
  promise._state = undefined;
  promise._result = undefined;
  promise._subscribers = [];
}

function Enumerator(Constructor, input) {
  this._instanceConstructor = Constructor;
  this.promise = new Constructor(noop$$1);

  if (!this.promise[PROMISE_ID]) {
    makePromise(this.promise);
  }

  if (isArray$$1(input)) {
    this._input = input;
    this.length = input.length;
    this._remaining = input.length;

    this._result = new Array(this.length);

    if (this.length === 0) {
      fulfill(this.promise, this._result);
    } else {
      this.length = this.length || 0;
      this._enumerate();
      if (this._remaining === 0) {
        fulfill(this.promise, this._result);
      }
    }
  } else {
    _reject(this.promise, validationError());
  }
}

function validationError() {
  return new Error('Array Methods must be provided an Array');
}

Enumerator.prototype._enumerate = function () {
  var length = this.length;
  var _input = this._input;

  for (var i = 0; this._state === PENDING && i < length; i++) {
    this._eachEntry(_input[i], i);
  }
};

Enumerator.prototype._eachEntry = function (entry, i) {
  var c = this._instanceConstructor;
  var resolve$$ = c.resolve;

  if (resolve$$ === resolve) {
    var _then = getThen(entry);

    if (_then === then && entry._state !== PENDING) {
      this._settledAt(entry._state, i, entry._result);
    } else if (typeof _then !== 'function') {
      this._remaining--;
      this._result[i] = entry;
    } else if (c === Promise) {
      var promise = new c(noop$$1);
      handleMaybeThenable(promise, entry, _then);
      this._willSettleAt(promise, i);
    } else {
      this._willSettleAt(new c(function (resolve$$) {
        return resolve$$(entry);
      }), i);
    }
  } else {
    this._willSettleAt(resolve$$(entry), i);
  }
};

Enumerator.prototype._settledAt = function (state, i, value) {
  var promise = this.promise;

  if (promise._state === PENDING) {
    this._remaining--;

    if (state === REJECTED) {
      _reject(promise, value);
    } else {
      this._result[i] = value;
    }
  }

  if (this._remaining === 0) {
    fulfill(promise, this._result);
  }
};

Enumerator.prototype._willSettleAt = function (promise, i) {
  var enumerator = this;

  subscribe(promise, undefined, function (value) {
    return enumerator._settledAt(FULFILLED, i, value);
  }, function (reason) {
    return enumerator._settledAt(REJECTED, i, reason);
  });
};

/**
  `Promise.all` accepts an array of promises, and returns a new promise which
  is fulfilled with an array of fulfillment values for the passed promises, or
  rejected with the reason of the first passed promise to be rejected. It casts all
  elements of the passed iterable to promises as it runs this algorithm.

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = resolve(2);
  let promise3 = resolve(3);
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = reject(new Error("2"));
  let promise3 = reject(new Error("3"));
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @static
  @param {Array} entries array of promises
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
  @static
*/
function all(entries) {
  return new Enumerator(this, entries).promise;
}

/**
  `Promise.race` returns a new promise which is settled in the same way as the
  first passed promise to settle.

  Example:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 2');
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // result === 'promise 2' because it was resolved before promise1
    // was resolved.
  });
  ```

  `Promise.race` is deterministic in that only the state of the first
  settled promise matters. For example, even if other promises given to the
  `promises` array argument are resolved, but the first settled promise has
  become rejected before the other promises became fulfilled, the returned
  promise will become rejected:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error('promise 2'));
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // Code here never runs
  }, function(reason){
    // reason.message === 'promise 2' because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  An example real-world use case is implementing timeouts:

  ```javascript
  Promise.race([ajax('foo.json'), timeout(5000)])
  ```

  @method race
  @static
  @param {Array} promises array of promises to observe
  Useful for tooling.
  @return {Promise} a promise which settles in the same way as the first passed
  promise to settle.
*/
function race(entries) {
  /*jshint validthis:true */
  var Constructor = this;

  if (!isArray$$1(entries)) {
    return new Constructor(function (_, reject) {
      return reject(new TypeError('You must pass an array to race.'));
    });
  } else {
    return new Constructor(function (resolve, reject) {
      var length = entries.length;
      for (var i = 0; i < length; i++) {
        Constructor.resolve(entries[i]).then(resolve, reject);
      }
    });
  }
}

/**
  `Promise.reject` returns a promise rejected with the passed `reason`.
  It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @static
  @param {Any} reason value that the returned promise will be rejected with.
  Useful for tooling.
  @return {Promise} a promise rejected with the given `reason`.
*/
function reject(reason) {
  /*jshint validthis:true */
  var Constructor = this;
  var promise = new Constructor(noop$$1);
  _reject(promise, reason);
  return promise;
}

function needsResolver() {
  throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
}

function needsNew() {
  throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
}

/**
  Promise objects represent the eventual result of an asynchronous operation. The
  primary way of interacting with a promise is through its `then` method, which
  registers callbacks to receive either a promise's eventual value or the reason
  why the promise cannot be fulfilled.

  Terminology
  -----------

  - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
  - `thenable` is an object or function that defines a `then` method.
  - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
  - `exception` is a value that is thrown using the throw statement.
  - `reason` is a value that indicates why a promise was rejected.
  - `settled` the final resting state of a promise, fulfilled or rejected.

  A promise can be in one of three states: pending, fulfilled, or rejected.

  Promises that are fulfilled have a fulfillment value and are in the fulfilled
  state.  Promises that are rejected have a rejection reason and are in the
  rejected state.  A fulfillment value is never a thenable.

  Promises can also be said to *resolve* a value.  If this value is also a
  promise, then the original promise's settled state will match the value's
  settled state.  So a promise that *resolves* a promise that rejects will
  itself reject, and a promise that *resolves* a promise that fulfills will
  itself fulfill.


  Basic Usage:
  ------------

  ```js
  let promise = new Promise(function(resolve, reject) {
    // on success
    resolve(value);

    // on failure
    reject(reason);
  });

  promise.then(function(value) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Advanced Usage:
  ---------------

  Promises shine when abstracting away asynchronous interactions such as
  `XMLHttpRequest`s.

  ```js
  function getJSON(url) {
    return new Promise(function(resolve, reject){
      let xhr = new XMLHttpRequest();

      xhr.open('GET', url);
      xhr.onreadystatechange = handler;
      xhr.responseType = 'json';
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.send();

      function handler() {
        if (this.readyState === this.DONE) {
          if (this.status === 200) {
            resolve(this.response);
          } else {
            reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
          }
        }
      };
    });
  }

  getJSON('/posts.json').then(function(json) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Unlike callbacks, promises are great composable primitives.

  ```js
  Promise.all([
    getJSON('/posts'),
    getJSON('/comments')
  ]).then(function(values){
    values[0] // => postsJSON
    values[1] // => commentsJSON

    return values;
  });
  ```

  @class Promise
  @param {function} resolver
  Useful for tooling.
  @constructor
*/
function Promise(resolver) {
  this[PROMISE_ID] = nextId();
  this._result = this._state = undefined;
  this._subscribers = [];

  if (noop$$1 !== resolver) {
    typeof resolver !== 'function' && needsResolver();
    this instanceof Promise ? initializePromise(this, resolver) : needsNew();
  }
}

Promise.all = all;
Promise.race = race;
Promise.resolve = resolve;
Promise.reject = reject;
Promise._setScheduler = setScheduler;
Promise._setAsap = setAsap;
Promise._asap = asap;

Promise.prototype = {
  constructor: Promise,

  /**
    The primary way of interacting with a promise is through its `then` method,
    which registers callbacks to receive either a promise's eventual value or the
    reason why the promise cannot be fulfilled.
  
    ```js
    findUser().then(function(user){
      // user is available
    }, function(reason){
      // user is unavailable, and you are given the reason why
    });
    ```
  
    Chaining
    --------
  
    The return value of `then` is itself a promise.  This second, 'downstream'
    promise is resolved with the return value of the first promise's fulfillment
    or rejection handler, or rejected if the handler throws an exception.
  
    ```js
    findUser().then(function (user) {
      return user.name;
    }, function (reason) {
      return 'default name';
    }).then(function (userName) {
      // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
      // will be `'default name'`
    });
  
    findUser().then(function (user) {
      throw new Error('Found user, but still unhappy');
    }, function (reason) {
      throw new Error('`findUser` rejected and we're unhappy');
    }).then(function (value) {
      // never reached
    }, function (reason) {
      // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
      // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
    });
    ```
    If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.
  
    ```js
    findUser().then(function (user) {
      throw new PedagogicalException('Upstream error');
    }).then(function (value) {
      // never reached
    }).then(function (value) {
      // never reached
    }, function (reason) {
      // The `PedgagocialException` is propagated all the way down to here
    });
    ```
  
    Assimilation
    ------------
  
    Sometimes the value you want to propagate to a downstream promise can only be
    retrieved asynchronously. This can be achieved by returning a promise in the
    fulfillment or rejection handler. The downstream promise will then be pending
    until the returned promise is settled. This is called *assimilation*.
  
    ```js
    findUser().then(function (user) {
      return findCommentsByAuthor(user);
    }).then(function (comments) {
      // The user's comments are now available
    });
    ```
  
    If the assimliated promise rejects, then the downstream promise will also reject.
  
    ```js
    findUser().then(function (user) {
      return findCommentsByAuthor(user);
    }).then(function (comments) {
      // If `findCommentsByAuthor` fulfills, we'll have the value here
    }, function (reason) {
      // If `findCommentsByAuthor` rejects, we'll have the reason here
    });
    ```
  
    Simple Example
    --------------
  
    Synchronous Example
  
    ```javascript
    let result;
  
    try {
      result = findResult();
      // success
    } catch(reason) {
      // failure
    }
    ```
  
    Errback Example
  
    ```js
    findResult(function(result, err){
      if (err) {
        // failure
      } else {
        // success
      }
    });
    ```
  
    Promise Example;
  
    ```javascript
    findResult().then(function(result){
      // success
    }, function(reason){
      // failure
    });
    ```
  
    Advanced Example
    --------------
  
    Synchronous Example
  
    ```javascript
    let author, books;
  
    try {
      author = findAuthor();
      books  = findBooksByAuthor(author);
      // success
    } catch(reason) {
      // failure
    }
    ```
  
    Errback Example
  
    ```js
  
    function foundBooks(books) {
  
    }
  
    function failure(reason) {
  
    }
  
    findAuthor(function(author, err){
      if (err) {
        failure(err);
        // failure
      } else {
        try {
          findBoooksByAuthor(author, function(books, err) {
            if (err) {
              failure(err);
            } else {
              try {
                foundBooks(books);
              } catch(reason) {
                failure(reason);
              }
            }
          });
        } catch(error) {
          failure(err);
        }
        // success
      }
    });
    ```
  
    Promise Example;
  
    ```javascript
    findAuthor().
      then(findBooksByAuthor).
      then(function(books){
        // found books
    }).catch(function(reason){
      // something went wrong
    });
    ```
  
    @method then
    @param {Function} onFulfilled
    @param {Function} onRejected
    Useful for tooling.
    @return {Promise}
  */
  then: then,

  /**
    `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
    as the catch block of a try/catch statement.
  
    ```js
    function findAuthor(){
      throw new Error('couldn't find that author');
    }
  
    // synchronous
    try {
      findAuthor();
    } catch(reason) {
      // something went wrong
    }
  
    // async with promises
    findAuthor().catch(function(reason){
      // something went wrong
    });
    ```
  
    @method catch
    @param {Function} onRejection
    Useful for tooling.
    @return {Promise}
  */
  'catch': function _catch(onRejection) {
    return this.then(null, onRejection);
  }
};

function polyfill() {
    var local = undefined;

    if (typeof commonjsGlobal !== 'undefined') {
        local = commonjsGlobal;
    } else if (typeof self !== 'undefined') {
        local = self;
    } else {
        try {
            local = Function('return this')();
        } catch (e) {
            throw new Error('polyfill failed because global object is unavailable in this environment');
        }
    }

    var P = local.Promise;

    if (P) {
        var promiseToString = null;
        try {
            promiseToString = Object.prototype.toString.call(P.resolve());
        } catch (e) {
            // silently ignored
        }

        if (promiseToString === '[object Promise]' && !P.cast) {
            return;
        }
    }

    local.Promise = Promise;
}

// Strange compat..
Promise.polyfill = polyfill;
Promise.Promise = Promise;

return Promise;

})));
});

var Promise$1 = es6Promise.Promise;

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();







var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

var get$2 = function get$2(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get$2(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};



var set$1 = function set$1(object, property, value, receiver) {
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent !== null) {
      set$1(parent, property, value, receiver);
    }
  } else if ("value" in desc && desc.writable) {
    desc.value = value;
  } else {
    var setter = desc.set;

    if (setter !== undefined) {
      setter.call(receiver, value);
    }
  }

  return value;
};

// Libs

function _extendableBuiltin(cls) {
    function ExtendableBuiltin() {
        cls.apply(this, arguments);
    }

    ExtendableBuiltin.prototype = Object.create(cls.prototype, {
        constructor: {
            value: cls,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });

    if (Object.setPrototypeOf) {
        Object.setPrototypeOf(ExtendableBuiltin, cls);
    } else {
        ExtendableBuiltin.__proto__ = cls;
    }

    return ExtendableBuiltin;
}

/**
 * Base function to filter nodes by state value.
 *
 * @private
 * @param {string} state State property
 * @param {boolean} full Return a non-flat hierarchy
 * @return {TreeNodes} Array of matching nodes.
 */
function baseStatePredicate(state, full) {
    if (full) {
        return this.extract(state);
    }

    // Cache a state predicate function
    var fn = getPredicateFunction(state);

    return this.flatten(function (node) {
        // Never include removed nodes unless specifically requested
        if (state !== 'removed' && node.removed()) {
            return false;
        }

        return fn(node);
    });
}

/**
 * Base function to invoke given method(s) on tree nodes.
 *
 * @private
 * @param {TreeNode} nodes Array of node objects.
 * @param {string|array} methods Method names.
 * @param {array|Arguments} args Array of arguments to proxy.
 * @param {boolean} deep Invoke deeply.
 * @return {TreeNodes} Array of node objects.
 */
function baseInvoke(nodes, methods, args, deep) {
    methods = _$1.castArray(methods);

    nodes._tree.dom.batch();

    nodes[deep ? 'recurseDown' : 'each'](function (node) {
        _$1.each(methods, function (method) {
            if (_$1.isFunction(node[method])) {
                node[method].apply(node, args);
            }
        });
    });

    nodes._tree.dom.end();

    return nodes;
}

/**
 * Creates a predicate function.
 *
 * @private
 * @param {string|function} predicate Property name or custom function.
 * @return {function} Predicate function.
 */
function getPredicateFunction(predicate) {
    var fn = predicate;
    if (_$1.isString(predicate)) {
        fn = function fn(node) {
            return _$1.isFunction(node[predicate]) ? node[predicate]() : node[predicate];
        };
    }

    return fn;
}

/**
 * An Array-like collection of TreeNodes.
 *
 * Note: Due to issue in many javascript environments,
 * native objects are problematic to extend correctly
 * so we mimic it, not actually extend it.
 *
 * @category TreeNodes
 * @param {array} array Array of TreeNode objects.
 * @return {TreeNodes} Collection of TreeNode
 */
var TreeNodes = function (_extendableBuiltin2) {
    inherits(TreeNodes, _extendableBuiltin2);

    function TreeNodes(tree, array) {
        classCallCheck(this, TreeNodes);

        var _this = possibleConstructorReturn(this, (TreeNodes.__proto__ || Object.getPrototypeOf(TreeNodes)).call(this));

        _this._tree = tree;
        _this.length = 0;

        var treeNodes = _this;
        if (_$1.isArray(array) || array instanceof TreeNodes) {
            _$1.each(array, function (node) {
                if (node instanceof TreeNode) {
                    treeNodes.push(node.clone());
                }
            });
        }
        return _this;
    }

    /**
     * Adds a new node to this collection. If a sort
     * method is configured, the node will be added
     * in the appropriate order.
     *
     * @category TreeNodes
     * @param {object} object Node
     * @return {TreeNode} Node object.
     */


    createClass(TreeNodes, [{
        key: 'addNode',
        value: function addNode(object) {
            // Base insertion index
            var index = this.length;

            // If tree is sorted, insert in correct position
            if (this._tree.config.sort) {
                index = _$1.sortedIndexBy(this, object, this._tree.config.sort);
            }

            return this.insertAt(index, object);
        }

        /**
         * Query for all available nodes.
         *
         * @category TreeNodes
         * @param {boolean} full Retain full hiearchy.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'available',
        value: function available(full) {
            return baseStatePredicate.call(this, 'available', full);
        }

        /**
         * Blur children in this collection.
         *
         * @category TreeNodes
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'blur',
        value: function blur() {
            return this.invoke('blur');
        }

        /**
         * Blur all children (deeply) in this collection.
         *
         * @category TreeNodes
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'blurDeep',
        value: function blurDeep() {
            return this.invokeDeep('blur');
        }

        /**
         * Query for all checked nodes.
         *
         * @category TreeNodes
         * @param {boolean} full Retain full hiearchy.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'checked',
        value: function checked(full) {
            return baseStatePredicate.call(this, 'checked', full);
        }

        /**
         * Clean children in this collection.
         *
         * @category TreeNodes
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'clean',
        value: function clean() {
            return this.invoke('clean');
        }

        /**
         * Clones (deep) the array of nodes.
         *
         * Note: Cloning will *not* clone the context pointer.
         *
         * @category TreeNodes
         * @return {TreeNodes} Array of cloned nodes.
         */

    }, {
        key: 'clone',
        value: function clone() {
            return new TreeNodes(this._tree, this);
        }

        /**
         * Collapse children in this collection.
         *
         * @category TreeNodes
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'collapse',
        value: function collapse() {
            return this.invoke('collapse');
        }

        /**
         * Query for all collapsed nodes.
         *
         * @category TreeNodes
         * @param {boolean} full Retain full hiearchy.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'collapsed',
        value: function collapsed(full) {
            return baseStatePredicate.call(this, 'collapsed', full);
        }

        /**
         * Collapse all children (deeply) in this collection.
         *
         * @category TreeNodes
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'collapseDeep',
        value: function collapseDeep() {
            return this.invokeDeep('collapse');
        }

        /**
         * Concat nodes like an Array would.
         *
         * @category TreeNodes
         * @param {TreeNodes} nodes Array of nodes.
         * @return {TreeNodes} Resulting node array.
         */

    }, {
        key: 'concat',
        value: function concat(nodes) {
            var newNodes = new TreeNodes(this._tree);
            newNodes._context = this._context;

            var pusher = function pusher(node) {
                if (node instanceof TreeNode) {
                    newNodes.push(node);
                }
            };

            _$1.each(this, pusher);
            _$1.each(nodes, pusher);

            return newNodes;
        }

        /**
         * Get the context of this collection. If a collection
         * of children, context is the parent node. Otherwise
         * the context is the tree itself.
         *
         * @category TreeNodes
         * @return {TreeNode|object} Node object or tree instance.
         */

    }, {
        key: 'context',
        value: function context() {
            return this._context || this._tree;
        }

        /**
         * Copies nodes to a new tree instance.
         *
         * @category TreeNodes
         * @param {boolean} hierarchy Include necessary ancestors to match hierarchy.
         * @return {object} Methods to perform action on copied nodes.
         */

    }, {
        key: 'copy',
        value: function copy(hierarchy) {
            var nodes = this;

            return {

                /**
                 * Sets a destination.
                 *
                 * @category CopyNode
                 * @param {object} dest Destination Inspire Tree.
                 * @return {array} Array of new nodes.
                 */
                to: function to(dest) {
                    if (!_$1.isFunction(dest.addNodes)) {
                        throw new Error('Destination must be an Inspire Tree instance.');
                    }

                    var newNodes = new TreeNodes(this._tree);

                    _$1.each(nodes, function (node) {
                        newNodes.push(node.copy(hierarchy).to(dest));
                    });

                    return newNodes;
                }
            };
        }

        /**
         * Returns deepest nodes from this array.
         *
         * @category TreeNodes
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'deepest',
        value: function deepest() {
            var matches = new TreeNodes(this._tree);

            this.recurseDown(function (node) {
                if (!node.children) {
                    matches.push(node);
                }
            });

            return matches;
        }

        /**
         * Deselect children in this collection.
         *
         * @category TreeNodes
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'deselect',
        value: function deselect() {
            return this.invoke('deselect');
        }

        /**
         * Deselect all children (deeply) in this collection.
         *
         * @category TreeNodes
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'deselectDeep',
        value: function deselectDeep() {
            return this.invokeDeep('deselect');
        }

        /**
         * Iterate every TreeNode in this collection.
         *
         * @category TreeNodes
         * @param {function} iteratee Iteratee invoke for each node.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'each',
        value: function each(iteratee) {
            _$1.each(this, iteratee);

            return this;
        }

        /**
         * Query for all editable nodes.
         *
         * @category TreeNodes
         * @param {boolean} full Retain full hiearchy.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'editable',
        value: function editable(full) {
            return baseStatePredicate.call(this, 'editable', full);
        }

        /**
         * Query for all nodes in editing mode.
         *
         * @category TreeNodes
         * @param {boolean} full Retain full hiearchy.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'editing',
        value: function editing(full) {
            return baseStatePredicate.call(this, 'editing', full);
        }

        /**
         * Expand children in this collection.
         *
         * @category TreeNodes
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'expand',
        value: function expand() {
            return this.invoke('expand');
        }

        /**
         * Query for all expanded nodes.
         *
         * @category TreeNodes
         * @param {boolean} full Retain full hiearchy.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'expanded',
        value: function expanded(full) {
            return baseStatePredicate.call(this, 'expanded', full);
        }

        /**
         * Recursively expands all nodes, loading all dynamic calls.
         *
         * @category TreeNodes
         * @return {Promise} Promise resolved only when all children have loaded and expanded.
         */

    }, {
        key: 'expandDeep',
        value: function expandDeep() {
            var nodes = this;

            return new Promise$1(function (resolve) {
                var waitCount = 0;

                var done = function done() {
                    if (--waitCount === 0) {
                        resolve(nodes);
                    }
                };

                nodes.recurseDown(function (node) {
                    waitCount++;

                    // Ignore nodes without children
                    if (node.children) {
                        node.expand().catch(done).then(function () {
                            // Manually trigger expansion on newly loaded children
                            node.children.expandDeep().catch(done).then(done);
                        });
                    } else {
                        done();
                    }
                });
            });
        }

        /**
         * Expand parents of children in this collection.
         *
         * @category TreeNodes
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'expandParents',
        value: function expandParents() {
            return this.invoke('expandParents');
        }

        /**
         * Returns a cloned hierarchy of all nodes matching a predicate.
         *
         * Because it filters deeply, we must clone all nodes so that we
         * don't affect the actual node array.
         *
         * @category TreeNodes
         * @param {string|function} predicate State flag or custom function.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'extract',
        value: function extract(predicate) {
            var flat = this.flatten(predicate);
            var matches = new TreeNodes(this._tree);

            _$1.each(flat, function (node) {
                matches.addNode(node.copyHierarchy());
            });

            return matches;
        }

        /**
         * Returns nodes which match a predicate.
         *
         * @category TreeNodes
         * @param {string|function} predicate State flag or custom function.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'filter',
        value: function filter(predicate) {
            var fn = getPredicateFunction(predicate);
            var matches = new TreeNodes(this._tree);

            _$1.each(this, function (node) {
                if (fn(node)) {
                    matches.push(node);
                }
            });

            return matches;
        }

        /**
         * Flattens a hierarchy, returning only node(s) matching the
         * expected state or predicate function.
         *
         * @category TreeNodes
         * @param {string|function} predicate State property or custom function.
         * @return {TreeNodes} Flat array of matching nodes.
         */

    }, {
        key: 'flatten',
        value: function flatten(predicate) {
            var flat = new TreeNodes(this._tree);

            var fn = getPredicateFunction(predicate);
            this.recurseDown(function (node) {
                if (fn(node)) {
                    flat.push(node);
                }
            });

            return flat;
        }

        /**
         * Query for all focused nodes.
         *
         * @category TreeNodes
         * @param {boolean} full Retain full hiearchy.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'focused',
        value: function focused(full) {
            return baseStatePredicate.call(this, 'focused', full);
        }

        /**
         * Get a specific node in the collection, or undefined if it doesn't exist.
         *
         * @category TreeNodes
         * @param {int} index Numeric index of requested node.
         * @return {TreeNode} Node object. Undefined if invalid index.
         */

    }, {
        key: 'get',
        value: function get(index) {
            return this[index];
        }

        /**
         * Query for all hidden nodes.
         *
         * @category TreeNodes
         * @param {boolean} full Retain full hiearchy.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'hidden',
        value: function hidden(full) {
            return baseStatePredicate.call(this, 'hidden', full);
        }

        /**
         * Hide children in this collection.
         *
         * @category TreeNodes
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'hide',
        value: function hide() {
            return this.invoke('hide');
        }

        /**
         * Hide all children (deeply) in this collection.
         *
         * @category TreeNodes
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'hideDeep',
        value: function hideDeep() {
            return this.invokeDeep('hide');
        }

        /**
         * Query for all indeterminate nodes.
         *
         * @category TreeNodes
         * @param {boolean} full Retain full hiearchy.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'indeterminate',
        value: function indeterminate(full) {
            return baseStatePredicate.call(this, 'indeterminate', full);
        }

        /**
         * Insert a new node at a given position.
         *
         * @category TreeNodes
         * @param {integer} index Index at which to insert the node.
         * @param {object} object Raw node object or TreeNode.
         * @return {TreeNode} Node object.
         */

    }, {
        key: 'insertAt',
        value: function insertAt(index, object) {
            // If node has a pre-existing ID
            if (object.id) {
                // Is it already in the tree?
                var existingNode = this.node(object.id);
                if (existingNode) {
                    existingNode.restore().show();

                    // Merge children
                    if (_$1.isArrayLike(object.children)) {
                        // Setup existing node's children property if needed
                        if (!_$1.isArrayLike(existingNode.children)) {
                            existingNode.children = new TreeNodes(this._tree);
                            existingNode.children._context = existingNode;
                        }

                        // Copy each child (using addNode, which uses insertAt)
                        _$1.each(object.children, function (child) {
                            existingNode.children.addNode(child);
                        });
                    }

                    // Merge truthy children
                    else if (object.children && _$1.isBoolean(existingNode.children)) {
                            existingNode.children = object.children;
                        }

                    existingNode.markDirty();
                    this._tree.dom.applyChanges();

                    // Node merged, return it.
                    return existingNode;
                }
            }

            // Node is new, insert at given location.
            var node = this._tree.isNode(object) ? object : objectToNode(this._tree, object);

            // Grab remaining nodes
            this.splice(index, 0, node);

            // Refresh parent state and mark dirty
            if (this._context) {
                node.itree.parent = this._context;
                this._context.refreshIndeterminateState().markDirty();
            }

            // Event
            this._tree.emit('node.added', node);

            // Always mark this node as dirty
            node.markDirty();

            // If pushing this node anywhere but the end, other nodes may change.
            if (this.length - 1 !== index) {
                this.invoke('markDirty');
            }

            this._tree.dom.applyChanges();

            return node;
        }

        /**
         * Invoke method(s) on each node.
         *
         * @category TreeNodes
         * @param {string|array} methods Method name(s).
         * @param {array|Arguments} args Array of arguments to proxy.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'invoke',
        value: function invoke(methods, args) {
            return baseInvoke(this, methods, args);
        }

        /**
         * Invoke method(s) deeply.
         *
         * @category TreeNodes
         * @param {string|array} methods Method name(s).
         *  @param {array|Arguments} args Array of arguments to proxy.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'invokeDeep',
        value: function invokeDeep(methods, args) {
            return baseInvoke(this, methods, args, true);
        }

        /**
         * Query for all loading nodes.
         *
         * @category TreeNodes
         * @param {boolean} full Retain full hiearchy.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'loading',
        value: function loading(full) {
            return baseStatePredicate.call(this, 'loading', full);
        }

        /**
         * Get a node.
         *
         * @category TreeNodes
         * @param {string|number} id ID of node.
         * @return {TreeNode} Node object.
         */

    }, {
        key: 'node',
        value: function node(id) {
            var match;

            if (_$1.isNumber(id)) {
                id = id.toString();
            }

            this.recurseDown(function (node) {
                if (node.id === id) {
                    match = node;

                    return false;
                }
            });

            return match;
        }

        /**
         * Get all nodes in a tree, or nodes for an array of IDs.
         *
         * @category TreeNodes
         * @param {array} refs Array of ID references.
         * @return {TreeNodes} Array of node objects.
         * @example
         *
         * var all = tree.nodes()
         * var some = tree.nodes([1, 2, 3])
         */

    }, {
        key: 'nodes',
        value: function nodes(refs) {
            var results;

            if (_$1.isArray(refs)) {
                // Ensure incoming IDs are strings
                refs = _$1.map(refs, function (element) {
                    if (_$1.isNumber(element)) {
                        element = element.toString();
                    }

                    return element;
                });

                results = new TreeNodes(this._tree);

                this.recurseDown(function (node) {
                    if (refs.indexOf(node.id) > -1) {
                        results.push(node);
                    }
                });
            }

            return _$1.isArray(refs) ? results : this;
        }

        /**
         * Iterate down all nodes and any children.
         *
         * @category TreeNodes
         * @param {function} iteratee Iteratee function.
         * @return {TreeNodes} Resulting nodes.
         */

    }, {
        key: 'recurseDown',
        value: function recurseDown(iteratee) {
            recurseDown$1(this, iteratee);

            return this;
        }

        /**
         * Query for all soft-removed nodes.
         *
         * @category TreeNodes
         * @param {boolean} full Retain full hiearchy.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'removed',
        value: function removed(full) {
            return baseStatePredicate.call(this, 'removed', full);
        }

        /**
         * Restore children in this collection.
         *
         * @category TreeNodes
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'restore',
        value: function restore() {
            return this.invoke('restore');
        }

        /**
         * Restore all children (deeply) in this collection.
         *
         * @category TreeNodes
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'restoreDeep',
        value: function restoreDeep() {
            return this.invokeDeep('restore');
        }

        /**
         * Select children in this collection.
         *
         * @category TreeNodes
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'select',
        value: function select() {
            return this.invoke('select');
        }

        /**
         * Query for all selectable nodes.
         *
         * @category TreeNodes
         * @param {boolean} full Retain full hiearchy.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'selectable',
        value: function selectable(full) {
            return baseStatePredicate.call(this, 'selectable', full);
        }

        /**
         * Select all children (deeply) in this collection.
         *
         * @category TreeNodes
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'selectDeep',
        value: function selectDeep() {
            return this.invokeDeep('select');
        }

        /**
         * Query for all selected nodes.
         *
         * @category TreeNodes
         * @param {boolean} full Retain full hiearchy.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'selected',
        value: function selected(full) {
            return baseStatePredicate.call(this, 'selected', full);
        }

        /**
         * Show children in this collection.
         *
         * @category TreeNodes
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'show',
        value: function show() {
            return this.invoke('show');
        }

        /**
         * Show all children (deeply) in this collection.
         *
         * @category TreeNodes
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'showDeep',
        value: function showDeep() {
            return this.invokeDeep('show');
        }

        /**
         * Soft-remove children in this collection.
         *
         * @category TreeNodes
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'softRemove',
        value: function softRemove() {
            return this.invoke('softRemove');
        }

        /**
         * Sorts all TreeNode objects in this collection.
         *
         * If no custom sorter given, the configured "sort" value will be used.
         *
         * @category TreeNodes
         * @param {string|function} sorter Sort function or property name.
         * @return {TreeNodes} Array of node obejcts.
         */

    }, {
        key: 'sort',
        value: function sort(sorter) {
            var nodes = this;
            sorter = sorter || this._tree.config.sort;

            // Only apply sort if one provided
            if (sorter) {
                var sorted = _$1.sortBy(nodes, sorter);

                nodes.length = 0;
                _$1.each(sorted, function (node) {
                    nodes.push(node);
                });
            }

            return nodes;
        }

        /**
         * Set state values for nodes in this collection.
         *
         * @category TreeNodes
         * @param {string} name Property name.
         * @param {boolean} newVal New value, if setting.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'state',
        value: function state() {
            return this.invoke('state', arguments);
        }

        /**
         * Set state values recursively.
         *
         * @category TreeNodes
         * @param {string} name Property name.
         * @param {boolean} newVal New value, if setting.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'stateDeep',
        value: function stateDeep() {
            return this.invokeDeep('state', arguments);
        }

        /**
         * Chained method for returning a chain to the tree context.
         *
         * @category TreeNodes
         * @return {[type]} [description]
         */

    }, {
        key: 'tree',
        value: function tree() {
            return this._tree;
        }

        /**
         * Returns a native Array of nodes.
         *
         * @category TreeNodes
         * @return {array} Array of node objects.
         */

    }, {
        key: 'toArray',
        value: function toArray() {
            var array = [];

            _$1.each(this, function (node) {
                array.push(node.toObject());
            });

            return array;
        }

        /**
         * Query for all visible nodes.
         *
         * @category TreeNodes
         * @param {boolean} full Retain full hiearchy.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'visible',
        value: function visible(full) {
            return baseStatePredicate.call(this, 'visible', full);
        }
    }]);
    return TreeNodes;
}(_extendableBuiltin(Array));

/**
 * Base recursion function for a collection or node.
 *
 * Returns false if execution should cease.
 *
 * @private
 * @param {TreeNode|TreeNodes} obj Node or collection.
 * @param {function} iteratee Iteratee function
 * @return {boolean} Cease iteration.
 */
function recurseDown$1(obj, iteratee) {
    var res;

    if (obj instanceof TreeNodes) {
        _$1.each(obj, function (node) {
            res = recurseDown$1(node, iteratee);

            return res;
        });
    } else if (obj instanceof TreeNode) {
        res = iteratee(obj);

        // Recurse children
        if (res !== false && obj.hasChildren()) {
            res = recurseDown$1(obj.children, iteratee);
        }
    }

    return res;
}

/**
 * Resolve promise-like objects consistently.
 *
 * @private
 * @param {object} promise Promise-like object.
 * @returns {Promise} Promise
 */
function standardizePromise(promise) {
    return new Promise$1(function (resolve, reject) {
        if (!_$1.isObject(promise)) {
            return reject(new Error('Invalid Promise'));
        }

        if (_$1.isFunction(promise.then)) {
            promise.then(resolve);
        }

        // jQuery promises use "error"
        if (_$1.isFunction(promise.error)) {
            promise.error(reject);
        } else if (_$1.isFunction(promise.catch)) {
            promise.catch(reject);
        }
    });
}

// Libs

/**
 * Helper method to clone an ITree config object.
 *
 * Rejects non-clonable properties like ref.
 *
 * @private
 * @param {object} itree ITree configuration object
 * @param {array} excludeKeys Keys to exclude, if any
 * @return {object} Cloned ITree.
 */
function cloneItree(itree, excludeKeys) {
    var clone = {};
    excludeKeys = _$1.castArray(excludeKeys);
    excludeKeys.push('ref');

    _$1.each(itree, function (v, k) {
        if (!_$1.includes(excludeKeys, k)) {
            clone[k] = _$1.cloneDeep(v);
        }
    });

    return clone;
}

/**
 * Represents a singe node object within the tree.
 *
 * @category TreeNode
 * @param {TreeNode} source TreeNode to copy.
 * @return {TreeNode} Tree node object.
 */
var TreeNode = function () {
    function TreeNode(tree, source, excludeKeys) {
        classCallCheck(this, TreeNode);

        var node = this;
        node._tree = tree;

        if (source instanceof TreeNode) {
            excludeKeys = _$1.castArray(excludeKeys);
            excludeKeys.push('_tree');

            // Iterate manually for better perf
            _$1.each(source, function (value, key) {
                // Skip vars
                if (!_$1.includes(excludeKeys, key)) {
                    if (_$1.isObject(value)) {
                        if (value instanceof TreeNodes) {
                            node[key] = value.clone();
                        } else if (key === 'itree') {
                            node[key] = cloneItree(value);
                        } else {
                            node[key] = _$1.cloneDeep(value);
                        }
                    } else {
                        // Copy primitives
                        node[key] = value;
                    }
                }
            });
        }
    }

    /**
     * Add a child to this node.
     *
     * @category TreeNode
     * @param {object} child Node object.
     * @return {TreeNode} Node object.
     */


    createClass(TreeNode, [{
        key: 'addChild',
        value: function addChild(child) {
            if (_$1.isArray(this.children) || !_$1.isArrayLike(this.children)) {
                this.children = new TreeNodes(this._tree);
                this.children._context = this;
            }

            return this.children.addNode(child);
        }

        /**
         * Add multiple children to this node.
         *
         * @category TreeNode
         * @param {object} children Array of nodes.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'addChildren',
        value: function addChildren(children) {
            var _this = this;

            var nodes = new TreeNodes();

            this._tree.dom.batch();
            _$1.each(children, function (child) {
                nodes.push(_this.addChild(child));
            });
            this._tree.dom.end();

            return nodes;
        }

        /**
         * Get if node available.
         *
         * @category TreeNode
         * @return {boolean} If available.
         */

    }, {
        key: 'available',
        value: function available() {
            return !this.hidden() && !this.removed();
        }

        /**
         * Blur focus from this node.
         *
         * @category TreeNode
         * @return {TreeNode} Node object.
         */

    }, {
        key: 'blur',
        value: function blur() {
            this.state('editing', false);

            return baseStateChange('focused', false, 'blurred', this);
        }
    }, {
        key: 'check',


        /**
         * Marks this node as checked.
         *
         * @category TreeNode
         * @param {boolean} shallow Skip auto-checking children.
         * @return {TreeNode} Node object.
         */
        value: function check(shallow) {
            this._tree.dom.batch();

            // Will we automatically apply state changes to our children
            var deep = !shallow && this._tree.config.checkbox.autoCheckChildren;

            baseStateChange('checked', true, 'checked', this, deep);

            // Refresh parent
            if (this.hasParent()) {
                this.getParent().refreshIndeterminateState();
            }

            this._tree.dom.end();

            return this;
        }
    }, {
        key: 'checked',


        /**
         * Get whether this node is checked.
         *
         * @category TreeNode
         * @return {boolean} Get if node checked.
         */
        value: function checked() {
            return this.state('checked');
        }

        /**
         * Hides parents without any visible children.
         *
         * @category TreeNode
         * @return {TreeNode} Node object.
         */

    }, {
        key: 'clean',
        value: function clean() {
            this.recurseUp(function (node) {
                if (node.hasParent()) {
                    var parent = node.getParent();
                    if (!parent.hasVisibleChildren()) {
                        parent.hide();
                    }
                }
            });

            return this;
        }

        /**
         * Clones this node.
         *
         * @category TreeNode
         * @param {array} excludeKeys Keys to exclude from the clone.
         * @return {TreeNode} New node object.
         */

    }, {
        key: 'clone',
        value: function clone(excludeKeys) {
            return new TreeNode(this._tree, this, excludeKeys);
        }

        /**
         * Collapse this node.
         *
         * @category TreeNode
         * @return {TreeNode} Node object.
         */

    }, {
        key: 'collapse',
        value: function collapse() {
            return baseStateChange('collapsed', true, 'collapsed', this);
        }

        /**
         * Get whether this node is collapsed.
         *
         * @category TreeNode
         * @return {boolean} Get if node collapsed.
         */

    }, {
        key: 'collapsed',
        value: function collapsed() {
            return this.state('collapsed');
        }

        /**
         * Get the containing context. If no parent present, the root context is returned.
         *
         * @category TreeNode
         * @return {TreeNodes} Node array object.
         */

    }, {
        key: 'context',
        value: function context() {
            return this.hasParent() ? this.getParent().children : this._tree.model;
        }

        /**
         * Copies node to a new tree instance.
         *
         * @category TreeNode
         * @param {boolean} hierarchy Include necessary ancestors to match hierarchy.
         * @return {object} Property "to" for defining destination.
         */

    }, {
        key: 'copy',
        value: function copy(hierarchy) {
            var node = this;

            if (hierarchy) {
                node = node.copyHierarchy();
            }

            return {

                /**
                 * Sets a destination.
                 *
                 * @category CopyNode
                 * @param {object} dest Destination Inspire Tree.
                 * @return {object} New node object.
                 */
                to: function to(dest) {
                    if (!_$1.isFunction(dest.addNode)) {
                        throw new Error('Destination must be an Inspire Tree instance.');
                    }

                    return dest.addNode(node.toObject());
                }
            };
        }

        /**
         * Copies all parents of a node.
         *
         * @category TreeNode
         * @param {boolean} excludeNode Exclude given node from hierarchy.
         * @return {TreeNode} Root node object with hierarchy.
         */

    }, {
        key: 'copyHierarchy',
        value: function copyHierarchy(excludeNode) {
            var node = this;
            var nodes = [];
            var parents = node.getParents();

            // Remove old hierarchy data
            _$1.each(parents, function (node) {
                nodes.push(node.toObject(excludeNode));
            });

            parents = nodes.reverse();

            if (!excludeNode) {
                var clone = node.toObject(true);

                // Filter out hidden children
                if (node.hasChildren()) {
                    clone.children = node.children.filter(function (n) {
                        return !n.state('hidden');
                    }).toArray();

                    clone.children._context = clone;
                }

                nodes.push(clone);
            }

            var hierarchy = nodes[0];
            var pointer = hierarchy;
            var l = nodes.length;
            _$1.each(nodes, function (parent, key) {
                var children = [];

                if (key + 1 < l) {
                    children.push(nodes[key + 1]);
                    pointer.children = children;

                    pointer = pointer.children[0];
                }
            });

            return objectToNode(this._tree, hierarchy);
        }
    }, {
        key: 'deselect',


        /**
         * Deselect this node.
         *
         * If selection.require is true and this is the last selected
         * node, the node will remain in a selected state.
         *
         * @category TreeNode
         * @param {boolean} shallow Skip auto-deselecting children.
         * @return {TreeNode} Node object.
         */
        value: function deselect(shallow) {
            if (this.selected() && (!this._tree.config.selection.require || this._tree.selected().length > 1)) {
                this._tree.dom.batch();

                // Will we apply this state change to our children?
                var deep = !shallow && this._tree.config.selection.autoSelectChildren;

                this.state('indeterminate', false);
                baseStateChange('selected', false, 'deselected', this, deep);

                this._tree.dom.end();
            }

            return this;
        }

        /**
         * Get if node editable. Required editing.edit to be enable via config.
         *
         * @category TreeNode
         * @return {boolean} If node editable.
         */

    }, {
        key: 'editable',
        value: function editable() {
            return this._tree.config.editable && this._tree.config.editing.edit && this.state('editable');
        }

        /**
         * Get if node is currently in edit mode.
         *
         * @category TreeNode
         * @return {boolean} If node in edit mode.
         */

    }, {
        key: 'editing',
        value: function editing() {
            return this.state('editing');
        }

        /**
         * Expand this node.
         *
         * @category TreeNode
         * @return {Promise} Promise resolved on successful load and expand of children.
         */

    }, {
        key: 'expand',
        value: function expand() {
            var node = this;

            return new Promise$1(function (resolve, reject) {
                var allow = node.hasChildren() || node._tree.isDynamic && node.children === true;

                if (allow && (node.collapsed() || node.hidden())) {
                    node.state('collapsed', false);
                    node.state('hidden', false);

                    node._tree.emit('node.expanded', node);

                    if (node._tree.isDynamic && node.children === true) {
                        node.loadChildren().then(resolve).catch(reject);
                    } else {
                        node.markDirty();
                        node._tree.dom.applyChanges();
                        resolve(node);
                    }
                } else {
                    // Resolve immediately
                    resolve(node);
                }
            });
        }

        /**
         * Get if node expanded.
         *
         * @category TreeNode
         * @return {boolean} If expanded.
         */

    }, {
        key: 'expanded',
        value: function expanded() {
            return !this.collapsed();
        }

        /**
         * Expand parent nodes.
         *
         * @category TreeNode
         * @return {TreeNode} Node object.
         */

    }, {
        key: 'expandParents',
        value: function expandParents() {
            if (this.hasParent()) {
                this.getParent().recurseUp(function (node) {
                    node.expand();
                });
            }

            return this;
        }

        /**
         * Focus a node without changing its selection.
         *
         * @category TreeNode
         * @return {TreeNode} Node object.
         */

    }, {
        key: 'focus',
        value: function focus() {
            if (!this.focused()) {
                // Batch selection changes
                this._tree.dom.batch();
                this._tree.blurDeep();
                this.state('focused', true);

                // Emit this event
                this._tree.emit('node.focused', this);

                // Mark hierarchy dirty and apply
                this.markDirty();
                this._tree.dom.end();
            }

            return this;
        }

        /**
         * Get whether this node is focused.
         *
         * @category TreeNode
         * @return {boolean} Get if node focused.
         */

    }, {
        key: 'focused',
        value: function focused() {
            return this.state('focused');
        }

        /**
         * Get children for this node. If no children exist, an empty TreeNodes
         * collection is returned for safe chaining.
         *
         * @category TreeNode
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'getChildren',
        value: function getChildren() {
            return this.hasChildren() ? this.children : new TreeNodes(this._tree);
        }

        /**
         * Get the immediate parent, if any.
         *
         * @category TreeNode
         * @return {TreeNode} Node object.
         */

    }, {
        key: 'getParent',
        value: function getParent() {
            return this.itree.parent;
        }

        /**
         * Returns parent nodes. Excludes any siblings.
         *
         * @category TreeNode
         * @return {TreeNodes} Node objects.
         */

    }, {
        key: 'getParents',
        value: function getParents() {
            var parents = new TreeNodes(this._tree);

            if (this.hasParent()) {
                this.getParent().recurseUp(function (node) {
                    parents.push(node);
                });
            }

            return parents;
        }

        /**
         * Get a textual hierarchy for a given node. An array
         * of text from this node's root ancestor to the given node.
         *
         * @category TreeNode
         * @return {array} Array of node texts.
         */

    }, {
        key: 'getTextualHierarchy',
        value: function getTextualHierarchy() {
            var paths = [];

            this.recurseUp(function (node) {
                paths.unshift(node.text);
            });

            return paths;
        }

        /**
         * If node has any children.
         *
         * @category TreeNode
         * @return {boolean} If children.
         */

    }, {
        key: 'hasChildren',
        value: function hasChildren() {
            return _$1.isArrayLike(this.children) && this.children.length > 0;
        }

        /**
         * If children loading method has completed. Will always be true for non-dynamic nodes.
         *
         * @category TreeNode
         * @return {boolean} If we've attempted to load children.
         */

    }, {
        key: 'hasLoadedChildren',
        value: function hasLoadedChildren() {
            return _$1.isArrayLike(this.children);
        }

        /**
         * If node has a parent.
         *
         * @category TreeNode
         * @return {boolean} If parent.
         */

    }, {
        key: 'hasParent',
        value: function hasParent() {
            return Boolean(this.itree.parent);
        }

        /**
         * If node has any visible children.
         *
         * @category TreeNode
         * @return {boolean} If visible children.
         */

    }, {
        key: 'hasVisibleChildren',
        value: function hasVisibleChildren() {
            var hasVisibleChildren = false;

            if (this.hasChildren()) {
                hasVisibleChildren = this.children.filter('available').length > 0;
            }

            return hasVisibleChildren;
        }

        /**
         * Hide this node.
         *
         * @category TreeNode
         * @return {TreeNode} Node object.
         */

    }, {
        key: 'hide',
        value: function hide() {
            var node = baseStateChange('hidden', true, 'hidden', this);

            // Update children
            if (node.hasChildren()) {
                node.children.hide();
            }

            return node;
        }

        /**
         * Get whether this node is hidden.
         *
         * @category TreeNode
         * @return {boolean} Get if node hidden.
         */

    }, {
        key: 'hidden',
        value: function hidden() {
            return this.state('hidden');
        }

        /**
         * Returns a "path" of indices, values which map this node's location within all parent contexts.
         *
         * @category TreeNode
         * @return {string} Index path
         */

    }, {
        key: 'indexPath',
        value: function indexPath() {
            var indices = [];

            this.recurseUp(function (node) {
                indices.push(_$1.indexOf(node.context(), node));
            });

            return indices.reverse().join('.');
        }

        /**
         * Get whether this node is indeterminate.
         *
         * @category TreeNode
         * @return {boolean} Get if node indeterminate.
         */

    }, {
        key: 'indeterminate',
        value: function indeterminate() {
            return this.state('indeterminate');
        }

        /**
         * Find the last + deepest visible child of the previous sibling.
         *
         * @category TreeNode
         * @return {TreeNode} Node object.
         */

    }, {
        key: 'lastDeepestVisibleChild',
        value: function lastDeepestVisibleChild() {
            var found;

            if (this.hasChildren() && !this.collapsed()) {
                found = _$1.findLast(this.children, function (node) {
                    return node.visible();
                });

                var res = found.lastDeepestVisibleChild();
                if (res) {
                    found = res;
                }
            }

            return found;
        }

        /**
         * Initiate a dynamic load of children for a given node.
         *
         * This requires `tree.config.data` to be a function which accepts
         * three arguments: node, resolve, reject.
         *
         * Use the `node` to filter results.
         *
         * On load success, pass the result array to `resolve`.
         * On error, pass the Error to `reject`.
         *
         * @category TreeNode
         * @return {Promise} Promise resolving children nodes.
         */

    }, {
        key: 'loadChildren',
        value: function loadChildren() {
            var node = this;

            return new Promise$1(function (resolve, reject) {
                if (!node._tree.isDynamic || !_$1.isArrayLike(node.children) && node.children !== true) {
                    reject(new Error('Node does not have or support dynamic children.'));
                }

                node.state('loading', true);
                node.markDirty();
                node._tree.dom.applyChanges();

                var complete = function complete(nodes, totalNodes) {
                    if (_$1.parseInt(totalNodes) > nodes.length) {
                        node.itree.pagination.total = _$1.parseInt(totalNodes);
                    }

                    node._tree.dom.batch();
                    node.state('loading', false);

                    var model = collectionToModel(node._tree, nodes, node);
                    if (_$1.isArrayLike(node.children)) {
                        node.children = node.children.concat(model);
                    } else {
                        node.children = model;
                    }

                    // If using checkbox mode, share selection with newly loaded children
                    if (node._tree.config.selection.mode === 'checkbox' && node.selected()) {
                        node.children.select();
                    }

                    node.markDirty();
                    node._tree.dom.end();

                    resolve(node.children);

                    node._tree.emit('children.loaded', node);
                };

                var error = function error(err) {
                    node.state('loading', false);
                    node.children = new TreeNodes(node._tree);
                    node.children._context = node;
                    node.markDirty();
                    node._tree.dom.applyChanges();

                    reject(err);

                    node._tree.emit('tree.loaderror', err);
                };

                var loader = node._tree.config.data(node, complete, error, node.itree.pagination);

                // Data loader is likely a promise
                if (_$1.isObject(loader)) {
                    standardizePromise(loader).then(complete).catch(error);
                }
            });
        }

        /**
         * Get whether this node is loading child data.
         *
         * @category TreeNode
         * @return {boolean} Get if node loading.
         */

    }, {
        key: 'loading',
        value: function loading() {
            return this.state('loading');
        }

        /**
         * Mark a node as dirty, rebuilding this node in the virtual DOM
         * and rerendering to the live DOM, next time applyChanges is called.
         *
         * @category TreeNode
         * @return {TreeNode} Node object.
         */

    }, {
        key: 'markDirty',
        value: function markDirty() {
            if (!this.itree.dirty) {
                this.itree.dirty = true;

                if (this.hasParent()) {
                    this.getParent().markDirty();
                }
            }

            return this;
        }

        /**
         * Find the next visible sibling of our ancestor. Continues
         * seeking up the tree until a valid node is found or we
         * reach the root node.
         *
         * @category TreeNode
         * @return {TreeNode} Node object.
         */

    }, {
        key: 'nextVisibleAncestralSiblingNode',
        value: function nextVisibleAncestralSiblingNode() {
            var next;

            if (this.hasParent()) {
                var parent = this.getParent();
                next = parent.nextVisibleSiblingNode();

                if (!next) {
                    next = parent.nextVisibleAncestralSiblingNode();
                }
            }

            return next;
        }

        /**
         * Find next visible child node.
         *
         * @category TreeNode
         * @return {TreeNode} Node object, if any.
         */

    }, {
        key: 'nextVisibleChildNode',
        value: function nextVisibleChildNode() {
            var startingNode = this;
            var next;

            if (startingNode.hasChildren()) {
                next = _$1.find(startingNode.children, function (child) {
                    return child.visible();
                });
            }

            return next;
        }

        /**
         * Get the next visible node.
         *
         * @category TreeNode
         * @return {TreeNode} Node object if any.
         */

    }, {
        key: 'nextVisibleNode',
        value: function nextVisibleNode() {
            var startingNode = this;
            var next;

            // 1. Any visible children
            next = startingNode.nextVisibleChildNode();

            // 2. Any Siblings
            if (!next) {
                next = startingNode.nextVisibleSiblingNode();
            }

            // 3. Find sibling of ancestor(s)
            if (!next) {
                next = startingNode.nextVisibleAncestralSiblingNode();
            }

            return next;
        }

        /**
         * Find the next visible sibling node.
         *
         * @category TreeNode
         * @return {TreeNode} Node object, if any.
         */

    }, {
        key: 'nextVisibleSiblingNode',
        value: function nextVisibleSiblingNode() {
            var startingNode = this;
            var context = startingNode.hasParent() ? startingNode.getParent().children : this._tree.nodes();
            var i = _$1.findIndex(context, { id: startingNode.id });

            return _$1.find(_$1.slice(context, i + 1), function (node) {
                return node.visible();
            });
        }

        /**
         * Find the previous visible node.
         *
         * @category TreeNode
         * @return {TreeNode} Node object, if any.
         */

    }, {
        key: 'previousVisibleNode',
        value: function previousVisibleNode() {
            var startingNode = this;
            var prev;

            // 1. Any Siblings
            prev = startingNode.previousVisibleSiblingNode();

            // 2. If that sibling has children though, go there
            if (prev && prev.hasChildren() && !prev.collapsed()) {
                prev = prev.lastDeepestVisibleChild();
            }

            // 3. Parent
            if (!prev && startingNode.hasParent()) {
                prev = startingNode.getParent();
            }

            return prev;
        }

        /**
         * Find the previous visible sibling node.
         *
         * @category TreeNode
         * @return {TreeNode} Node object, if any.
         */

    }, {
        key: 'previousVisibleSiblingNode',
        value: function previousVisibleSiblingNode() {
            var context = this.hasParent() ? this.getParent().children : this._tree.nodes();
            var i = _$1.findIndex(context, { id: this.id });
            return _$1.findLast(_$1.slice(context, 0, i), function (node) {
                return node.visible();
            });
        }

        /**
         * Iterate down node and any children.
         *
         * @category TreeNode
         * @param {function} iteratee Iteratee function.
         * @return {TreeNode} Node object.
         */

    }, {
        key: 'recurseDown',
        value: function recurseDown(iteratee) {
            recurseDown$1(this, iteratee);

            return this;
        }

        /**
         * Iterate up a node and its parents.
         *
         * @category TreeNode
         * @param {function} iteratee Iteratee function.
         * @return {TreeNode} Node object.
         */

    }, {
        key: 'recurseUp',
        value: function recurseUp(iteratee) {
            var result = iteratee(this);

            if (result !== false && this.hasParent()) {
                this.getParent().recurseUp(iteratee);
            }

            return this;
        }

        /**
         * Updates the indeterminate state of this node.
         *
         * Only available when dom.showCheckboxes=true.
         * True if some, but not all children are checked.
         * False if no children are checked.
         *
         * @category TreeNode
         * @return {TreeNode} Node object.
         */

    }, {
        key: 'refreshIndeterminateState',
        value: function refreshIndeterminateState() {
            var node = this;
            var oldValue = node.indeterminate();
            node.state('indeterminate', false);

            if (this._tree.config.dom.showCheckboxes) {
                if (node.hasChildren()) {
                    var childrenCount = node.children.length;
                    var indeterminate = 0;
                    var checked = 0;

                    node.children.each(function (n) {
                        if (n.checked()) {
                            checked++;
                        }

                        if (n.indeterminate()) {
                            indeterminate++;
                        }
                    });

                    // Set selected if all children are
                    if (checked === childrenCount) {
                        baseStateChange('checked', true, 'checked', node);
                    } else {
                        baseStateChange('checked', false, 'unchecked', node);
                    }

                    // Set indeterminate if any children are, or some children are selected
                    if (!node.checked()) {
                        node.state('indeterminate', indeterminate > 0 || childrenCount > 0 && checked > 0 && checked < childrenCount);
                    }
                }

                if (node.hasParent()) {
                    node.getParent().refreshIndeterminateState();
                }

                if (oldValue !== node.state('indeterminate')) {
                    node.markDirty();
                }
            }

            return node;
        }

        /**
         * Remove a node from the tree.
         *
         * @category TreeNode
         * @return {object} Removed tree node object.
         */

    }, {
        key: 'remove',
        value: function remove() {
            var node = this;

            var parent;
            if (node.hasParent()) {
                parent = node.getParent();
            }

            var context = parent ? parent.children : this._tree.model;
            _$1.remove(context, { id: node.id });

            if (parent) {
                parent.refreshIndeterminateState();
            }

            var exported = node.toObject();
            this._tree.emit('node.removed', exported);

            this._tree.dom.applyChanges();

            return exported;
        }

        /**
         * Get whether this node is soft-removed.
         *
         * @category TreeNode
         * @return {boolean} Get if node removed.
         */

    }, {
        key: 'removed',
        value: function removed() {
            return this.state('removed');
        }

        /**
         * Get whether this node has been rendered.
         *
         * Will be false if deferred rendering is enable and the node has
         * not yet been loaded, or if a custom DOM renderer is used.
         *
         * @category TreeNode
         * @return {boolean} Get if node rendered.
         */

    }, {
        key: 'rendered',
        value: function rendered() {
            return this.state('rendered');
        }

        /**
         * Restore state if soft-removed.
         *
         * @category TreeNode
         * @return {TreeNode} Node object.
         */

    }, {
        key: 'restore',
        value: function restore() {
            return baseStateChange('removed', false, 'restored', this);
        }

        /**
         * Select this node.
         *
         * @category TreeNode
         * @param {boolean} shallow Skip auto-selecting children.
         * @return {TreeNode} Node object.
         */

    }, {
        key: 'select',
        value: function select(shallow) {
            var node = this;

            if (!node.selected() && node.selectable()) {
                // Batch selection changes
                node._tree.dom.batch();

                if (node._tree.canAutoDeselect()) {
                    var oldVal = node._tree.config.selection.require;
                    node._tree.config.selection.require = false;
                    node._tree.deselectDeep();
                    node._tree.config.selection.require = oldVal;
                }

                // Will we apply this state change to our children?
                var deep = !shallow && node._tree.config.selection.autoSelectChildren;

                baseStateChange('selected', true, 'selected', this, deep);

                // Cache as the last selected node
                node._tree._lastSelectedNode = node;

                // Mark hierarchy dirty and apply
                node.markDirty();
                node._tree.dom.end();
            }

            return node;
        }

        /**
         * Get if node selectable.
         *
         * @category TreeNode
         * @return {boolean} If node selectable.
         */

    }, {
        key: 'selectable',
        value: function selectable() {
            var allow = this._tree.config.selection.allow(this);
            return typeof allow === 'boolean' ? allow : this.state('selectable');
        }

        /**
         * Get whether this node is selected.
         *
         * @category TreeNode
         * @return {boolean} Get if node selected.
         */

    }, {
        key: 'selected',
        value: function selected() {
            return this.state('selected');
        }

        /**
         * Set a root property on this node.
         *
         * @category TreeNode
         * @param {string|number} property Property name.
         * @param {*} value New value.
         * @return {TreeNode} Node object.
         */

    }, {
        key: 'set',
        value: function set(property, value) {
            this[property] = value;
            this.markDirty();

            return this;
        }

        /**
         * Show this node.
         *
         * @category TreeNode
         * @return {TreeNode} Node object.
         */

    }, {
        key: 'show',
        value: function show() {
            return baseStateChange('hidden', false, 'shown', this);
        }

        /**
         * Get or set a state value.
         *
         * This is a base method and will not invoke related changes, for example
         * setting selected=false will not trigger any deselection logic.
         *
         * @category TreeNode
         * @param {string} name Property name.
         * @param {boolean} newVal New value, if setting.
         * @return {boolean} Current value on read, old value on set.
         */

    }, {
        key: 'state',
        value: function state(name, newVal) {
            var currentVal = this.itree.state[name];

            if (typeof newVal !== 'undefined' && currentVal !== newVal) {
                // Update values
                this.itree.state[name] = newVal;

                if (name !== 'rendered') {
                    this.markDirty();
                }

                // Emit an event
                this._tree.emit('node.state.changed', this, name, currentVal, newVal);
            }

            return currentVal;
        }

        /**
         * Mark this node as "removed" without actually removing it.
         *
         * Expand/show methods will never reveal this node until restored.
         *
         * @category TreeNode
         * @return {TreeNode} Node object.
         */

    }, {
        key: 'softRemove',
        value: function softRemove() {
            return baseStateChange('removed', true, 'softremoved', this, 'softRemove');
        }

        /**
         * Toggles checked state.
         *
         * @category TreeNode
         * @return {TreeNode} Node object.
         */

    }, {
        key: 'toggleCheck',
        value: function toggleCheck() {
            return this.checked() ? this.uncheck() : this.check();
        }

        /**
         * Toggles collapsed state.
         *
         * @category TreeNode
         * @return {TreeNode} Node object.
         */

    }, {
        key: 'toggleCollapse',
        value: function toggleCollapse() {
            return this.collapsed() ? this.expand() : this.collapse();
        }

        /**
         * Toggles editing state.
         *
         * @category TreeNode
         * @return {TreeNode} Node object.
         */

    }, {
        key: 'toggleEditing',
        value: function toggleEditing() {
            this.state('editing', !this.state('editing'));

            this.markDirty();
            this._tree.dom.applyChanges();

            return this;
        }

        /**
         * Toggles selected state.
         *
         * @category TreeNode
         * @return {TreeNode} Node object.
         */

    }, {
        key: 'toggleSelect',
        value: function toggleSelect() {
            return this.selected() ? this.deselect() : this.select();
        }

        /**
         * Export this node as a native Object.
         *
         * @category TreeNode
         * @param {boolean} excludeChildren Exclude children.
         * @return {object} Node object.
         */

    }, {
        key: 'toObject',
        value: function toObject(excludeChildren) {
            var object = {};

            _$1.each(this, function (v, k) {
                if (k !== '_tree' && k !== 'children' && k !== 'itree') {
                    object[k] = v;
                }
            });

            if (!excludeChildren && this.hasChildren() && _$1.isFunction(this.children.toArray)) {
                object.children = this.children.toArray();
            }

            return object;
        }

        /**
         * Unchecks this node.
         *
         * @category TreeNode
         * @param {boolean} shallow Skip auto-unchecking children.
         * @return {TreeNode} Node object.
         */

    }, {
        key: 'uncheck',
        value: function uncheck(shallow) {
            this._tree.dom.batch();

            // Will we apply this state change to our children?
            var deep = !shallow && this._tree.config.checkbox.autoCheckChildren;

            baseStateChange('checked', false, 'unchecked', this, deep);

            // Refresh our parent
            if (this.hasParent()) {
                this.getParent().refreshIndeterminateState();
            }

            this._tree.dom.end();

            return this;
        }
    }, {
        key: 'visible',


        /**
         * Checks whether a node is visible to a user. Returns false
         * if it's hidden, or if any ancestor is hidden or collapsed.
         *
         * @category TreeNode
         * @return {boolean} Whether visible.
         */
        value: function visible() {
            var node = this;

            var isVisible = true;
            if (node.hidden() || node.removed() || this._tree.usesNativeDOM && !node.rendered()) {
                isVisible = false;
            } else if (node.hasParent()) {
                if (node.getParent().collapsed()) {
                    isVisible = false;
                } else {
                    isVisible = node.getParent().visible();
                }
            } else {
                isVisible = true;
            }

            return isVisible;
        }
    }]);
    return TreeNode;
}();

/**
 * Parse a raw object into a TreeNode used within a tree.
 *
 * Note: Uses native js over lodash where performance
 * benefits most, since this handles every node.
 *
 * @private
 * @param {object} tree Tree instance.
 * @param {object} object Source object
 * @param {object} parent Pointer to parent object.
 * @return {object} Final object
 */
function objectToNode(tree, object, parent) {
    // Create or type-ensure ID
    object.id = object.id || index();
    if (typeof object.id !== 'string') {
        object.id = object.id.toString();
    }

    // High-performance default assignments
    var itree = object.itree = object.itree || {};
    itree.icon = itree.icon || false;

    var li = itree.li = itree.li || {};
    li.attributes = li.attributes || {};

    var a = itree.a = itree.a || {};
    a.attributes = a.attributes || {};

    var state = itree.state = itree.state || {};

    // Enabled by default
    state.collapsed = typeof state.collapsed === 'boolean' ? state.collapsed : tree.defaultState.collapsed;
    state.selectable = typeof state.selectable === 'boolean' ? state.selectable : tree.defaultState.selectable;

    // Disabled by default
    state.checked = typeof state.checked === 'boolean' ? state.checked : false;
    state.editable = typeof state.editable === 'boolean' ? state.editable : tree.defaultState.editable;
    state.editing = typeof state.editing === 'boolean' ? state.editing : tree.defaultState.editing;
    state.focused = state.focused || tree.defaultState.focused;
    state.hidden = state.hidden || tree.defaultState.hidden;
    state.indeterminate = state.indeterminate || tree.defaultState.indeterminate;
    state.loading = state.loading || tree.defaultState.loading;
    state.removed = state.removed || tree.defaultState.removed;
    state.rendered = state.rendered || tree.defaultState.rendered;
    state.selected = state.selected || tree.defaultState.selected;

    // Save parent, if any.
    object.itree.parent = parent;

    // Wrap
    object = _$1.assign(new TreeNode(tree), object);

    if (object.hasChildren()) {
        object.children = collectionToModel(tree, object.children, object);
    }

    // Fire events for pre-set states, if enabled
    if (tree.allowsLoadEvents) {
        _$1.each(tree.config.allowLoadEvents, function (eventName) {
            if (state[eventName]) {
                tree.emit('node.' + eventName, object);
            }
        });
    }

    return object;
}

/**
 * Parses a raw collection of objects into a model used
 * within a tree. Adds state and other internal properties.
 *
 * @private
 * @param {object} tree Tree instance.
 * @param {array} array Array of nodes
 * @param {object} parent Pointer to parent object
 * @return {array|object} Object model.
 */
function collectionToModel(tree, array, parent) {
    var collection = new TreeNodes(tree);

    // Sort
    if (tree.config.sort) {
        array = _$1.sortBy(array, tree.config.sort);
    }

    _$1.each(array, function (node) {
        collection.push(objectToNode(tree, node, parent));
    });

    collection._context = parent;

    return collection;
}

var eventemitter2 = createCommonjsModule(function (module, exports) {
/*!
 * EventEmitter2
 * https://github.com/hij1nx/EventEmitter2
 *
 * Copyright (c) 2013 hij1nx
 * Licensed under the MIT license.
 */
!function(undefined) {

  var isArray$$1 = Array.isArray ? Array.isArray : function _isArray(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
  };
  var defaultMaxListeners = 10;

  function init() {
    this._events = {};
    if (this._conf) {
      configure.call(this, this._conf);
    }
  }

  function configure(conf) {
    if (conf) {
      this._conf = conf;

      conf.delimiter && (this.delimiter = conf.delimiter);
      this._events.maxListeners = conf.maxListeners !== undefined ? conf.maxListeners : defaultMaxListeners;
      conf.wildcard && (this.wildcard = conf.wildcard);
      conf.newListener && (this.newListener = conf.newListener);
      conf.verboseMemoryLeak && (this.verboseMemoryLeak = conf.verboseMemoryLeak);

      if (this.wildcard) {
        this.listenerTree = {};
      }
    } else {
      this._events.maxListeners = defaultMaxListeners;
    }
  }

  function logPossibleMemoryLeak(count, eventName) {
    var errorMsg = '(node) warning: possible EventEmitter memory ' +
        'leak detected. %d listeners added. ' +
        'Use emitter.setMaxListeners() to increase limit.';

    if(this.verboseMemoryLeak){
      errorMsg += ' Event name: %s.';
      console.error(errorMsg, count, eventName);
    } else {
      console.error(errorMsg, count);
    }

    if (console.trace){
      console.trace();
    }
  }

  function EventEmitter(conf) {
    this._events = {};
    this.newListener = false;
    this.verboseMemoryLeak = false;
    configure.call(this, conf);
  }
  EventEmitter.EventEmitter2 = EventEmitter; // backwards compatibility for exporting EventEmitter property

  //
  // Attention, function return type now is array, always !
  // It has zero elements if no any matches found and one or more
  // elements (leafs) if there are matches
  //
  function searchListenerTree(handlers, type, tree, i) {
    if (!tree) {
      return [];
    }
    var listeners=[], leaf, len, branch, xTree, xxTree, isolatedBranch, endReached,
        typeLength = type.length, currentType = type[i], nextType = type[i+1];
    if (i === typeLength && tree._listeners) {
      //
      // If at the end of the event(s) list and the tree has listeners
      // invoke those listeners.
      //
      if (typeof tree._listeners === 'function') {
        handlers && handlers.push(tree._listeners);
        return [tree];
      } else {
        for (leaf = 0, len = tree._listeners.length; leaf < len; leaf++) {
          handlers && handlers.push(tree._listeners[leaf]);
        }
        return [tree];
      }
    }

    if ((currentType === '*' || currentType === '**') || tree[currentType]) {
      //
      // If the event emitted is '*' at this part
      // or there is a concrete match at this patch
      //
      if (currentType === '*') {
        for (branch in tree) {
          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
            listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+1));
          }
        }
        return listeners;
      } else if(currentType === '**') {
        endReached = (i+1 === typeLength || (i+2 === typeLength && nextType === '*'));
        if(endReached && tree._listeners) {
          // The next element has a _listeners, add it to the handlers.
          listeners = listeners.concat(searchListenerTree(handlers, type, tree, typeLength));
        }

        for (branch in tree) {
          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
            if(branch === '*' || branch === '**') {
              if(tree[branch]._listeners && !endReached) {
                listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], typeLength));
              }
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
            } else if(branch === nextType) {
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+2));
            } else {
              // No match on this one, shift into the tree but not in the type array.
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
            }
          }
        }
        return listeners;
      }

      listeners = listeners.concat(searchListenerTree(handlers, type, tree[currentType], i+1));
    }

    xTree = tree['*'];
    if (xTree) {
      //
      // If the listener tree will allow any match for this part,
      // then recursively explore all branches of the tree
      //
      searchListenerTree(handlers, type, xTree, i+1);
    }

    xxTree = tree['**'];
    if(xxTree) {
      if(i < typeLength) {
        if(xxTree._listeners) {
          // If we have a listener on a '**', it will catch all, so add its handler.
          searchListenerTree(handlers, type, xxTree, typeLength);
        }

        // Build arrays of matching next branches and others.
        for(branch in xxTree) {
          if(branch !== '_listeners' && xxTree.hasOwnProperty(branch)) {
            if(branch === nextType) {
              // We know the next element will match, so jump twice.
              searchListenerTree(handlers, type, xxTree[branch], i+2);
            } else if(branch === currentType) {
              // Current node matches, move into the tree.
              searchListenerTree(handlers, type, xxTree[branch], i+1);
            } else {
              isolatedBranch = {};
              isolatedBranch[branch] = xxTree[branch];
              searchListenerTree(handlers, type, { '**': isolatedBranch }, i+1);
            }
          }
        }
      } else if(xxTree._listeners) {
        // We have reached the end and still on a '**'
        searchListenerTree(handlers, type, xxTree, typeLength);
      } else if(xxTree['*'] && xxTree['*']._listeners) {
        searchListenerTree(handlers, type, xxTree['*'], typeLength);
      }
    }

    return listeners;
  }

  function growListenerTree(type, listener) {

    type = typeof type === 'string' ? type.split(this.delimiter) : type.slice();

    //
    // Looks for two consecutive '**', if so, don't add the event at all.
    //
    for(var i = 0, len = type.length; i+1 < len; i++) {
      if(type[i] === '**' && type[i+1] === '**') {
        return;
      }
    }

    var tree = this.listenerTree;
    var name = type.shift();

    while (name !== undefined) {

      if (!tree[name]) {
        tree[name] = {};
      }

      tree = tree[name];

      if (type.length === 0) {

        if (!tree._listeners) {
          tree._listeners = listener;
        }
        else {
          if (typeof tree._listeners === 'function') {
            tree._listeners = [tree._listeners];
          }

          tree._listeners.push(listener);

          if (
            !tree._listeners.warned &&
            this._events.maxListeners > 0 &&
            tree._listeners.length > this._events.maxListeners
          ) {
            tree._listeners.warned = true;
            logPossibleMemoryLeak.call(this, tree._listeners.length, name);
          }
        }
        return true;
      }
      name = type.shift();
    }
    return true;
  }

  // By default EventEmitters will print a warning if more than
  // 10 listeners are added to it. This is a useful default which
  // helps finding memory leaks.
  //
  // Obviously not all Emitters should be limited to 10. This function allows
  // that to be increased. Set to zero for unlimited.

  EventEmitter.prototype.delimiter = '.';

  EventEmitter.prototype.setMaxListeners = function(n) {
    if (n !== undefined) {
      this._events || init.call(this);
      this._events.maxListeners = n;
      if (!this._conf) this._conf = {};
      this._conf.maxListeners = n;
    }
  };

  EventEmitter.prototype.event = '';

  EventEmitter.prototype.once = function(event, fn) {
    this.many(event, 1, fn);
    return this;
  };

  EventEmitter.prototype.many = function(event, ttl, fn) {
    var self = this;

    if (typeof fn !== 'function') {
      throw new Error('many only accepts instances of Function');
    }

    function listener() {
      if (--ttl === 0) {
        self.off(event, listener);
      }
      fn.apply(this, arguments);
    }

    listener._origin = fn;

    this.on(event, listener);

    return self;
  };

  EventEmitter.prototype.emit = function() {

    this._events || init.call(this);

    var type = arguments[0];

    if (type === 'newListener' && !this.newListener) {
      if (!this._events.newListener) {
        return false;
      }
    }

    var al = arguments.length;
    var args,l,i,j;
    var handler;

    if (this._all && this._all.length) {
      handler = this._all.slice();
      if (al > 3) {
        args = new Array(al);
        for (j = 0; j < al; j++) args[j] = arguments[j];
      }

      for (i = 0, l = handler.length; i < l; i++) {
        this.event = type;
        switch (al) {
        case 1:
          handler[i].call(this, type);
          break;
        case 2:
          handler[i].call(this, type, arguments[1]);
          break;
        case 3:
          handler[i].call(this, type, arguments[1], arguments[2]);
          break;
        default:
          handler[i].apply(this, args);
        }
      }
    }

    if (this.wildcard) {
      handler = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handler, ns, this.listenerTree, 0);
    } else {
      handler = this._events[type];
      if (typeof handler === 'function') {
        this.event = type;
        switch (al) {
        case 1:
          handler.call(this);
          break;
        case 2:
          handler.call(this, arguments[1]);
          break;
        case 3:
          handler.call(this, arguments[1], arguments[2]);
          break;
        default:
          args = new Array(al - 1);
          for (j = 1; j < al; j++) args[j - 1] = arguments[j];
          handler.apply(this, args);
        }
        return true;
      } else if (handler) {
        // need to make copy of handlers because list can change in the middle
        // of emit call
        handler = handler.slice();
      }
    }

    if (handler && handler.length) {
      if (al > 3) {
        args = new Array(al - 1);
        for (j = 1; j < al; j++) args[j - 1] = arguments[j];
      }
      for (i = 0, l = handler.length; i < l; i++) {
        this.event = type;
        switch (al) {
        case 1:
          handler[i].call(this);
          break;
        case 2:
          handler[i].call(this, arguments[1]);
          break;
        case 3:
          handler[i].call(this, arguments[1], arguments[2]);
          break;
        default:
          handler[i].apply(this, args);
        }
      }
      return true;
    } else if (!this._all && type === 'error') {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }

    return !!this._all;
  };

  EventEmitter.prototype.emitAsync = function() {

    this._events || init.call(this);

    var type = arguments[0];

    if (type === 'newListener' && !this.newListener) {
        if (!this._events.newListener) { return Promise.resolve([false]); }
    }

    var promises= [];

    var al = arguments.length;
    var args,l,i,j;
    var handler;

    if (this._all) {
      if (al > 3) {
        args = new Array(al);
        for (j = 1; j < al; j++) args[j] = arguments[j];
      }
      for (i = 0, l = this._all.length; i < l; i++) {
        this.event = type;
        switch (al) {
        case 1:
          promises.push(this._all[i].call(this, type));
          break;
        case 2:
          promises.push(this._all[i].call(this, type, arguments[1]));
          break;
        case 3:
          promises.push(this._all[i].call(this, type, arguments[1], arguments[2]));
          break;
        default:
          promises.push(this._all[i].apply(this, args));
        }
      }
    }

    if (this.wildcard) {
      handler = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handler, ns, this.listenerTree, 0);
    } else {
      handler = this._events[type];
    }

    if (typeof handler === 'function') {
      this.event = type;
      switch (al) {
      case 1:
        promises.push(handler.call(this));
        break;
      case 2:
        promises.push(handler.call(this, arguments[1]));
        break;
      case 3:
        promises.push(handler.call(this, arguments[1], arguments[2]));
        break;
      default:
        args = new Array(al - 1);
        for (j = 1; j < al; j++) args[j - 1] = arguments[j];
        promises.push(handler.apply(this, args));
      }
    } else if (handler && handler.length) {
      if (al > 3) {
        args = new Array(al - 1);
        for (j = 1; j < al; j++) args[j - 1] = arguments[j];
      }
      for (i = 0, l = handler.length; i < l; i++) {
        this.event = type;
        switch (al) {
        case 1:
          promises.push(handler[i].call(this));
          break;
        case 2:
          promises.push(handler[i].call(this, arguments[1]));
          break;
        case 3:
          promises.push(handler[i].call(this, arguments[1], arguments[2]));
          break;
        default:
          promises.push(handler[i].apply(this, args));
        }
      }
    } else if (!this._all && type === 'error') {
      if (arguments[1] instanceof Error) {
        return Promise.reject(arguments[1]); // Unhandled 'error' event
      } else {
        return Promise.reject("Uncaught, unspecified 'error' event.");
      }
    }

    return Promise.all(promises);
  };

  EventEmitter.prototype.on = function(type, listener) {
    if (typeof type === 'function') {
      this.onAny(type);
      return this;
    }

    if (typeof listener !== 'function') {
      throw new Error('on only accepts instances of Function');
    }
    this._events || init.call(this);

    // To avoid recursion in the case that type == "newListeners"! Before
    // adding it to the listeners, first emit "newListeners".
    this.emit('newListener', type, listener);

    if (this.wildcard) {
      growListenerTree.call(this, type, listener);
      return this;
    }

    if (!this._events[type]) {
      // Optimize the case of one listener. Don't need the extra array object.
      this._events[type] = listener;
    }
    else {
      if (typeof this._events[type] === 'function') {
        // Change to array.
        this._events[type] = [this._events[type]];
      }

      // If we've already got an array, just append.
      this._events[type].push(listener);

      // Check for listener leak
      if (
        !this._events[type].warned &&
        this._events.maxListeners > 0 &&
        this._events[type].length > this._events.maxListeners
      ) {
        this._events[type].warned = true;
        logPossibleMemoryLeak.call(this, this._events[type].length, type);
      }
    }

    return this;
  };

  EventEmitter.prototype.onAny = function(fn) {
    if (typeof fn !== 'function') {
      throw new Error('onAny only accepts instances of Function');
    }

    if (!this._all) {
      this._all = [];
    }

    // Add the function to the event listener collection.
    this._all.push(fn);
    return this;
  };

  EventEmitter.prototype.addListener = EventEmitter.prototype.on;

  EventEmitter.prototype.off = function(type, listener) {
    if (typeof listener !== 'function') {
      throw new Error('removeListener only takes instances of Function');
    }

    var handlers,leafs=[];

    if(this.wildcard) {
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);
    }
    else {
      // does not use listeners(), so no side effect of creating _events[type]
      if (!this._events[type]) return this;
      handlers = this._events[type];
      leafs.push({_listeners:handlers});
    }

    for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
      var leaf = leafs[iLeaf];
      handlers = leaf._listeners;
      if (isArray$$1(handlers)) {

        var position = -1;

        for (var i = 0, length = handlers.length; i < length; i++) {
          if (handlers[i] === listener ||
            (handlers[i].listener && handlers[i].listener === listener) ||
            (handlers[i]._origin && handlers[i]._origin === listener)) {
            position = i;
            break;
          }
        }

        if (position < 0) {
          continue;
        }

        if(this.wildcard) {
          leaf._listeners.splice(position, 1);
        }
        else {
          this._events[type].splice(position, 1);
        }

        if (handlers.length === 0) {
          if(this.wildcard) {
            delete leaf._listeners;
          }
          else {
            delete this._events[type];
          }
        }

        this.emit("removeListener", type, listener);

        return this;
      }
      else if (handlers === listener ||
        (handlers.listener && handlers.listener === listener) ||
        (handlers._origin && handlers._origin === listener)) {
        if(this.wildcard) {
          delete leaf._listeners;
        }
        else {
          delete this._events[type];
        }

        this.emit("removeListener", type, listener);
      }
    }

    function recursivelyGarbageCollect(root) {
      if (root === undefined) {
        return;
      }
      var keys = Object.keys(root);
      for (var i in keys) {
        var key = keys[i];
        var obj = root[key];
        if ((obj instanceof Function) || (typeof obj !== "object") || (obj === null))
          continue;
        if (Object.keys(obj).length > 0) {
          recursivelyGarbageCollect(root[key]);
        }
        if (Object.keys(obj).length === 0) {
          delete root[key];
        }
      }
    }
    recursivelyGarbageCollect(this.listenerTree);

    return this;
  };

  EventEmitter.prototype.offAny = function(fn) {
    var i = 0, l = 0, fns;
    if (fn && this._all && this._all.length > 0) {
      fns = this._all;
      for(i = 0, l = fns.length; i < l; i++) {
        if(fn === fns[i]) {
          fns.splice(i, 1);
          this.emit("removeListenerAny", fn);
          return this;
        }
      }
    } else {
      fns = this._all;
      for(i = 0, l = fns.length; i < l; i++)
        this.emit("removeListenerAny", fns[i]);
      this._all = [];
    }
    return this;
  };

  EventEmitter.prototype.removeListener = EventEmitter.prototype.off;

  EventEmitter.prototype.removeAllListeners = function(type) {
    if (arguments.length === 0) {
      !this._events || init.call(this);
      return this;
    }

    if (this.wildcard) {
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      var leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);

      for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
        var leaf = leafs[iLeaf];
        leaf._listeners = null;
      }
    }
    else if (this._events) {
      this._events[type] = null;
    }
    return this;
  };

  EventEmitter.prototype.listeners = function(type) {
    if (this.wildcard) {
      var handlers = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handlers, ns, this.listenerTree, 0);
      return handlers;
    }

    this._events || init.call(this);

    if (!this._events[type]) this._events[type] = [];
    if (!isArray$$1(this._events[type])) {
      this._events[type] = [this._events[type]];
    }
    return this._events[type];
  };

  EventEmitter.prototype.listenerCount = function(type) {
    return this.listeners(type).length;
  };

  EventEmitter.prototype.listenersAny = function() {

    if(this._all) {
      return this._all;
    }
    else {
      return [];
    }

  };

  if (typeof undefined === 'function' && undefined.amd) {
     // AMD. Register as an anonymous module.
    undefined(function() {
      return EventEmitter;
    });
  } else if (typeof exports === 'object') {
    // CommonJS
    module.exports = EventEmitter;
  }
  else {
    // Browser global.
    window.EventEmitter2 = EventEmitter;
  }
}();
});

var EventEmitter2 = eventemitter2.EventEmitter2;

var inferno$1 = createCommonjsModule(function (module, exports) {
/*!
 * inferno v1.0.0-beta23
 * (c) 2016 Dominic Gannaway
 * Released under the MIT License.
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof undefined === 'function' && undefined.amd ? undefined(factory) :
	(global.Inferno = factory());
}(commonjsGlobal, (function () { 'use strict';

var NO_OP = '$NO_OP';
var ERROR_MSG = 'a runtime error occured! Use Inferno in development environment to find the error.';
var isBrowser = typeof window !== 'undefined' && window.document;

// this is MUCH faster than .constructor === Array and instanceof Array
// in Node 7 and the later versions of V8, slower in older versions though
var isArray$$1 = Array.isArray;
function isStatefulComponent(o) {
    return !isUndefined(o.prototype) && !isUndefined(o.prototype.render);
}
function isStringOrNumber(obj) {
    return isString$$1(obj) || isNumber$$1(obj);
}
function isNullOrUndef(obj) {
    return isUndefined(obj) || isNull(obj);
}
function isInvalid(obj) {
    return isNull(obj) || obj === false || isTrue(obj) || isUndefined(obj);
}
function isFunction$$1(obj) {
    return typeof obj === 'function';
}
function isAttrAnEvent(attr) {
    return attr[0] === 'o' && attr[1] === 'n' && attr.length > 3;
}
function isString$$1(obj) {
    return typeof obj === 'string';
}
function isNumber$$1(obj) {
    return typeof obj === 'number';
}
function isNull(obj) {
    return obj === null;
}
function isTrue(obj) {
    return obj === true;
}
function isUndefined(obj) {
    return obj === undefined;
}
function isObject$$1(o) {
    return typeof o === 'object';
}
function throwError(message) {
    if (!message) {
        message = ERROR_MSG;
    }
    throw new Error(("Inferno Error: " + message));
}
function warning(condition, message) {
    if (!condition) {
        console.error(message);
    }
}
var EMPTY_OBJ = {};

function cloneVNode(vNodeToClone, props) {
    var _children = [], len = arguments.length - 2;
    while ( len-- > 0 ) _children[ len ] = arguments[ len + 2 ];

    var children = _children;
    if (_children.length > 0 && !isNull(_children[0])) {
        if (!props) {
            props = {};
        }
        if (_children.length === 1) {
            children = _children[0];
        }
        if (isUndefined(props.children)) {
            props.children = children;
        }
        else {
            if (isArray$$1(children)) {
                if (isArray$$1(props.children)) {
                    props.children = props.children.concat(children);
                }
                else {
                    props.children = [props.children].concat(children);
                }
            }
            else {
                if (isArray$$1(props.children)) {
                    props.children.push(children);
                }
                else {
                    props.children = [props.children];
                    props.children.push(children);
                }
            }
        }
    }
    children = null;
    var flags = vNodeToClone.flags;
    var newVNode;
    if (isArray$$1(vNodeToClone)) {
        newVNode = vNodeToClone.map(function (vNode) { return cloneVNode(vNode); });
    }
    else if (isNullOrUndef(props) && isNullOrUndef(children)) {
        newVNode = Object.assign({}, vNodeToClone);
    }
    else {
        var key = !isNullOrUndef(vNodeToClone.key) ? vNodeToClone.key : props.key;
        var ref = vNodeToClone.ref || props.ref;
        if (flags & 28 /* Component */) {
            newVNode = createVNode(flags, vNodeToClone.type, Object.assign({}, vNodeToClone.props, props), null, key, ref, true);
        }
        else if (flags & 3970 /* Element */) {
            children = (props && props.children) || vNodeToClone.children;
            newVNode = createVNode(flags, vNodeToClone.type, Object.assign({}, vNodeToClone.props, props), children, key, ref, !children);
        }
    }
    if (flags & 28 /* Component */) {
        var newProps = newVNode.props;
        // we need to also clone component children that are in props
        // as the children may also have been hoisted
        if (newProps && newProps.children) {
            var newChildren = newProps.children;
            if (isArray$$1(newChildren)) {
                for (var i = 0; i < newChildren.length; i++) {
                    if (!isInvalid(newChildren[i]) && isVNode(newChildren[i])) {
                        newProps.children[i] = cloneVNode(newChildren[i]);
                    }
                }
            }
            else if (!isInvalid(newChildren) && isVNode(newChildren)) {
                newProps.children = cloneVNode(newChildren);
            }
        }
        newVNode.children = null;
    }
    newVNode.dom = null;
    return newVNode;
}

function _normalizeVNodes(nodes, result, i) {
    for (; i < nodes.length; i++) {
        var n = nodes[i];
        if (!isInvalid(n)) {
            if (Array.isArray(n)) {
                _normalizeVNodes(n, result, 0);
            }
            else {
                if (isStringOrNumber(n)) {
                    n = createTextVNode(n);
                }
                else if (isVNode(n) && n.dom) {
                    n = cloneVNode(n);
                }
                result.push(n);
            }
        }
    }
}
function normalizeVNodes(nodes) {
    var newNodes;
    // we assign $ which basically means we've flagged this array for future note
    // if it comes back again, we need to clone it, as people are using it
    // in an immutable way
    // tslint:disable
    if (nodes['$']) {
        nodes = nodes.slice();
    }
    else {
        nodes['$'] = true;
    }
    // tslint:enable
    for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (isInvalid(n)) {
            if (!newNodes) {
                newNodes = nodes.slice(0, i);
            }
            newNodes.push(n);
        }
        else if (Array.isArray(n)) {
            var result = (newNodes || nodes).slice(0, i);
            _normalizeVNodes(nodes, result, i);
            return result;
        }
        else if (isStringOrNumber(n)) {
            if (!newNodes) {
                newNodes = nodes.slice(0, i);
            }
            newNodes.push(createTextVNode(n));
        }
        else if (isVNode(n) && n.dom) {
            if (!newNodes) {
                newNodes = nodes.slice(0, i);
            }
            newNodes.push(cloneVNode(n));
        }
        else if (newNodes) {
            newNodes.push(cloneVNode(n));
        }
    }
    return newNodes || nodes;
}
function normalize(vNode) {
    var props = vNode.props;
    var children = vNode.children;
    if (props) {
        if (!(vNode.flags & 28 /* Component */) && isNullOrUndef(children) && !isNullOrUndef(props.children)) {
            vNode.children = props.children;
        }
        if (props.ref) {
            vNode.ref = props.ref;
        }
        if (!isNullOrUndef(props.key)) {
            vNode.key = props.key;
        }
    }
    if (!isInvalid(children)) {
        if (isArray$$1(children)) {
            vNode.children = normalizeVNodes(children);
        }
        else if (isVNode(children) && children.dom) {
            vNode.children = cloneVNode(children);
        }
    }
}
function createVNode(flags, type, props, children, key, ref, noNormalise) {
    if (flags & 16 /* ComponentUnknown */) {
        flags = isStatefulComponent(type) ? 4 /* ComponentClass */ : 8 /* ComponentFunction */;
    }
    var vNode = {
        children: isUndefined(children) ? null : children,
        dom: null,
        flags: flags || 0,
        key: key === undefined ? null : key,
        props: props || null,
        ref: ref || null,
        type: type
    };
    if (!noNormalise) {
        normalize(vNode);
    }
    return vNode;
}
// when a components root VNode is also a component, we can run into issues
// this will recursively look for vNode.parentNode if the VNode is a component
function updateParentComponentVNodes(vNode, dom) {
    if (vNode.flags & 28 /* Component */) {
        var parentVNode = vNode.parentVNode;
        if (parentVNode) {
            parentVNode.dom = dom;
            updateParentComponentVNodes(parentVNode, dom);
        }
    }
}
function createVoidVNode() {
    return createVNode(4096 /* Void */);
}
function createTextVNode(text) {
    return createVNode(1 /* Text */, null, null, text);
}
function isVNode(o) {
    return !!o.flags;
}

var devToolsStatus = {
    connected: false
};
var internalIncrementer = {
    id: 0
};
var componentIdMap = new Map();
function getIncrementalId() {
    return internalIncrementer.id++;
}
function sendToDevTools(global, data) {
    var event = new CustomEvent('inferno.client.message', {
        detail: JSON.stringify(data, function (key, val) {
            if (!isNull(val) && !isUndefined(val)) {
                if (key === '_vComponent' || !isUndefined(val.nodeType)) {
                    return;
                }
                else if (isFunction$$1(val)) {
                    return ("$$f:" + (val.name));
                }
            }
            return val;
        })
    });
    global.dispatchEvent(event);
}
function rerenderRoots() {
    for (var i = 0; i < roots.length; i++) {
        var root = roots[i];
        render(root.input, root.dom);
    }
}
function initDevToolsHooks(global) {
    global.__INFERNO_DEVTOOLS_GLOBAL_HOOK__ = roots;
    global.addEventListener('inferno.devtools.message', function (message) {
        var detail = JSON.parse(message.detail);
        var type = detail.type;
        switch (type) {
            case 'get-roots':
                if (!devToolsStatus.connected) {
                    devToolsStatus.connected = true;
                    rerenderRoots();
                    sendRoots(global);
                }
                break;
            default:
                // TODO:?
                break;
        }
    });
}
function sendRoots(global) {
    sendToDevTools(global, { type: 'roots', data: roots });
}

var Lifecycle = function Lifecycle() {
    this.listeners = [];
    this.fastUnmount = true;
};
Lifecycle.prototype.addListener = function addListener (callback) {
    this.listeners.push(callback);
};
Lifecycle.prototype.trigger = function trigger () {
        var this$1 = this;

    for (var i = 0; i < this.listeners.length; i++) {
        this$1.listeners[i]();
    }
};

function constructDefaults(string, object, value) {
    /* eslint no-return-assign: 0 */
    string.split(',').forEach(function (i) { return object[i] = value; });
}
var xlinkNS = 'http://www.w3.org/1999/xlink';
var xmlNS = 'http://www.w3.org/XML/1998/namespace';
var svgNS = 'http://www.w3.org/2000/svg';
var strictProps = {};
var booleanProps = {};
var namespaces = {};
var isUnitlessNumber = {};
constructDefaults('xlink:href,xlink:arcrole,xlink:actuate,xlink:role,xlink:titlef,xlink:type', namespaces, xlinkNS);
constructDefaults('xml:base,xml:lang,xml:space', namespaces, xmlNS);
constructDefaults('volume,defaultValue,defaultChecked', strictProps, true);
constructDefaults('muted,scoped,loop,open,checked,default,capture,disabled,readonly,required,autoplay,controls,seamless,reversed,allowfullscreen,novalidate', booleanProps, true);
constructDefaults('animationIterationCount,borderImageOutset,borderImageSlice,borderImageWidth,boxFlex,boxFlexGroup,boxOrdinalGroup,columnCount,flex,flexGrow,flexPositive,flexShrink,flexNegative,flexOrder,gridRow,gridColumn,fontWeight,lineClamp,lineHeight,opacity,order,orphans,tabSize,widows,zIndex,zoom,fillOpacity,floodOpacity,stopOpacity,strokeDasharray,strokeDashoffset,strokeMiterlimit,strokeOpacity,strokeWidth,', isUnitlessNumber, true);

function isCheckedType(type) {
    return type === 'checkbox' || type === 'radio';
}
function isControlled(props) {
    var usesChecked = isCheckedType(props.type);
    return usesChecked ? !isNullOrUndef(props.checked) : !isNullOrUndef(props.value);
}
function onTextInputChange(e) {
    var vNode = this.vNode;
    var props = vNode.props;
    var dom = vNode.dom;
    if (props.onInput) {
        props.onInput(e);
    }
    else if (props.oninput) {
        props.oninput(e);
    }
    // the user may have updated the vNode from the above onInput events
    // so we need to get it from the context of `this` again
    applyValue(this.vNode, dom);
}
function onCheckboxChange(e) {
    var vNode = this.vNode;
    var props = vNode.props;
    var dom = vNode.dom;
    if (props.onClick) {
        props.onClick(e);
    }
    else if (props.onclick) {
        props.onclick(e);
    }
    // the user may have updated the vNode from the above onClick events
    // so we need to get it from the context of `this` again
    applyValue(this.vNode, dom);
}
function handleAssociatedRadioInputs(name) {
    var inputs = document.querySelectorAll(("input[type=\"radio\"][name=\"" + name + "\"]"));
    [].forEach.call(inputs, function (dom) {
        var inputWrapper = wrappers.get(dom);
        if (inputWrapper) {
            var props = inputWrapper.vNode.props;
            if (props) {
                dom.checked = inputWrapper.vNode.props.checked;
            }
        }
    });
}
function processInput(vNode, dom) {
    var props = vNode.props || EMPTY_OBJ;
    applyValue(vNode, dom);
    if (isControlled(props)) {
        var inputWrapper = wrappers.get(dom);
        if (!inputWrapper) {
            inputWrapper = {
                vNode: vNode
            };
            if (isCheckedType(props.type)) {
                dom.onclick = onCheckboxChange.bind(inputWrapper);
                dom.onclick.wrapped = true;
            }
            else {
                dom.oninput = onTextInputChange.bind(inputWrapper);
                dom.oninput.wrapped = true;
            }
            wrappers.set(dom, inputWrapper);
        }
        inputWrapper.vNode = vNode;
    }
}
function applyValue(vNode, dom) {
    var props = vNode.props || EMPTY_OBJ;
    var type = props.type;
    var value = props.value;
    var checked = props.checked;
    if (type !== dom.type && type) {
        dom.type = type;
    }
    if (props.multiple !== dom.multiple) {
        dom.multiple = props.multiple;
    }
    if (isCheckedType(type)) {
        if (!isNullOrUndef(value)) {
            dom.value = value;
        }
        dom.checked = checked;
        if (type === 'radio' && props.name) {
            handleAssociatedRadioInputs(props.name);
        }
    }
    else {
        if (!isNullOrUndef(value) && dom.value !== value) {
            dom.value = value;
        }
        else if (!isNullOrUndef(checked)) {
            dom.checked = checked;
        }
    }
}

function isControlled$1(props) {
    return !isNullOrUndef(props.value);
}
function updateChildOption(vNode, value) {
    var props = vNode.props || EMPTY_OBJ;
    var dom = vNode.dom;
    // we do this as multiple may have changed
    dom.value = props.value;
    if ((isArray$$1(value) && value.indexOf(props.value) !== -1) || props.value === value) {
        dom.selected = true;
    }
    else {
        dom.selected = props.selected || false;
    }
}
function onSelectChange(e) {
    var vNode = this.vNode;
    var props = vNode.props;
    var dom = vNode.dom;
    if (props.onChange) {
        props.onChange(e);
    }
    else if (props.onchange) {
        props.onchange(e);
    }
    // the user may have updated the vNode from the above onChange events
    // so we need to get it from the context of `this` again
    applyValue$1(this.vNode, dom);
}
function processSelect(vNode, dom) {
    var props = vNode.props || EMPTY_OBJ;
    applyValue$1(vNode, dom);
    if (isControlled$1(props)) {
        var selectWrapper = wrappers.get(dom);
        if (!selectWrapper) {
            selectWrapper = {
                vNode: vNode
            };
            dom.onchange = onSelectChange.bind(selectWrapper);
            dom.onchange.wrapped = true;
            wrappers.set(dom, selectWrapper);
        }
        selectWrapper.vNode = vNode;
    }
}
function applyValue$1(vNode, dom) {
    var props = vNode.props || EMPTY_OBJ;
    if (props.multiple !== dom.multiple) {
        dom.multiple = props.multiple;
    }
    var children = vNode.children;
    var value = props.value;
    if (isArray$$1(children)) {
        for (var i = 0; i < children.length; i++) {
            updateChildOption(children[i], value);
        }
    }
    else if (isVNode(children)) {
        updateChildOption(children, value);
    }
}

// import { isVNode } from '../../core/shapes';
function isControlled$2(props) {
    return !isNullOrUndef(props.value);
}
function onTextareaInputChange(e) {
    var vNode = this.vNode;
    var props = vNode.props;
    var dom = vNode.dom;
    if (props.onInput) {
        props.onInput(e);
    }
    else if (props.oninput) {
        props.oninput(e);
    }
    // the user may have updated the vNode from the above onInput events
    // so we need to get it from the context of `this` again
    applyValue$2(this.vNode, dom);
}
function processTextarea(vNode, dom) {
    var props = vNode.props || EMPTY_OBJ;
    applyValue$2(vNode, dom);
    var textareaWrapper = wrappers.get(dom);
    if (isControlled$2(props)) {
        if (!textareaWrapper) {
            textareaWrapper = {
                vNode: vNode
            };
            dom.oninput = onTextareaInputChange.bind(textareaWrapper);
            dom.oninput.wrapped = true;
            wrappers.set(dom, textareaWrapper);
        }
        textareaWrapper.vNode = vNode;
    }
}
function applyValue$2(vNode, dom) {
    var props = vNode.props || EMPTY_OBJ;
    var value = props.value;
    if (dom.value !== value) {
        dom.value = value;
    }
}

var wrappers = new Map();
function processElement(flags, vNode, dom) {
    if (flags & 512 /* InputElement */) {
        processInput(vNode, dom);
    }
    else if (flags & 2048 /* SelectElement */) {
        processSelect(vNode, dom);
    }
    else if (flags & 1024 /* TextareaElement */) {
        processTextarea(vNode, dom);
    }
}

function unmount(vNode, parentDom, lifecycle, canRecycle, shallowUnmount, isRecycling) {
    var flags = vNode.flags;
    if (flags & 28 /* Component */) {
        unmountComponent(vNode, parentDom, lifecycle, canRecycle, shallowUnmount, isRecycling);
    }
    else if (flags & 3970 /* Element */) {
        unmountElement(vNode, parentDom, lifecycle, canRecycle, shallowUnmount, isRecycling);
    }
    else if (flags & 1 /* Text */) {
        unmountText(vNode, parentDom);
    }
    else if (flags & 4096 /* Void */) {
        unmountVoid(vNode, parentDom);
    }
}
function unmountVoid(vNode, parentDom) {
    if (parentDom) {
        removeChild(parentDom, vNode.dom);
    }
}
function unmountText(vNode, parentDom) {
    if (parentDom) {
        removeChild(parentDom, vNode.dom);
    }
}
function unmountComponent(vNode, parentDom, lifecycle, canRecycle, shallowUnmount, isRecycling) {
    var instance = vNode.children;
    var flags = vNode.flags;
    var isStatefulComponent$$1 = flags & 4;
    var ref = vNode.ref;
    var dom = vNode.dom;
    if (!isRecycling) {
        if (!shallowUnmount) {
            if (isStatefulComponent$$1) {
                var subLifecycle = instance._lifecycle;
                if (!subLifecycle.fastUnmount) {
                    unmount(instance._lastInput, null, lifecycle, false, shallowUnmount, isRecycling);
                }
            }
            else {
                if (!lifecycle.fastUnmount) {
                    unmount(instance, null, lifecycle, false, shallowUnmount, isRecycling);
                }
            }
        }
        if (isStatefulComponent$$1) {
            instance._ignoreSetState = true;
            instance.componentWillUnmount();
            if (ref && !isRecycling) {
                ref(null);
            }
            instance._unmounted = true;
            componentToDOMNodeMap.delete(instance);
        }
        else if (!isNullOrUndef(ref)) {
            if (!isNullOrUndef(ref.onComponentWillUnmount)) {
                ref.onComponentWillUnmount(dom);
            }
        }
    }
    if (parentDom) {
        var lastInput = instance._lastInput;
        if (isNullOrUndef(lastInput)) {
            lastInput = instance;
        }
        removeChild(parentDom, dom);
    }
    if (recyclingEnabled && (parentDom || canRecycle)) {
        poolComponent(vNode);
    }
}
function unmountElement(vNode, parentDom, lifecycle, canRecycle, shallowUnmount, isRecycling) {
    var dom = vNode.dom;
    var ref = vNode.ref;
    if (!shallowUnmount && !lifecycle.fastUnmount) {
        if (ref && !isRecycling) {
            unmountRef(ref);
        }
        var children = vNode.children;
        if (!isNullOrUndef(children)) {
            unmountChildren$1(children, lifecycle, shallowUnmount, isRecycling);
        }
    }
    if (parentDom) {
        removeChild(parentDom, dom);
    }
    if (recyclingEnabled && (parentDom || canRecycle)) {
        poolElement(vNode);
    }
}
function unmountChildren$1(children, lifecycle, shallowUnmount, isRecycling) {
    if (isArray$$1(children)) {
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (!isInvalid(child) && isObject$$1(child)) {
                unmount(child, null, lifecycle, false, shallowUnmount, isRecycling);
            }
        }
    }
    else if (isObject$$1(children)) {
        unmount(children, null, lifecycle, false, shallowUnmount, isRecycling);
    }
}
function unmountRef(ref) {
    if (isFunction$$1(ref)) {
        ref(null);
    }
    else {
        if (isInvalid(ref)) {
            return;
        }
        if (process.env.NODE_ENV !== 'production') {
            throwError('string "refs" are not supported in Inferno 1.0. Use callback "refs" instead.');
        }
        throwError();
    }
}

function patch(lastVNode, nextVNode, parentDom, lifecycle, context, isSVG, isRecycling) {
    if (lastVNode !== nextVNode) {
        var lastFlags = lastVNode.flags;
        var nextFlags = nextVNode.flags;
        if (nextFlags & 28 /* Component */) {
            if (lastFlags & 28 /* Component */) {
                patchComponent(lastVNode, nextVNode, parentDom, lifecycle, context, isSVG, nextFlags & 4 /* ComponentClass */, isRecycling);
            }
            else {
                replaceVNode(parentDom, mountComponent(nextVNode, null, lifecycle, context, isSVG, nextFlags & 4 /* ComponentClass */), lastVNode, lifecycle, isRecycling);
            }
        }
        else if (nextFlags & 3970 /* Element */) {
            if (lastFlags & 3970 /* Element */) {
                patchElement(lastVNode, nextVNode, parentDom, lifecycle, context, isSVG, isRecycling);
            }
            else {
                replaceVNode(parentDom, mountElement(nextVNode, null, lifecycle, context, isSVG), lastVNode, lifecycle, isRecycling);
            }
        }
        else if (nextFlags & 1 /* Text */) {
            if (lastFlags & 1 /* Text */) {
                patchText(lastVNode, nextVNode);
            }
            else {
                replaceVNode(parentDom, mountText(nextVNode, null), lastVNode, lifecycle, isRecycling);
            }
        }
        else if (nextFlags & 4096 /* Void */) {
            if (lastFlags & 4096 /* Void */) {
                patchVoid(lastVNode, nextVNode);
            }
            else {
                replaceVNode(parentDom, mountVoid(nextVNode, null), lastVNode, lifecycle, isRecycling);
            }
        }
        else {
            // Error case: mount new one replacing old one
            replaceLastChildAndUnmount(lastVNode, nextVNode, parentDom, lifecycle, context, isSVG, isRecycling);
        }
    }
}
function unmountChildren(children, dom, lifecycle, isRecycling) {
    if (isVNode(children)) {
        unmount(children, dom, lifecycle, true, false, isRecycling);
    }
    else if (isArray$$1(children)) {
        removeAllChildren(dom, children, lifecycle, false, isRecycling);
    }
    else {
        dom.textContent = '';
    }
}
function patchElement(lastVNode, nextVNode, parentDom, lifecycle, context, isSVG, isRecycling) {
    var nextTag = nextVNode.type;
    var lastTag = lastVNode.type;
    if (lastTag !== nextTag) {
        replaceWithNewNode(lastVNode, nextVNode, parentDom, lifecycle, context, isSVG, isRecycling);
    }
    else {
        var dom = lastVNode.dom;
        var lastProps = lastVNode.props;
        var nextProps = nextVNode.props;
        var lastChildren = lastVNode.children;
        var nextChildren = nextVNode.children;
        var lastFlags = lastVNode.flags;
        var nextFlags = nextVNode.flags;
        var lastRef = lastVNode.ref;
        var nextRef = nextVNode.ref;
        nextVNode.dom = dom;
        if (isSVG || (nextFlags & 128 /* SvgElement */)) {
            isSVG = true;
        }
        if (lastChildren !== nextChildren) {
            patchChildren(lastFlags, nextFlags, lastChildren, nextChildren, dom, lifecycle, context, isSVG, isRecycling);
        }
        if (!(nextFlags & 2 /* HtmlElement */)) {
            processElement(nextFlags, nextVNode, dom);
        }
        if (lastProps !== nextProps) {
            patchProps(lastProps, nextProps, dom, lifecycle, context, isSVG);
        }
        if (nextRef) {
            if (lastRef !== nextRef || isRecycling) {
                mountRef(dom, nextRef, lifecycle);
            }
        }
    }
}
function patchChildren(lastFlags, nextFlags, lastChildren, nextChildren, dom, lifecycle, context, isSVG, isRecycling) {
    var patchArray = false;
    var patchKeyed = false;
    if (nextFlags & 64 /* HasNonKeyedChildren */) {
        patchArray = true;
    }
    else if ((lastFlags & 32 /* HasKeyedChildren */) && (nextFlags & 32 /* HasKeyedChildren */)) {
        patchKeyed = true;
        patchArray = true;
    }
    else if (isInvalid(nextChildren)) {
        unmountChildren(lastChildren, dom, lifecycle, isRecycling);
    }
    else if (isInvalid(lastChildren)) {
        if (isStringOrNumber(nextChildren)) {
            setTextContent(dom, nextChildren);
        }
        else {
            if (isArray$$1(nextChildren)) {
                mountArrayChildren(nextChildren, dom, lifecycle, context, isSVG);
            }
            else {
                mount(nextChildren, dom, lifecycle, context, isSVG);
            }
        }
    }
    else if (isStringOrNumber(nextChildren)) {
        if (isStringOrNumber(lastChildren)) {
            updateTextContent(dom, nextChildren);
        }
        else {
            unmountChildren(lastChildren, dom, lifecycle, isRecycling);
            setTextContent(dom, nextChildren);
        }
    }
    else if (isArray$$1(nextChildren)) {
        if (isArray$$1(lastChildren)) {
            patchArray = true;
            if (isKeyed(lastChildren, nextChildren)) {
                patchKeyed = true;
            }
        }
        else {
            unmountChildren(lastChildren, dom, lifecycle, isRecycling);
            mountArrayChildren(nextChildren, dom, lifecycle, context, isSVG);
        }
    }
    else if (isArray$$1(lastChildren)) {
        removeAllChildren(dom, lastChildren, lifecycle, false, isRecycling);
        mount(nextChildren, dom, lifecycle, context, isSVG);
    }
    else if (isVNode(nextChildren)) {
        if (isVNode(lastChildren)) {
            patch(lastChildren, nextChildren, dom, lifecycle, context, isSVG, isRecycling);
        }
        else {
            unmountChildren(lastChildren, dom, lifecycle, isRecycling);
            mount(nextChildren, dom, lifecycle, context, isSVG);
        }
    }
    else if (isVNode(lastChildren)) {
    }
    else {
    }
    if (patchArray) {
        if (patchKeyed) {
            patchKeyedChildren(lastChildren, nextChildren, dom, lifecycle, context, isSVG, isRecycling);
        }
        else {
            patchNonKeyedChildren(lastChildren, nextChildren, dom, lifecycle, context, isSVG, isRecycling);
        }
    }
}
function patchComponent(lastVNode, nextVNode, parentDom, lifecycle, context, isSVG, isClass, isRecycling) {
    var lastType = lastVNode.type;
    var nextType = nextVNode.type;
    var nextProps = nextVNode.props || EMPTY_OBJ;
    var lastKey = lastVNode.key;
    var nextKey = nextVNode.key;
    if (lastType !== nextType) {
        if (isClass) {
            replaceWithNewNode(lastVNode, nextVNode, parentDom, lifecycle, context, isSVG, isRecycling);
        }
        else {
            var lastInput = lastVNode.children._lastInput || lastVNode.children;
            var nextInput = createStatelessComponentInput(nextVNode, nextType, nextProps, context);
            patch(lastInput, nextInput, parentDom, lifecycle, context, isSVG, isRecycling);
            var dom = nextVNode.dom = nextInput.dom;
            nextVNode.children = nextInput;
            mountStatelessComponentCallbacks(nextVNode.ref, dom, lifecycle);
            unmount(lastVNode, null, lifecycle, false, true, isRecycling);
        }
    }
    else {
        if (isClass) {
            if (lastKey !== nextKey) {
                replaceWithNewNode(lastVNode, nextVNode, parentDom, lifecycle, context, isSVG, isRecycling);
                return false;
            }
            var instance = lastVNode.children;
            if (instance._unmounted) {
                if (isNull(parentDom)) {
                    return true;
                }
                replaceChild(parentDom, mountComponent(nextVNode, null, lifecycle, context, isSVG, nextVNode.flags & 4 /* ComponentClass */), lastVNode.dom);
            }
            else {
                var defaultProps = nextType.defaultProps;
                var lastProps = instance.props;
                if (instance._devToolsStatus.connected && !instance._devToolsId) {
                    componentIdMap.set(instance._devToolsId = getIncrementalId(), instance);
                }
                lifecycle.fastUnmount = false;
                if (!isUndefined(defaultProps)) {
                    copyPropsTo(lastProps, nextProps);
                    nextVNode.props = nextProps;
                }
                var lastState = instance.state;
                var nextState = instance.state;
                var childContext = instance.getChildContext();
                nextVNode.children = instance;
                instance._isSVG = isSVG;
                if (!isNullOrUndef(childContext)) {
                    childContext = Object.assign({}, context, childContext);
                }
                else {
                    childContext = context;
                }
                var lastInput$1 = instance._lastInput;
                var nextInput$1 = instance._updateComponent(lastState, nextState, lastProps, nextProps, context, false);
                var didUpdate = true;
                instance._childContext = childContext;
                if (isInvalid(nextInput$1)) {
                    nextInput$1 = createVoidVNode();
                }
                else if (isArray$$1(nextInput$1)) {
                    if (process.env.NODE_ENV !== 'production') {
                        throwError('a valid Inferno VNode (or null) must be returned from a component render. You may have returned an array or an invalid object.');
                    }
                    throwError();
                }
                else if (nextInput$1 === NO_OP) {
                    nextInput$1 = lastInput$1;
                    didUpdate = false;
                }
                else if (isObject$$1(nextInput$1) && nextInput$1.dom) {
                    nextInput$1 = cloneVNode(nextInput$1);
                }
                if (nextInput$1.flags & 28 /* Component */) {
                    nextInput$1.parentVNode = nextVNode;
                }
                else if (lastInput$1.flags & 28 /* Component */) {
                    lastInput$1.parentVNode = nextVNode;
                }
                instance._lastInput = nextInput$1;
                instance._vNode = nextVNode;
                if (didUpdate) {
                    patch(lastInput$1, nextInput$1, parentDom, lifecycle, childContext, isSVG, isRecycling);
                    instance.componentDidUpdate(lastProps, lastState);
                    componentToDOMNodeMap.set(instance, nextInput$1.dom);
                }
                nextVNode.dom = nextInput$1.dom;
            }
        }
        else {
            var shouldUpdate = true;
            var lastProps$1 = lastVNode.props;
            var nextHooks = nextVNode.ref;
            var nextHooksDefined = !isNullOrUndef(nextHooks);
            var lastInput$2 = lastVNode.children;
            var nextInput$2 = lastInput$2;
            nextVNode.dom = lastVNode.dom;
            nextVNode.children = lastInput$2;
            if (lastKey !== nextKey) {
                shouldUpdate = true;
            }
            else {
                if (nextHooksDefined && !isNullOrUndef(nextHooks.onComponentShouldUpdate)) {
                    shouldUpdate = nextHooks.onComponentShouldUpdate(lastProps$1, nextProps);
                }
            }
            if (shouldUpdate !== false) {
                if (nextHooksDefined && !isNullOrUndef(nextHooks.onComponentWillUpdate)) {
                    lifecycle.fastUnmount = false;
                    nextHooks.onComponentWillUpdate(lastProps$1, nextProps);
                }
                nextInput$2 = nextType(nextProps, context);
                if (isInvalid(nextInput$2)) {
                    nextInput$2 = createVoidVNode();
                }
                else if (isArray$$1(nextInput$2)) {
                    if (process.env.NODE_ENV !== 'production') {
                        throwError('a valid Inferno VNode (or null) must be returned from a component render. You may have returned an array or an invalid object.');
                    }
                    throwError();
                }
                else if (isObject$$1(nextInput$2) && nextInput$2.dom) {
                    nextInput$2 = cloneVNode(nextInput$2);
                }
                if (nextInput$2 !== NO_OP) {
                    patch(lastInput$2, nextInput$2, parentDom, lifecycle, context, isSVG, isRecycling);
                    nextVNode.children = nextInput$2;
                    if (nextHooksDefined && !isNullOrUndef(nextHooks.onComponentDidUpdate)) {
                        lifecycle.fastUnmount = false;
                        nextHooks.onComponentDidUpdate(lastProps$1, nextProps);
                    }
                    nextVNode.dom = nextInput$2.dom;
                }
            }
            if (nextInput$2.flags & 28 /* Component */) {
                nextInput$2.parentVNode = nextVNode;
            }
            else if (lastInput$2.flags & 28 /* Component */) {
                lastInput$2.parentVNode = nextVNode;
            }
        }
    }
    return false;
}
function patchText(lastVNode, nextVNode) {
    var nextText = nextVNode.children;
    var dom = lastVNode.dom;
    nextVNode.dom = dom;
    if (lastVNode.children !== nextText) {
        dom.nodeValue = nextText;
    }
}
function patchVoid(lastVNode, nextVNode) {
    nextVNode.dom = lastVNode.dom;
}
function patchNonKeyedChildren(lastChildren, nextChildren, dom, lifecycle, context, isSVG, isRecycling) {
    var lastChildrenLength = lastChildren.length;
    var nextChildrenLength = nextChildren.length;
    var commonLength = lastChildrenLength > nextChildrenLength ? nextChildrenLength : lastChildrenLength;
    var i;
    var nextNode = null;
    var newNode;
    // Loop backwards so we can use insertBefore
    if (lastChildrenLength < nextChildrenLength) {
        for (i = nextChildrenLength - 1; i >= commonLength; i--) {
            var child = nextChildren[i];
            if (!isInvalid(child)) {
                if (child.dom) {
                    nextChildren[i] = child = cloneVNode(child);
                }
                newNode = mount(child, null, lifecycle, context, isSVG);
                insertOrAppend(dom, newNode, nextNode);
                nextNode = newNode;
            }
        }
    }
    else if (nextChildrenLength === 0) {
        removeAllChildren(dom, lastChildren, lifecycle, false, isRecycling);
    }
    else if (lastChildrenLength > nextChildrenLength) {
        for (i = commonLength; i < lastChildrenLength; i++) {
            var child$1 = lastChildren[i];
            if (!isInvalid(child$1)) {
                unmount(lastChildren[i], dom, lifecycle, false, false, isRecycling);
            }
        }
    }
    for (i = commonLength - 1; i >= 0; i--) {
        var lastChild = lastChildren[i];
        var nextChild = nextChildren[i];
        if (isInvalid(nextChild)) {
            if (!isInvalid(lastChild)) {
                unmount(lastChild, dom, lifecycle, true, false, isRecycling);
            }
        }
        else {
            if (nextChild.dom) {
                nextChildren[i] = nextChild = cloneVNode(nextChild);
            }
            if (isInvalid(lastChild)) {
                newNode = mount(nextChild, null, lifecycle, context, isSVG);
                insertOrAppend(dom, newNode, nextNode);
                nextNode = newNode;
            }
            else {
                patch(lastChild, nextChild, dom, lifecycle, context, isSVG, isRecycling);
                nextNode = nextChild.dom;
            }
        }
    }
}
function patchKeyedChildren(a, b, dom, lifecycle, context, isSVG, isRecycling) {
    var aLength = a.length;
    var bLength = b.length;
    var aEnd = aLength - 1;
    var bEnd = bLength - 1;
    var aStart = 0;
    var bStart = 0;
    var i;
    var j;
    var aNode;
    var bNode;
    var nextNode;
    var nextPos;
    var node;
    if (aLength === 0) {
        if (bLength !== 0) {
            mountArrayChildren(b, dom, lifecycle, context, isSVG);
        }
        return;
    }
    else if (bLength === 0) {
        removeAllChildren(dom, a, lifecycle, false, isRecycling);
        return;
    }
    var aStartNode = a[aStart];
    var bStartNode = b[bStart];
    var aEndNode = a[aEnd];
    var bEndNode = b[bEnd];
    if (bStartNode.dom) {
        b[bStart] = bStartNode = cloneVNode(bStartNode);
    }
    if (bEndNode.dom) {
        b[bEnd] = bEndNode = cloneVNode(bEndNode);
    }
    // Step 1
    /* eslint no-constant-condition: 0 */
    outer: while (true) {
        // Sync nodes with the same key at the beginning.
        while (aStartNode.key === bStartNode.key) {
            patch(aStartNode, bStartNode, dom, lifecycle, context, isSVG, isRecycling);
            aStart++;
            bStart++;
            if (aStart > aEnd || bStart > bEnd) {
                break outer;
            }
            aStartNode = a[aStart];
            bStartNode = b[bStart];
            if (bStartNode.dom) {
                b[bStart] = bStartNode = cloneVNode(bStartNode);
            }
        }
        // Sync nodes with the same key at the end.
        while (aEndNode.key === bEndNode.key) {
            patch(aEndNode, bEndNode, dom, lifecycle, context, isSVG, isRecycling);
            aEnd--;
            bEnd--;
            if (aStart > aEnd || bStart > bEnd) {
                break outer;
            }
            aEndNode = a[aEnd];
            bEndNode = b[bEnd];
            if (bEndNode.dom) {
                b[bEnd] = bEndNode = cloneVNode(bEndNode);
            }
        }
        // Move and sync nodes from right to left.
        if (aEndNode.key === bStartNode.key) {
            patch(aEndNode, bStartNode, dom, lifecycle, context, isSVG, isRecycling);
            insertOrAppend(dom, bStartNode.dom, aStartNode.dom);
            aEnd--;
            bStart++;
            aEndNode = a[aEnd];
            bStartNode = b[bStart];
            if (bStartNode.dom) {
                b[bStart] = bStartNode = cloneVNode(bStartNode);
            }
            continue;
        }
        // Move and sync nodes from left to right.
        if (aStartNode.key === bEndNode.key) {
            patch(aStartNode, bEndNode, dom, lifecycle, context, isSVG, isRecycling);
            nextPos = bEnd + 1;
            nextNode = nextPos < b.length ? b[nextPos].dom : null;
            insertOrAppend(dom, bEndNode.dom, nextNode);
            aStart++;
            bEnd--;
            aStartNode = a[aStart];
            bEndNode = b[bEnd];
            if (bEndNode.dom) {
                b[bEnd] = bEndNode = cloneVNode(bEndNode);
            }
            continue;
        }
        break;
    }
    if (aStart > aEnd) {
        if (bStart <= bEnd) {
            nextPos = bEnd + 1;
            nextNode = nextPos < b.length ? b[nextPos].dom : null;
            while (bStart <= bEnd) {
                node = b[bStart];
                if (node.dom) {
                    b[bStart] = node = cloneVNode(node);
                }
                bStart++;
                insertOrAppend(dom, mount(node, null, lifecycle, context, isSVG), nextNode);
            }
        }
    }
    else if (bStart > bEnd) {
        while (aStart <= aEnd) {
            unmount(a[aStart++], dom, lifecycle, false, false, isRecycling);
        }
    }
    else {
        aLength = aEnd - aStart + 1;
        bLength = bEnd - bStart + 1;
        var aNullable = a;
        var sources = new Array(bLength);
        // Mark all nodes as inserted.
        for (i = 0; i < bLength; i++) {
            sources[i] = -1;
        }
        var moved = false;
        var pos = 0;
        var patched = 0;
        if ((bLength <= 4) || (aLength * bLength <= 16)) {
            for (i = aStart; i <= aEnd; i++) {
                aNode = a[i];
                if (patched < bLength) {
                    for (j = bStart; j <= bEnd; j++) {
                        bNode = b[j];
                        if (aNode.key === bNode.key) {
                            sources[j - bStart] = i;
                            if (pos > j) {
                                moved = true;
                            }
                            else {
                                pos = j;
                            }
                            if (bNode.dom) {
                                b[j] = bNode = cloneVNode(bNode);
                            }
                            patch(aNode, bNode, dom, lifecycle, context, isSVG, isRecycling);
                            patched++;
                            aNullable[i] = null;
                            break;
                        }
                    }
                }
            }
        }
        else {
            var keyIndex = new Map();
            for (i = bStart; i <= bEnd; i++) {
                node = b[i];
                keyIndex.set(node.key, i);
            }
            for (i = aStart; i <= aEnd; i++) {
                aNode = a[i];
                if (patched < bLength) {
                    j = keyIndex.get(aNode.key);
                    if (!isUndefined(j)) {
                        bNode = b[j];
                        sources[j - bStart] = i;
                        if (pos > j) {
                            moved = true;
                        }
                        else {
                            pos = j;
                        }
                        if (bNode.dom) {
                            b[j] = bNode = cloneVNode(bNode);
                        }
                        patch(aNode, bNode, dom, lifecycle, context, isSVG, isRecycling);
                        patched++;
                        aNullable[i] = null;
                    }
                }
            }
        }
        if (aLength === a.length && patched === 0) {
            removeAllChildren(dom, a, lifecycle, false, isRecycling);
            while (bStart < bLength) {
                node = b[bStart];
                if (node.dom) {
                    b[bStart] = node = cloneVNode(node);
                }
                bStart++;
                insertOrAppend(dom, mount(node, null, lifecycle, context, isSVG), null);
            }
        }
        else {
            i = aLength - patched;
            while (i > 0) {
                aNode = aNullable[aStart++];
                if (!isNull(aNode)) {
                    unmount(aNode, dom, lifecycle, false, false, isRecycling);
                    i--;
                }
            }
            if (moved) {
                var seq = lis_algorithm(sources);
                j = seq.length - 1;
                for (i = bLength - 1; i >= 0; i--) {
                    if (sources[i] === -1) {
                        pos = i + bStart;
                        node = b[pos];
                        if (node.dom) {
                            b[pos] = node = cloneVNode(node);
                        }
                        nextPos = pos + 1;
                        nextNode = nextPos < b.length ? b[nextPos].dom : null;
                        insertOrAppend(dom, mount(node, dom, lifecycle, context, isSVG), nextNode);
                    }
                    else {
                        if (j < 0 || i !== seq[j]) {
                            pos = i + bStart;
                            node = b[pos];
                            nextPos = pos + 1;
                            nextNode = nextPos < b.length ? b[nextPos].dom : null;
                            insertOrAppend(dom, node.dom, nextNode);
                        }
                        else {
                            j--;
                        }
                    }
                }
            }
            else if (patched !== bLength) {
                for (i = bLength - 1; i >= 0; i--) {
                    if (sources[i] === -1) {
                        pos = i + bStart;
                        node = b[pos];
                        if (node.dom) {
                            b[pos] = node = cloneVNode(node);
                        }
                        nextPos = pos + 1;
                        nextNode = nextPos < b.length ? b[nextPos].dom : null;
                        insertOrAppend(dom, mount(node, null, lifecycle, context, isSVG), nextNode);
                    }
                }
            }
        }
    }
}
// // https://en.wikipedia.org/wiki/Longest_increasing_subsequence
function lis_algorithm(a) {
    var p = a.slice(0);
    var result = [];
    result.push(0);
    var i;
    var j;
    var u;
    var v;
    var c;
    for (i = 0; i < a.length; i++) {
        if (a[i] === -1) {
            continue;
        }
        j = result[result.length - 1];
        if (a[j] < a[i]) {
            p[i] = j;
            result.push(i);
            continue;
        }
        u = 0;
        v = result.length - 1;
        while (u < v) {
            c = ((u + v) / 2) | 0;
            if (a[result[c]] < a[i]) {
                u = c + 1;
            }
            else {
                v = c;
            }
        }
        if (a[i] < a[result[u]]) {
            if (u > 0) {
                p[i] = result[u - 1];
            }
            result[u] = i;
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}
// these are handled by other parts of Inferno, e.g. input wrappers
var skipProps = {
    children: true,
    ref: true,
    key: true,
    selected: true,
    checked: true,
    value: true,
    multiple: true
};
function patchProp(prop, lastValue, nextValue, dom, isSVG) {
    if (skipProps[prop]) {
        return;
    }
    if (booleanProps[prop]) {
        dom[prop] = nextValue ? true : false;
    }
    else if (strictProps[prop]) {
        var value = isNullOrUndef(nextValue) ? '' : nextValue;
        if (dom[prop] !== value) {
            dom[prop] = value;
        }
    }
    else if (lastValue !== nextValue) {
        if (isNullOrUndef(nextValue)) {
            dom.removeAttribute(prop);
        }
        else if (prop === 'className') {
            if (isSVG) {
                dom.setAttribute('class', nextValue);
            }
            else {
                dom.className = nextValue;
            }
        }
        else if (prop === 'style') {
            patchStyle(lastValue, nextValue, dom);
        }
        else if (isAttrAnEvent(prop)) {
            var eventName = prop.toLowerCase();
            var event = dom[eventName];
            if (!event || !event.wrapped) {
                dom[eventName] = nextValue;
            }
        }
        else if (prop === 'dangerouslySetInnerHTML') {
            var lastHtml = lastValue && lastValue.__html;
            var nextHtml = nextValue && nextValue.__html;
            if (lastHtml !== nextHtml) {
                if (!isNullOrUndef(nextHtml)) {
                    dom.innerHTML = nextHtml;
                }
            }
        }
        else if (prop !== 'childrenType' && prop !== 'ref' && prop !== 'key') {
            var ns = namespaces[prop];
            if (ns) {
                dom.setAttributeNS(ns, prop, nextValue);
            }
            else {
                dom.setAttribute(prop, nextValue);
            }
        }
    }
}
function patchProps(lastProps, nextProps, dom, lifecycle, context, isSVG) {
    lastProps = lastProps || EMPTY_OBJ;
    nextProps = nextProps || EMPTY_OBJ;
    if (nextProps !== EMPTY_OBJ) {
        for (var prop in nextProps) {
            // do not add a hasOwnProperty check here, it affects performance
            var nextValue = nextProps[prop];
            var lastValue = lastProps[prop];
            if (isNullOrUndef(nextValue)) {
                removeProp(prop, dom);
            }
            else {
                patchProp(prop, lastValue, nextValue, dom, isSVG);
            }
        }
    }
    if (lastProps !== EMPTY_OBJ) {
        for (var prop$1 in lastProps) {
            // do not add a hasOwnProperty check here, it affects performance
            if (isNullOrUndef(nextProps[prop$1])) {
                removeProp(prop$1, dom);
            }
        }
    }
}
// We are assuming here that we come from patchProp routine
// -nextAttrValue cannot be null or undefined
function patchStyle(lastAttrValue, nextAttrValue, dom) {
    if (isString$$1(nextAttrValue)) {
        dom.style.cssText = nextAttrValue;
    }
    else if (isNullOrUndef(lastAttrValue)) {
        for (var style in nextAttrValue) {
            // do not add a hasOwnProperty check here, it affects performance
            var value = nextAttrValue[style];
            if (isNumber$$1(value) && !isUnitlessNumber[style]) {
                dom.style[style] = value + 'px';
            }
            else {
                dom.style[style] = value;
            }
        }
    }
    else {
        for (var style$1 in nextAttrValue) {
            // do not add a hasOwnProperty check here, it affects performance
            var value$1 = nextAttrValue[style$1];
            if (isNumber$$1(value$1) && !isUnitlessNumber[style$1]) {
                dom.style[style$1] = value$1 + 'px';
            }
            else {
                dom.style[style$1] = value$1;
            }
        }
        for (var style$2 in lastAttrValue) {
            if (isNullOrUndef(nextAttrValue[style$2])) {
                dom.style[style$2] = '';
            }
        }
    }
}
function removeProp(prop, dom) {
    if (prop === 'className') {
        dom.removeAttribute('class');
    }
    else if (prop === 'value') {
        dom.value = '';
    }
    else if (prop === 'style') {
        dom.style.cssText = null;
        dom.removeAttribute('style');
    }
    else {
        dom.removeAttribute(prop);
    }
}

var recyclingEnabled = true;
var componentPools = new Map();
var elementPools = new Map();
function disableRecycling() {
    recyclingEnabled = false;
    componentPools.clear();
    elementPools.clear();
}

function recycleElement(vNode, lifecycle, context, isSVG) {
    var tag = vNode.type;
    var key = vNode.key;
    var pools = elementPools.get(tag);
    if (!isUndefined(pools)) {
        var pool = key === null ? pools.nonKeyed : pools.keyed.get(key);
        if (!isUndefined(pool)) {
            var recycledVNode = pool.pop();
            if (!isUndefined(recycledVNode)) {
                patchElement(recycledVNode, vNode, null, lifecycle, context, isSVG, true);
                return vNode.dom;
            }
        }
    }
    return null;
}
function poolElement(vNode) {
    var tag = vNode.type;
    var key = vNode.key;
    var pools = elementPools.get(tag);
    if (isUndefined(pools)) {
        pools = {
            nonKeyed: [],
            keyed: new Map()
        };
        elementPools.set(tag, pools);
    }
    if (isNull(key)) {
        pools.nonKeyed.push(vNode);
    }
    else {
        var pool = pools.keyed.get(key);
        if (isUndefined(pool)) {
            pool = [];
            pools.keyed.set(key, pool);
        }
        pool.push(vNode);
    }
}
function recycleComponent(vNode, lifecycle, context, isSVG) {
    var type = vNode.type;
    var key = vNode.key;
    var pools = componentPools.get(type);
    if (!isUndefined(pools)) {
        var pool = key === null ? pools.nonKeyed : pools.keyed.get(key);
        if (!isUndefined(pool)) {
            var recycledVNode = pool.pop();
            if (!isUndefined(recycledVNode)) {
                var flags = vNode.flags;
                var failed = patchComponent(recycledVNode, vNode, null, lifecycle, context, isSVG, flags & 4 /* ComponentClass */, true);
                if (!failed) {
                    return vNode.dom;
                }
            }
        }
    }
    return null;
}
function poolComponent(vNode) {
    var type = vNode.type;
    var key = vNode.key;
    var hooks = vNode.ref;
    var nonRecycleHooks = hooks && (hooks.onComponentWillMount ||
        hooks.onComponentWillUnmount ||
        hooks.onComponentDidMount ||
        hooks.onComponentWillUpdate ||
        hooks.onComponentDidUpdate);
    if (nonRecycleHooks) {
        return;
    }
    var pools = componentPools.get(type);
    if (isUndefined(pools)) {
        pools = {
            nonKeyed: [],
            keyed: new Map()
        };
        componentPools.set(type, pools);
    }
    if (isNull(key)) {
        pools.nonKeyed.push(vNode);
    }
    else {
        var pool = pools.keyed.get(key);
        if (isUndefined(pool)) {
            pool = [];
            pools.keyed.set(key, pool);
        }
        pool.push(vNode);
    }
}

function mount(vNode, parentDom, lifecycle, context, isSVG) {
    var flags = vNode.flags;
    if (flags & 3970 /* Element */) {
        return mountElement(vNode, parentDom, lifecycle, context, isSVG);
    }
    else if (flags & 28 /* Component */) {
        return mountComponent(vNode, parentDom, lifecycle, context, isSVG, flags & 4 /* ComponentClass */);
    }
    else if (flags & 4096 /* Void */) {
        return mountVoid(vNode, parentDom);
    }
    else if (flags & 1 /* Text */) {
        return mountText(vNode, parentDom);
    }
    else {
        if (process.env.NODE_ENV !== 'production') {
            throwError(("mount() expects a valid VNode, instead it received an object with the type \"" + (typeof vNode) + "\"."));
        }
        throwError();
    }
}
function mountText(vNode, parentDom) {
    var dom = document.createTextNode(vNode.children);
    vNode.dom = dom;
    if (parentDom) {
        appendChild(parentDom, dom);
    }
    return dom;
}
function mountVoid(vNode, parentDom) {
    var dom = document.createTextNode('');
    vNode.dom = dom;
    if (parentDom) {
        appendChild(parentDom, dom);
    }
    return dom;
}
function mountElement(vNode, parentDom, lifecycle, context, isSVG) {
    if (recyclingEnabled) {
        var dom$1 = recycleElement(vNode, lifecycle, context, isSVG);
        if (!isNull(dom$1)) {
            if (!isNull(parentDom)) {
                appendChild(parentDom, dom$1);
            }
            return dom$1;
        }
    }
    var tag = vNode.type;
    var flags = vNode.flags;
    if (isSVG || (flags & 128 /* SvgElement */)) {
        isSVG = true;
    }
    var dom = documentCreateElement(tag, isSVG);
    var children = vNode.children;
    var props = vNode.props;
    var ref = vNode.ref;
    vNode.dom = dom;
    if (!isNull(children)) {
        if (isStringOrNumber(children)) {
            setTextContent(dom, children);
        }
        else if (isArray$$1(children)) {
            mountArrayChildren(children, dom, lifecycle, context, isSVG);
        }
        else if (isVNode(children)) {
            mount(children, dom, lifecycle, context, isSVG);
        }
    }
    if (!(flags & 2 /* HtmlElement */)) {
        processElement(flags, vNode, dom);
    }
    if (!isNull(props)) {
        for (var prop in props) {
            // do not add a hasOwnProperty check here, it affects performance
            patchProp(prop, null, props[prop], dom, isSVG);
        }
    }
    if (!isNull(ref)) {
        mountRef(dom, ref, lifecycle);
    }
    if (!isNull(parentDom)) {
        appendChild(parentDom, dom);
    }
    return dom;
}
function mountArrayChildren(children, dom, lifecycle, context, isSVG) {
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (!isInvalid(child)) {
            if (child.dom) {
                children[i] = child = cloneVNode(child);
            }
            mount(children[i], dom, lifecycle, context, isSVG);
        }
    }
}
function mountComponent(vNode, parentDom, lifecycle, context, isSVG, isClass) {
    if (recyclingEnabled) {
        var dom$1 = recycleComponent(vNode, lifecycle, context, isSVG);
        if (!isNull(dom$1)) {
            if (!isNull(parentDom)) {
                appendChild(parentDom, dom$1);
            }
            return dom$1;
        }
    }
    var type = vNode.type;
    var props = vNode.props || EMPTY_OBJ;
    var ref = vNode.ref;
    var dom;
    if (isClass) {
        var defaultProps = type.defaultProps;
        lifecycle.fastUnmount = false;
        if (!isUndefined(defaultProps)) {
            copyPropsTo(defaultProps, props);
            vNode.props = props;
        }
        var instance = createStatefulComponentInstance(vNode, type, props, context, isSVG, devToolsStatus);
        var input = instance._lastInput;
        var fastUnmount = lifecycle.fastUnmount;
        // we store the fastUnmount value, but we set it back to true on the lifecycle
        // we do this so we can determine if the component render has a fastUnmount or not
        lifecycle.fastUnmount = true;
        instance._vNode = vNode;
        vNode.dom = dom = mount(input, null, lifecycle, instance._childContext, isSVG);
        // we now create a lifecycle for this component and store the fastUnmount value
        var subLifecycle = instance._lifecycle = new Lifecycle();
        subLifecycle.fastUnmount = lifecycle.fastUnmount;
        // we then set the lifecycle fastUnmount value back to what it was before the mount
        lifecycle.fastUnmount = fastUnmount;
        if (!isNull(parentDom)) {
            appendChild(parentDom, dom);
        }
        mountStatefulComponentCallbacks(ref, instance, lifecycle);
        componentToDOMNodeMap.set(instance, dom);
        vNode.children = instance;
    }
    else {
        var input$1 = createStatelessComponentInput(vNode, type, props, context);
        vNode.dom = dom = mount(input$1, null, lifecycle, context, isSVG);
        vNode.children = input$1;
        mountStatelessComponentCallbacks(ref, dom, lifecycle);
        if (!isNull(parentDom)) {
            appendChild(parentDom, dom);
        }
    }
    return dom;
}
function mountStatefulComponentCallbacks(ref, instance, lifecycle) {
    if (ref) {
        if (isFunction$$1(ref)) {
            ref(instance);
        }
        else {
            if (process.env.NODE_ENV !== 'production') {
                throwError('string "refs" are not supported in Inferno 1.0. Use callback "refs" instead.');
            }
            throwError();
        }
    }
    if (!isNull(instance.componentDidMount)) {
        lifecycle.addListener(function () {
            instance.componentDidMount();
        });
    }
}
function mountStatelessComponentCallbacks(ref, dom, lifecycle) {
    if (ref) {
        if (!isNullOrUndef(ref.onComponentWillMount)) {
            lifecycle.fastUnmount = false;
            ref.onComponentWillMount();
        }
        if (!isNullOrUndef(ref.onComponentDidMount)) {
            lifecycle.fastUnmount = false;
            lifecycle.addListener(function () { return ref.onComponentDidMount(dom); });
        }
    }
}
function mountRef(dom, value, lifecycle) {
    if (isFunction$$1(value)) {
        lifecycle.fastUnmount = false;
        lifecycle.addListener(function () { return value(dom); });
    }
    else {
        if (isInvalid(value)) {
            return;
        }
        if (process.env.NODE_ENV !== 'production') {
            throwError('string "refs" are not supported in Inferno 1.0. Use callback "refs" instead.');
        }
        throwError();
    }
}

function copyPropsTo(copyFrom, copyTo) {
    for (var prop in copyFrom) {
        if (isUndefined(copyTo[prop])) {
            copyTo[prop] = copyFrom[prop];
        }
    }
}
function createStatefulComponentInstance(vNode, Component, props, context, isSVG, devToolsStatus) {
    var instance = new Component(props, context);
    instance.context = context;
    instance._patch = patch;
    instance._devToolsStatus = devToolsStatus;
    instance._componentToDOMNodeMap = componentToDOMNodeMap;
    var childContext = instance.getChildContext();
    if (!isNullOrUndef(childContext)) {
        instance._childContext = Object.assign({}, context, childContext);
    }
    else {
        instance._childContext = context;
    }
    instance._unmounted = false;
    instance._pendingSetState = true;
    instance._isSVG = isSVG;
    instance.componentWillMount();
    instance._beforeRender && instance._beforeRender();
    var input = instance.render(props, instance.state, context);
    instance._afterRender && instance._afterRender();
    if (isArray$$1(input)) {
        if (process.env.NODE_ENV !== 'production') {
            throwError('a valid Inferno VNode (or null) must be returned from a component render. You may have returned an array or an invalid object.');
        }
        throwError();
    }
    else if (isInvalid(input)) {
        input = createVoidVNode();
    }
    else {
        if (input.dom) {
            input = cloneVNode(input);
        }
        if (input.flags & 28 /* Component */) {
            // if we have an input that is also a component, we run into a tricky situation
            // where the root vNode needs to always have the correct DOM entry
            // so we break monomorphism on our input and supply it our vNode as parentVNode
            // we can optimise this in the future, but this gets us out of a lot of issues
            input.parentVNode = vNode;
        }
    }
    instance._pendingSetState = false;
    instance._lastInput = input;
    return instance;
}
function replaceLastChildAndUnmount(lastInput, nextInput, parentDom, lifecycle, context, isSVG, isRecycling) {
    replaceVNode(parentDom, mount(nextInput, null, lifecycle, context, isSVG), lastInput, lifecycle, isRecycling);
}
function replaceVNode(parentDom, dom, vNode, lifecycle, isRecycling) {
    var shallowUnmount = false;
    // we cannot cache nodeType here as vNode might be re-assigned below
    if (vNode.flags & 28 /* Component */) {
        // if we are accessing a stateful or stateless component, we want to access their last rendered input
        // accessing their DOM node is not useful to us here
        unmount(vNode, null, lifecycle, false, false, isRecycling);
        vNode = vNode.children._lastInput || vNode.children;
        shallowUnmount = true;
    }
    replaceChild(parentDom, dom, vNode.dom);
    unmount(vNode, null, lifecycle, false, shallowUnmount, isRecycling);
}
function createStatelessComponentInput(vNode, component, props, context) {
    var input = component(props, context);
    if (isArray$$1(input)) {
        if (process.env.NODE_ENV !== 'production') {
            throwError('a valid Inferno VNode (or null) must be returned from a component render. You may have returned an array or an invalid object.');
        }
        throwError();
    }
    else if (isInvalid(input)) {
        input = createVoidVNode();
    }
    else {
        if (input.dom) {
            input = cloneVNode(input);
        }
        if (input.flags & 28 /* Component */) {
            // if we have an input that is also a component, we run into a tricky situation
            // where the root vNode needs to always have the correct DOM entry
            // so we break monomorphism on our input and supply it our vNode as parentVNode
            // we can optimise this in the future, but this gets us out of a lot of issues
            input.parentVNode = vNode;
        }
    }
    return input;
}
function setTextContent(dom, text) {
    if (text !== '') {
        dom.textContent = text;
    }
    else {
        dom.appendChild(document.createTextNode(''));
    }
}
function updateTextContent(dom, text) {
    dom.firstChild.nodeValue = text;
}
function appendChild(parentDom, dom) {
    parentDom.appendChild(dom);
}
function insertOrAppend(parentDom, newNode, nextNode) {
    if (isNullOrUndef(nextNode)) {
        appendChild(parentDom, newNode);
    }
    else {
        parentDom.insertBefore(newNode, nextNode);
    }
}
function documentCreateElement(tag, isSVG) {
    if (isSVG === true) {
        return document.createElementNS(svgNS, tag);
    }
    else {
        return document.createElement(tag);
    }
}
function replaceWithNewNode(lastNode, nextNode, parentDom, lifecycle, context, isSVG, isRecycling) {
    var lastInstance = null;
    var instanceLastNode = lastNode._lastInput;
    if (!isNullOrUndef(instanceLastNode)) {
        lastInstance = lastNode;
        lastNode = instanceLastNode;
    }
    unmount(lastNode, null, lifecycle, false, false, isRecycling);
    var dom = mount(nextNode, null, lifecycle, context, isSVG);
    nextNode.dom = dom;
    replaceChild(parentDom, dom, lastNode.dom);
    if (lastInstance !== null) {
        lastInstance._lasInput = nextNode;
    }
}
function replaceChild(parentDom, nextDom, lastDom) {
    if (!parentDom) {
        parentDom = lastDom.parentNode;
    }
    parentDom.replaceChild(nextDom, lastDom);
}
function removeChild(parentDom, dom) {
    parentDom.removeChild(dom);
}
function removeAllChildren(dom, children, lifecycle, shallowUnmount, isRecycling) {
    dom.textContent = '';
    if (!lifecycle.fastUnmount) {
        removeChildren(null, children, lifecycle, shallowUnmount, isRecycling);
    }
}
function removeChildren(dom, children, lifecycle, shallowUnmount, isRecycling) {
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (!isInvalid(child)) {
            unmount(child, dom, lifecycle, true, shallowUnmount, isRecycling);
        }
    }
}
function isKeyed(lastChildren, nextChildren) {
    return nextChildren.length && !isNullOrUndef(nextChildren[0]) && !isNullOrUndef(nextChildren[0].key)
        && lastChildren.length && !isNullOrUndef(lastChildren[0]) && !isNullOrUndef(lastChildren[0].key);
}

function normaliseChildNodes(dom) {
    var rawChildNodes = dom.childNodes;
    var length = rawChildNodes.length;
    var i = 0;
    while (i < length) {
        var rawChild = rawChildNodes[i];
        if (rawChild.nodeType === 8) {
            if (rawChild.data === '!') {
                var placeholder = document.createTextNode('');
                dom.replaceChild(placeholder, rawChild);
                i++;
            }
            else {
                dom.removeChild(rawChild);
                length--;
            }
        }
        else {
            i++;
        }
    }
}
function hydrateComponent(vNode, dom, lifecycle, context, isSVG, isClass) {
    var type = vNode.type;
    var props = vNode.props;
    var ref = vNode.ref;
    vNode.dom = dom;
    if (isClass) {
        var _isSVG = dom.namespaceURI === svgNS;
        var defaultProps = type.defaultProps;
        lifecycle.fastUnmount = false;
        if (!isUndefined(defaultProps)) {
            copyPropsTo(defaultProps, props);
            vNode.props = props;
        }
        var instance = createStatefulComponentInstance(vNode, type, props, context, _isSVG, devToolsStatus);
        var input = instance._lastInput;
        var fastUnmount = lifecycle.fastUnmount;
        // we store the fastUnmount value, but we set it back to true on the lifecycle
        // we do this so we can determine if the component render has a fastUnmount or not		
        lifecycle.fastUnmount = true;
        instance._vComponent = vNode;
        instance._vNode = vNode;
        hydrate(input, dom, lifecycle, instance._childContext, _isSVG);
        var subLifecycle = instance._lifecycle = new Lifecycle();
        subLifecycle.fastUnmount = lifecycle.fastUnmount;
        // we then set the lifecycle fastUnmount value back to what it was before the mount
        lifecycle.fastUnmount = fastUnmount;
        mountStatefulComponentCallbacks(ref, instance, lifecycle);
        componentToDOMNodeMap.set(instance, dom);
        vNode.children = instance;
    }
    else {
        var input$1 = createStatelessComponentInput(vNode, type, props, context);
        hydrate(input$1, dom, lifecycle, context, isSVG);
        vNode.children = input$1;
        vNode.dom = input$1.dom;
        mountStatelessComponentCallbacks(ref, dom, lifecycle);
    }
}
function hydrateElement(vNode, dom, lifecycle, context, isSVG) {
    var tag = vNode.type;
    var children = vNode.children;
    var props = vNode.props;
    var flags = vNode.flags;
    if (isSVG || (flags & 128 /* SvgElement */)) {
        isSVG = true;
    }
    if (dom.nodeType !== 1 || dom.tagName.toLowerCase() !== tag) {
        var newDom = mountElement(vNode, null, lifecycle, context, isSVG);
        vNode.dom = newDom;
        replaceChild(dom.parentNode, newDom, dom);
    }
    else {
        vNode.dom = dom;
        if (children) {
            hydrateChildren(children, dom, lifecycle, context, isSVG);
        }
        if (!(flags & 2 /* HtmlElement */)) {
            processElement(flags, vNode, dom);
        }
        for (var prop in props) {
            var value = props[prop];
            patchProp(prop, null, value, dom, isSVG);
        }
    }
}
function hydrateChildren(children, dom, lifecycle, context, isSVG) {
    normaliseChildNodes(dom);
    var domNodes = Array.prototype.slice.call(dom.childNodes);
    var childNodeIndex = 0;
    if (isArray$$1(children)) {
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (isObject$$1(child) && !isNull(child)) {
                hydrate(child, domNodes[childNodeIndex++], lifecycle, context, isSVG);
            }
        }
    }
    else if (isObject$$1(children)) {
        hydrate(children, dom.firstChild, lifecycle, context, isSVG);
    }
}
function hydrateText(vNode, dom) {
    if (dom.nodeType === 3) {
        var newDom = mountText(vNode, null);
        vNode.dom = newDom;
        replaceChild(dom.parentNode, newDom, dom);
    }
    else {
        vNode.dom = dom;
    }
}
function hydrateVoid(vNode, dom) {
    vNode.dom = dom;
}
function hydrate(vNode, dom, lifecycle, context, isSVG) {
    if (process.env.NODE_ENV !== 'production') {
        if (isInvalid(dom)) {
            throwError("failed to hydrate. The server-side render doesn't match client side.");
        }
    }
    var flags = vNode.flags;
    if (flags & 28 /* Component */) {
        return hydrateComponent(vNode, dom, lifecycle, context, isSVG, flags & 4 /* ComponentClass */);
    }
    else if (flags & 3970 /* Element */) {
        return hydrateElement(vNode, dom, lifecycle, context, isSVG);
    }
    else if (flags & 1 /* Text */) {
        return hydrateText(vNode, dom);
    }
    else if (flags & 4096 /* Void */) {
        return hydrateVoid(vNode, dom);
    }
    else {
        if (process.env.NODE_ENV !== 'production') {
            throwError(("hydrate() expects a valid VNode, instead it received an object with the type \"" + (typeof vNode) + "\"."));
        }
        throwError();
    }
}
function hydrateRoot(input, parentDom, lifecycle) {
    if (parentDom && parentDom.nodeType === 1 && parentDom.firstChild) {
        hydrate(input, parentDom.firstChild, lifecycle, {}, false);
        return true;
    }
    return false;
}

// rather than use a Map, like we did before, we can use an array here
// given there shouldn't be THAT many roots on the page, the difference
// in performance is huge: https://esbench.com/bench/5802a691330ab09900a1a2da
var roots = [];
var componentToDOMNodeMap = new Map();
function findDOMNode(domNode) {
    return componentToDOMNodeMap.get(domNode) || null;
}
function getRoot(dom) {
    for (var i = 0; i < roots.length; i++) {
        var root = roots[i];
        if (root.dom === dom) {
            return root;
        }
    }
    return null;
}
function setRoot(dom, input, lifecycle) {
    roots.push({
        dom: dom,
        input: input,
        lifecycle: lifecycle
    });
}
function removeRoot(root) {
    for (var i = 0; i < roots.length; i++) {
        if (roots[i] === root) {
            roots.splice(i, 1);
            return;
        }
    }
}
var documentBody = isBrowser ? document.body : null;
function render(input, parentDom) {
    if (documentBody === parentDom) {
        if (process.env.NODE_ENV !== 'production') {
            throwError('you cannot render() to the "document.body". Use an empty element as a container instead.');
        }
        throwError();
    }
    if (input === NO_OP) {
        return;
    }
    var root = getRoot(parentDom);
    if (isNull(root)) {
        var lifecycle = new Lifecycle();
        if (!isInvalid(input)) {
            if (input.dom) {
                input = cloneVNode(input);
            }
            if (!hydrateRoot(input, parentDom, lifecycle)) {
                mount(input, parentDom, lifecycle, {}, false);
            }
            lifecycle.trigger();
            setRoot(parentDom, input, lifecycle);
        }
    }
    else {
        var lifecycle$1 = root.lifecycle;
        lifecycle$1.listeners = [];
        if (isNullOrUndef(input)) {
            unmount(root.input, parentDom, lifecycle$1, false, false, false);
            removeRoot(root);
        }
        else {
            if (input.dom) {
                input = cloneVNode(input);
            }
            patch(root.input, input, parentDom, lifecycle$1, {}, false, false);
        }
        lifecycle$1.trigger();
        root.input = input;
    }
    if (devToolsStatus.connected) {
        sendRoots(window);
    }
}
function createRenderer() {
    var parentDom;
    return function renderer(lastInput, nextInput) {
        if (!parentDom) {
            parentDom = lastInput;
        }
        render(nextInput, parentDom);
    };
}

if (isBrowser) {
	window.process = {
		env: {
			NODE_ENV: 'development'
		}
	};
	initDevToolsHooks(window);
}

if (process.env.NODE_ENV !== 'production') {
	var testFunc = function testFn() {};
	warning(
		(testFunc.name || testFunc.toString()).indexOf('testFn') !== -1,
		'It looks like you\'re using a minified copy of the development build ' +
		'of Inferno. When deploying Inferno apps to production, make sure to use ' +
		'the production build which skips development warnings and is faster. ' +
		'See http://infernojs.org for more details.'
	);
}

var index = {
	// core shapes
	createVNode: createVNode,

	// cloning
	cloneVNode: cloneVNode,

	// TODO do we still need this? can we remove?
	NO_OP: NO_OP,

	//DOM
	render: render,
	findDOMNode: findDOMNode,
	createRenderer: createRenderer,
	disableRecycling: disableRecycling
};

return index;

})));
});

var inferno = inferno$1;

var render$1 = inferno.render;

var infernoComponent$1 = createCommonjsModule(function (module, exports) {
/*!
 * inferno-component v1.0.0-beta23
 * (c) 2016 Dominic Gannaway
 * Released under the MIT License.
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof undefined === 'function' && undefined.amd ? undefined(factory) :
    (global.Inferno = global.Inferno || {}, global.Inferno.Component = factory());
}(commonjsGlobal, (function () { 'use strict';

var NO_OP = '$NO_OP';
var ERROR_MSG = 'a runtime error occured! Use Inferno in development environment to find the error.';


// this is MUCH faster than .constructor === Array and instanceof Array
// in Node 7 and the later versions of V8, slower in older versions though
var isArray$$1 = Array.isArray;
function isStatefulComponent(o) {
    return !isUndefined(o.prototype) && !isUndefined(o.prototype.render);
}
function isStringOrNumber(obj) {
    return isString$$1(obj) || isNumber$$1(obj);
}
function isNullOrUndef(obj) {
    return isUndefined(obj) || isNull(obj);
}
function isInvalid(obj) {
    return isNull(obj) || obj === false || isTrue(obj) || isUndefined(obj);
}
function isFunction$$1(obj) {
    return typeof obj === 'function';
}

function isString$$1(obj) {
    return typeof obj === 'string';
}
function isNumber$$1(obj) {
    return typeof obj === 'number';
}
function isNull(obj) {
    return obj === null;
}
function isTrue(obj) {
    return obj === true;
}
function isUndefined(obj) {
    return obj === undefined;
}

function throwError(message) {
    if (!message) {
        message = ERROR_MSG;
    }
    throw new Error(("Inferno Error: " + message));
}

var EMPTY_OBJ = {};

function cloneVNode(vNodeToClone, props) {
    var _children = [], len = arguments.length - 2;
    while ( len-- > 0 ) _children[ len ] = arguments[ len + 2 ];

    var children = _children;
    if (_children.length > 0 && !isNull(_children[0])) {
        if (!props) {
            props = {};
        }
        if (_children.length === 1) {
            children = _children[0];
        }
        if (isUndefined(props.children)) {
            props.children = children;
        }
        else {
            if (isArray$$1(children)) {
                if (isArray$$1(props.children)) {
                    props.children = props.children.concat(children);
                }
                else {
                    props.children = [props.children].concat(children);
                }
            }
            else {
                if (isArray$$1(props.children)) {
                    props.children.push(children);
                }
                else {
                    props.children = [props.children];
                    props.children.push(children);
                }
            }
        }
    }
    children = null;
    var flags = vNodeToClone.flags;
    var newVNode;
    if (isArray$$1(vNodeToClone)) {
        newVNode = vNodeToClone.map(function (vNode) { return cloneVNode(vNode); });
    }
    else if (isNullOrUndef(props) && isNullOrUndef(children)) {
        newVNode = Object.assign({}, vNodeToClone);
    }
    else {
        var key = !isNullOrUndef(vNodeToClone.key) ? vNodeToClone.key : props.key;
        var ref = vNodeToClone.ref || props.ref;
        if (flags & 28 /* Component */) {
            newVNode = createVNode(flags, vNodeToClone.type, Object.assign({}, vNodeToClone.props, props), null, key, ref, true);
        }
        else if (flags & 3970 /* Element */) {
            children = (props && props.children) || vNodeToClone.children;
            newVNode = createVNode(flags, vNodeToClone.type, Object.assign({}, vNodeToClone.props, props), children, key, ref, !children);
        }
    }
    if (flags & 28 /* Component */) {
        var newProps = newVNode.props;
        // we need to also clone component children that are in props
        // as the children may also have been hoisted
        if (newProps && newProps.children) {
            var newChildren = newProps.children;
            if (isArray$$1(newChildren)) {
                for (var i = 0; i < newChildren.length; i++) {
                    if (!isInvalid(newChildren[i]) && isVNode(newChildren[i])) {
                        newProps.children[i] = cloneVNode(newChildren[i]);
                    }
                }
            }
            else if (!isInvalid(newChildren) && isVNode(newChildren)) {
                newProps.children = cloneVNode(newChildren);
            }
        }
        newVNode.children = null;
    }
    newVNode.dom = null;
    return newVNode;
}

function _normalizeVNodes(nodes, result, i) {
    for (; i < nodes.length; i++) {
        var n = nodes[i];
        if (!isInvalid(n)) {
            if (Array.isArray(n)) {
                _normalizeVNodes(n, result, 0);
            }
            else {
                if (isStringOrNumber(n)) {
                    n = createTextVNode(n);
                }
                else if (isVNode(n) && n.dom) {
                    n = cloneVNode(n);
                }
                result.push(n);
            }
        }
    }
}
function normalizeVNodes(nodes) {
    var newNodes;
    // we assign $ which basically means we've flagged this array for future note
    // if it comes back again, we need to clone it, as people are using it
    // in an immutable way
    // tslint:disable
    if (nodes['$']) {
        nodes = nodes.slice();
    }
    else {
        nodes['$'] = true;
    }
    // tslint:enable
    for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (isInvalid(n)) {
            if (!newNodes) {
                newNodes = nodes.slice(0, i);
            }
            newNodes.push(n);
        }
        else if (Array.isArray(n)) {
            var result = (newNodes || nodes).slice(0, i);
            _normalizeVNodes(nodes, result, i);
            return result;
        }
        else if (isStringOrNumber(n)) {
            if (!newNodes) {
                newNodes = nodes.slice(0, i);
            }
            newNodes.push(createTextVNode(n));
        }
        else if (isVNode(n) && n.dom) {
            if (!newNodes) {
                newNodes = nodes.slice(0, i);
            }
            newNodes.push(cloneVNode(n));
        }
        else if (newNodes) {
            newNodes.push(cloneVNode(n));
        }
    }
    return newNodes || nodes;
}
function normalize(vNode) {
    var props = vNode.props;
    var children = vNode.children;
    if (props) {
        if (!(vNode.flags & 28 /* Component */) && isNullOrUndef(children) && !isNullOrUndef(props.children)) {
            vNode.children = props.children;
        }
        if (props.ref) {
            vNode.ref = props.ref;
        }
        if (!isNullOrUndef(props.key)) {
            vNode.key = props.key;
        }
    }
    if (!isInvalid(children)) {
        if (isArray$$1(children)) {
            vNode.children = normalizeVNodes(children);
        }
        else if (isVNode(children) && children.dom) {
            vNode.children = cloneVNode(children);
        }
    }
}
function createVNode(flags, type, props, children, key, ref, noNormalise) {
    if (flags & 16 /* ComponentUnknown */) {
        flags = isStatefulComponent(type) ? 4 /* ComponentClass */ : 8 /* ComponentFunction */;
    }
    var vNode = {
        children: isUndefined(children) ? null : children,
        dom: null,
        flags: flags || 0,
        key: key === undefined ? null : key,
        props: props || null,
        ref: ref || null,
        type: type
    };
    if (!noNormalise) {
        normalize(vNode);
    }
    return vNode;
}
// when a components root VNode is also a component, we can run into issues
// this will recursively look for vNode.parentNode if the VNode is a component
function updateParentComponentVNodes(vNode, dom) {
    if (vNode.flags & 28 /* Component */) {
        var parentVNode = vNode.parentVNode;
        if (parentVNode) {
            parentVNode.dom = dom;
            updateParentComponentVNodes(parentVNode, dom);
        }
    }
}
function createVoidVNode() {
    return createVNode(4096 /* Void */);
}
function createTextVNode(text) {
    return createVNode(1 /* Text */, null, null, text);
}
function isVNode(o) {
    return !!o.flags;
}

var Lifecycle = function Lifecycle() {
    this.listeners = [];
    this.fastUnmount = true;
};
Lifecycle.prototype.addListener = function addListener (callback) {
    this.listeners.push(callback);
};
Lifecycle.prototype.trigger = function trigger () {
        var this$1 = this;

    for (var i = 0; i < this.listeners.length; i++) {
        this$1.listeners[i]();
    }
};

var noOp = ERROR_MSG;
if (process.env.NODE_ENV !== 'production') {
    noOp = 'Inferno Error: Can only update a mounted or mounting component. This usually means you called setState() or forceUpdate() on an unmounted component. This is a no-op.';
}
var componentCallbackQueue = new Map();
function addToQueue(component, force, callback) {
    // TODO this function needs to be revised and improved on
    var queue = componentCallbackQueue.get(component);
    if (!queue) {
        queue = [];
        componentCallbackQueue.set(component, queue);
        Promise.resolve().then(function () {
            applyState(component, force, function () {
                for (var i = 0; i < queue.length; i++) {
                    queue[i]();
                }
            });
            componentCallbackQueue.delete(component);
            component._processingSetState = false;
        });
    }
    if (callback) {
        queue.push(callback);
    }
}
function queueStateChanges(component, newState, callback) {
    if (isFunction$$1(newState)) {
        newState = newState(component.state);
    }
    for (var stateKey in newState) {
        component._pendingState[stateKey] = newState[stateKey];
    }
    if (!component._pendingSetState) {
        if (component._processingSetState || callback) {
            addToQueue(component, false, callback);
        }
        else {
            component._pendingSetState = true;
            component._processingSetState = true;
            applyState(component, false, callback);
            component._processingSetState = false;
        }
    }
    else {
        component.state = Object.assign({}, component.state, component._pendingState);
        component._pendingState = {};
    }
}
function applyState(component, force, callback) {
    if ((!component._deferSetState || force) && !component._blockRender) {
        component._pendingSetState = false;
        var pendingState = component._pendingState;
        var prevState = component.state;
        var nextState = Object.assign({}, prevState, pendingState);
        var props = component.props;
        var context = component.context;
        component._pendingState = {};
        var nextInput = component._updateComponent(prevState, nextState, props, props, context, force);
        var didUpdate = true;
        if (isInvalid(nextInput)) {
            nextInput = createVoidVNode();
        }
        else if (isArray$$1(nextInput)) {
            if (process.env.NODE_ENV !== 'production') {
                throwError('a valid Inferno VNode (or null) must be returned from a component render. You may have returned an array or an invalid object.');
            }
            throwError();
        }
        else if (nextInput === NO_OP) {
            nextInput = component._lastInput;
            didUpdate = false;
        }
        var lastInput = component._lastInput;
        var parentDom = lastInput.dom.parentNode;
        component._lastInput = nextInput;
        if (didUpdate) {
            var subLifecycle = component._lifecycle;
            if (!subLifecycle) {
                subLifecycle = new Lifecycle();
            }
            else {
                subLifecycle.listeners = [];
            }
            component._lifecycle = subLifecycle;
            var childContext = component.getChildContext();
            if (!isNullOrUndef(childContext)) {
                childContext = Object.assign({}, context, component._childContext, childContext);
            }
            else {
                childContext = Object.assign({}, context, component._childContext);
            }
            component._patch(lastInput, nextInput, parentDom, subLifecycle, childContext, component._isSVG, false);
            subLifecycle.trigger();
            component.componentDidUpdate(props, prevState);
        }
        var vNode = component._vNode;
        var dom = vNode.dom = nextInput.dom;
        component._componentToDOMNodeMap.set(component, nextInput.dom);
        updateParentComponentVNodes(vNode, dom);
        if (!isNullOrUndef(callback)) {
            callback();
        }
    }
}
var Component$1 = function Component$1(props, context) {
    this.state = {};
    this.refs = {};
    this._processingSetState = false;
    this._blockRender = false;
    this._ignoreSetState = false;
    this._blockSetState = false;
    this._deferSetState = false;
    this._pendingSetState = false;
    this._pendingState = {};
    this._lastInput = null;
    this._vNode = null;
    this._unmounted = true;
    this._devToolsStatus = null;
    this._devToolsId = null;
    this._lifecycle = null;
    this._childContext = null;
    this._patch = null;
    this._isSVG = false;
    this._componentToDOMNodeMap = null;
    /** @type {object} */
    this.props = props || {};
    /** @type {object} */
    this.context = context || {};
    if (!this.componentDidMount) {
        this.componentDidMount = null;
    }
};
Component$1.prototype.render = function render (nextProps, nextState, nextContext) {
};
Component$1.prototype.forceUpdate = function forceUpdate (callback) {
    if (this._unmounted) {
        throw Error(noOp);
    }
    applyState(this, true, callback);
};
Component$1.prototype.setState = function setState (newState, callback) {
    if (this._unmounted) {
        throw Error(noOp);
    }
    if (!this._blockSetState) {
        if (!this._ignoreSetState) {
            queueStateChanges(this, newState, callback);
        }
    }
    else {
        if (process.env.NODE_ENV !== 'production') {
            throwError('cannot update state via setState() in componentWillUpdate().');
        }
        throwError();
    }
};
Component$1.prototype.componentWillMount = function componentWillMount () {
};
Component$1.prototype.componentDidMount = function componentDidMount () {
};
Component$1.prototype.componentWillUnmount = function componentWillUnmount () {
};
Component$1.prototype.componentDidUpdate = function componentDidUpdate (prevProps, prevState, prevContext) {
};
Component$1.prototype.shouldComponentUpdate = function shouldComponentUpdate (nextProps, nextState, context) {
    return true;
};
Component$1.prototype.componentWillReceiveProps = function componentWillReceiveProps (nextProps, context) {
};
Component$1.prototype.componentWillUpdate = function componentWillUpdate (nextProps, nextState, nextContext) {
};
Component$1.prototype.getChildContext = function getChildContext () {
};
Component$1.prototype._updateComponent = function _updateComponent (prevState, nextState, prevProps, nextProps, context, force) {
    if (this._unmounted === true) {
        if (process.env.NODE_ENV !== 'production') {
            throwError(noOp);
        }
        throwError();
    }
    if (!isNullOrUndef(nextProps) && isNullOrUndef(nextProps.children)) {
        nextProps.children = prevProps.children;
    }
    if ((prevProps !== nextProps || nextProps === EMPTY_OBJ) || prevState !== nextState || force) {
        if (prevProps !== nextProps || nextProps === EMPTY_OBJ) {
            this._blockRender = true;
            this.componentWillReceiveProps(nextProps, context);
            this._blockRender = false;
            if (this._pendingSetState) {
                nextState = Object.assign({}, nextState, this._pendingState);
                this._pendingSetState = false;
                this._pendingState = {};
            }
        }
        var shouldUpdate = this.shouldComponentUpdate(nextProps, nextState, context);
        if (shouldUpdate !== false || force) {
            this._blockSetState = true;
            this.componentWillUpdate(nextProps, nextState, context);
            this._blockSetState = false;
            this.props = nextProps;
            var state = this.state = nextState;
            this.context = context;
            this._beforeRender && this._beforeRender();
            var render = this.render(nextProps, state, context);
            this._afterRender && this._afterRender();
            return render;
        }
    }
    return NO_OP;
};

return Component$1;

})));
});

var infernoComponent = infernoComponent$1;

/**
 * Compares all keys on the given state. Returns true if any difference exists.
 *
 * @private
 * @category DOM
 * @param {object} previousState Previous state.
 * @param {object} currentState  Current state.
 * @return {boolean} Difference was found.
 */
function stateComparator(previousState, currentState) {
    // Always treat dirty flag as a state difference
    var isDirty = currentState.dirty || false;

    if (!isDirty) {
        _$1.each(Object.keys(currentState), function (key) {
            if (key !== 'dirty' && currentState[key] !== previousState[key]) {
                isDirty = true;
                return false;
            }
        });
    }

    return isDirty;
}

var Checkbox = function (_Component) {
    inherits(Checkbox, _Component);

    function Checkbox(props) {
        classCallCheck(this, Checkbox);

        var _this = possibleConstructorReturn(this, (Checkbox.__proto__ || Object.getPrototypeOf(Checkbox)).call(this, props));

        _this.state = _this.getStateFromNodes(props.node);
        return _this;
    }

    createClass(Checkbox, [{
        key: 'getStateFromNodes',
        value: function getStateFromNodes(node) {
            return {
                checked: node.checked(),
                indeterminate: node.indeterminate()
            };
        }
    }, {
        key: 'componentWillReceiveProps',
        value: function componentWillReceiveProps(data) {
            this.setState(this.getStateFromNodes(data.node));
        }
    }, {
        key: 'shouldComponentUpdate',
        value: function shouldComponentUpdate(nextProps, nextState) {
            return stateComparator(this.state, nextState);
        }
    }, {
        key: 'click',
        value: function click(event) {
            var _this2 = this;

            // Define our default handler
            var handler = function handler() {
                _this2.props.node.toggleCheck();
            };

            // Emit an event with our forwarded MouseEvent, node, and default handler
            this.props.dom._tree.emit('node.click', event, this.props.node, handler);

            // Unless default is prevented, auto call our default handler
            if (!event.treeDefaultPrevented) {
                handler();
            }
        }
    }, {
        key: 'render',
        value: function render() {
            var _this3 = this;

            return inferno.createVNode(512, 'input', {
                'checked': this.props.node.checked(),
                'indeterminate': this.props.node.indeterminate(),
                'onClick': this.click.bind(this),
                'type': 'checkbox'
            }, null, null, function (elem) {
                return elem.indeterminate = _this3.state.indeterminate;
            });
        }
    }]);
    return Checkbox;
}(infernoComponent);

var EditToolbar = function (_Component) {
    inherits(EditToolbar, _Component);

    function EditToolbar(props) {
        classCallCheck(this, EditToolbar);
        return possibleConstructorReturn(this, (EditToolbar.__proto__ || Object.getPrototypeOf(EditToolbar)).call(this, props));
    }

    createClass(EditToolbar, [{
        key: 'shouldComponentUpdate',
        value: function shouldComponentUpdate() {
            return false;
        }
    }, {
        key: 'add',
        value: function add(event) {
            event.stopPropagation();

            node.addChild(blankNode());
            node.expand();
        }
    }, {
        key: 'edit',
        value: function edit(event) {
            event.stopPropagation();

            this.props.node.toggleEditing();
        }
    }, {
        key: 'remove',
        value: function remove(event) {
            event.stopPropagation();

            this.props.node.remove();
        }
    }, {
        key: 'render',
        value: function render() {
            var buttons = [];

            if (this.props.dom._tree.config.editing.edit) {
                buttons.push(inferno.createVNode(2, 'a', {
                    'className': 'btn icon icon-pencil',
                    'onclick': this.edit.bind(this),
                    'title': 'Edit this node'
                }));
            }

            if (this.props.dom._tree.config.editing.add) {
                buttons.push(inferno.createVNode(2, 'a', {
                    'className': 'btn icon icon-plus',
                    'onclick': this.add.bind(this),
                    'title': 'Add a child node'
                }));
            }

            if (this.props.dom._tree.config.editing.remove) {
                buttons.push(inferno.createVNode(2, 'a', {
                    'className': 'btn icon icon-minus',
                    'onclick': this.remove.bind(this),
                    'title': 'Remove this node'
                }));
            }

            return inferno.createVNode(2, 'span', {
                'className': 'btn-group'
            }, buttons);
        }
    }]);
    return EditToolbar;
}(infernoComponent);

var EmptyList = function (_Component) {
    inherits(EmptyList, _Component);

    function EmptyList(props) {
        classCallCheck(this, EmptyList);

        var _this = possibleConstructorReturn(this, (EmptyList.__proto__ || Object.getPrototypeOf(EmptyList)).call(this, props));

        _this.state = {
            text: props.text
        };
        return _this;
    }

    createClass(EmptyList, [{
        key: 'componentWillReceiveProps',
        value: function componentWillReceiveProps(nextProps) {
            this.setState({
                text: nextProps.text
            });
        }
    }, {
        key: 'shouldComponentUpdate',
        value: function shouldComponentUpdate(nextProps) {
            return this.state.text !== nextProps.text;
        }
    }, {
        key: 'render',
        value: function render() {
            return inferno.createVNode(2, 'ol', null, inferno.createVNode(2, 'li', {
                'className': 'leaf'
            }, inferno.createVNode(2, 'span', {
                'className': 'title icon icon-file-empty empty'
            }, this.state.text)));
        }
    }]);
    return EmptyList;
}(infernoComponent);

var EditForm = function (_Component) {
    inherits(EditForm, _Component);

    function EditForm(props) {
        classCallCheck(this, EditForm);

        var _this = possibleConstructorReturn(this, (EditForm.__proto__ || Object.getPrototypeOf(EditForm)).call(this, props));

        _this.state = _this.getStateFromNodes(props.node);
        return _this;
    }

    createClass(EditForm, [{
        key: 'getStateFromNodes',
        value: function getStateFromNodes(node) {
            return {
                text: node.text
            };
        }
    }, {
        key: 'componentWillReceiveProps',
        value: function componentWillReceiveProps(data) {
            this.setState(this.getStateFromNodes(data.node));
        }
    }, {
        key: 'shouldComponentUpdate',
        value: function shouldComponentUpdate(nextProps, nextState) {
            return stateComparator(this.state, nextState);
        }
    }, {
        key: 'click',
        value: function click(event) {
            var _this2 = this;

            // Define our default handler
            var handler = function handler() {
                _this2.props.node.toggleCheck();
            };

            // Emit an event with our forwarded MouseEvent, node, and default handler
            this.props.dom._tree.emit('node.click', event, this.props.node, handler);

            // Unless default is prevented, auto call our default handler
            if (!event.treeDefaultPrevented) {
                handler();
            }
        }
    }, {
        key: 'keypress',
        value: function keypress(event) {
            if (event.which === 13) {
                return this.save();
            }
        }
    }, {
        key: 'input',
        value: function input(event) {
            this.setState({
                text: event.target.value
            });
        }
    }, {
        key: 'cancel',
        value: function cancel(event) {
            if (event) {
                event.stopPropagation();
            }

            this.props.node.toggleEditing();
        }
    }, {
        key: 'save',
        value: function save(event) {
            if (event) {
                event.stopPropagation();
            }

            // Update the text
            this.props.node.set('text', this.ref.value);

            // Disable editing and update
            this.props.node.state('editing', false);
            this.props.node.markDirty();
            this.props.dom.applyChanges();
        }
    }, {
        key: 'render',
        value: function render() {
            var _this3 = this;

            return inferno.createVNode(2, 'form', {
                'onsubmit': function onsubmit(event) {
                    return event.preventDefault;
                }
            }, [inferno.createVNode(512, 'input', {
                'onClick': function onClick(event) {
                    return event.stopPropagation;
                },
                'onInput': this.input.bind(this),
                'onKeyPress': this.keypress.bind(this),
                'value': this.state.text
            }, null, null, function (elem) {
                return _this3.ref = elem;
            }), inferno.createVNode(2, 'span', {
                'className': 'btn-group'
            }, [inferno.createVNode(2, 'button', {
                'className': 'btn icon icon-check',
                'onClick': this.save.bind(this),
                'title': 'Save',
                'type': 'button'
            }), inferno.createVNode(2, 'button', {
                'className': 'btn icon icon-cross',
                'onClick': this.cancel.bind(this),
                'title': 'Cancel',
                'type': 'button'
            })])]);
        }
    }]);
    return EditForm;
}(infernoComponent);

var NodeAnchor = function (_Component) {
    inherits(NodeAnchor, _Component);

    function NodeAnchor(props) {
        classCallCheck(this, NodeAnchor);

        var _this = possibleConstructorReturn(this, (NodeAnchor.__proto__ || Object.getPrototypeOf(NodeAnchor)).call(this, props));

        _this.state = _this.stateFromNode(props.node);
        return _this;
    }

    createClass(NodeAnchor, [{
        key: 'stateFromNode',
        value: function stateFromNode(node) {
            return {
                editing: node.editing(),
                expanded: node.expanded(),
                hasVisibleChildren: !this.props.dom.isDynamic ? node.hasVisibleChildren() : Boolean(node.children),
                text: node.text
            };
        }
    }, {
        key: 'componentWillReceiveProps',
        value: function componentWillReceiveProps(data) {
            this.setState(this.stateFromNode(data.node));
        }
    }, {
        key: 'shouldComponentUpdate',
        value: function shouldComponentUpdate(nextProps, nextState) {
            return stateComparator(this.state, nextState);
        }
    }, {
        key: 'blur',
        value: function blur() {
            this.props.node.blur();
        }
    }, {
        key: 'click',
        value: function click(event) {
            var node = this.props.node;
            var dom = this.props.dom;

            // Define our default handler
            var handler = function handler() {
                event.preventDefault();

                if (node.editing()) {
                    return;
                }

                if (event.metaKey || event.ctrlKey || event.shiftKey) {
                    dom._tree.disableDeselection();
                }

                if (event.shiftKey) {
                    dom.clearSelection();

                    var selected = dom._tree.lastSelectedNode();
                    if (selected) {
                        dom._tree.selectBetween.apply(dom._tree, dom._tree.boundingNodes(selected, node));
                    }
                }

                if (node.selected()) {
                    if (!dom._tree.config.selection.disableDirectDeselection) {
                        node.deselect();
                    }
                } else {
                    node.select();
                }

                dom._tree.enableDeselection();
            };

            // Emit an event with our forwarded MouseEvent, node, and default handler
            dom._tree.emit('node.click', event, node, handler);

            // Unless default is prevented, auto call our default handler
            if (!event.treeDefaultPrevented) {
                handler();
            }
        }
    }, {
        key: 'dblclick',
        value: function dblclick(event) {
            var node = this.props.node;
            var dom = this.props.dom;

            // Define our default handler
            var handler = function handler() {
                // Clear text selection which occurs on double click
                dom.clearSelection();

                node.toggleCollapse();
            };

            // Emit an event with our forwarded MouseEvent, node, and default handler
            dom._tree.emit('node.dblclick', event, node, handler);

            // Unless default is prevented, auto call our default handler
            if (!event.treeDefaultPrevented) {
                handler();
            }
        }
    }, {
        key: 'focus',
        value: function focus(event) {
            this.props.node.focus(event);
        }
    }, {
        key: 'mousedown',
        value: function mousedown() {
            if (this.props.dom.isDragDropEnabled) {
                this.props.dom.isMouseHeld = true;
            }
        }
    }, {
        key: 'render',
        value: function render() {
            var node = this.props.node;
            var attributes = node.itree.a.attributes || {};
            attributes.className = 'title icon';
            attributes.tabindex = 1;
            attributes.unselectable = 'on';

            if (!this.props.dom._tree.config.dom.showCheckboxes) {
                var folder = this.state.expanded ? 'icon-folder-open' : 'icon-folder';
                attributes.className += ' ' + (node.itree.icon || (this.state.hasVisibleChildren ? folder : 'icon-file-empty'));
            }

            var content = node.text;
            if (node.editing()) {
                content = inferno.createVNode(16, EditForm, {
                    'dom': this.props.dom,
                    'node': this.props.node
                });
            }

            return inferno.createVNode(2, 'a', _extends({
                'onBlur': this.blur.bind(this),
                'onClick': this.click.bind(this),
                'onDblClick': this.dblclick.bind(this),
                'onFocus': this.focus.bind(this),
                'onMouseDown': this.mousedown.bind(this)
            }, attributes), content);
        }
    }]);
    return NodeAnchor;
}(infernoComponent);

var ToggleAnchor = function (_Component) {
    inherits(ToggleAnchor, _Component);

    function ToggleAnchor(props) {
        classCallCheck(this, ToggleAnchor);

        var _this = possibleConstructorReturn(this, (ToggleAnchor.__proto__ || Object.getPrototypeOf(ToggleAnchor)).call(this, props));

        _this.state = _this.stateFromNode(props.node);
        return _this;
    }

    createClass(ToggleAnchor, [{
        key: 'stateFromNode',
        value: function stateFromNode(node) {
            return {
                collapsed: node.collapsed()
            };
        }
    }, {
        key: 'componentWillReceiveProps',
        value: function componentWillReceiveProps(data) {
            this.setState(this.stateFromNode(data.node));
        }
    }, {
        key: 'shouldComponentUpdate',
        value: function shouldComponentUpdate(nextProps, nextState) {
            return this.state.collapsed !== nextState.collapsed;
        }
    }, {
        key: 'className',
        value: function className() {
            return 'toggle icon ' + (this.state.collapsed ? 'icon-expand' : 'icon-collapse');
        }
    }, {
        key: 'toggle',
        value: function toggle() {
            this.props.node.toggleCollapse();
        }
    }, {
        key: 'render',
        value: function render() {
            return inferno.createVNode(2, 'a', {
                'className': this.className(),
                'onClick': this.toggle.bind(this)
            });
        }
    }]);
    return ToggleAnchor;
}(infernoComponent);

var ListItem = function (_Component) {
    inherits(ListItem, _Component);

    function ListItem(props) {
        classCallCheck(this, ListItem);

        var _this = possibleConstructorReturn(this, (ListItem.__proto__ || Object.getPrototypeOf(ListItem)).call(this, props));

        _this.state = _this.stateFromNode(props.node);
        return _this;
    }

    createClass(ListItem, [{
        key: 'stateFromNode',
        value: function stateFromNode(node) {
            return {
                dirty: node.itree.dirty
            };
        }
    }, {
        key: 'componentWillReceiveProps',
        value: function componentWillReceiveProps(data) {
            this.setState(this.stateFromNode(data.node));
        }
    }, {
        key: 'shouldComponentUpdate',
        value: function shouldComponentUpdate(nextProps, nextState) {
            return nextState.dirty;
        }
    }, {
        key: 'getClassNames',
        value: function getClassNames() {
            var node = this.props.node;
            var state = node.itree.state;
            var attributes = node.itree.li.attributes;

            // Set state classnames
            var classNames = [];

            // https://jsperf.com/object-keys-vs-each
            _.each(Object.keys(state), function (key) {
                if (state[key]) {
                    classNames.push(key);
                }
            });

            // Inverse and additional classes
            if (!node.hidden() && node.removed()) {
                classNames.push('hidden');
            }

            if (node.expanded()) {
                classNames.push('expanded');
            }

            classNames.push(node.children ? 'folder' : 'leaf');

            // Append any custom class names
            var customClasses = attributes.class || attributes.className;
            if (_.isFunction(customClasses)) {
                customClasses = customClasses(node);
            }

            // Append content correctly
            if (!_.isEmpty(customClasses)) {
                if (_.isString(customClasses)) {
                    classNames = classNames.concat(customClasses.split(' '));
                } else if (_.isArray(customClasses)) {
                    classNames = classNames.concat(customClasses);
                }
            }

            return classNames.join(' ');
        }
    }, {
        key: 'getAttributes',
        value: function getAttributes() {
            var node = this.props.node;
            var attributes = _.clone(node.itree.li.attributes) || {};
            attributes.className = this.getClassNames();

            // Force internal-use attributes
            attributes['data-uid'] = node.id;

            return attributes;
        }
    }, {
        key: 'renderCheckbox',
        value: function renderCheckbox() {
            if (this.props.dom._tree.config.dom.showCheckboxes) {
                return inferno.createVNode(16, Checkbox, {
                    'dom': this.props.dom,
                    'node': this.props.node
                });
            }
        }
    }, {
        key: 'renderChildren',
        value: function renderChildren() {
            var node = this.props.node;

            if (node.hasChildren()) {
                return inferno.createVNode(16, List, {
                    'context': this.props.node,
                    'dom': this.props.dom,
                    'nodes': node.children
                });
            } else if (this.props.dom.isDynamic && !node.hasLoadedChildren()) {
                return inferno.createVNode(16, EmptyList, {
                    'text': 'Loading...'
                });
            } else if (this.props.dom.isDynamic) {
                return inferno.createVNode(16, EmptyList, {
                    'text': 'No Results'
                });
            }
        }
    }, {
        key: 'renderEditToolbar',
        value: function renderEditToolbar() {
            // @todo fix this boolean
            if (this.props.dom._tree.config.editing.edit && !this.props.node.editing()) {
                return inferno.createVNode(16, EditToolbar, {
                    'dom': this.props.dom,
                    'node': this.props.node
                });
            }
        }
    }, {
        key: 'renderToggle',
        value: function renderToggle() {
            var node = this.props.node;
            var hasVisibleChildren = !this.props.dom.isDynamic ? node.hasVisibleChildren() : Boolean(node.children);

            if (hasVisibleChildren) {
                return inferno.createVNode(16, ToggleAnchor, {
                    'node': node
                });
            }
        }
    }, {
        key: 'render',
        value: function render() {
            var _this2 = this;

            var li = inferno.createVNode(2, 'li', _extends({}, this.getAttributes()), [this.renderEditToolbar(), inferno.createVNode(2, 'div', {
                'className': 'title-wrap'
            }, [this.renderToggle(), this.renderCheckbox(), inferno.createVNode(16, NodeAnchor, {
                'dom': this.props.dom,
                'node': this.props.node
            })]), inferno.createVNode(2, 'div', {
                'className': 'wholerow'
            }), this.renderChildren()], null, function (domNode) {
                return _this2.props.node.itree.ref = domNode;
            });

            // Clear dirty bool only after everything has been generated (and states set)
            this.props.node.state('rendered', true);
            this.props.node.itree.dirty = false;

            return li;
        }
    }]);
    return ListItem;
}(infernoComponent);

var List = function (_Component) {
    inherits(List, _Component);

    function List(props) {
        classCallCheck(this, List);

        var _this = possibleConstructorReturn(this, (List.__proto__ || Object.getPrototypeOf(List)).call(this, props));

        _this.state = _this.getStateFromNodes(props.nodes);
        return _this;
    }

    createClass(List, [{
        key: 'getStateFromNodes',
        value: function getStateFromNodes(nodes) {
            var pagination = this.props.dom.getContextPagination(this.props.context);

            return {
                limit: _.get(pagination, 'limit', nodes.length),
                loading: this.props.dom.loading,
                total: _.get(pagination, 'total', nodes.length)
            };
        }
    }, {
        key: 'componentWillReceiveProps',
        value: function componentWillReceiveProps(data) {
            this.setState(this.getStateFromNodes(data.nodes));
        }
    }, {
        key: 'shouldComponentUpdate',
        value: function shouldComponentUpdate(nextProps, nextState) {
            return _.find(nextProps.nodes, 'itree.dirty') || stateComparator(this.state, nextState);
        }
    }, {
        key: 'isDeferred',
        value: function isDeferred() {
            return this.props.dom._tree.config.dom.deferredRendering || this.props.dom._tree.config.deferredLoading;
        }
    }, {
        key: 'loadMore',
        value: function loadMore(event) {
            event.preventDefault();

            this.props.dom.loadMore(this.props.context, event);
        }
    }, {
        key: 'renderLoadMoreNode',
        value: function renderLoadMoreNode() {
            return inferno.createVNode(2, 'li', {
                'className': 'leaf detached'
            }, inferno.createVNode(2, 'a', {
                'className': 'title icon icon-more load-more',
                'onClick': this.loadMore.bind(this)
            }, 'Load More'));
        }
    }, {
        key: 'renderLoadingTextNode',
        value: function renderLoadingTextNode() {
            return inferno.createVNode(2, 'li', {
                'className': 'leaf'
            }, inferno.createVNode(2, 'span', {
                'className': 'title icon icon-more'
            }, 'Loading...'));
        }
    }, {
        key: 'render',
        value: function render() {
            var _this2 = this;

            var renderNodes = this.props.nodes;

            // If rendering deferred, chunk the nodes client-side
            if (this.props.dom._tree.config.dom.deferredRendering) {
                // Determine the limit. Either for our current context or for the root level
                var limit = this.state.limit || this.props.dom.getNodeslimit();

                // Slice the current nodes by this context's pagination
                renderNodes = _.slice(this.props.nodes, 0, limit);
            }

            // Render nodes as list items
            var items = _.map(renderNodes, function (node) {
                return inferno.createVNode(16, ListItem, {
                    'dom': _this2.props.dom,
                    'node': node
                }, null, node.id);
            });

            if (this.isDeferred() && this.state.limit < this.state.total) {
                if (!this.state.loading) {
                    items.push(this.renderLoadMoreNode());
                } else {
                    items.push(this.renderLoadingTextNode());
                }
            }

            return inferno.createVNode(2, 'ol', null, [items, this.props.children]);
        }
    }]);
    return List;
}(infernoComponent);

/**
 * Helper method to create an object for a new node.
 *
 * @private
 * @return {void}
 */
function blankNode$1() {
    return {
        text: 'New Node',
        itree: {
            state: {
                editing: true,
                focused: true
            }
        }
    };
}

var Tree = function (_Component) {
    inherits(Tree, _Component);

    function Tree() {
        classCallCheck(this, Tree);
        return possibleConstructorReturn(this, (Tree.__proto__ || Object.getPrototypeOf(Tree)).apply(this, arguments));
    }

    createClass(Tree, [{
        key: 'add',
        value: function add() {
            this.props.dom._tree.focused().blur();

            this.props.dom._tree.addNode(blankNode$1());
        }
    }, {
        key: 'renderAddLink',
        value: function renderAddLink() {
            if (this.props.dom._tree.config.editing.add) {
                return inferno.createVNode(2, 'li', null, inferno.createVNode(2, 'a', {
                    'className': 'btn icon icon-plus',
                    'onClick': this.add.bind(this),
                    'title': 'Add a new root node'
                }));
            }
        }
    }, {
        key: 'render',
        value: function render() {
            return inferno.createVNode(16, List, {
                'dom': this.props.dom,
                'nodes': this.props.nodes,
                children: this.renderAddLink()
            });
        }
    }]);
    return Tree;
}(infernoComponent);

// Libs

/**
 * Default InspireTree rendering logic.
 *
 * @category DOM
 * @return {InspireDOM} Default renderer.
 */

var InspireDOM = function () {
    function InspireDOM(tree) {
        classCallCheck(this, InspireDOM);

        // Init properties
        this._tree = tree;
        this.batching = 0;
        this.dropTargets = [];
        this.$scrollLayer;

        // Cache because we use in loops
        this.isDynamic = _$1.isFunction(this._tree.config.data);
        this.contextMenuChoices = this._tree.config.contextMenu;
    }

    /**
     * Apply pending data changes to the DOM.
     *
     * Will skip rendering as long as any calls
     * to `batch` have yet to be resolved,
     *
     * @category DOM
     * @private
     * @return {void}
     */


    createClass(InspireDOM, [{
        key: 'applyChanges',
        value: function applyChanges() {
            // Never rerender when until batch complete
            if (this.batching > 0) {
                return;
            }

            this.renderNodes();
        }

        /**
         * Attaches to the DOM element for rendering.
         *
         * @category DOM
         * @private
         * @param {HTMLElement} target Element, selector, or jQuery-like object.
         * @return {void}
         */

    }, {
        key: 'attach',
        value: function attach(target) {
            var dom = this;
            dom.$target = dom.getElement(target);
            dom.$scrollLayer = dom.getScrollableAncestor(dom.$target);

            if (!dom.$target) {
                throw new Error('No valid element to attach to.');
            }

            // Set classnames
            var classNames = dom.$target.className.split(' ');
            classNames.push('inspire-tree');

            if (dom._tree.config.editable) {
                classNames.push('editable');

                _$1.each(_$1.pickBy(dom._tree.config.editing, _$1.identity), function (v, key) {
                    classNames.push('editable-' + key);
                });
            }

            dom.$target.className = classNames.join(' ');
            dom.$target.setAttribute('tabindex', dom._tree.config.tabindex || 0);

            // Handle keyboard interaction
            dom.$target.addEventListener('keyup', dom.keyboardListener.bind(dom));

            var dragTargetSelectors = dom._tree.config.dragTargets;
            if (!_$1.isEmpty(dragTargetSelectors)) {
                _$1.each(dragTargetSelectors, function (selector) {
                    var dropTarget = dom.getElement(selector);

                    if (dropTarget) {
                        dom.dropTargets.push(dropTarget);
                    } else {
                        throw new Error('No valid element found for drop target ' + selector);
                    }
                });
            }

            dom.isDragDropEnabled = dom.dropTargets.length > 0;

            if (dom.isDragDropEnabled) {
                document.addEventListener('mouseup', dom.mouseUpListener.bind(dom));
                document.addEventListener('mousemove', dom.mouseMoveListener.bind(dom));
            }

            // Sync browser focus to focus state
            dom._tree.on('node.focused', function (node) {
                var elem = node.itree.ref.querySelector('.title');
                if (elem !== document.activeElement) {
                    elem.focus();
                }
            });

            // Set pagination limits
            this.pagination = {
                limit: this.getNodesLimit()
            };

            var limit = this.pagination.limit;
            dom._tree.on('model.loaded', function () {
                // Set context-specific pagination
                dom._tree.nodes().recurseDown(function (node) {
                    if (node.children) {
                        node.itree.pagination = {
                            limit: limit,
                            total: node.hasChildren() ? node.children.length : -1
                        };
                    }
                });
            });

            dom._tree.on('node.added', function (node) {
                if (node.children) {
                    node.itree.pagination = {
                        limit: limit,
                        total: node.hasChildren() ? node.children.length : -1
                    };
                }
            });

            // Listen for scrolls for automatic loading
            if ((dom._tree.config.dom.deferredRendering || dom._tree.config.deferredLoading) && dom._tree.config.dom.autoLoadMore) {
                dom.$target.addEventListener('scroll', _$1.throttle(dom.scrollListener.bind(dom), 20));
            }

            dom.$target.inspireTree = dom._tree;
        }

        /**
         * Disable rendering in preparation for multiple changes.
         *
         * @category DOM
         * @private
         * @return {void}
         */

    }, {
        key: 'batch',
        value: function batch() {
            if (this.batching < 0) {
                this.batching = 0;
            }

            this.batching++;
        }

        /**
         * Clear page text selection, primarily after a click event which
         * natively selects a range of text.
         *
         * @category DOM
         * @private
         * @return {void}
         */

    }, {
        key: 'clearSelection',
        value: function clearSelection() {
            if (document.selection && document.selection.empty) {
                document.selection.empty();
            } else if (window.getSelection) {
                window.getSelection().removeAllRanges();
            }
        }

        /**
         * Creates a draggable element by cloning a target,
         * registers a listener for mousemove.
         *
         * @private
         * @param {HTMLElement} element DOM Element.
         * @param {Event} event Click event to use.
         * @return {void}
         */

    }, {
        key: 'createDraggableElement',
        value: function createDraggableElement(element, event) {
            this.$dragNode = this.nodeFromTitleDOMElement(element);

            var rect = element.getBoundingClientRect();
            var diffX = event.clientX - rect.left;
            var diffY = event.clientY - rect.top;

            this.dragHandleOffset = { left: diffX, top: diffY };

            this.$dragElement = element.cloneNode(true);
            this.$dragElement.className += ' dragging';
            this.$dragElement.style.top = rect.top + 'px';
            this.$dragElement.style.left = rect.left + 'px';
            this.$target.appendChild(this.$dragElement);
        }

        /**
         * Permit rerendering of batched changes.
         *
         * @category DOM
         * @private
         * @return {void}
         */

    }, {
        key: 'end',
        value: function end() {
            this.batching--;

            if (this.batching === 0) {
                this.applyChanges();
            }
        }

        /**
         * Get the pagination for the given context node, or root if undefined.
         *
         * @param {TreeNode} context Context node.
         * @return {object} Pagination configuration object.
         */

    }, {
        key: 'getContextPagination',
        value: function getContextPagination(context) {
            return context ? _$1.get(context, 'itree.pagination') : this.pagination;
        }

        /**
         * Get an HTMLElement through various means:
         * An element, jquery object, or a selector.
         *
         * @private
         * @param {mixed} target Element, jQuery selector, selector.
         * @return {HTMLElement} Matching element.
         */

    }, {
        key: 'getElement',
        value: function getElement(target) {
            var $element;

            if (target instanceof HTMLElement) {
                $element = target;
            } else if (_$1.isObject(target) && _$1.isObject(target[0])) {
                $element = target[0];
            } else if (_$1.isString(target)) {
                var match = document.querySelector(target);
                if (match) {
                    $element = match;
                }
            }

            return $element;
        }

        /**
         * Get the max nodes per "page" we'll allow. Defaults to how many nodes can fit.
         *
         * @private
         * @return {integer} Node count
         */

    }, {
        key: 'getNodesLimit',
        value: function getNodesLimit() {
            var limit = this._tree.config.pagination.limit;
            return (limit > 0 ? limit : _$1.ceil(this.$scrollLayer.clientHeight / this._tree.config.dom.nodeHeight)) || 20;
        }

        /**
         * Helper method to find a scrollable ancestor element.
         *
         * @param  {HTMLElement} $element Starting element.
         * @return {HTMLElement} Scrollable element.
         */

    }, {
        key: 'getScrollableAncestor',
        value: function getScrollableAncestor($element) {
            if ($element instanceof Element) {
                var style = getComputedStyle($element);
                if (style.overflow !== 'auto' && $element.parentNode) {
                    $element = this.getScrollableAncestor($element.parentNode);
                }
            }

            return $element;
        }

        /**
         * Listen to keyboard event for navigation.
         *
         * @private
         * @param {Event} event Keyboard event.
         * @return {void}
         */

    }, {
        key: 'keyboardListener',
        value: function keyboardListener(event) {
            // Navigation
            var focusedNode = this._tree.focused();
            if (focusedNode) {
                focusedNode = focusedNode[0];
                switch (event.which) {
                    case 40:
                        this.moveFocusDownFrom(focusedNode);
                        break;
                    case 13:
                        focusedNode.toggleSelect();
                        break;
                    case 37:
                        focusedNode.collapse();
                        break;
                    case 39:
                        focusedNode.expand();
                        break;
                    case 38:
                        this.moveFocusUpFrom(focusedNode);
                        break;
                    default:
                }
            }
        }

        /**
         * Loads/renders additional nodes for a given context, or the root.
         *
         * @private
         * @param {TreeNode} context Parent node, or none for root.
         * @param {Event} event Click or scroll event which triggered this call.
         * @return {Promise} Resolves with request results.
         */

    }, {
        key: 'loadMore',
        value: function loadMore(context, event) {
            var _this = this;

            if (this.loading) {
                return;
            }

            var pagination = this.getContextPagination(context);
            var promise;

            // Set loading flag, prevents repeat requests
            this.loading = true;
            this.batch();

            // Mark this context as dirty since we'll update text/tree nodes
            _$1.invoke(context, 'markDirty');

            // Increment the pagination
            pagination.limit += this.getNodesLimit();

            // Emit an event
            this._tree.emit('node.paginate', context, pagination, event);

            if (this._tree.config.deferredLoading) {
                if (context) {
                    promise = context.loadChildren();
                } else {
                    promise = this._tree.load(this._tree.config.data);
                }
            } else {
                this.loading = false;
            }

            this.end();

            // Clear the loading flag
            if (this._tree.config.deferredLoading) {
                promise.then(function () {
                    _this.loading = false;
                    _this.applyChanges();
                }).catch(function () {
                    this.loading = false;
                    this.applyChanges();
                });
            }

            return promise;
        }

        /**
         * Listener for mouse move events for drag and drop.
         * Is removed automatically on mouse up.
         *
         * @private
         * @param {Event} event Mouse move event.
         * @return {void}
         */

    }, {
        key: 'mouseMoveListener',
        value: function mouseMoveListener(event) {
            if (this.isMouseHeld && !this.$dragElement) {
                this.createDraggableElement(event.target, event);
            } else if (this.$dragElement) {
                event.preventDefault();
                event.stopPropagation();

                var x = event.clientX - this.dragHandleOffset.left;
                var y = event.clientY - this.dragHandleOffset.top;

                this.$dragElement.style.left = x + 'px';
                this.$dragElement.style.top = y + 'px';

                var validTarget;
                _$1.each(this.dropTargets, function (target) {
                    var rect = target.getBoundingClientRect();

                    if (event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom) {
                        validTarget = target;
                        return false;
                    }
                });

                // If new target found for the first time
                if (!this.$activeDropTarget && validTarget && validTarget.className.indexOf('itree-active-drop-target') === -1) {
                    validTarget.className += ' itree-active-drop-target';
                }

                this.$activeDropTarget = validTarget;
            }
        }

        /**
         * Handle mouse up events for dragged elements.
         *
         * @return {void}
         */

    }, {
        key: 'mouseUpListener',
        value: function mouseUpListener() {
            this.isMouseHeld = false;

            if (this.$dragElement) {
                this.$dragElement.parentNode.removeChild(this.$dragElement);

                if (this.$activeDropTarget) {
                    var targetIsTree = _$1.isFunction(_$1.get(this.$activeDropTarget, 'inspireTree.addNode'));

                    // Notify that the node was "dropped out" of this tree
                    this._tree.emit('node.dropout', this.$dragNode, this.$activeDropTarget, targetIsTree);

                    // If drop target supports the addNode method, invoke it
                    if (targetIsTree) {
                        var newNode = this.$activeDropTarget.inspireTree.addNode(this.$dragNode.copyHierarchy().toObject());

                        // Notify that the node was "dropped out"
                        this.$activeDropTarget.inspireTree.emit('node.dropin', newNode);
                    }
                }
            }

            if (this.$activeDropTarget) {
                this.$activeDropTarget.className = this.$activeDropTarget.className.replace('itree-active-drop-target', '');
            }

            this.$dragNode = null;
            this.$dragElement = null;
            this.$activeDropTarget = null;
        }

        /**
         * Move select down the visible tree from a starting node.
         *
         * @private
         * @param {object} startingNode Node object.
         * @return {void}
         */

    }, {
        key: 'moveFocusDownFrom',
        value: function moveFocusDownFrom(startingNode) {
            var next = startingNode.nextVisibleNode();
            if (next) {
                next.focus();
            }
        }

        /**
         * Move select up the visible tree from a starting node.
         *
         * @private
         * @param {object} startingNode Node object.
         * @return {void}
         */

    }, {
        key: 'moveFocusUpFrom',
        value: function moveFocusUpFrom(startingNode) {
            var prev = startingNode.previousVisibleNode();
            if (prev) {
                prev.focus();
            }
        }

        /**
         * Helper method for obtaining the data-uid from a DOM element.
         *
         * @private
         * @param {HTMLElement} element HTML Element.
         * @return {object} Node object
         */

    }, {
        key: 'nodeFromTitleDOMElement',
        value: function nodeFromTitleDOMElement(element) {
            var uid = element.parentNode.parentNode.getAttribute('data-uid');
            return this._tree.node(uid);
        }

        /**
         * Triggers rendering for the given node array.
         *
         * @category DOM
         * @private
         * @param {array} nodes Array of node objects.
         * @return {void}
         */

    }, {
        key: 'renderNodes',
        value: function renderNodes(nodes) {
            render$1(inferno.createVNode(16, Tree, {
                'dom': this,
                'nodes': nodes || this._tree.nodes()
            }), this.$target);
        }
    }, {
        key: 'scrollListener',


        /**
         * Listens for scroll events, to automatically trigger
         * Load More links when they're scrolled into view.
         *
         * @category DOM
         * @private
         * @param {Event} event Scroll event.
         * @return {void}
         */
        value: function scrollListener(event) {
            var _this2 = this;

            if (!this.rendering && !this.loading) {
                // Get the bounding rect of the scroll layer
                var rect = this.$scrollLayer.getBoundingClientRect();

                // Find all load-more links
                var links = document.querySelectorAll('.load-more');
                _$1.each(links, function (link) {
                    // Look for load-more links which overlap our "viewport"
                    var r = link.getBoundingClientRect();
                    var overlap = !(rect.right < r.left || rect.left > r.right || rect.bottom < r.top || rect.top > r.bottom);

                    if (overlap) {
                        // Auto-trigger Load More links
                        var context;

                        var $parent = link.parentNode.parentNode.parentNode;
                        if ($parent.tagName === 'LI') {
                            context = _this2._tree.node($parent.getAttribute('data-uid'));
                        }

                        _this2.loadMore(context, event);
                    }
                });
            }
        }

        /**
         * Scroll the first selected node into view.
         *
         * @category DOM
         * @private
         * @return {void}
         */

    }, {
        key: 'scrollSelectedIntoView',
        value: function scrollSelectedIntoView() {
            var $tree = document.querySelector('.inspire-tree');
            var $selected = $tree.querySelector('.selected');

            if ($selected && dom.$scrollLayer) {
                dom.$scrollLayer.scrollTop = $selected.offsetTop;
            }
        }
    }]);
    return InspireDOM;
}();

// 'use strict';

// Libs
// CSS
// require('./scss/tree.scss');

/**
 * Maps a method to the root TreeNodes collection.
 *
 * @private
 * @param {InspireTree} tree Tree instance.
 * @param {string} method Method name.
 * @param {arguments} args Proxied arguments.
 * @return {mixed} Proxied return value.
 */
function map$1(tree, method, args) {
    return tree.model[method].apply(tree.model, args);
}

/**
 * Represents a singe tree instance.
 *
 * @category Tree
 * @return {InspireTree} Tree instance.
 */

var InspireTree = function (_EventEmitter) {
    inherits(InspireTree, _EventEmitter);

    function InspireTree(opts) {
        classCallCheck(this, InspireTree);

        var _this = possibleConstructorReturn(this, (InspireTree.__proto__ || Object.getPrototypeOf(InspireTree)).call(this));

        var tree = _this;

        // Init properties
        tree._lastSelectedNode;
        tree._muted = false;
        tree.allowsLoadEvents = false;
        tree.dom = false;
        tree.initialized = false;
        tree.isDynamic = false;
        tree.model = new TreeNodes(tree);
        tree.opts = opts;
        tree.preventDeselection = false;

        // Assign defaults
        tree.config = _$1.defaultsDeep({}, opts, {
            allowLoadEvents: [],
            checkbox: {
                autoCheckChildren: true
            },
            contextMenu: false,
            data: false,
            dom: {
                autoLoadMore: true,
                deferredRendering: false,
                nodeHeight: 25,
                showCheckboxes: false
            },
            dragTargets: false,
            editable: false,
            editing: {
                add: false,
                edit: false,
                remove: false
            },
            nodes: {
                resetStateOnRestore: true
            },
            pagination: {
                limit: -1
            },
            renderer: false,
            search: false,
            selection: {
                allow: _$1.noop,
                autoDeselect: true,
                autoSelectChildren: false,
                disableDirectDeselection: false,
                mode: 'default',
                multiple: false,
                require: false
            },
            showCheckboxes: false,
            sort: false,
            tabindex: -1,
            target: false
        });

        // If checkbox mode, we must force auto-selecting children
        if (tree.config.selection.mode === 'checkbox') {
            tree.config.selection.autoSelectChildren = true;

            // If user didn't specify showCheckboxes,
            // but is using checkbox selection mode,
            // enable it automatically.
            if (!_$1.isBoolean(_$1.get(opts, 'dom.showCheckboxes'))) {
                tree.config.dom.showCheckboxes = true;
            }

            // In checkbox mode, checked=selected
            tree.on('node.checked', function (node) {
                if (!node.selected()) {
                    node.select(true);
                }
            });

            tree.on('node.selected', function (node) {
                if (!node.checked()) {
                    node.check(true);
                }
            });

            tree.on('node.unchecked', function (node) {
                if (node.selected()) {
                    node.deselect(true);
                }
            });

            tree.on('node.deselected', function (node) {
                if (node.checked()) {
                    node.uncheck(true);
                }
            });
        }

        // If auto-selecting children, we must force multiselect
        if (tree.config.selection.autoSelectChildren) {
            tree.config.selection.multiple = true;
            tree.config.selection.autoDeselect = false;
        }

        // Treat editable as full edit mode
        if (opts.editable && !opts.editing) {
            tree.config.editing.add = true;
            tree.config.editing.edit = true;
            tree.config.editing.remove = true;
        }

        // Init the default state for nodes
        tree.defaultState = {
            collapsed: true,
            editable: _$1.get(tree, 'config.editing.edit'),
            editing: false,
            focused: false,
            hidden: false,
            indeterminate: false,
            loading: false,
            removed: false,
            rendered: false,
            selectable: true,
            selected: false
        };

        // Cache some configs
        tree.allowsLoadEvents = _$1.isArray(tree.config.allowLoadEvents) && tree.config.allowLoadEvents.length > 0;
        tree.isDynamic = _$1.isFunction(tree.config.data);
        tree.usesNativeDOM = true; // @todo

        // Override emitter so we can better control flow
        var emit = tree.emit;
        tree.emit = function (eventName) {
            if (!tree.isEventMuted(eventName)) {
                // Duck-type for a DOM event
                if (_$1.isFunction(_$1.get(arguments, '[1].preventDefault'))) {
                    var event = arguments[1];
                    event.treeDefaultPrevented = false;
                    event.preventTreeDefault = function () {
                        event.treeDefaultPrevented = true;
                    };
                }

                emit.apply(tree, arguments);
            }
        };

        // Webpack has a DOM boolean that when false,
        // allows us to exclude this library from our build.
        // For those doing their own rendering, it's useless.
        // if (DOM) {
        tree.dom = new InspireDOM(tree);
        // }

        // Validation
        if (tree.dom && (!_$1.isObject(opts) || !opts.target)) {
            throw new TypeError('Property "target" is required, either an element or a selector.');
        }

        // Load custom/empty renderer
        if (!tree.dom) {
            var renderer = _$1.isFunction(tree.config.renderer) ? tree.config.renderer(tree) : {};
            tree.dom = _$1.defaults(renderer, {
                applyChanges: _$1.noop,
                attach: _$1.noop,
                batch: _$1.noop,
                end: _$1.noop
            });
        }

        // Connect to our target DOM element
        tree.dom.attach(tree.config.target);

        // Load initial user data
        if (tree.config.data) {
            tree.load(tree.config.data).catch(function (err) {
                // Proxy initial errors. At this point we should never consume them
                setTimeout(function () {
                    throw err;
                });
            });
        }

        tree.initialized = true;
        return _this;
    }

    /**
     * Adds a new node to this collection. If a sort
     * method is configured, the node will be added
     * in the appropriate order.
     *
     * @category Tree
     * @param {object} node Node
     * @return {TreeNode} Node object.
     */


    createClass(InspireTree, [{
        key: 'addNode',
        value: function addNode() {
            return map$1(this, 'addNode', arguments);
        }

        /**
         * Add nodes.
         *
         * @category Tree
         * @param {array} nodes Array of node objects.
         * @return {TreeNodes} Added node objects.
         */

    }, {
        key: 'addNodes',
        value: function addNodes(nodes) {
            var tree = this;
            tree.dom.batch();

            var newNodes = new TreeNodes(this);
            _$1.each(nodes, function (node) {
                newNodes.push(tree.addNode(node));
            });

            tree.dom.end();

            return newNodes;
        }

        /**
         * Query for all available nodes.
         *
         * @category Tree
         * @param {boolean} full Retain full hiearchy.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'available',
        value: function available() {
            return map$1(this, 'available', arguments);
        }

        /**
         * Blur children in this collection.
         *
         * @category Tree
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'blur',
        value: function blur() {
            return map$1(this, 'blur', arguments);
        }

        /**
         * Blur all children (deeply) in this collection.
         *
         * @category Tree
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'blurDeep',
        value: function blurDeep() {
            return map$1(this, 'blurDeep', arguments);
        }

        /**
         * Compares any number of TreeNode objects and returns
         * the minimum and maximum (starting/ending) nodes.
         *
         * @category Tree
         * @return {array} Array with two TreeNode objects.
         */

    }, {
        key: 'boundingNodes',
        value: function boundingNodes() {
            var pathMap = _$1.transform(arguments, function (map$$1, node) {
                map$$1[node.indexPath().replace(/\./g, '')] = node;
            }, {});

            var paths = _$1.sortBy(Object.keys(pathMap));
            return [_$1.get(pathMap, _$1.head(paths)), _$1.get(pathMap, _$1.tail(paths))];
        }

        /**
         * Get if the tree will auto-deselect currently selected nodes
         * when a new selection is made.
         *
         * @category Tree
         * @return {boolean} If tree will auto-deselect nodes.
         */

    }, {
        key: 'canAutoDeselect',
        value: function canAutoDeselect() {
            return this.config.selection.autoDeselect && !this.preventDeselection;
        }

        /**
         * Query for all checked nodes.
         *
         * @category Tree
         * @param {boolean} full Retain full hiearchy.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'checked',
        value: function checked() {
            return map$1(this, 'checked', arguments);
        }

        /**
         * Clean children in this collection.
         *
         * @category Tree
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'clean',
        value: function clean() {
            return map$1(this, 'clean', arguments);
        }

        /**
         * Shows all nodes and collapses parents.
         *
         * @category Tree
         * @return {Tree} Tree instance.
         */

    }, {
        key: 'clearSearch',
        value: function clearSearch() {
            return this.showDeep().collapseDeep().tree();
        }

        /**
         * Clones (deep) the array of nodes.
         *
         * Note: Cloning will *not* clone the context pointer.
         *
         * @category Tree
         * @return {TreeNodes} Array of cloned nodes.
         */

    }, {
        key: 'clone',
        value: function clone() {
            return map$1(this, 'clone', arguments);
        }

        /**
         * Collapse children in this collection.
         *
         * @category Tree
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'collapse',
        value: function collapse() {
            return map$1(this, 'collapse', arguments);
        }

        /**
         * Query for all collapsed nodes.
         *
         * @category Tree
         * @param {boolean} full Retain full hiearchy.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'collapsed',
        value: function collapsed() {
            return map$1(this, 'collapsed', arguments);
        }

        /**
         * Collapse all children (deeply) in this collection.
         *
         * @category Tree
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'collapseDeep',
        value: function collapseDeep() {
            return map$1(this, 'collapseDeep', arguments);
        }

        /**
         * Concat nodes like an Array would.
         *
         * @category Tree
         * @param {TreeNodes} nodes Array of nodes.
         * @return {TreeNodes} Resulting node array.
         */

    }, {
        key: 'concat',
        value: function concat() {
            return map$1(this, 'concat', arguments);
        }

        /**
         * Copies nodes to a new tree instance.
         *
         * @category Tree
         * @param {boolean} hierarchy Include necessary ancestors to match hierarchy.
         * @return {object} Methods to perform action on copied nodes.
         */

    }, {
        key: 'copy',
        value: function copy() {
            return map$1(this, 'copy', arguments);
        }

        /**
         * Returns deepest nodes from this array.
         *
         * @category Tree
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'deepest',
        value: function deepest() {
            return map$1(this, 'deepest', arguments);
        }

        /**
         * Deselect children in this collection.
         *
         * @category Tree
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'deselect',
        value: function deselect() {
            return map$1(this, 'deselect', arguments);
        }

        /**
         * Deselect all children (deeply) in this collection.
         *
         * @category Tree
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'deselectDeep',
        value: function deselectDeep() {
            return map$1(this, 'deselectDeep', arguments);
        }

        /**
         * Disable auto-deselection of currently selected nodes.
         *
         * @category Tree
         * @return {Tree} Tree instance.
         */

    }, {
        key: 'disableDeselection',
        value: function disableDeselection() {
            if (this.config.selection.multiple) {
                this.preventDeselection = true;
            }

            return this;
        }

        /**
         * Iterate every TreeNode in this collection.
         *
         * @category Tree
         * @param {function} iteratee Iteratee invoke for each node.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'each',
        value: function each() {
            return map$1(this, 'each', arguments);
        }

        /**
         * Query for all editable nodes.
         *
         * @category Tree
         * @param {boolean} full Retain full hiearchy.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'editable',
        value: function editable() {
            return map$1(this, 'editable', arguments);
        }

        /**
         * Query for all nodes in editing mode.
         *
         * @category Tree
         * @param {boolean} full Retain full hiearchy.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'editing',
        value: function editing() {
            return map$1(this, 'editing', arguments);
        }

        /**
         * Enable auto-deselection of currently selected nodes.
         *
         * @category Tree
         * @return {Tree} Tree instance.
         */

    }, {
        key: 'enableDeselection',
        value: function enableDeselection() {
            this.preventDeselection = false;

            return this;
        }

        /**
         * Expand children in this collection.
         *
         * @category Tree
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'expand',
        value: function expand() {
            return map$1(this, 'expand', arguments);
        }

        /**
         * Recursively expands all nodes, loading all dynamic calls.
         *
         * @category Tree
         * @param {boolean} full Retain full hiearchy.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'expandDeep',
        value: function expandDeep() {
            return map$1(this, 'expandDeep', arguments);
        }

        /**
         * Query for all expanded nodes.
         *
         * @category Tree
         * @return {Promise} Promise resolved only when all children have loaded and expanded.
         */

    }, {
        key: 'expanded',
        value: function expanded() {
            return map$1(this, 'expanded', arguments);
        }

        /**
         * Returns a cloned hierarchy of all nodes matching a predicate.
         *
         * Because it filters deeply, we must clone all nodes so that we
         * don't affect the actual node array.
         *
         * @category Tree
         * @param {string|function} predicate State flag or custom function.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'extract',
        value: function extract() {
            return map$1(this, 'extract', arguments);
        }

        /**
         * Returns nodes which match a predicate.
         *
         * @category Tree
         * @param {string|function} predicate State flag or custom function.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'filter',
        value: function filter() {
            return map$1(this, 'filter', arguments);
        }

        /**
         * Flattens a hierarchy, returning only node(s) matching the
         * expected state or predicate function.
         *
         * @category Tree
         * @param {string|function} predicate State property or custom function.
         * @return {TreeNodes} Flat array of matching nodes.
         */

    }, {
        key: 'flatten',
        value: function flatten() {
            return map$1(this, 'flatten', arguments);
        }

        /**
         * Query for all focused nodes.
         *
         * @category Tree
         * @param {boolean} full Retain full hiearchy.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'focused',
        value: function focused() {
            return map$1(this, 'focused', arguments);
        }

        /**
         * Get a specific node in the collection, or undefined if it doesn't exist.
         *
         * @category Tree
         * @param {int} index Numeric index of requested node.
         * @return {TreeNode} Node object. Undefined if invalid index.
         */

    }, {
        key: 'get',
        value: function get() {
            return map$1(this, 'get', arguments);
        }

        /**
         * Query for all hidden nodes.
         *
         * @category Tree
         * @param {boolean} full Retain full hiearchy.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'hidden',
        value: function hidden() {
            return map$1(this, 'hidden', arguments);
        }

        /**
         * Hide children in this collection.
         *
         * @category Tree
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'hide',
        value: function hide() {
            return map$1(this, 'hide', arguments);
        }

        /**
         * Hide all children (deeply) in this collection.
         *
         * @category Tree
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'hideDeep',
        value: function hideDeep() {
            return map$1(this, 'hideDeep', arguments);
        }

        /**
         * Query for all indeterminate nodes.
         *
         * @category Tree
         * @param {boolean} full Retain full hiearchy.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'indeterminate',
        value: function indeterminate() {
            return map$1(this, 'indeterminate', arguments);
        }

        /**
         * Insert a new node at a given position.
         *
         * @category Tree
         * @param {integer} index Index at which to insert the node.
         * @param {object} object Raw node object or TreeNode.
         * @return {TreeNode} Node object.
         */

    }, {
        key: 'insertAt',
        value: function insertAt() {
            return map$1(this, 'insertAt', arguments);
        }

        /**
         * Invoke method(s) on each node.
         *
         * @category Tree
         * @param {string|array} methods Method name(s).
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'invoke',
        value: function invoke() {
            return map$1(this, 'invoke', arguments);
        }

        /**
         * Invoke method(s) deeply.
         *
         * @category Tree
         * @param {string|array} methods Method name(s).
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'invokeDeep',
        value: function invokeDeep() {
            return map$1(this, 'invokeDeep', arguments);
        }

        /**
         * Check if an object is a TreeNode.
         *
         * @category Tree
         * @param {object} object Object
         * @return {boolean} If object is a TreeNode.
         */

    }, {
        key: 'isNode',
        value: function isNode(object) {
            return object instanceof TreeNode;
        }

        /**
         * Check if an event is currently muted.
         *
         * @category Tree
         * @param {string} eventName Event name.
         * @return {boolean} If event is muted.
         */

    }, {
        key: 'isEventMuted',
        value: function isEventMuted(eventName) {
            if (_$1.isBoolean(this.muted())) {
                return this.muted();
            }

            return _$1.includes(this.muted(), eventName);
        }

        /**
         * Get the most recently selected node, if any.
         *
         * @category Tree
         * @return {TreeNode} Last selected node, or undefined.
         */

    }, {
        key: 'lastSelectedNode',
        value: function lastSelectedNode() {
            return this._lastSelectedNode;
        }

        /**
         * Loads tree. Accepts an array or a promise.
         *
         * @category Tree
         * @param {array|function} loader Array of nodes, or promise resolving an array of nodes.
         * @return {Promise} Promise resolved upon successful load, rejected on error.
         * @example
         *
         * tree.load($.getJSON('nodes.json'));
         */

    }, {
        key: 'load',
        value: function load(loader) {
            var tree = this;

            var promise = new Promise$1(function (resolve, reject) {
                var complete = function complete(nodes, totalNodes) {
                    tree.dom.pagination.total = nodes.length;

                    if (_$1.parseInt(totalNodes) > nodes.length) {
                        tree.dom.pagination.total = _$1.parseInt(totalNodes);
                    }

                    // Delay event for synchronous loader. Otherwise it fires
                    // before the user has a chance to listen.
                    if (!tree.initialized && _$1.isArray(nodes)) {
                        setTimeout(function () {
                            tree.emit('data.loaded', nodes);
                        });
                    } else {
                        tree.emit('data.loaded', nodes);
                    }

                    // Concat newly loaded nodes
                    tree.model = tree.model.concat(collectionToModel(tree, nodes));

                    if (tree.config.selection.require && !tree.selected().length) {
                        tree.selectFirstAvailableNode();
                    }

                    // Delay event for synchronous loader
                    if (!tree.initialized && _$1.isArray(nodes)) {
                        setTimeout(function () {
                            tree.emit('model.loaded', tree.model);
                        });
                    } else {
                        tree.emit('model.loaded', tree.model);
                    }

                    resolve(tree.model);

                    tree.dom.applyChanges();

                    if (_$1.isFunction(tree.dom.scrollSelectedIntoView)) {
                        tree.dom.scrollSelectedIntoView();
                    }
                };

                // Data given already as an array
                if (_$1.isArrayLike(loader)) {
                    complete(loader);
                }

                // Data loader requires a caller/callback
                else if (_$1.isFunction(loader)) {
                        var resp = loader(null, complete, reject, tree.dom.pagination);

                        // Loader returned its own object
                        if (resp) {
                            loader = resp;
                        }
                    }

                // Data loader is likely a promise
                if (_$1.isObject(loader)) {
                    standardizePromise(loader).then(complete).catch(reject);
                } else {
                    error(new Error('Invalid data loader.'));
                }
            });

            // Copy to event listeners
            promise.catch(function (err) {
                tree.emit('data.loaderror', err);
            });

            return promise;
        }

        /**
         * Query for all loading nodes.
         *
         * @category Tree
         * @param {boolean} full Retain full hiearchy.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'loading',
        value: function loading() {
            return map$1(this, 'loading', arguments);
        }

        /*
         * Pause events.
         *
         * @category Tree
         * @param {array} events Event names to mute.
         * @return {Tree} Tree instance.
         */

    }, {
        key: 'mute',
        value: function mute(events) {
            if (_$1.isString(events) || _$1.isArray(events)) {
                this._muted = _$1.castArray(events);
            } else {
                this._muted = true;
            }

            return this;
        }

        /**
         * Get current mute settings.
         *
         * @category Tree
         * @return {boolean|array} Muted events. If all, true.
         */

    }, {
        key: 'muted',
        value: function muted() {
            return this._muted;
        }

        /**
         * Get a node.
         *
         * @category Tree
         * @param {string|number} id ID of node.
         * @return {TreeNode} Node object.
         */

    }, {
        key: 'node',
        value: function node() {
            return map$1(this, 'node', arguments);
        }

        /**
         * Get all nodes in a tree, or nodes for an array of IDs.
         *
         * @category Tree
         * @param {array} refs Array of ID references.
         * @return {TreeNodes} Array of node objects.
         * @example
         *
         * var all = tree.nodes()
         * var some = tree.nodes([1, 2, 3])
         */

    }, {
        key: 'nodes',
        value: function nodes() {
            return map$1(this, 'nodes', arguments);
        }

        /**
         * Base recursion function for a collection or node.
         *
         * Returns false if execution should cease.
         *
         * @private
         * @param {function} iteratee Iteratee function
         * @return {TreeNodes} Resulting nodes.
         */

    }, {
        key: 'recurseDown',
        value: function recurseDown() {
            return map$1(this, 'recurseDown', arguments);
        }

        /**
         * Reloads/re-executes the original data loader.
         *
         * @category Tree
         * @return {Promise} Load method promise.
         */

    }, {
        key: 'reload',
        value: function reload() {
            this.removeAll();

            return this.load(this.opts.data || this.config.data);
        }

        /**
         * Removes all nodes.
         *
         * @category Tree
         * @return {Tree} Tree instance.
         */

    }, {
        key: 'removeAll',
        value: function removeAll() {
            this.model = new TreeNodes(this);
            this.dom.applyChanges();

            return this;
        }

        /**
         * Query for all soft-removed nodes.
         *
         * @category Tree
         * @param {boolean} full Retain full hiearchy.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'removed',
        value: function removed() {
            return map$1(this, 'removed', arguments);
        }

        /**
         * Restore children in this collection.
         *
         * @category Tree
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'restore',
        value: function restore() {
            return map$1(this, 'restore', arguments);
        }

        /**
         * Restore all children (deeply) in this collection.
         *
         * @category Tree
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'restoreDeep',
        value: function restoreDeep() {
            return map$1(this, 'restoreDeep', arguments);
        }

        /**
         * Search nodes, showing only those that match and the necessary hierarchy.
         *
         * @category Tree
         * @param {*} query Search string, RegExp, or function.
         * @return {TreeNodes} Array of matching node objects.
         */

    }, {
        key: 'search',
        value: function search(query) {
            var tree = this;
            var matches = new TreeNodes(this);

            var custom = tree.config.search;
            if (_$1.isFunction(custom)) {
                return custom(query, function resolver(nodes) {
                    tree.dom.batch();

                    tree.hideDeep();
                    _$1.each(nodes, function (node) {
                        tree.addNode(node);
                    });

                    tree.dom.end();
                }, function rejecter(err) {
                    tree.emit('tree.loaderror', err);
                });
            }

            // Don't search if query empty
            if (!query || _$1.isString(query) && _$1.isEmpty(query)) {
                return tree.clearSearch();
            }

            if (_$1.isString(query)) {
                query = new RegExp(query, 'i');
            }

            var predicate;
            if (_$1.isRegExp(query)) {
                predicate = function predicate(node) {
                    return query.test(node.text);
                };
            } else {
                predicate = query;
            }

            tree.dom.batch();

            tree.model.recurseDown(function (node) {
                if (!node.removed()) {
                    var match = predicate(node);
                    var wasHidden = node.hidden();
                    node.state('hidden', !match);

                    // If hidden state will change
                    if (wasHidden !== node.hidden()) {
                        node.markDirty();
                    }

                    if (match) {
                        matches.push(node);
                        node.expandParents();
                    }
                }
            });

            tree.dom.end();

            return matches;
        }

        /**
         * Select children in this collection.
         *
         * @category Tree
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'select',
        value: function select() {
            return map$1(this, 'select', arguments);
        }

        /**
         * Query for all selectable nodes.
         *
         * @category Tree
         * @param {boolean} full Retain full hiearchy.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'selectable',
        value: function selectable() {
            return map$1(this, 'selectable', arguments);
        }

        /**
         * Select all nodes between a start and end node.
         * Starting node must have a higher index path so we can work down to endNode.
         *
         * @category Tree
         * @param {TreeNode} startNode Starting node
         * @param {TreeNode} endNode Ending node
         * @return {Tree} Tree instance.
         */

    }, {
        key: 'selectBetween',
        value: function selectBetween(startNode, endNode) {
            this.dom.batch();

            var node = startNode.nextVisibleNode();
            while (node) {
                if (node.id === endNode.id) {
                    break;
                }

                node.select();

                node = node.nextVisibleNode();
            }

            this.dom.end();

            return this;
        }
    }, {
        key: 'selectDeep',


        /**
         * Select all children (deeply) in this collection.
         *
         * @category Tree
         * @return {TreeNodes} Array of node objects.
         */
        value: function selectDeep() {
            return map$1(this, 'selectDeep', arguments);
        }

        /**
         * Query for all selected nodes.
         *
         * @category Tree
         * @param {boolean} full Retain full hiearchy.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'selected',
        value: function selected() {
            return map$1(this, 'selected', arguments);
        }

        /**
         * Select the first available node at the root level.
         *
         * @category Tree
         * @return {TreeNode} Selected node object.
         */

    }, {
        key: 'selectFirstAvailableNode',
        value: function selectFirstAvailableNode() {
            var node = this.model.filter('available').get(0);
            if (node) {
                node.select();
            }

            return node;
        }
    }, {
        key: 'show',


        /**
         * Show children in this collection.
         *
         * @category Tree
         * @return {TreeNodes} Array of node objects.
         */
        value: function show() {
            return map$1(this, 'show', arguments);
        }

        /**
         * Show all children (deeply) in this collection.
         *
         * @category Tree
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'showDeep',
        value: function showDeep() {
            return map$1(this, 'showDeep', arguments);
        }

        /**
         * Soft-remove children in this collection.
         *
         * @category Tree
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'softRemove',
        value: function softRemove() {
            return map$1(this, 'softRemove', arguments);
        }

        /**
         * Sorts all TreeNode objects in this collection.
         *
         * If no custom sorter given, the configured "sort" value will be used.
         *
         * @category Tree
         * @param {string|function} sorter Sort function or property name.
         * @return {TreeNodes} Array of node obejcts.
         */

    }, {
        key: 'sort',
        value: function sort() {
            return map$1(this, 'sort', arguments);
        }

        /**
         * Set state values for nodes in this collection.
         *
         * @category Tree
         * @param {string} name Property name.
         * @param {boolean} newVal New value, if setting.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'state',
        value: function state() {
            return map$1(this, 'state', arguments);
        }

        /**
         * Set state values for nodes in this collection.
         *
         * @category Tree
         * @param {string} name Property name.
         * @param {boolean} newVal New value, if setting.
         * @return {TreeNodes} Array of node objects.
         */

    }, {
        key: 'stateDeep',
        value: function stateDeep() {
            return map$1(this, 'stateDeep', arguments);
        }

        /**
         * Returns a native Array of nodes.
         *
         * @category Tree
         * @return {array} Array of node objects.
         */

    }, {
        key: 'toArray',
        value: function toArray() {
            return map$1(this, 'toArray', arguments);
        }

        /**
         * Resume events.
         *
         * @category Tree
         * @param {array} events Events to unmute.
         * @return {Tree} Tree instance.
         */

    }, {
        key: 'unmute',
        value: function unmute(events) {
            // Diff array and set to false if we're now empty
            if (_$1.isString(events) || _$1.isArray(events)) {
                this._muted = _$1.difference(this._muted, _$1.castArray(events));
                if (!this._muted.length) {
                    this._muted = false;
                }
            } else {
                this._muted = false;
            }

            return this;
        }
    }, {
        key: 'visible',


        /**
         * Query for all visible nodes.
         *
         * @category Tree
         * @param {boolean} full Retain full hiearchy.
         * @return {TreeNodes} Array of node objects.
         */
        value: function visible() {
            return map$1(this, 'visible', arguments);
        }
    }]);
    return InspireTree;
}(EventEmitter2);

return InspireTree;

})));
