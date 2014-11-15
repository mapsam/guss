'use strict';
window.App = window.App || {};


/*
**
**  constructor
**
*/
var MainController = function( options ) {
    console.log( "[ CONSTRUCTOR ]" );
    options = options || {};

    // controller members
    this.scope = "https://www.googleapis.com/auth/drive";
    this.state = "new_gus";
    this.clientID = "435183833819-akg5lgthnt46t5ahuqpa0m6hk7hbugf9.apps.googleusercontent.com";
    this.access_token;
    this.str_data = 'lat,lng,column1,data2,another3\n46.75679833,-114.0816879,Lolo,john,something\n46.87333583,-113.9886475,Missoula,sarah,something else\n46.757439,-114.081923,Gas Station,sam,this information can be anything you want!';
    this.ablob = new Blob( [ this.str_data ], { type : 'text/csv', title : 'GUS TITLE', description : 'MAPPING DB' } );

    // event listeners
    this.bind_event_listeners();

    // initialize
    gapi.client.setApiKey( this.clientID );
    // this.init();
};


/*
**
**  functions
**
*/
MainController.prototype.bind_event_listeners = function() {

    // build new gus click event
    document.getElementById('build').addEventListener('click', function(e) {
        console.log( "[ CLICK EVENT ]" );
        e.preventDefault();
        this.authorize_access_token();
    }.bind( this ), false);

};


/*
** 
**  when using gapi.auth.authorize
**  this function is deprecated
**  b/c we are not getting access token through
**  a URL redirect query params
**
*/
MainController.prototype.init = function() {
    console.log( "[ INIT ]" );
    gapi.client.setApiKey( this.clientID );

    if ( this.is_access_token_cb() ) {
        this.set_access_token();
        this.remove_query_params();
        this.insert_file();
    }
};


/*
** 
**  when using gapi.auth.authorize
**  this function is deprecated
**  b/c we are not getting access token through
**  a URL redirect query params
**
*/
MainController.prototype.is_access_token_cb = function() {
    console.log( "[ IS_ACCESS_TOKEN ]" );

    // if query params exist, then attempt to get access_token key
    if( window.location.hash !== "" ) {

        // parse
        var params = {}, queryString = location.hash.substring(1), regex = /([^&=]+)=([^&]*)/g, m;
        while (m = regex.exec(queryString)) {
          params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
        }
        
        // check for access token key 
        if ( params.access_token ) {
            this.access_token = params.access_token; 
            return true;
        }

    }
    return false;
};


MainController.prototype.set_access_token = function() {
    console.log( "[ SET_ACCESS_TOKEN ]" );

    gapi.auth.setToken( this.access_token );

};


/*
** 
**  when using gapi.auth.authorize
**  this function is deprecated
**  b/c we are not getting access token through
**  a URL redirect query params
**
*/
MainController.prototype.remove_query_params = function() {
    console.log( "[ REMOVE_QUERY_PARAMS ]" );

    /*
    **
    **  if the user refreshes the window 
    **  and the access_token params are still there
    **  then another file will be created automatically
    **  prevent this by removing location.hash after authorization.
    **  however, default browser behavior on changing location.hash 
    **  will prompt a redirect. so we use pushState to prevent 
    **  this for browsers that support this call
    **  
    */
    if( history.pushState ) {
        history.pushState( null, null, '/' );
    }
    else {
        location.hash = '/';
    }

};


/*
**
**  this function is not used but is a mockup
**  of how we would authorize through gapi
**  instead of authorizing through a GET-params redirect by 
**  clicking on the button 'Build New Gus'
**
*/
MainController.prototype.authorize_access_token = function() {
    console.log( "[ AUTHORIZE_ACCESS_TOKEN ]" );

    gapi.auth.authorize({
        client_id: this.clientID, 
        scope: this.scope, 
        immediate: true
        }, 
        this.qc_access_token.bind( this )
    );

};

MainController.prototype.qc_access_token = function( token_object ) {

    if ( token_object.error ) {
        console.error( "[ ERROR ]: token could not be set: ", token_object.error, token_object );
        return false;
    }
    
    this.access_token = token_object.access_token;
    this.set_access_token();
    this.insert_file();

};

MainController.prototype.insert_file = function( ) {
    console.log( "[ INSERT_FILE ]" );

    var boundary = '-------314159265358979323846';
    var delimiter = "\r\n--" + boundary + "\r\n";
    var close_delim = "\r\n--" + boundary + "--";

    var reader = new FileReader();
    reader.readAsBinaryString( this.ablob );
    reader.onload = function(e) {

        var contentType = this.ablob.type || 'application/octet-stream';
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

        gapi.client.request({
            'path': '/upload/drive/v2/files',
            'method': 'POST',
            'params': { 
                uploadType : "multipart" , 
                convert : true  ,
                access_token : this.access_token 
            },
            'headers': {
              'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
            },
            'body': multipartRequestBody
        })
        .then( 
            function( file ) {
                // success
                console.log( "[ SUCCESS ]: file created => ", file ); 
            } ,
            function() {
                // error
                console.error( "[ ERROR ]: file could not be created ", arguments ); 
            }
        );

    }.bind( this ); // end reader.onload
};


App.MainController = MainController;
