const express = require("express");
const axios = require("axios");
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const FormData = require("form-data");
const path = require("path");
const hbs = require("hbs");
const casbin = require("casbin");

const PORT = 3001;
const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Engine Setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/views/partials');

// System variables where Client credentials are stored
const CLIENT_ID = "392970294258-7laomhlpe4v98ksmgoid9jn3alsqnpq8.apps.googleusercontent.com";       //TIAGO
const CLIENT_SECRET = "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";                                        //TIAGO 

const API_KEY = "AIzaSyCnv__5hSvkGTI3ArbtRPibHlwaSDsc76k";

// Callback URL configured during Client registration in OIDC provider
const CALLBACK = "callback";


// HOMEPAGE. Get request for resource
app.get("/", function (req, res) {
    console.log(
        req.socket.remoteAddress
        //+ ' ' + req.socket.getPeerCertificate().subject.CN
        + ' ' + req.method
        + ' ' + req.url);
    res.send(
        '<a href = /login> Login with your Google Account </a>' +
        '<br><br> <a href=/allTasks> View your task lists </a>'
    );
});

// Login
app.get('/login', (req, res) => {
    res.redirect(302,
        // authorization endpoint
        'https://accounts.google.com/o/oauth2/v2/auth?'

        // client id
        + 'client_id=' + CLIENT_ID + '&'

        // OpenID scope "openid email"
        + 'scope=openid%20email%20https://www.googleapis.com/auth/tasks&'

        // parameter state is used to check if the user-agent requesting login is the same making the request to the callback URL
        // more info at https://www.rfc-editor.org/rfc/rfc6749#section-10.12
        //+ 'state=value-based-on-user-session&'

        // responde_type for "authorization code grant"
        + 'response_type=code&'

        // redirect uri used to register RP
        + 'redirect_uri=http://localhost:3001/' + CALLBACK);
});

// CALLBACK
app.get('/' + CALLBACK, (req, res) => {
    //if (req.cookies.StateParam == req.query.state) {
    console.log('making request to token endpoint');
    // content-type: application/x-www-form-urlencoded (URL-Encoded Forms)
    const form = new FormData();
    form.append('code', req.query.code);
    form.append('client_id', CLIENT_ID);
    form.append('client_secret', CLIENT_SECRET);
    form.append('redirect_uri', 'http://localhost:3001/' + CALLBACK);
    form.append('grant_type', 'authorization_code');
    //console.log(form);

    axios.post(
        // token endpoint
        'https://www.googleapis.com/oauth2/v3/token',
        // body parameters in form url encoded
        form,
        { headers: form.getHeaders() }
    )
        .then(function (response) {
            // AXIOS assumes by default that response type is JSON: https://github.com/axios/axios#request-config
            // Property response.data should have the JSON response according to schema described here: https://openid.net/specs/openid-connect-core-1_0.html#TokenResponse

            console.log(response.data);
            // decode id_token from base64 encoding
            // note: method decode does not verify signature
            var jwt_payload = jwt.decode(response.data.id_token);
            console.log(jwt_payload);

            // define two cookies
            res.cookie("EmailCookie", jwt_payload.email);
            res.cookie("AccessTokenCookie", response.data.access_token);

            // HTML response with the code and access token received from the authorization server
            res.send(
                '<div> callback with code = <code>' + req.query.code + '</code></div><br>' +
                '<div> client app received access code = <code>' + response.data.access_token + '</code></div><br>' +
                '<div> id_token = <code>' + response.data.id_token + '</code></div><br>' +
                '<div> Hi <b>' + jwt_payload.email + '</b> </div><br>' +
                'Go back to <a href="/">Home screen</a>'
            );
        })
        .catch(function (err) {
            console.log(err);
            res.send();
        });
});


app.get('/allTasks', allTasks);

