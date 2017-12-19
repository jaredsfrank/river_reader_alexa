/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills
 * nodejs skill development kit.
 * This sample supports multiple lauguages. (en-US, en-GB, de-DE).
 * The Intent Schema, Custom Slots and Sample Utterances for this skill, as well
 * as testing instructions are located at https://github.com/alexa/skill-sample-nodejs-fact
 **/

'use strict';
const Alexa = require('alexa-sdk');
var feed = require("feed-read");
var request = require("request");

//=========================================================================================================================================
//TODO: The items below this comment need your attention.
//=========================================================================================================================================

//Replace with your app ID (OPTIONAL).  You can find this value at the top of your skill's page on http://developer.amazon.com.
//Make sure to enclose your value in quotes, like this: const APP_ID = 'amzn1.ask.skill.bb4045e6-b3e8-4133-b650-72923c5980f1';
const APP_ID = undefined;

const SKILL_NAME = 'River Level';
const HELP_REPROMPT = 'What can I help you with?';
const STOP_MESSAGE = 'Goodbye!';
var river_level = "River Level";


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

function parse_current(body){
    var re = /USGS\t\d*\t[\d -:]*\tEST(\t\d+\.\d+\tP){4}/gi;
    var matches = body.match(re);
    var last_row = matches[matches.length-1];
    var all_values = last_row.match(/\d+\.\d/gi);
    var guage = all_values[0];
    var middle_temp = all_values[1];
    var bottom_temp = all_values[2];
    var top_temp = all_values[3];
    return [guage, top_temp];
}


exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

const handlers = {
    'LaunchRequest': function () {
        this.emit('RiverLevel');
    },
    'RiverLevel': function () {
        var that = this;
        request({
            uri: "https://nwis.waterdata.usgs.gov/nwis/uv?cb_00010=on&cb_00065=on&format=rdb&site_no=01646500&period=0",
        }, function(error, response, body) {
            var parsed = parse_current(body);
            var f_temp = parseFloat(parsed[1])*9/5+32;
            var curr_level = parsed[0];
            feed('http://water.weather.gov/ahps2/rss/fcst/brkm2.rss', function(err, articles) {
                if (err) console.log(err);
                var future = parse_future(articles[0].content, curr_level);
                const speechOutput =  "The little falls guage reads " +curr_level + " feet at " 
                                + f_temp.toFixed() + " degrees fahrenheit." + future;
                that.response.cardRenderer(SKILL_NAME, speechOutput);
                that.response.speak(speechOutput);
                that.emit(':responseReady');
            });
        });
    },
    'AMAZON.HelpIntent': function () {
        const speechOutput = HELP_REPROMPT;
        const reprompt = HELP_REPROMPT;

        this.response.speak(speechOutput).listen(reprompt);
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function () {
        this.response.speak(STOP_MESSAGE);
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () {
        this.response.speak(STOP_MESSAGE);
        this.emit(':responseReady');
    },
};