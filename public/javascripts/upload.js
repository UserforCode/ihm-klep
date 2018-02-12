$('.upload-btn').on('click', function (){
    $('#upload-input').click();
    $('.progress-bar').text('0%');
    $('.progress-bar').width('0%');
});

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};


$('#upload-input').on('change', function(){

    var files = $(this).get(0).files;

    if (files.length > 0){
        //créer un objet FormData qui sera envoyé en tant que données dans la requête AJAX

        var formData = new FormData();

        // parcourir tous les fichiers sélectionnés et les ajouter à l'objet formData
        for (var i = 0; i < files.length; i++) {
            var file = files[i];

            // ajouter les fichiers à l'objet formData pour charger les données
            formData.append('uploads[]', file, file.name);
        }

        $.ajax({
            url: '/upload',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(data){
                console.log('success');
                console.log('this is the data of ajax : ', data);
                //$('#output').innerHTML(data)
                document.getElementById('output').innerHTML = data.replaceAll('\n', '<br>');
            },
            xhr: function() {
                // créer XMLHttpRequest
                var xhr = new XMLHttpRequest();

                // écouter le 'progress' event
                xhr.upload.addEventListener('progress', function(evt) {

                    if (evt.lengthComputable) {
                        // calculer le pourcentage de l'upload
                        var percentComplete = evt.loaded / evt.total;
                        percentComplete = parseInt(percentComplete * 100);

                        // mettre à jour la barre de progression Bootstrap avec le nouveau pourcentage
                        $('.progress-bar').text(percentComplete + '%');
                        $('.progress-bar').width(percentComplete + '%');

                        // Une fois que le téléchargement atteint 100%, on écrit done sur la barre de progress
                        if (percentComplete === 100) {
                            $('.progress-bar').html('Done');
                        }

                    }

                }, false);

                return xhr;
            }
        });

    }
});

$('.download-btn').on('click', function (){

    var files =  document.getElementById("blob-name").value;

    $.ajax({
        url: '/download',
        type: 'POST',
        data: {name : files },
        //processData: false,
        //contentType: false,
        success: function(data){
            //console.log('success' + data);
        }

    });
});

$('.list-btn').on('click', function (){
    $.ajax({
        url: '/list',
        type: 'GET',
        success: function(data){

            var i;

            var myArray = [];

            var myTable= "<table><tr><td style='width: 100px; color: white;'>Blob Number</td>";
            myTable+= "<td style='width: 100px; color: white; text-align: center;'>Blob Name</td>";
            myTable+= "<td style='width: 100px; color: white; text-align: center;'>Check Blob</td></tr>";

            myTable+="<tr><td style='width: 100px; color: white'>---------------</td>";
            myTable+="<td style='width: 100px; text-align: center; color: white'>---------------</td>";
            myTable+="<td style='width: 100px; text-align: center; color: white'>---------------</td></tr>";
            myTable+="<tbody id =\"list-table\">"

            for (i = 0; i < data.length; i++) {
                //text += data[i] ;
                    var s = i+1;

                    myTable+="<tr id= i ><td style='width: 100px; color: white'>Blob" + s + "</td>";
                    myArray[i] = data[i];
                    myTable+="<td style='width: 100px; text-align: center; color:white'>" + myArray[i] + "</td>";
                    myTable+="<td style='width: 100px; text-align: center; color:white'><input type='checkbox'  id='nom_checkbox'  /> </td></tr>";
                    myTable+="</tbody>"
                //}
                //text += "  ";

            }
            myTable+="</table>";
            document.getElementById("liste").innerHTML = myTable ;

            //console.log(data);
        }
    });
});

$("#thechecked").click(function(){
    var closestTr = $(':checkbox:checked').closest('tr').attr('id');
    alert(closestTr);
});



