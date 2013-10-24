var util = require('util');
var path = require('path');
var Q = require('q');
var chmodr = require('chmodr');
var mkdirp = require('mkdirp');
var which = require('which');
var LRU = require('lru-cache');
var mout = require('mout');
var Resolver = require('./Resolver');
var semver = require('../../util/semver');
var createError = require('../../util/createError');
var defaultConfig = require('../../config');
var cmd = require('../../util/cmd');

function SvnResolver(decEndpoint, config, logger) {
	Resolver.call(this, decEndpoint, config, logger);
}

util.inherits(SvnResolver, Resolver);
mout.object.mixIn(SvnResolver, Resolver);

SvnResolver.prototype._resolve = function() {
	this._resolution = {
		tag: this._target,
		type: 'tag'
	};

	return this._export();
};

SvnResolver.prototype._export = function() {
	this._logger.action('export', this._resolution.tag, {
			resolution: this._resolution,
			to: this._tempDir
		}
	);

	return cmd('svn', ['export', this._source + '/tags/' + this._resolution.tag, this._tempDir, '--force']);
};

module.exports = SvnResolver;