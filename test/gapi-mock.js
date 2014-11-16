var Q = require( 'q' );

// for use with jsdom ( which mimics browser and HTML spec )
if ( typeof window !== 'undefined' ) {

    window.gapi = window.gapi || {};

    /*
    **
    **  CLIENT
    **
    */
    window.gapi.client = {

        setApiKey : function( key ) {
            gapi.api_key = key;
        } ,

        request : function ( options ) {
            var deferred = Q.defer();
            
            deferred.resolve( 
                return { 
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
    window.gapi.auth = {

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

}
