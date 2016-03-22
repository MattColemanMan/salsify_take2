var express = require('express');
var app = express();
var fs = require("fs");
var chomp = require("line-chomper").chomp;



//max digits our offsets can be. 
//12 gets us enough space to process text files up to a terabyte
padLength = 12; 

var lock = 7; //set to -1 when we're done processing the file
currLine = 0;



//process each line, marking down the offset of where each starts
//write it to an "offset" file where each line
//is padded with spaces so each is padLength chars long
//Letting us jump to the desired line wthout reading the file
chomp( process.argv[2],
    function (line, offset, sizeInBytes) {
		strung = offset.toString();
		strung = strung + (" ".repeat(padLength - strung.length)) + '\n'; //pad so its the correct length chars long
		fs.appendFileSync('datastore', strung); //synchronous to make sure things are written in the right order
		currLine += 1;
    },
    function (err, count) {
    	lock = -1;
		console.log("Processed " + count + " lines");
	}
);


//open the datastore file for reading, so we can find the offsets
//to read the main file from
fs.open('datastore', 'r+', function(err, fdList) {
	console.log("server up and running. Ready for API calls");
	app.get('/lines/:line', function (req, res) { //define our api call
		lineToFind = req.params.line - 1; //-1 because arrays are 0 indexed
		if(lineToFind + 1 > currLine){ //requesting a line we can't reach
			if(lock == -1){ //a line we can't reach and wont
				res.status(413).send('HTTP ERROR 413: Line number does not exist, our file is not that big');
				res.end();
			}else{ //for very large files, let them know we're still setting up
				res.status(413).send("HTTP ERROR 413: Server hasn't finished setting up, please try again later");
				res.end();
			}
		}else{
			var buffy = new Buffer(padLength*2);
			var ressy = '';
			
			fs.read(fdList, buffy, 0, padLength*2, (padLength + 1)*lineToFind, function(err, bites){
				if (err){
					console.log(err);
				}

				ressy = buffy.toString().split('\n');
				console.log(ressy);
				line1 = parseInt(ressy[0].trim());
				line2 = parseInt(ressy[1].trim());

				sizeOfLine = line2 - line1;
				var buf = new Buffer(sizeOfLine);
				var result = 'ERROR';

				fs.open(process.argv[2], 'r+', function(err, fd) {
					if (err) {
					   return console.error(err);
					}
					fs.read(fd, buf, 0, sizeOfLine, line1, function(err, bytes){
						if (err){
							console.log(err);
						}
						
						var result = buf.toString();
						result = result.trim();
						res.status(200).send(result);
					});
				});

			});
			
		}
	});
});



var server = app.listen(8081, function () { //start off the server
	var host = server.address().address
	var port = server.address().port
	console.log("Line Reader App running at http://%s:%s", host, port)
});