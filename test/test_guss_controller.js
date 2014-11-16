var test = require( 'tape' ) ,
    jsdom = require( 'jsdom' ) ,
    fs = require( 'fs' ) ,
    gapi = fs.readFileSync( './gapi-mock.js', 'utf-8' ) ,
    App = require( './static/js/auth.js' );


jsdom.env( {
    html : "<html><body><a id='build' href='/'>Build a new gus</a></body></html>" ,
    src : [ gapi, App ] ,
    done : function ( errors, window ) {

        test( 'GussController can be instantiated, state is in proper place, gapi.api_key is set', function ( t ) {

                App.guss = new App.GussController();
                t.equal( App.guss.state, 'bind_event_listeners' );
                t.equal( gapi.api_key, App.guss.clientID );
                t.end();
        });

    }
} );
