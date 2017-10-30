/**
 * Created by zonebond on 2017/5/9.
 */
import co from './co-generator'
/**
 * hooks
 * 1. will-request,
 * 2. request,
 * 3. response,
 * 4. responseError
 */

// Wrapped primitive XMLHttpRequest
function request(url) {
  return new Promise((resolve, reject) => {
    const xhr              = new XMLHttpRequest();
    xhr.__$fake_request$__ = true;
    xhr.open('GET', url);

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        resolve(xhr);
      }
    };

    xhr.onerror = (err) => {
      reject(err);
    };

    xhr.send();
  });
}

const XHR           = XMLHttpRequest.prototype;
const RAW           = name => `__watched_${name}_`;
const interceptions = {request: [], response: [], error: []};
const Interceptor   = {hook: null, interceptions: interceptions};

if (XHR && !XHR.fakeWatching) {

  XHR.fakeWatching             = true;
  XHR[RAW('open')]             = XHR.open;
  XHR[RAW('send')]             = XHR.send;
  XHR[RAW('setRequestHeader')] = XHR.setRequestHeader;

  XHR[RAW('status')]       = Object.getOwnPropertyDescriptor(XHR, 'status');
  XHR[RAW('readyState')]   = Object.getOwnPropertyDescriptor(XHR, 'readyState');
  XHR[RAW('responseURL')]  = Object.getOwnPropertyDescriptor(XHR, 'responseURL');
  XHR[RAW('response')]     = Object.getOwnPropertyDescriptor(XHR, 'response');
  XHR[RAW('responseText')] = Object.getOwnPropertyDescriptor(XHR, 'responseText');

  const originalFunc = () => '??originalFunc??';

  const status       = XHR[RAW('status')] ? XHR[RAW('status')].get : originalFunc;
  const readyState   = XHR[RAW('readyState')] ? XHR[RAW('readyState')].get : originalFunc;
  const responseURL  = XHR[RAW('responseURL')] ? XHR[RAW('responseURL')].get : originalFunc;
  const response     = XHR[RAW('response')] ? XHR[RAW('response')].get : originalFunc;
  const responseText = XHR[RAW('responseText')] ? XHR[RAW('responseText')].get : originalFunc;

  // [hack] url
  Object.defineProperty(XHR, 'url', {
    get: function () {
      return this.__url__;
    },
  });
  Object.defineProperty(XHR, 'method', {
    get: function () {
      return this.__method__;
    },
  });

  // [wrapper] open
  XHR.open = function () {
    this.__method__ = arguments[0];
    this.__url__    = arguments[1];

    this[RAW('open')](...arguments);
  };

  XHR.__watch_hooks__ = function () {

    let which = this;

    const rse_handle = this[RAW('on_ready_state_change')] = which.onreadystatechange;
    const load_handle = this[RAW('on_load')] = which.onload;
    const error_handle = this[RAW('on_error')] = which.onerror;

    // const scheme =  FakeBackend.match(which.url);
    const scheme = typeof Interceptor.hook === 'function' ? Interceptor.hook(which.url) : null;

    const next_process = () =>{
    	if (scheme && which.status === 404) {
          which.onerror();
          which.abort();
        } else {
          rse_handle();
        }
    }

    if (which.onreadystatechange) {
      which.onreadystatechange = () => {
        // Interceptor response
        if (which.readyState === 3) {
          const co_impact = handleInterceptor(which, interceptions.response, 'response');
          if(co_impact){
            co_impact.then(next_process);
          }
        }
        
        // last process
        if (which.readyState === 4) {
          next_process();
        }
      }
    }

    if (which.onload) {
      which.onload = evt => {
        // console.debug('onload >>>');
        load_handle(evt);
      }
    }

    if (which.onerror) {
      which.onerror = evt => {
        // console.debug('on_error >>>');
        if (scheme && !which.schemed) {
          which.schemed = true;
          if (typeof scheme === 'string') {
            console.debug(' FakeBacked Scheme  乀(ˉεˉ乀) \n', this.url, '~>', scheme, '');

            request(scheme).then(xhr => {

              which.__$proxy_status$__        = xhr.status;
              which.__$proxy_ready_state$__   = xhr.readyState;
              which.__$proxy_response_URL$__  = xhr.responseURL;
              which.__$proxy_response$__      = xhr.response;
              which.__$proxy_response_Text$__ = xhr.responseText;
              try {
                which.data = JSON.parse(xhr.responseText || xhr.response);
              } catch (ex) {
                which.data = xhr.responseText || xhr.response;
              }

              rse_handle && rse_handle();
              load_handle && load_handle({target: which});
            })
          }

          if (typeof scheme === 'function') {
            console.debug(' FakeBacked Scheme  乀(ˉεˉ乀) \n', this.url, '~>', 'Function Worker');

            const pm = new Promise((resolve, reject) => {
              scheme(which, resolve, reject);
            });

            pm.then(response => {

              which.__$proxy_status$__        = 200;
              which.__$proxy_ready_state$__   = 4;
              which.__$proxy_response$__      = response;
              which.__$proxy_response_Text$__ = response;
              try {
                which.data = JSON.parse(response);
              } catch (ex) {
                which.data = response;
              }

              rse_handle && rse_handle();
              load_handle && load_handle({target: which});
            }).catch(error => {
              error_handle(error);
            });
          }
        } else {
          error_handle();
        }
      }
    }
  };

  function handleInterceptor(ctx, handles, phase) {
  	const is_impact_phase = `__$_is_impact_${phase}_$__`;

  	if(ctx[is_impact_phase])
  		return null;

  	ctx[is_impact_phase] = true;

    return co(function*(ctx) {
      const length = Array.isArray(handles) ? handles.length : 0;
      if (length) {
        let idx = 0;
        while (idx < length) {
          yield* handles[idx](ctx);
          idx++;
        }
      }
    }, ctx);
  }

  // [wrapper] send
  XHR.send = function (data) {
    const which   = this;
    which.payload = data;

    handleInterceptor(which, interceptions.request, 'request').then(done => {
      if (!which.__$fake_request$__) {
        which.__watch_hooks__.call(which);
      }
      which[RAW('send')](which.payload);
    });
  };

  XHR.setRequestHeader = function (header, value) {
    if (!this.__$proxy_request_header$__) {
      this.__$proxy_request_header$__ = {}
    }
    this.__$proxy_request_header$__[header] = value;
    this[RAW('setRequestHeader')](header, value)
  };

  XHR.getRequestHeader = function () {
    return this.__$proxy_request_header$__;
  };

  // [wrapper] addEventListener
  XHR.addEventListener = function (type, listener, useCapture) {
    console.debug('watching listener', type);
  };

  // setter getter function proxy
  Object.defineProperty(XHR, 'status', {
    ...XHR[RAW('status')], get: function () {
      return this.__$proxy_status$__ ? this.__$proxy_status$__ : status.call(this);
    },
  });
  Object.defineProperty(XHR, 'readyState', {
    ...XHR[RAW('readyState')], get: function () {
      return this.__$proxy_ready_state$__ ? this.__$proxy_ready_state$__ : readyState.call(this);
    },
  });
  Object.defineProperty(XHR, 'responseURL', {
    ...XHR[RAW('responseURL')], get: function () {
      return this.__$proxy_response_URL$__ ? this.__$proxy_response_URL$__ : responseURL.call(this);
    },
  });
  Object.defineProperty(XHR, 'response', {
    ...XHR[RAW('response')], get: function () {
      return this.__$proxy_response$__ ? this.__$proxy_response$__ : response.call(this);
    },
  });
  Object.defineProperty(XHR, 'responseText', {
    ...XHR[RAW('responseText')], get: function () {
      return this.__$proxy_response_Text$__ ? this.__$proxy_response_Text$__ : responseText.call(this);
    },
  });

  process.env.NODE_ENV === 'development' && console.debug(' FakeHttp Backend Working... ~(￣▽￣)~(￣▽￣)~ Yoooeah!');
}

export default Interceptor;
