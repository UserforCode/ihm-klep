var i = 0;
var j = 0;
const compar = 0.7 ;
var flag = 0 ;
const nbOccurenceForDetection = 2 ;

module.exports = function (answer) {
    console.log("inside module")
    var answerParsed = JSON.parse(answer);

    console.log(answerParsed);
    //process(answerParsed);
    if (answerParsed.hasOwnProperty('Predictions')) {
        console.log('inside if')
        console.log(answerParsed);
        process(answerParsed)
    } else {
        console.log('The API didn\'t answered!')
        //return answerParsed.Predictions
        return "The API didn't answered!"
    }
};

function process(answerParsed) {
    console.log('inside function')
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

        }

        if (i === nbOccurenceForDetection || j === nbOccurenceForDetection){
            flag = 1;
        }


    }

    for (var k = 0 ; k < answerParsed['Predictions'].length ; k++){

        delete answerParsed['Predictions'][k];

    }
    delete answerParsed['Iteration'];
    delete answerParsed['Created'];


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
        flag = 0;
    }
    console.log('inside function api controller', answerParsed.Predictions);
    return answerParsed.Predictions
}


