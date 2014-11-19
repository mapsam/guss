var Q = require( 'q' );

gapi = {};

/*
**
**  CLIENT
**
*/
gapi.client = {

    setApiKey : function( key ) {
        gapi.api_key = key;
    } ,

    request : function ( options ) {
        var deferred = Q.defer();
        
        deferred.resolve( 
            { 
                kind: "drive#file", 
                id: "1duN1QRq4-fJ7QuaVe", 
                shared: false, 
                appDataContents: false, 
                status: 200, 
                statusText: "OK"
            }
        );

    } ,

};



/*
**
**  AUTH
**
*/
gapi.auth = {

    authorize : function( options, cb ) {
        var token_object = {
            expires_in :  2000 ,
            access_token : 'ya29.vwDaplIyo8f4Loxy1_YR7v0ENntS88nHHsiX9JiMg6uJxgY-jGv83RNfDip3VUkMsZIjMWjoRwl0xQ' ,
        }
        cb.call( token_object );
    } ,

    setToken : function( token ) {
        gapi.token = token;
    } ,
};

module.exports = gapi;

