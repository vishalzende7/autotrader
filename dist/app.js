"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const client_1 = require("./clients/client");
const core_1 = require("./firestore/core");
const Stoxkart_1 = require("./core/Stoxkart");
const config_1 = require("./config/config");
class App {
    constructor() {
        this.count = 0;
        this.client = null;
        this.stoxkart = null;
        this.firestore = new core_1.db();
        this.stoxkart = new Stoxkart_1.Stoxkart(this);
    }
    install() {
        //create direstore db structure
    }
    dumpFakeData() {
        const p_num = 4;
        const c_pp = 5;
        for (let i = 0; i < p_num; i++) {
            let pDocRef = this.firestore.getDocumentRef('tokens/fin100321' + i).collection('users');
            let memUsage = 0;
            memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
            console.log("before loop %.2f MB", (Math.round(memUsage * 100) / 100));
            for (let j = 0; j < c_pp; j++) {
                memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
                console.log("In Loop before %.2f MB", (Math.round(memUsage * 100) / 100));
                let xtsid = 'BD' + i + j + (2 * j);
                var t_data = {
                    token: 'bbcnndhhfd77dhhfjjsjd' + j,
                    group: ['OptionTrader', 'ALGO'],
                    symbols: { 10999: 10, 10666: 100 },
                    stxid: xtsid,
                    lastUpdate: Date.now()
                };
                memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
                console.log("In Loop after %.2f MB", (Math.round(memUsage * 100) / 100));
                pDocRef.doc(xtsid).set(t_data);
            }
            memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
            console.log("after loop %.2f MB", (Math.round(memUsage * 100) / 100));
        }
    }
    initApp() {
        return __awaiter(this, void 0, void 0, function* () {
            /*
            start
            look for access token collection if found then
            get all document this will be a count of partners will access this server
            get update_time if difference is < 12hrs then
            fetch token records
            init client tables
            end
            */
            if (this.client == null) {
                this.client = new client_1.Clients(this.firestore.getCollectionReff('tokens'));
            }
            yield this.client.initClientAll();
            console.log("Finish client initilization");
        });
    }
    test(partnerId = 'FIN001') {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.client.refeshToken(partnerId);
        });
    }
    ProcessOrderAlgo(reqDetails) {
        if (this.client == null)
            return;
        if (reqDetails == null)
            return;
        this.log("Processing algo order! asynchronusly");
        const partner = reqDetails.partnerId;
        let client_arr = this.client.getClientsByGroup(partner, reqDetails.groupId);
        client_arr.forEach(element => {
            let c = this.client.getClientById(partner, element);
            let o = new Stoxkart_1.Order();
            o.uid = c.stxid;
            o.exchange = reqDetails.exch;
            o.sym = Number.parseInt(reqDetails.sym);
            o.ordertype = reqDetails.oType;
            o.side = reqDetails.side;
            o.qty = Number(c.symbols[10666]);
            o.price = Number.parseFloat(reqDetails.price);
            o.stopLoss = Number.parseFloat(reqDetails.sl);
            o.target = Number.parseFloat(reqDetails.tgt);
            o.token = c.token;
            this.stoxkart.bracketOrder(o);
        });
    }
    ProcessManualOrder(reqDetails) {
        if (this.client == null)
            return;
        if (reqDetails == null)
            return;
        this.log("Processing Manual order! asynchronusly");
        const partner = reqDetails.partnerId;
        let client_arr = this.client.getClientsByGroup(partner, reqDetails.groupId);
        client_arr.forEach(element => {
            let c = this.client.getClientById(partner, element);
            let o = new Stoxkart_1.Order();
            o.uid = c.stxid;
            o.exchange = reqDetails.exch;
            o.sym = Number.parseInt(reqDetails.sym);
            o.productType = reqDetails.pType;
            o.ordertype = reqDetails.oType;
            o.side = reqDetails.side;
            o.qty = reqDetails.qty;
            o.price = Number.parseFloat(reqDetails.price);
            o.token = c.token;
            this.stoxkart.normalOrder(o);
        });
        console.log("Finished order processing");
    }
    placeOrder(c) {
        let o = new Stoxkart_1.Order();
        return 0;
    }
    onSuccess(res) {
        this.log('On Success ', res);
    }
    onFailed(e) {
        this.log('On error ', e);
    }
    log(msg, ...args) {
        if (config_1.config.env == 0) {
            console.log(msg, args);
        }
    }
}
module.exports = App;
//# sourceMappingURL=app.js.map