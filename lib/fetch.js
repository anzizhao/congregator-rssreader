var debug = require('debug')('rssreader:fetch');
var colors = require('colors');
var util = require('util');
var async = require('async');
var request = require('request');
var FeedParser = require('feedparser')

var iconv = require('iconv-lite');
var helpers = require('./helpers');



function getList(opt, callback){
    var requestOptions = {
        url: opt.url,
        encoding: null,
        headers: {
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36',
            'accept': 'text/html,application/xhtml+xml'
        },
        timeout: this.timeout ||  10000,
        pool: false
    };
    request(requestOptions, function (error, response, body){
        if(!error && response.statusCode == 200){
            var streamCounter = 0; // keep count of streams
            var data = []; // hold data (posts)

            var feedparser = new FeedParser(); // create a feed parser (rss)
            // handle incoming stream
            feedparser.on('readable', function () {
                var stream = this;
                var item;

                // iterate through each post (here is where we pool all posts for processing)
                while (item = stream.read()) {
                    data.push(item);
                }
            });

            feedparser.on('error', function (err) {
                debug('error with - ' + opt.name);
                debug(util.inspect(err));
                callback(null, []);
            });

            // handle 'end' event for stream
            feedparser.on('end', function () {
                callback(null, data);
            }.bind(this));

            // convert to UTF-8 encoding if the response isn't already
            var charset = opt.charsetOverride || helpers.getParams(response.headers['content-type'] || '').charset;
            charset = charset || 'iso-8859-1'; // if no charset header, assume iso-8859-1
            var charSetIsNotUtf = !/utf-*8/i.test(charset); // check if charset is different from UTF-8

            if (charSetIsNotUtf && iconv.encodingExists(charset)) {
                debug('<- charset is not utf-8, converting ->');
                var temp = iconv.decode(body, charset);
                body = iconv.encode(temp, 'utf-8');
            }

            feedparser.write(body); // write body to feedparser
            feedparser.end(); // end stream
        }
        else if (error) {
            callback(error);
        }
        else {
            debug('error - status: ' + response.statusCode);
            callback('could not fetch opt');
        }
    });
}
function handleList(opt,  _entries, callback) {
    var fetchUrl = this.imageServer;

    async.waterfall([
        function(callback) {
            var ranking = 0; // rank the articles by position in feed
            var formattedPosts = []; // formatted posts holder
            async.eachSeries( _entries, function (post, callback) {
                var formattedPost = this.handler(post, opt, ++ranking);
                if (formattedPost) formattedPosts.push(formattedPost);
                callback();
            }.bind(this), function (err) {
                callback(err, formattedPosts);
            });

        }.bind(this),
        function(entries, callback) {
            //转化出来的entries 
            //wired 网站做图片缓存处理
            async.map( entries, function(entry, callback){
                switch( entry.site ) {
                    case 'Wired': 
                        break;
                    case 'ArsTechnica': 
                        break;
                    case 'Smashing Magazine': 
                        break;
                    default: 
                        return callback(null, entry);
                }
                var requestData = {
                    url: entry.image,
                    category:  entry.site.replace(/\s/g, ""),
                    options: {
                        webp: true, 
                    }
                };
                request({
                    url: fetchUrl,
                    method: "POST",
                    json: true,
                    headers: {
                        "content-type": "application/json",
                    },
                    body: JSON.stringify(requestData)
                }, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        entry.imageB = body.data.url
                        console.dir( entry )
                    }
                    callback(null, entry)
                }); 

            }, function(err, _entries ){
                callback(err, _entries) 
            }) 
        }
    ], function(err, result){
        callback(err, result ) 
    })

}


exports = module.exports =  {
    getList: getList,
    handleList: handleList,
};
