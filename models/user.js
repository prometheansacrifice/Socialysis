var empathy = require('../modules/empathy');
var FB = require('fb');
var wordcloud = require('../modules/wordcloud');

exports.id = '';
exports.login = function (req, res) {
    req.session.fbid = req.body.id;
    req.session.accessToken = req.body.accessToken;
    req.session.loggedIn = true;
    res.send(200);
};

exports.getInfo = function (req, res) {
    if(!req.session.loggedIn) {
        res.send(400);
    } else {
        FB.setAccessToken(req.session.accessToken);
        FB.api('/me', function (fbres) {
            if(!fbres || fbres.error) {
                console.log('trapped');
                console.log(!fbres ? 'error occurred' : fbres.error);
                return;
            }
            var name = fbres.name;
            
            /* Getting profile pic */
            function fbProfilePicCallback (fbres) {
                if(!fbres || fbres.error) {
                    console.log(!fbres ? 'error occurred' : fbres.error);
                    return;
                }
                res.json({
                    name: name,
                    dp: fbres.data.url
                });
            }
            var graphQuery = '/' + req.session.fbid +
                    '/picture?redirect=0&height=400&type=normal&width';
            FB.api(graphQuery, fbProfilePicCallback);
        });
    }
};

exports.logout = function (req, res) {
    req.session.fbid = '';
    req.session.accessToken = '';
    req.session.loggedIn = false;
    res.redirect('/');
};

exports.checkLogin = function (req, res) {
    if(req.session.loggedIn) {
        res.send(200);
    } else {
        res.send(400);
    }
};

exports.getWordCloudData = function(req, res) {

    if(req.session.loggedIn === true) {

        FB.setAccessToken( req.session.accessToken);
        FB.api('me/friends', function (fbres) {
            if(!fbres || fbres.error) {
                console.log(!fbres ? 'error occurred' : fbres.error);
                return;
            }
            var ids = [];
            for(var i = 0; i < fbres.data.length && i < 50; ++i) {
                ids.push(fbres.data[i].id);
            }
            var posts = [], temp = [];
            var count = 0;
            var async = require("async");
            console.log('Fetching...');
            function iterator (id, cb){

                FB.api(id + '/statuses', function (fbres) {
                    if(!fbres || fbres.error) {
                        console.log(!fbres ? 'error occurred' : fbres.error);
                        return;
                    }
                    for(var j in fbres.data) {
                        temp.push(fbres.data[j].message);
                        count++;
                    }
                    cb();
                });
            }
            function createJSON(err) {
                var text = temp.join(' ');
                wordcloud.createJSON(text);
            }
            async.each(ids, iterator, createJSON);
        });
        res.json({data: 666, msg: 'The number of the beast'});
    } else {
        res.send(400);
    }
};

// exports.fetchLastUpdate = function () {
//     FB.api('/me/statuses', function (fbres) {
//         if(!fbres || fbres.error) {
//             console.log(!fbres ? 'error occurred' : fbres.error);
//             return {message: 'Error occured while fetching last status'};
//         }

//         return {message: fbres.data[0].message};
//     });
// };

exports.fetchLastActivity = function (req, res) {
    FB.api('/me/posts', function (fbres) {
        if(!fbres || fbres.error) {
            console.log(!fbres ? 'error occurred' : fbres.error);
            res.send(400);
            return;
        }

        var str =  fbres.data[0].story;

        if(str) {
            res.send({message: str});
        } else {
            res.send({message: fbres.data[0].message});
        }
    });
};


exports.empathy = function (req, res) {

    FB.api('/me/statuses', function (fbres) {
        if(!fbres || fbres.error) {
            console.log(!fbres ? 'error occurred' : fbres.error);
            res.send ({message: 'Error occured while fetching last status'});
        }

        var status = fbres.data[0].message,
            obj = empathy.suggestSong(status);
        res.send({status: status, song: obj.song, emotion: obj.emotion});
    });
};
