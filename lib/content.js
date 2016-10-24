var read = require('node-read');
var async = require('async');
var debug = require('debug')('rssreader:content-fetcher');
var util = require('util');
var Entities = require('html-entities').AllHtmlEntities;
var entities = new Entities();
var helpers = require('./helpers');
var url = require('url');


function getContent(opt, item, callback) {
    var url = item[opt.linkref];
    callback(null, url);
}

exports = module.exports =  {
    getContent: getContent
};

