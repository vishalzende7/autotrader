"use strict";

const express = require('express');
const App = require('./app');
const config = require('./config/config').config;
const server = express();
const app = new App();

app.initApp();
server.use(express.json());

const PORT = process.env.PORT || 8080

server.listen(PORT, function serverListenCB(err) {
    console.log('Server listening on %d and env is %d', PORT, config.env);

});


server.get('/', function serverRoot(req, res) {
    res.status(200);
    res.setHeader('content-type', 'application/json');
    let msg = '{"ServerStatus":"Running","Partners":4, "ClientList":1000}';
    res.send(msg);
    res.end();
});

server.post('/algorithm', async function AlgoOrder(req, res) {
    res.status(200);
    res.setHeader('content-type', 'application/json');
    let msg = '{"response":"processing algo order"}';
    let reqData = req.body;
    let status = await app.ProcessOrderAlgo(reqData);
    console.log("Status is %d", status);
    res.send(msg);
    res.end();
});

server.post('/processorder', async function ManualOrder(req, res) {
    res.status(200);
    res.setHeader('content-type', 'application/json');
    let reqData = req.body;
    reqData.oid = String(Date.now());

    console.log('Orderrequest received %s', req.body.partnerId);

    app.ProcessManualOrder(reqData);
    let msg = { status: 200, type: "placed", result: reqData.oid }

    res.send(JSON.stringify(msg));
    res.end();
});

server.post('/cancelorder', async function cancelOrder(req, res) {
    let reqData = req.body;
    let response = await app.cancelBracketOrder(reqData);
    let msg = { status: 200, type: "request", result: 200 }
    if (response == 200) {
        msg.result = "request sent";
        msg.status = 200;
    }
    else if (response == 500) {
        msg.status = 500;
        msg.result = "Bad request, contact admin";
    }
    else if (response == 404) {
        msg.status = 404;
        msg.result = "order not found";
    }

    res.status(200);
    res.setHeader('content-type', 'application/json');
    res.send(msg);
    res.end();
});

server.get('/refresh', async function test(req, res) {
    let pid = req.query.q;
    let count = await app.refresh(pid);
    res.send('{"count":' + count + "}");
    res.end();
});

server.get('/rebuild', async function rebuild(req, res) {
    app.initApp();
    res.send("Okay");
    res.end();
});