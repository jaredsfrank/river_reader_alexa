var feed = require("feed-read");
var river_level = "";


function parse(content){
    var height = substr(content, "Latest Observation: ", ' ')
    var volume = substr(content, "Latest Observation (Secondary): ", ' ')
    return ["The little falls gauge reads "+height+" feet.", height]
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
    var changes = [change(current, near, 0.05), change(near,far,0.05)]
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

/* GET home page. */
function get_output() {
    feed('https://water.weather.gov/ahps2/rss/obs/brkm2.rss', function(err, articles) {
        if (err) console.log(err);
        var current_conditions = parse(articles[0].content)
        feed('http://water.weather.gov/ahps2/rss/fcst/brkm2.rss', function(err, articles) {
            if (err) console.log(err);
            var future = parse_future(articles[0].content, current_conditions[1]);
            console.log(current_conditions+future);
            river_level = current_conditions[0]+future;
        });
    });
}

console.log(get_output())
console.log("Here" + river_level)