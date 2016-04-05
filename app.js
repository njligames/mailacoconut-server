var express = require('express');
var app = express();
var bodyParser = require('body-parser')
//var app = express.createServer();

app.use(bodyParser.json());

//app.get('/', function (req, res) {
      //res.send('Hello World!');
//});


//var http = require('http');

var port = Number(process.env.PORT || 3000);

app.set('port', port);

function myStripe(json, response)
{
    //console.log(JSON.stringify(json));
    var jsonData = JSON.parse(json);
    var stripe = require("stripe")(
              "sk_test_fnX3lNRhVQZxgKW2VOB4KvFg"
            );

    var result = stripe.charges.create({
        amount: 4000,
        currency: "usd",
        card:jsonData.stripeToken,
        description: jsonData.description,
        metadata:{
            "firstName":jsonData.shipping.firstName,
            "lastName":jsonData.shipping.lastName,
            "street":jsonData.shipping.street,
            "city":jsonData.shipping.city,
            "state":jsonData.shipping.state,
            "zip":jsonData.shipping.zip,
            "message":jsonData.message,
        }

    }, function(err, charge) {
          // asynchronously called
            response.writeHead(200, {"Content-Type": "application/json"});
            response.end(JSON.stringify(charge));
      });
}

app.post("/webhook", function(request, response) {
    //Retrieve the request's body and parse it as JSON
     var event_json = JSON.parse(request.body);

    // Do something with event_json
    console.log(event_json);

    response.send(200);
});
app.post('/pay', function (req, res) {
//var server = http.createServer(function(req, res) {
        // console.log(req);   // debug dump the request

        // If they pass in a basic auth credential it'll be in a header called "Authorization" (note NodeJS lowercases the names of headers in its request object)

        var auth = req.headers['authorization'];  // auth is in base64(username:password)  so we need to decode the base64
        //console.log("Authorization Header is: ", auth);

        if(!auth) {     // No Authorization header was passed in so it's the first time the browser hit us

                // Sending a 401 will require authentication, we need to send the 'WWW-Authenticate' to tell them the sort of authentication to use
                // Basic auth is quite literally the easiest and least secure, it simply gives back  base64( username + ":" + password ) from the browser
                res.statusCode = 401;
                res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');

                //res.end('<html><body>Need some creds son</body></html>');
                res.end(JSON.stringify({'description':'need login credentials.'}));
        }

        else if(auth) {    // The Authorization was passed in so now we validate it

                var tmp = auth.split(' ');   // Split on a space, the original auth looks like  "Basic Y2hhcmxlczoxMjM0NQ==" and we need the 2nd part

                var buf = new Buffer(tmp[1], 'base64'); // create a buffer and tell it the data coming in is base64
                var plain_auth = buf.toString();        // read it back out as a string

                //console.log("Decoded Authorization ", plain_auth);

                // At this point plain_auth = "username:password"

                var creds = plain_auth.split(':');      // split on a ':'
                var username = creds[0];
                var password = creds[1];

                if((username == 'hack') && (password == 'thegibson')) {   // Is the username/password correct?

                        myStripe(JSON.stringify(req.body), res);

                        //res.statusCode = 200;  // OK
                        //res.end('<html><body>Congratulations you just hax0rd teh Gibson!<br/>' + JSON.stringify(req.body) + '</body></html>');

                        //console.log(JSON.stringify(req.body));

                }
                else {
                        res.statusCode = 401; // Force them to retry authentication
                        res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');

                        // res.statusCode = 403;   // or alternatively just reject them altogether with a 403 Forbidden

                        //res.end('<html><body>You shall not pass</body></html>');
                        res.end(JSON.stringify({'description':'invalid login.'}));
                }
        }
});




//server.listen(5000, function() { console.log("Server Listening on http://localhost:5000/"); });
app.listen(app.get('port'), function () {
    console.log('Example app listening on port ' + app.get('port') + '!');
});
