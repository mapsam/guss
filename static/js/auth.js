'use strict';
var App = App || {};


/*
**
**  constructor
**
*/
var GussController = function( options ) {
    console.log( "[ CONSTRUCTOR ]" );
    options = options || {};

    // controller members
    this.scope = "https://www.googleapis.com/auth/drive";
    this.state = "constructor";  // tracks state for testing
    this.token_expirey; // set after authorize
    this.clientID = "435183833819-akg5lgthnt46t5ahuqpa0m6hk7hbugf9.apps.googleusercontent.com";
    this.access_token; // set after authorize
    this.str_data = 'lat,lng,column1,data2,another3\n46.75679833,-114.0816879,Lolo,john,something\n46.87333583,-113.9886475,Missoula,sarah,something else\n46.757439,-114.081923,Gas Station,sam,this information can be anything you want!';
    this.ablob = this.get_blob();
    this.is_in_testing = False;
    this.folderID; // set after authorize, when id created works
    

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
GussController.prototype.bind_event_listeners = function() {
    console.log( "[ BIND_EVENT_LISTENERS ]" );
    this.state = "bind_event_listeners";

    // build new gus click event
    document.getElementById('build').addEventListener('click', function(e) {

        console.log( "[ CLICK EVENT ]" );
        e.preventDefault();

        /* 
        ** 
        **  if the token is not expired
        **  then authorize with immediate=true
        **  which will bypass the popup
        **  else authorize with immediate=false
        **  to trigger popup
        **
        */
        var now = new Date().getTime();
        if ( now < this.token_expirey ) {
            this.authorize_access_token( true );
        }
        else {
            this.authorize_access_token( false );
        }

    }.bind( this ), false);

};

/*
**
**  a function that helps us test the controller
**  by sending back fake data for NodeJS tests
**
*/
GussController.prototype.get_blob = function() {
    if ( typeof window !== 'undefined' ) {
        this.is_in_testing = False;
        return new Blob( [ this.str_data ], { type : 'text/csv', title : 'GUS TITLE', description : 'MAPPING DB' } );
    else {
        this.is_in_testing = True;
        return {}; // for NodeJS tests just return hash
    }
};


GussController.prototype.set_access_token = function() {
    console.log( "[ SET_ACCESS_TOKEN ]" );

    gapi.auth.setToken( this.access_token );

};



GussController.prototype.authorize_access_token = function( immediate, force_ui ) {
    console.log( "[ AUTHORIZE_ACCESS_TOKEN ]: immediate = ", immediate );
    this.state = "authorize_access_token";

    gapi.auth.authorize({
        client_id: this.clientID, 
        scope: this.scope, 
        immediate: ( typeof immediate !== 'undefined' ) ? immediate : false,
        }, 
        this.qc_access_token.bind( this )
    );

};

GussController.prototype.qc_access_token = function( token_object ) {
    console.log( "[ QC ACCESS TOKEN ]" );
    this.state = "qc_acces_token";

    if ( token_object.error ) {
        console.error( "[ ERROR ]: token could not be set...trying again ", token_object.error, token_object );
        // reauthorize with immediate=false to force popup
        this.authorize_access_token( false );
        return false;
    }
    
    // set class attributes and expirey time
    this.access_token = token_object.access_token;
    this.set_access_token();
    this.token_expirey = new Date().setSeconds( token_object.expires_in );
    this.get_or_insert_spreadsheet();

};


GussController.prototype.get_or_insert_spreadsheet = function() {

        gapi.client.request({
            'path': '/drive/v2/files',
            'method': 'GET',
            'params': { 
                q : "title contains 'gus' and mimeType = 'application/vnd.google-apps.folder' and trashed = false" ,
                maxResults : "1000" ,
                access_token : this.access_token 
            },
        })
        .then( 
            function ( response ) {
                // if no gus folder, create one and add file
                if ( response.result.items.length === 0 ) {
                    console.log( "[ NO EXISTING FOLDER ]: creating..." );
                    // this.createFolder().then(this.insert_file());
                    this.createFolder();
                }
                // otherwise, create a new file within the gus folder id
                else {
                    console.log( "[ FOUND FOLDER ]: there are", response.result.items.length, "existing folders:" , response.result.items  );
                    this.folderID = response.result.items[0].id;
                    this.insert_file();
                }
            }.bind( this ) ,
            function ( e ) {
                // error
                console.error( "[ ERROR ]: error in listing files ", e ); 
        });
};

GussController.prototype.insert_file = function( ) {
    console.log( "[ INSERT_FILE ]" );
    this.state = "insert_file";

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
          'mimeType': contentType,
          'parents': [{ 'id':this.folderID }]
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
                this.state = "success";
                console.log( "[ SUCCESS ]: file created => ", file ); 
            }.bind( this ) ,
            function() {
                // error
                this.state = "error";
                console.error( "[ ERROR ]: file could not be created...retrying ", arguments ); 
                // reauthorize with immediate=false to force popup
                this.authorize_access_token( false );
            }.bind( this )
        );

    }.bind( this ); // end reader.onload
};

GussController.prototype.createFolder = function( ) {
    this.state = "create_folder";

    var request = gapi.client.request({
       'path': '/drive/v2/files/',
       'method': 'POST',
       'headers': {
           'Content-Type': 'application/json',
           'Authorization': 'Bearer ' + this.access_token,             
       },
       'body':{
           "title" : "gus-maps",
           "mimeType" : "application/vnd.google-apps.folder",
       }
    });

   request.execute(function(resp) { 
       console.log( "[ CREATED FOLDER ] : " + resp.id );
       this.folderID = resp.id; // this doesn't seem to be working ... no access to this within the execute scope?
       this.insert_file();
   }.bind( this ));
};


App.GussController = GussController;
