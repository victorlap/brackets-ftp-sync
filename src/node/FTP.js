/*
 * Copyright (c) 2014 Tim Burgess. All rights reserved.
 *  
 * @author Tim Burgess <info@tim-burgess.com>
 * @license Tim Burgess 2014
 */
/*jslint debug:true, vars: true, plusplus: true, devel: true, nomen: true, indent: 2,
maxerr: 50, node: true, white: true */

var fs = require('fs');

function FTP(domainManager) {

  this.JSFtp = require('jsftp');
  this._domainManager = domainManager;
}


FTP.prototype.connect = function(opts, cb) {
  var self = this;
  this.ftp = new this.JSFtp(opts);
  this.ftp.auth(opts.user, opts.pwd, function(err, data) {
    if (err) {
      self._domainManager.emitEvent('ftpsync', 'error', err.toString());
      console.log('Failed to connect to remote: ' + err);
      return cb(false);
    }
    self._domainManager.emitEvent('ftpsync', 'connected', data.text);
    console.log('Connected ' + data.text);
    cb(true);
  });
};  
  

FTP.prototype.disconnect = function() {
  this.ftp.raw.quit(function(err, data) {
    console.log('quit:' + data.text);
  });
};

FTP.prototype.stat = function(remotePath, cb) {
  // stat whether path exists or not
  this.ftp.raw.stat(remotePath, function(err, data) {
    if (err) return cb(err);
    // if more than two lines exist, dir is present
    if (data.text.split(/\r\n|\r|\n/).length > 2) return cb(true);
    cb(false);
  });
};

FTP.prototype.exists = function(localPath, remotePath, cb) {
  // stat whether same size file exists or not
  this.ftp.ls(remotePath, function(err, data) {
    if (err) return cb(err);
    // irrespective of FTP 200 code, data gives us file info
    if (data.length === 0) return cb(false)

    // return filesize whether filesize the same
    var size = fs.statSync(localPath).size;
    if (size === parseInt(data[0].size, 10)) return cb(true);
    cb(false);
  });
};

FTP.prototype.put = function(localPath, remotePath, cb) {
  this.ftp.put(localPath, remotePath, function(err) {
    cb(err);
  });
};

FTP.prototype.mkdir = function(remotePath, cb) {
  this.ftp.raw.mkd(remotePath, function(err) {
    if (err) {
      if (err.code === 550) { // dir already exists
        return cb(undefined, true);
      }
      return cb(err);
    }
    // directory created
    cb(undefined, false);
  });
};

module.exports = FTP;
  
