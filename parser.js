var feed = require("feed-read");
var river_level = "";
var request = require("request");

// var node_read = require('node-read');




function parse(content){
    var height = substr(content, "Latest Observation: ", ' ')
    var volume = substr(content, "Latest Observation (Secondary): ", ' ')
    return ["The little falls gauge reads "+height+" feet", height]
}


function substr(content, key, sep){
    var start1 = content.indexOf(key)
    var start2 = start1 + key.length
    var end = content.substring(start2).indexOf(sep)+start2
    return content.substring(start2, end)
}

function change(a, b, thresh){
    if (Math.abs(a-b)<=thresh){
        return 0
    }
    else if (a-b >= thresh){
        return -1
    }
    else{
        return 1
    }
}

function change_to_text(change){
    if (change == 0) return "will remain steady at";
    else if (change == -1) return "will drop to";
    else return "will rise to"
}

function track_change(current, near, near_time, far, far_time){
    var changes = [change(current, near, 0.005), change(near,far,0.005)]
    if (changes[0] == changes[1] && changes[0] == 0){
        return " The level will remain steady in the near future. "+
        "It will be " + near + "ft on " + near_time +
        ". And will be at " + far + "ft on " + far_time+"."
    }
    else{
        return " The level " + change_to_text(changes[0]) + " " + near +" feet on "+
        near_time + " and " + change_to_text(changes[1]) + " " + far + " feet on " + far_time+'.'
    }
}

function parse_future(content, current){
    var near = substr(content, "Recent Projected Forecast Available: ", " ")
    var near_time = substr(content, "Recent Projected Forecast Time: ", ",")
    var far = substr(content, "Last Projected Forecast Available: ", " ")
    var far_time = substr(content, "Last Projected Forecast Time: ", ",")
    return track_change(parseFloat(current), parseFloat(near), near_time, parseFloat(far), far_time)
}

function temp_test(){
    console.log(1)
    // node_read('https://waterdata.usgs.gov/nwis/uv/?site_no=01646500', function(err, article, res) {
    //     x = 0
    //     for(i = 0; i < 2; i++){//while (article.html.substring(old_x).indexOf("Most recent instantaneous value") > 0){
    //       x = article.html.indexOf("Most recent instantaneous value: ", x) + "Most recent instantaneous value: ".length
    //       end = article.html.indexOf(" ", x)
    //       temp = article.html.substring(x, end)
    //       console.log(temp*(9/5)+32)
    //     }
    // });

    request({
      uri: "https://waterdata.usgs.gov/nwis/uv?cb_00010=on&format=rdb&site_no=01646500&period=0",
    }, function(error, response, body) {
      var re = /USGS\t\d*\t[\d -:]*\tEST\t\d+\.\d+\tP\t\d+\.\d+\tP/gi
      var matches = body.match(re)
      var last_row = matches[matches.length-1]
      var temp = last_row.match(/\d+\.\d/)
    });
}
/* GET home page. */
function get_output_old() {
    feed('https://water.weather.gov/ahps2/rss/obs/brkm2.rss', function(err, articles) {
        if (err) console.log(err);
        var current_conditions = parse(articles[0].content)
        console.log(current_conditions)
        feed('http://water.weather.gov/ahps2/rss/fcst/brkm2.rss', function(err, articles) {
            if (err) console.log(err);
            var future = parse_future(articles[0].content, current_conditions[1]);
            console.log("Start")
            request({
              uri: "https://waterdata.usgs.gov/nwis/uv?cb_00010=on&format=rdb&site_no=01646500&period=0",
            }, function(error, response, body) {
                var re = /USGS\t\d*\t[\d -:]*\tEST\t\d+\.\d+\tP\t\d+\.\d+\tP/gi
                var matches = body.match(re)
                var last_row = matches[matches.length-1]
                var temp = last_row.match(/\d+\.\d/)
                var f_temp = parseFloat(temp)*9/5+32
                var river_level =  " and " + f_temp.toFixed() + " degrees fahrenheit." + future;
                console.log(river_level)
            });
        });
    });
}

function parse_current(body){
    var re = /USGS\t\d*\t[\d -:]*\tEST(\t\d+\.\d+\tP){4}/gi
    var matches = body.match(re)
    var last_row = matches[matches.length-1]
    all_values = last_row.match(/\d+\.\d/gi)
    var guage = all_values[0]
    var middle_temp = all_values[1]
    var bottom_temp = all_values[2]
    var top_temp = all_values[3]
    return [guage, top_temp]

}

function get_output() {
        request({
            uri: "https://nwis.waterdata.usgs.gov/nwis/uv?cb_00010=on&cb_00065=on&format=rdb&site_no=01646500&period=0",
        }, function(error, response, body) {

            parsed = parse_current(body)
            var f_temp = parseFloat(parsed[1])*9/5+32
            var curr_level = parsed[0]
            feed('http://water.weather.gov/ahps2/rss/fcst/brkm2.rss', function(err, articles) {
                if (err) console.log(err);
                var future = parse_future(articles[0].content, curr_level);
                var river_level =  "The little falls guage reads " +curr_level + " feet at " 
                                + f_temp.toFixed() + " degrees fahrenheit." + future;
                console.log(river_level)
            });
        });
}

// temp_test()
get_output()