"use strict";

const express = require('express');
const App = require('./app');
const config = require('./config/config').config;
const server = express();
const app = new App();

app.initApp();
server.use(express.json());

const PORT = process.env.PORT || 8080

server.listen(PORT, function serverListenCB(err){
    console.log('Server listening on %d and env is %d',PORT,config.env);

});


server.get('/',function serverRoot(req,res){
    res.status(200);
    res.setHeader('content-type','application/json');
    let msg = '{"ServerStatus":"Running","Partners":4, "ClientList":1000}';
    res.send(msg);
});

server.post('/processalgo', async function AlgoOrder(req,res){
    res.status(200);
    res.setHeader('content-type','application/json');
    let msg = '{"response":"processing algo order"}';
    let reqData = req.body;
    app.ProcessOrderAlgo(reqData);
    res.send(msg);
});

server.post('/processorder', async function ManualOrder(req,res){
    res.status(200);
    res.setHeader('content-type','application/json');
    let msg = '{"response":"processing manual order"}';
    let reqData = req.body;
    console.log(req.body.partnerId);
    app.ProcessManualOrder(reqData);
    res.send(msg);
});


server.get('/refresh',async function test(req,res){
    let pid = req.query.q;
    let count = await app.test(pid);
    res.send("Okay "+count);
});