async function allTasks(req, res) {

    if (Object.keys(req.cookies).length != 0) {
        const e = await casbin.newEnforcer(__dirname + '/rbac/rbac_model.conf', __dirname + '/rbac/rbac_policy_app.csv');
        const aux = await e.enforce(req.cookies.EmailCookie, 'add_task', 'write')
        if (aux) {
            axios.get(
                `https://tasks.googleapis.com/tasks/v1/users/@me/lists?access_token=${req.cookies.AccessTokenCookie}&key=${API_KEY}`,
                { Authorization: 'Bearer ' + req.cookies.AccessTokenCookie }
            )
                .then(
                    (response) => {
                        res.render('taskLists', { l: response.data.items, title: 'My Task Lists', taskLists: true });
                    })
                .catch(function (err) {
                    console.log(err);
                    res.redirect("/");
                });
        } else {
            axios.get(
                `https://tasks.googleapis.com/tasks/v1/users/@me/lists?access_token=${req.cookies.AccessTokenCookie}&key=${API_KEY}`,
                { Authorization: 'Bearer ' + req.cookies.AccessTokenCookie }
            )
                .then(
                    (response) => {
                        res.render('taskListsFree', { l: response.data.items, title: 'My Task Lists', taskListsFree: true });
                    })
                .catch(function (err) {
                    console.log(err);
                    res.redirect("/");
                });
        }
    } else res.redirect("/login");
};

//Get the tasks in a certain list by the list id
app.get('/taskList/:id', (req, res) => {

    if (Object.keys(req.cookies).length != 0) {
        axios.get(
            `https://tasks.googleapis.com/tasks/v1/lists/${req.params.id}/tasks?access_token=${req.cookies.AccessTokenCookie}&key=${API_KEY}`,
            { Authorization: 'Bearer ' + req.cookies.AccessTokenCookie }
        )
            .then(
                (response) => {
                    res.render('list', { l: response.data.items, title: `Task List ID: ${req.params.id}`, list: true });
                })
            .catch(function (err) {
                console.log(err);
                res.redirect("/");
            });
    } else {
        console.log("Tem de estar logado para entrar no taskList add");
        res.redirect("/login");
    };
});

//Obtain the form to add a new task
app.get('/taskList/add/:id', (req, res) => {
    res.render('addToTaskList', { l: req.params.id, addToTaskList: true });
});

//Add the new task to the list
app.post('/taskList/add/:id', (req, res) => {

    if (Object.keys(req.cookies).length != 0) {
        axios.post(
            `https://tasks.googleapis.com/tasks/v1/lists/${req.params.id}/tasks?access_token=${req.cookies.AccessTokenCookie}&key=${API_KEY}`,
            { Authorization: 'Bearer ' + req.cookies.AccessTokenCookie, title: req.body.title }
        )
            .then(
                res.redirect(`/taskList/${req.params.id}`)
            )
            .catch(function (err) {
                console.log(err);
                res.redirect("/");
            });
    } else {
        console.log("Tem de estar logado para entrar no taskList add");
        res.redirect("/login");
    };
});


/*              COOKIES             */

// Protected Resource
app.get('/protectedresource', (req, res) => {
    console.log(req.headers);
    if (req.header('Authorization')) {
        // TODO: check credentials
        console.log('Header authorization is present: ' + req.header('Authorization'));
        res.sendStatus(200);
    } else {
        console.log('Requesting authorization header');
        res.header(
            'WWW-Authenticate',
            'Basic realm=testrealm'
        );
        res.sendStatus(401);
    };
});

// Print Cookies
app.get('/printcookies', (req, resp) => {
    resp.statusCode = 200;
    resp.send(req.header('Cookie'));
});

// Set Cookies
app.get('/setcookies', (req, resp) => {
    resp.statusCode = 200;
    // eq. Set-Cookie: C1=A; C2=B; Path=/
    resp.setHeader('Set-Cookie', ['C1=A', 'C2=B']);
    resp.cookie('mycookie', 'some-value', { expires: new Date(Date.now() + 900000), httpOnly: true });
    resp.end();
});

const crypto = require('crypto');
const hmac = crypto.createHmac('sha256', 'changeit');

// Set Cookies-HMAC
app.get('/setcookies-hmac', (req, res) => {
    res.statusCode = 200;
    // random user id
    id = crypto.randomBytes(8);
    // compute hmac 
    var h = hmac.digest(id);
    // convert to base64
    var hBase64 = Buffer.from(h).toString('base64');

    res.setHeader('Set-Cookie', ['MyAppCookie=' + id, 'T=' + hBase64]);
    res.cookie('MyAppCookie', id, { expires: new Date(Date.now() + 900000), httpOnly: true });
    res.cookie('T', hBase64, { expires: new Date(Date.now() + 900000), httpOnly: true });
    res.send('cookie *MyId* is protected by tag *T*');
});


/*              LAUNCH SERVER               */

app.listen(PORT, () => console.log("Server started at port " + PORT));
