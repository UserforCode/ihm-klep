/*************************
 * Libraries
 *************************/

var express = require('express');
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var storage = require('azure-storage');
var bodyParser = require('body-parser');
var cv = require('opencv');
var https = require('https');

/*************************
 * Local files
 *************************/

// var apiController = require('./controller/apiController');

let connectionString = 'DefaultEndpointsProtocol=https;AccountName=poc3blob;AccountKey=yjYGFYPbgTWI2fPE87HycQJbWqMK1mtLP8o1MIXidwlKC/L6+m7YugyOTVMbLcnObjCO1sMx17wy4bPR3rSs7w==;EndpointSuffix=core.windows.net';
let blobService = storage.createBlobService(connectionString);
let app = express();

var count = 0 ;


var sec = 00;
var min = 00;
var hour = 00;

/**
 *  Function ApiController
 */

var i = 0;
var j = 0;
var x = 0;
const compar = 0.7 ;
var flag = 0 ;
const nbOccurenceForDetection = 2 ;

function process(answer) {
    console.log('inside function')

    var probabilityPackage = answer['Predictions'][2]['Probability'] ;
    var probabilitySuitcase = answer['Predictions'][1]['Probability'] ;
    var probabilityBag = answer['Predictions'][0]['Probability'] ;
    console.log('probability suitcase', probabilitySuitcase);
    console.log('probability bag', probabilityBag);
    console.log('Probability of Package', probabilityPackage);

    var answerParsed = answer ;

    for (var z = 0 ; z < answerParsed['Predictions'].length ; z++){

        if ( answerParsed['Predictions'][z]['Tag'] === 'bag' ){

            if (answerParsed['Predictions'][z]['Probability'] > compar){
                i++;
                console.log('occurence de bag : ', i);
            }else{
                i = 0;
            }

        } else if (answerParsed['Predictions'][z]['Tag'] === 'suitcase' ){

            if (answerParsed['Predictions'][z]['Probability'] > compar){
                j++;
                console.log('occurence de suitcase : ', j);
            }else {
                j = 0;
            }

        } else if (answerParsed['Predictions'][z]['Tag'] === 'package' ){

            if (answerParsed['Predictions'][z]['Probability'] > compar){
                x ++;
                console.log('occurence de colis : ', x);
            }else {
                x = 0;
            }

        }

        if (i === nbOccurenceForDetection || j === nbOccurenceForDetection || x === nbOccurenceForDetection){
            flag = 1;
        }


    }

    for (var k = 0 ; k < answerParsed['Predictions'].length ; k++){

        delete answerParsed['Predictions'][k];

    }
    delete answerParsed['Iteration'];
    delete answerParsed['Created'];


    answerParsed['Predictions'].unshift({"Occurence":x });
    answerParsed['Predictions'].unshift({"Tag":"package"});
    answerParsed['Predictions'].unshift({"Occurence":i });
    answerParsed['Predictions'].unshift({"Tag":"bag"});
    answerParsed['Predictions'].unshift({"Occurence":j });
    answerParsed['Predictions'].unshift({"Tag":"suitcase"});
    answerParsed.status = flag;

    //var objout = JSON.stringify(answer);
    //var out2 = Buffer.from(objout).toString('base64');

    if (flag === 1){
        i = 0;
        j = 0;
        x = 0;
        flag = 0;
    }

    //return /*answerParsed.Predictions +*/ answerParsed.status




    var prediction = JSON.parse(JSON.stringify(answerParsed.Predictions));
    var predictionFiltred = prediction.filter(function(x) { return x !== null });

    return [predictionFiltred, answerParsed.status, probabilitySuitcase, probabilityBag, probabilityPackage]
}

/**
 * Configure frameworks
 */
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


