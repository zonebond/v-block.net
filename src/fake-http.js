/**
 * Created by zonebond on 2017/4/10.
 */
import Interceptor from './xhr-interceptor'

/* eslint no-useless-escape: 0*/

const holders_exp = /\/(?!:http|https)*:[A-Za-z0-9\._-]+/g;

const NotNoop = prop => prop !== undefined && prop !== null && prop !== '' && prop !== 'null' && prop !== 'undefined' && prop.trim() !== '';

const role_exp_star_str = /[\w@$%^&*(|)+-]+/.source;
const role_exp_plus_str = /[^?]+/.source;

let _stopped_ = false;

class FakeHttpBackend {
  _mapping_ = {};

  /**
   * @param exp : api url
   * @param cb : matching rule
   * @returns {void|XML|string|*}
   */
  scheme(exp, cb) {
  	if(_stopped_){
      return exp;
    }

    exp = exp.replace('?', '\\?');
    let role_exp_cc;
    for (let regular in cb) {
      let role_exp;
      if (NotNoop(regular)) {
        const roles = regular.split(',');
        let role, holder, value;
        role_exp    = exp;
        while (roles.length) {
          role   = roles.shift().split(':');
          holder = role[0].trim().replace(/^@/, ':');
          value  = role[1].trim() || null;

          role_exp_cc = new RegExp(holder + '(?!\W\w)');

          if (value === '*') {
            role_exp = role_exp.replace(role_exp_cc, role_exp_star_str);
          } else if (value === '+') {
            role_exp = role_exp.replace(role_exp_cc, role_exp_plus_str);
          } else {
            role_exp = role_exp.replace(role_exp_cc, value);
          }
        }
        role_exp = role_exp.replace(holders_exp, '');
      } else {
        role_exp = exp.replace(holders_exp, '');
      }

      const reg_match = {
        reg_exp: new RegExp(role_exp + '($)'), cb: cb[regular],
      };

      this._mapping_[reg_match.reg_exp] = reg_match;
    }
    return exp;
  }

  match = function(exp) {
    if(_stopped_){
      return null;
    }
    const mapping = this._mapping_;
    const _exp_   = exp.replace(/\\/g, '');
    for (let rule in mapping) {
      if (mapping[rule].reg_exp.test(_exp_)) {
        return mapping[rule].cb;
      }
    }
    return null;
  }.bind(this);

  Shotdown() {
    _stopped_ = true;
  };

  /**
   * Options is consist of Object Map which have request | response | error mapping function handles;
   * @param options
   */
  interception(options) {
    Object.keys(options).forEach(option => {
      Interceptor.interceptions[option] && Interceptor.interceptions[option].push(options[option]);
    });
  }
}

const FakeBackend = new FakeHttpBackend();

Interceptor.hook = FakeBackend.match;

export default FakeBackend;
