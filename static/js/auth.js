// globals
var res;
var clientID = "435183833819-akg5lgthnt46t5ahuqpa0m6hk7hbugf9.apps.googleusercontent.com";
var access_token;
var str_data = 'lat,lng,column1,data2,another3\n46.75679833,-114.0816879,Lolo,john,something\n46.87333583,-113.9886475,Missoula,sarah,something else\n46.757439,-114.081923,Gas Station,sam,this information can be anything you want!';
var ablob = new Blob( [ str_data ], { type : 'text/csv', title : 'GUS TITLE', description : 'MAPPING DB' } );

// setup gapi
function init() {
  gapi.client.setApiKey('435183833819-akg5lgthnt46t5ahuqpa0m6hk7hbugf9.apps.googleusercontent.com');
  gapi.client.load('urlshortener', 'v1');
}

$(document).ready(function(){
  // get access token from parameters if exist
  if(window.location.href!=="http://localhost:8000/") {
    var params = {}, queryString = location.hash.substring(1),
        regex = /([^&=]+)=([^&]*)/g, m;
    while (m = regex.exec(queryString)) {
      params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
    }
    access_token = params.access_token; // global scope
    
    // authorize params with google
    $.ajax({
      url: "https://www.googleapis.com/oauth2/v1/tokeninfo?access_token="+params.access_token,
      type: "POST",
      success: function(e) {
        // if the access_key passed matches the return key, keep going
        if(e.audience==clientID) {
          res = e; // global scope
          insertFile( ablob, function( d ) {
            console.log( "[ SUCCESS ]: ", d ); // newly created file metadata
          });
        } else {
          // handle tampered clientID
        }
      },
      error: function(e) {
        // expired token
        // invalid response
        console.error(e);
      }
    });
  }
});


function insertFile(fileData, callback) {
  console.log( fileData );
  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  var reader = new FileReader();
  reader.readAsBinaryString(fileData);
  reader.onload = function(e) {
    var contentType = fileData.type || 'application/octet-stream';
    var metadata = {
      'title': 'GUS TITLE' ,
      'description': 'MAPPING DB' ,
      'mimeType': contentType
    };

    var base64Data = btoa(reader.result);
    var multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' + contentType + '\r\n' +
        'Content-Transfer-Encoding: base64\r\n' +
        '\r\n' +
        base64Data +
        close_delim;

    var request = gapi.client.request({
        'path': '/upload/drive/v2/files',
        'method': 'POST',
        'params': { 
            uploadType : "multipart" , 
            convert : true  ,
            access_token : access_token 
        },
        'headers': {
          'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
        },
        'body': multipartRequestBody});
    if (!callback) {
      callback = function(file) {
        console.log(file)
      };
    }
    request.execute(callback);
  }
}