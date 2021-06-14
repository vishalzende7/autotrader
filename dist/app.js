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
const Orders_1 = require("./Orders");
const md5 = require("md5");
class App {
    constructor() {
        this.count = 0;
        this.client = null;
        this.stoxkart = null;
        this.orders = null;
        this.firestore = new core_1.db();
        this.stoxkart = new Stoxkart_1.Stoxkart(this);
        this.orders = new Orders_1.Orders(this.firestore.getCollectionReff('orders'));
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
    refresh(partnerId = 'FIN001') {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.client.refeshToken(partnerId);
        });
    }
    ProcessOrderAlgo(reqDetails) {
        return __awaiter(this, void 0, void 0, function* () {
            //completed, perform testing...
            if (this.client == null)
                return 1;
            if (reqDetails == null)
                return 2;
            let order_id = reqDetails.OrderID;
            let msg = reqDetails.groupID + reqDetails.partnerID + reqDetails.sym;
            let hash = md5(msg);
            if (hash == order_id) {
                this.log("Processing order for %s", reqDetails.partnerID);
                try {
                    //Case 1: PL and BO
                    if ("PL" == reqDetails.type.toUpperCase() && "BO" == reqDetails.pt.toUpperCase()) {
                        return 200;
                    }
                    //Case 2: Squareoff and BO
                    if ("SQUAREOFF" == reqDetails.sqr.toUpperCase() && "BO" == reqDetails.pt.toUpperCase()) {
                        //In case of MIS or NRML do nothing here
                        let partnerId = reqDetails.partnerID;
                        let orderId = order_id;
                        let data = yield this.orders.getOrderData(orderId, partnerId, true);
                        if ('number' === typeof data) {
                            if (data === 500) {
                                return 500;
                            }
                            else {
                                return 404;
                            }
                        }
                        else {
                            if (data.orders != undefined && data.product_type == "BO") {
                                for (let i = 0; i < data.orders.length; i++) {
                                    let e = data.orders[i];
                                    let c = this.client.getClientById(partnerId, e.user_id);
                                    let o = new Stoxkart_1.Order();
                                    o.appOrderId = e.appOrderId;
                                    o.token = c.token;
                                    //Stoxkart BO squareoff
                                    this.stoxkart.squareoffBracket(o);
                                }
                                return 200;
                            }
                            else {
                                return 500;
                            }
                        }
                    }
                    let client_arr = this.client.getClientsByGroup(reqDetails.partnerID, reqDetails.groupID);
                    for (let i = 0; i < client_arr.length; i++) {
                        let client = this.client.getClientById(reqDetails.partnerID, client_arr[i]);
                        if (reqDetails.qty == 0 && client.symbols[reqDetails.sym] == undefined) {
                            console.log("Quantity is not defined for %d for client %s", reqDetails.sym, client.stxid);
                            continue;
                        }
                        let o = new Stoxkart_1.Order();
                        o.group_id = reqDetails.groupID;
                        o.uid = client.stxid;
                        o.partner = reqDetails.partnerID;
                        o.orderId = order_id;
                        o.source = "algo";
                        o.exchange = reqDetails.exch;
                        o.sym = reqDetails.sym;
                        o.productType = reqDetails.pt; //MIS, BO, NRML
                        o.ordertype = reqDetails.ot; //LIMIT, MARKET
                        o.side = reqDetails.action.toUpperCase();
                        o.qty = reqDetails.qty == 0 ? Number(client.symbols[reqDetails.sym]) : reqDetails.qty;
                        o.price = "LIMIT" == reqDetails.ot.toUpperCase() ? 0.0 : Number.parseFloat(reqDetails.price);
                        o.token = client.token;
                        if (reqDetails.pt == "BO") {
                            o.target = Number.parseFloat(reqDetails.tgt);
                            o.stopLoss = Number.parseFloat(reqDetails.sl);
                            this.stoxkart.bracketOrder(o);
                        }
                        else {
                            this.stoxkart.normalOrder(o);
                        }
                    }
                    return 200;
                }
                catch (e) {
                    console.log("error generated at app.ts:63 (process algo order): %s", JSON.stringify(e));
                    return 500;
                }
            }
            else {
                console.log("Order data does not match...error!...create new algo!");
                return 502;
            }
        });
    }
    ProcessManualOrder(reqDetails) {
        if (this.client == null)
            return;
        if (reqDetails == null)
            return;
        const partner = reqDetails.partnerId;
        this.log("Processing Manual order! asynchronusly for %s ", partner);
        this.log("Request data %s", JSON.stringify(reqDetails));
        let client_arr = this.client.getClientsByGroup(partner, reqDetails.groupId); //get client's STXID in array
        if (client_arr != undefined) {
            client_arr.forEach(element => {
                let c = this.client.getClientById(partner, element); //element is client's STXID
                if (reqDetails.qty == 0 && c.symbols[reqDetails.sym] == undefined) {
                    console.log("qty is not defined for %d for client %s", reqDetails.sym, c.stxid); //push to log stack *new feature yet to be created
                }
                else {
                    let o = new Stoxkart_1.Order();
                    o.group_id = reqDetails.groupId;
                    o.uid = c.stxid;
                    o.partner = partner;
                    o.orderId = reqDetails.oid;
                    o.source = "manual";
                    o.exchange = reqDetails.exch;
                    o.sym = Number.parseInt(reqDetails.sym);
                    o.productType = reqDetails.pType;
                    o.ordertype = reqDetails.oType;
                    o.side = reqDetails.side;
                    o.qty = reqDetails.qty == 0 ? Number(c.symbols[reqDetails.sym]) : reqDetails.qty;
                    o.price = 'MARKET' == String(reqDetails.oType).toUpperCase() ? 0.0 : Number.parseFloat(reqDetails.price);
                    o.token = c.token;
                    if (reqDetails.pType == 'BO') {
                        o.target = Number.parseFloat(reqDetails.tgt);
                        o.stopLoss = Number.parseFloat(reqDetails.stoploss);
                        this.stoxkart.bracketOrder(o);
                    }
                    else {
                        this.stoxkart.normalOrder(o);
                    }
                }
            });
            console.log("Finished order processing for %s ", partner);
        }
        else {
            console.log("Group '%s' does not exists (%s) ", reqDetails.groupId, partner);
        }
    }
    cancelBracketOrder(reqDetails) {
        return __awaiter(this, void 0, void 0, function* () {
            let partnerId = reqDetails.partner_id;
            let orderId = reqDetails.order_id;
            let data = yield this.orders.getOrderData(orderId, partnerId);
            if ('number' === typeof data) {
                if (data === 500) {
                    return 500;
                }
                else {
                    return 404;
                }
            }
            else {
                if (data.orders != undefined) {
                    for (let i = 0; i < data.orders.length; i++) {
                        let e = data.orders[i];
                        let c = this.client.getClientById(partnerId, e.user_id);
                        let o = new Stoxkart_1.Order();
                        o.appOrderId = e.appOrderId;
                        o.token = c.token;
                        this.stoxkart.squareoffBracket(o);
                    }
                }
                this.orders.removeOrderData(orderId, partnerId);
                return 200;
            }
        });
    }
    onSuccess(res) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = res;
            let resp = result.resp;
            if (resp.type == 'success') {
                let order_data = result.order_data;
                if (order_data.productType == "BO")
                    order_data.appOrderId = resp.result.OrderID;
                else
                    order_data.appOrderId = resp.result.AppOrderID;
                if (order_data.source == 'algo')
                    this.orders.storeOrderData(order_data, true);
                else
                    this.orders.storeOrderData(order_data);
            }
            console.log('onSuccess ', JSON.stringify(res));
        });
    }
    onFailed(e) {
        console.log('On error %s', JSON.stringify(e));
    }
    log(msg, ...args) {
        if (config_1.config.env == 0) {
            console.log(msg, args);
        }
    }
}
module.exports = App;
//# sourceMappingURL=app.js.map