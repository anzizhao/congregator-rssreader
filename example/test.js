var debug = require('debug')('rssreader:testapp');
var util = require('util');
var events = require('events');
var ipc = new events.EventEmitter();

function isActive (element) {
    return element.active;
}

var handleEntry = function (item, callback) {
    debug(util.inspect(item, { colors: true }));
    callback(null, item);
};

var getFeeds = function (options, callback) {
    var feeds = require('./template');
    callback(null, feeds.filter(isActive));
};

// rss reader/scraper module
var rssReader = require('../lib')({
    getSources: getFeeds,
    handleEntry: handleEntry,
    ipc: ipc,
    sockets: 15,
    waitTime: 10000
});

console.log('running rss-reader');

rssReader.run();