var util = require('util');
var Q = require('q');
var mout = require('mout');
var Resolver = require('./Resolver');
var createError = require('../../util/createError');
var cmd = require('../../util/cmd');

var FOLDER_MAP = {
	tag: 'tags',
	branch: 'branches',
	trunk: 'trunk'
};

function SvnResolver(decEndpoint, config, logger) {
	Resolver.call(this, decEndpoint, config, logger);
}

util.inherits(SvnResolver, Resolver);
mout.object.mixIn(SvnResolver, Resolver);

SvnResolver.prototype._resolve = function () {
	var resolver = this;

	return this._findResolution(this._target).then(function () {
		return resolver._export();
	});
};

SvnResolver.prototype._export = function () {
	var export_folder = [this._source];

	export_folder.push(FOLDER_MAP[this._resolution.type]);

	if (this._resolution.target !== 'trunk'){
		export_folder.push(this._resolution.target);
	}

	this._logger.action('export', this._resolution.target, {
			resolution: this._resolution,
			to: this._tempDir
		}
	);

	return cmd('svn', ['export', export_folder.join('/'), this._tempDir, '--force']);
};

SvnResolver.prototype.getRefs = function (type, source) {
	return cmd('svn', ['ls', source + '/' + FOLDER_MAP[type]])
		.then(function (stdout) {
			var refs;

			stdout = stdout.toString();
			refs = stdout.trim()
				.replace(/\//g, '')
				.split(/[\r\n]+/);


			return refs;
		}).fail(function () {
			return [];
		});
};

SvnResolver.prototype.getTags = function (source) {
	return this.getRefs('tag', source);
};

SvnResolver.prototype.getBranches = function (source) {
	return this.getRefs('branch', source);
};

SvnResolver.prototype._findResolution = function (target) {
	var resolver = this;

	if (target === 'trunk') {
		return Q.fcall(function() {
			resolver._resolution = {type: 'trunk', target: 'trunk'};
		});
	}

	return Q.all([
		this.getTags(this._source),
		this.getBranches(this._source)
	]).spread(function (tags, branches) {
		if (tags.indexOf(target) > -1) {
			resolver._resolution = {type: 'tag', target: target};
		}
		if (branches.indexOf(target) > -1) {
			resolver._resolution = {type: 'branch', target: target};
		}

		if (!resolver._resolution) {
			throw createError('No tag found that was able to satisfy ' + target, 'ENORESTARGET', {
				details: 'No versions found'
			});
		}
	});
};

module.exports = SvnResolver;