/********************************************
 * Controller
 ********************************************/
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.post('/upload', function(req, res) {
    var form = new formidable.IncomingForm();

    form.on('file', function(field, file) {

        form.uploadDir = path.join(__dirname, '/uploads');
        fs.rename(file.path, path.join(form.uploadDir, file.name));

        var filelocalPath = () => {
            if (process.platform === 'win32')
                return form.uploadDir + '\\' + file.name;
            else
                return form.uploadDir + '/' + file.name;
        };

        var video = new cv.VideoCapture(filelocalPath());
        var fps = 24;

        /**
         * Set the capture every X seconds
         * @type {number}
         */
        var capture_every_seconds = 10;

        var threshold = fps * capture_every_seconds;

        var counter = 0;
        var counter_img = 1;

        var result = ' ';

        /**
         * Iter through the video and capture one image every 'threshold'
         */
        var iter = () => {
            video.read(function(err, im) {
                console.log( "############################### counter % threshold = ", counter % threshold);
                if (!err && im.height() !== 0 && im.width() !== 0) {
                    if (counter % threshold === 0) {
                        var imageFileName = './uploads/saved-image-' + file.name + counter_img.toString() + '.png';



                        im.save(imageFileName);

                        fs.readFile(imageFileName, function(err, data) {
                            if (err) throw err;
                            typeof data;
                            /**
                             * Call API Custom here
                             */
                            callAPI(data, function(answer) {

                                var answerParsed = JSON.parse(answer);


                                if (answerParsed.hasOwnProperty('Predictions')) {

                                    console.log('inside if')
                                    console.log(answerParsed);
                                    var response =  process(answerParsed);

                                    function alertRaising (resp)
                                    {
                                        if (resp == 0) {

                                            return "alert not raised";
                                        }else{
                                            return "alert raised";
                                        }
                                    };

                                    function rounding (resp){

                                        var number = resp * 100 ;
                                        return Math.round(number).toFixed(2);
                                    }


                                    count ++ ;
                                    var responseParseString = JSON.stringify(response[0]);
                                    var responseAscii = Buffer.from(responseParseString).toString('ascii');

                                    if(sec < 60 && min <= 59){
                                        sec = sec + capture_every_seconds;
                                        if(sec >= 60){
                                            min = min + 1;
                                            sec = 00;
                                        }
                                    }else if (sec >= 60) {
                                        min = min + 1;
                                        sec = 00;
                                    }

                                    result += "Time Capture " + min + " : " + sec + '\n' + "Image " + count + ' - ' + "Detection Result " + '\n' + " Bag : " + rounding(response[2]) + " %" + '\n' + " Suitcase : " + rounding(response[3]) + " %" + '\n' + " Package : " + rounding(response[4]) + " %" + '\n' + "Alert : " + alertRaising(response[1]) + '\n' + '\n';
                                    console.log('result : ', result);

                                }else {
                                    console.log('###############################The API didn\'t answered!#############################')
                                    if(sec < 60 && min <= 59){
                                        sec = sec + capture_every_seconds;
                                        if(sec >= 60){
                                            min = min + 1;
                                            sec = 00;
                                        }
                                    }else if (sec >= 60) {
                                        min = min + 1;
                                        sec = 00;
                                    }
                                    result += "Time Capture " + min + " : " + sec + '\n' + "The API didn't answered!" + '\n' + '\n';

                                }


                                //var response = apiController(answer);


                            });
                        });
                        counter_img++;
                    }

                    counter++;
                    iter();
                } else {
                    console.log('End of the video: ' + err);
                    video.release();
                    im.release();
                }
            });
        };

        iter();

        /*        blobService.createContainerIfNotExists('klepierre', {'publicAccessLevel': 'blob'}, function(error) {
         if (!error) {
         blobService.createBlockBlobFromLocalFile('klepierre', file.name, filelocalPath(), function(error, result, response) {
         if (!error) {
         console.log('file uploaded!');
         } else {
         console.log('Error during the upload: ' + error);
         }
         });
         } else {
         console.log('Error during the creation of the container: ' + error);
         }
         });*/
        setTimeout(myFunc, 10000, 'funky');
        function myFunc() {
            res.send(result);
        }
    });

    form.parse(req);

});

/**********************************
 * call API functions
 **********************************/

let predictionKey = '1b7ddc249aaf4f7f8a2245da0c7e9f13';
let projectId = '2d33e818-b923-43d2-b12c-b56d2e0e0dcf';

function callAPI(image, callback) {

    let options = {
        hostname: 'southcentralus.api.cognitive.microsoft.com',
        port: 443,
        path: '/customvision/v1.0/Prediction/' + projectId + '/image',
        method: 'POST',
        headers: {
            'Content-Type': 'multipart/form-data',
            'Prediction-key': predictionKey,
        },
    };

    let req = https.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            console.log(`BODY: ${chunk}`);
            callback(chunk);
        });
        res.on('error', () => {
            console.log('Could not get the result');
        });
        res.on('end', () => {
            console.log('No more data in response.');
        });
    });

    req.write(image);
    req.end();
}

app.post('/download', function(req, res) {
    var names = req.body.name;

    res.json({ok: true});

    const fileDown = path.join(__dirname, '/downloads/');
    blobService.getBlobToLocalFile('mycontainer', names, fileDown + '\\' + names, function(error, result, response) {
        if (!error) {
            // blob retrieved
        }
    });
    console.log('valide');

});

app.get('/list', function(req, res) {
    blobService.listBlobsSegmented('mycontainer', null, function(err, result) {
        if (err) {
            console.log('Couldn\'t list blobs for container ');
            console.error(err);
        } else {
            console.log('Successfully listed blobs for container');
        }
        var names = [];
        names.toString();
        for (var i = 0; i < result.entries.length; i++) {

            names.push(result.entries[i].name);
        }
        res.send(names);
    });
});

app.listen(3000, function() {
    console.log('Server listening on port 3000');
});