"use strict";

const express = require('express');
const App = require('./app');
const config = require('./config/config').config;
const server = express();
const app = new App();

app.initApp();

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

server.get('/processalgo', async function AlgoOrder(req,res){
    res.status(200);
    res.setHeader('content-type','application/json');
    let msg = '{"response":"processing algo order"}';
    res.send(msg);

    app.ProcessOrderAlgo();
});

server.get('/processorder', async function ManualOrder(req,res){
    res.status(200);
    res.setHeader('content-type','application/json');
    let msg = '{"response":"processing manual order"}';
    res.send(msg);

    app.ProcessManualOrder();
});

server.get('/config',function configureServer(req,res){
    app.install();
    res.status(200).send("Written");
});

server.get('/dump',function dumpData(req,res){
    app.dumpFakeData();
    res.status(200).send("Written Fake Data");
});

server.get('/t',async function test(req,res){
    let pid = req.query.q;
    console.log(pid);
    let count = await app.test(pid);
    res.send("Okay "+count);
});