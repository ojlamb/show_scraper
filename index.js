var fs = require('fs');
var queue = require('queue-async');
var childProcess = require('child_process');
var moment = require('moment');

var page = fs.readFileSync(__dirname + '/template.html', 'utf8');
var emailTemplate = fs.readFileSync(__dirname + '/email_template.html', 'utf8');

log('info', 'fetching sources')
fs.readdir(__dirname + '/sources', function(err, dirs) {
    var q = queue(10)
    dirs.forEach(function(dir) {
        var fn = require(__dirname + '/sources/' + dir)
        q.defer(fn)
    })
    q.awaitAll(function(errs, results) {
        var shows = []
        results.forEach(function(venue) {
            shows = shows.concat(venue)
        })

        log('info', 'found ' + shows.length + ' total shows')

        shows.sort(function(a, b) {
            if (a.date > b.date) return 1
            else return -1
        })

        var today = new Date()
        var year = today.getFullYear().toString()

        var month = (today.getMonth() + 1).toString()
		if (month.length === 1) month = '0' + month

        var day = today.getDate().toString()
        if (day.length === 1) day = '0' + day

		var oneWeek = moment(year + '-' + month + '-' + day).add(6, 'days').format('YYYY-MM-DD');
        var venueHash = {};
		var hashKey = {0:"tonight", 1: "one", 2: "two", 3: "three", 4: "four",5: "five",6: "six",7: "seven"}
		var i = 0;
        shows.forEach(function(show) {
            if (!venueHash[show.venue]) venueHash[show.venue] = {
                venue: show.venue,
                venueURL: show.venueURL,
                tonight: [],
				one: [],
				two: [],
				three: [],
				four: [],
				five: [],
				six: [],
				seven: []
            }

            if (show.date === year + '-' + month + '-' + day) {
                venueHash[show.venue].tonight.push(show)
            } else if (show.date == moment(year + '-' + month + '-' + day,'YYYY-MM-DD').add(1, 'days').format('YYYY-MM-DD')) {
				venueHash[show.venue].one.push(show)
			} else if (show.date == moment(year + '-' + month + '-' + day,'YYYY-MM-DD').add(2, 'days').format('YYYY-MM-DD')) {
				venueHash[show.venue].two.push(show)
			} else if (show.date == moment(year + '-' + month + '-' + day,'YYYY-MM-DD').add(3, 'days').format('YYYY-MM-DD')) {
				venueHash[show.venue].three.push(show)
			} else if (show.date == moment(year + '-' + month + '-' + day,'YYYY-MM-DD').add(4, 'days').format('YYYY-MM-DD')) {
				venueHash[show.venue].four.push(show)
			} else if (show.date == moment(year + '-' + month + '-' + day,'YYYY-MM-DD').add(5, 'days').format('YYYY-MM-DD')) {
				venueHash[show.venue].five.push(show)
			} else if (show.date == moment(year + '-' + month + '-' + day,'YYYY-MM-DD').add(6, 'days').format('YYYY-MM-DD')) {
				venueHash[show.venue].six.push(show)
			} else if (show.date == moment(year + '-' + month + '-' + day,'YYYY-MM-DD').add(7, 'days').format('YYYY-MM-DD')) {
				venueHash[show.venue].seven.push(show)
			}
        })
        venues = Object.keys(venueHash).map(function(key) {
            return venueHash[key]
        })

		var html = ''
		for(i = 0; i < 8; i++) {
			var night = hashKey[i];
			if (night == 'tonight') {
				html += '<div class="navhead">TONIGHT';
			    html += '<span class="date">' + moment().format('M/D') + '</span>';
				html += '</div>'
				html += '<div id="tonight">'
			} else {
				html +=  '<div class="navhead">' + moment().add(i, 'day').format('dddd');
				html += '<span class="date">' + moment().add(i, 'day').format('M/D') + '</span>';
				html += '</div>'
				html += '<div id="soon">'
			}

			venues.forEach(function(venue) {
				if (venue[night].length > 0) html += '<h3><a class="venue-link" target="_blank" href="' + venue.venueURL + '">' + venue.venue + '</a></h3>'
				venue[night].forEach(function(show, i) {
					if (i > 0) html += '<hr>'
					html += '<div class="show">'
					html += '<h4><a class="show-link" href="' + show.url + '" target="_blank">' + show.title + '</a></h4>'
					html += '<div class="info">' + show.time + '</div>'
					if (show.price) html += '<div class="info">' + show.price + '</div>'
					html += '</div>'
				})
			})
			html += '</div>'
		}
        page = page.split('{{content}}').join(html);
        fs.writeFileSync(__dirname + '/index.html', page);

        log('info', 'write mjml');
        var mjml = '';
        mjml += '<mj-column width="90%">'
		for(i = 0; i < 8; i++) {
			var night = hashKey[i];
			mjml += '<mj-spacer></mj-spacer>'
			if (night == 'tonight') {
				mjml += '<mj-text font-weight="bold" font-size="26" color="#01C4FF">Tonight</mj-text>';
			} else {
				mjml += '<mj-text font-weight="bold" font-size="26" color="#01C4FF">'+ moment().add(i, 'day').format('dddd') +'</mj-text>';
			}
			mjml +=  '<mj-divider border-color="#D0057A"></mj-divider>';
			venues.forEach(function(venue) {
				if (venue[night].length > 0) {
					mjml += '<mj-text font-size="24px" align="left" color="#000" font-weight="bold">' + venue.venue + '</mj-text>'
					mjml += '<mj-divider border-color="#01C4FF" border-width=".8px" width="97%"></mj-divider>';
				}
				venue[night].forEach(function(show, i) {
					var buttonText = 'Tickets'
					if(venue.venue == 'City Park Jazz'){
						buttonText = 'Info'
					}
					if (i > 0) mjml += '<mj-divider border-width=".8px" border-color="#01C4FF" width="97%" padding-bottom="2px"/>'
					mjml += '<mj-text font-size="20px" font-weight="500" padding-top="5px" padding-bottom="0px" color="#000">' + show.title + '</mj-text>'
					mjml += '<mj-text padding-bottom="0px" padding-top="0px">' + show.date.split('-')[1] + '/' + show.date.split('-')[2] + '/' + show.date.split('-')[0] + '</mj-text>'
					mjml += '<mj-text padding-top="0px">' + show.time + '</mj-text>'
					mjml += '<mj-text align="center" font-size="18" color="#D0057A" text-decoration="none" font-weight="700" padding-bottom="25px"><a style="text-decoration: none; color:#D0057A" href="' + show.url + '">'+buttonText+'</a></mj-text>'
				})
			})
		}
		mjml += '</mj-column>'

		//TODO get accordion working
		// log('info', 'write mjml');
        // var mjml = '';
        // mjml += '<mj-column width="100%">'
		// mjml += '<mj-text font-weight="bold" font-size="26" color="#01C4FF">Tonight</mj-text>';
	    // mjml +=  '<mj-divider border-color="#D0057A"></mj-divider>';
		// 	venues.forEach(function(venue) {
		// 		if (venue['tonight'].length > 0) {
		// 			mjml += '<mj-text font-size="20px" align="left" color="#000" font-weight="700">' + venue.venue + '</mj-text>'
		// 			mjml += '<mj-divider border-color="#01C4FF" border-width=".8px" width="97%"></mj-divider>';
		// 		}
		// 		venue[night].forEach(function(show, i) {
		// 			var buttonText = 'Tickets'
		// 			if(venue.venue == 'City Park Jazz'){
		// 				buttonText = 'Info'
		// 			}
		// 			if (i > 0) mjml += '<mj-divider border-width=".8px" border-color="#01C4FF" width="97%" padding-bottom="3px"/>'
		// 			mjml += '<mj-text font-size="20px" font-weight="500" padding-top="5px" padding-bottom="0px" color="#000">' + show.title + '</mj-text>'
		// 			mjml += '<mj-text padding-bottom="0px" padding-top="0px">' + show.date.split('-')[1] + '/' + show.date.split('-')[2] + '/' + show.date.split('-')[0] + '</mj-text>'
		// 			mjml += '<mj-text padding-top="0px">' + show.time + '</mj-text>'
		// 			mjml += '<mj-text align="center" font-size="18" color="#D0057A" text-decoration="none" font-weight="700"><a style="text-decoration: none; color:#D0057A" href="' + show.url + '">'+buttonText+'</a></mj-text>'
		// 		})
		// 	})
		// delete hashKey.tonight;
		// for(i = 0; i < 7; i++) {
		// 	mjml += '<mj-accordion>'
		// 	mjml += '<mj-accordion-element>'
		// 	var night = hashKey[i];
		// 	mjml += '<mj-accordion-title>'+ moment().add(i, 'day').format('dddd') +'</mj-accordion-title>';
		// 	mjml += '<mj-accordion-text>'
		// 	venues.forEach(function(venue) {
		// 		if (venue[night].length > 0) {
		// 			mjml += ' <div style="font-size:20px; text-align:left; color:#000; font-weight: 700; border-bottom: 1px solid #01C4FF;padding-bottom:5px;">' + venue.venue + '</div><br>'
		// 		}
		// 		venue[night].forEach(function(show, i) {
		// 			var buttonText = 'Tickets'
		// 			if(venue.venue == 'City Park Jazz'){
		// 				buttonText = 'Info'
		// 			}
		// 			mjml += ' <span style="font-size:16px;font-weight:700; padding-top:5px; color: #000">' + show.title + '</span><br><br>'
		// 			mjml += '<span>' + show.date.split('-')[1] + '/' + show.date.split('-')[2] + '/' + show.date.split('-')[0] + '<span><br>'
		// 			mjml += '<span>' + show.time + '</span>'
		// 			mjml += '<span style="text-align: center; font-weigh:700;" color="#D0057A" text-decoration="none"><a style="text-decoration: none; color:#D0057A" href="' + show.url + '">'+buttonText+'</a></span>'
		// 		})
		// 		if (venue[night].length > 0) {
		// 		 mjml +='<div style="padding-bottom:15px;"></div>'
		// 		}
		// 	})
		// 	mjml += '</mj-accordion-text>'
		// 	mjml += '</mj-accordion-element>'
		// 	mjml += '</mj-accordion>'
		// 	if (i<6){
		// 	   mjml +=  '<mj-divider border-color="#D0057A"></mj-divider>';
		// 	}
		// }
		// mjml += '</mj-column>'
        emailTemplate = emailTemplate.split('{{content}}').join(mjml);
        var mjml = require('mjml').mjml2html;
        email = mjml(emailTemplate);

        fs.writeFileSync(__dirname + '/email.html', email.html);

        log('info', 'wrote page')

        childProcess.exec('cd ' + __dirname +
		'aws s3 cp index.html s3://denvertonight.co/index.html;'+
		'aws s3 cp email.html s3://denvertonight.co/email.html;'+
		'aws s3 cp favicon.ico s3://denvertonight.co/favicon.ico;'+
		'aws s3 cp logo.png s3://denvertonight.co/logo.png;'+
		'aws s3 cp thumbnail.png s3://denvertonight.co/thumbnail.png;'+
		'aws s3 cp favicon.ico s3://denvertonight.co/favicon.ico;'+
		'aws s3 cp about.html s3://denvertonight.co/about.html;'+
		'aws s3 cp subscribe.html s3://denvertonight.co/subscribe.html;'+
		'', function() {
            log('info', 'pushed to S3')
        })
    })
})

function log(level, msg) {
    process.stderr.write('[' + new Date() + '] ' + '[' + level + '] ' + msg + '\n')
    fs.appendFileSync(__dirname + '/log.txt', '[' + new Date() + '] ' + '[' + level + '] ' + msg + '\n')
}
