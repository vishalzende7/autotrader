"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Result = exports.Order = exports.Stoxkart = void 0;
const request = require("request-promise");
const config_1 = require("../config/config");
class Stoxkart {
    constructor(cb) {
        this.restApi = {
            "session": "/user/session",
            "profile": "/user/profile",
            "balance": "/user/balance",
            "orders": "/orders",
            "bracket": "/orders/bracket",
            "trade": "/orders/trades",
            "position": "/portfolio/positions",
            "candleBO": "/orders/bracket?boEntryOrderId=",
            "prod_url": "https://tradelite.stoxkart.com/interactive"
        };
        this._callback = cb;
    }
    bracketOrder(od) {
        let option = {
            method: 'POST',
            url: this.restApi.prod_url + this.restApi.bracket,
            headers: {
                Header: "Content-Type:application/json",
                authorization: od.token
            },
            body: {
                clientID: od.uid,
                exchangeSegment: od.exchange,
                exchangeInstrumentID: od.sym,
                orderType: od.ordertype,
                orderSide: od.side,
                disclosedQuantity: od.qty,
                orderQuantity: od.qty,
                limitPrice: od.price,
                stopLossPrice: od.stopLoss,
                trailingStoploss: 0,
                squarOff: od.target,
                orderUniqueIdentifier: "WEB"
            },
            json: true
        };
        if (config_1.config.env == 0) {
            console.log("Option Data ", option);
        }
        if (config_1.config.apiCall == 0) {
            console.log("Order is not placed, check config.ts->apiCall ", option);
            return;
        }
        let mInstance = this;
        request(option)
            .then(function success(res) {
            let r = new Result();
            r.status = 200;
            r.type = 'SUCCESS';
            r.resp = res;
            mInstance._callback.onSuccess(r);
        })
            .catch(function error(e) {
            let r = new Result();
            r.status = e.statusCode;
            r.type = 'ERROR';
            r.resp = e;
            mInstance._callback.onFailed(r);
        });
    }
    squareoffBracket(od) {
        let options = {
            method: "DELETE",
            url: this.restApi.prod_url + this.restApi.candleBO + od.appOrderId,
            headers: {
                authorization: od.token
            }
        };
    }
    normalOrder(od) {
        var options = {
            method: "POST",
            uri: this.restApi.prod_url + this.restApi.orders,
            headers: {
                Header: "Content-Type:applicstion/json",
                authorization: od.token
            },
            body: {
                exchangeSegment: od.exchange,
                exchangeInstrumentID: od.sym,
                productType: od.productType,
                orderType: od.ordertype,
                orderSide: od.side,
                timeInForce: "DAY",
                disclosedQuantity: od.qty,
                orderQuantity: od.qty,
                limitPrice: od.price,
                stopPrice: 0,
                orderUniqueIdentifier: "WEB" + od.uid
            },
            json: true
        };
        if (config_1.config.apiCall == 0) {
            console.log("Order is not placed, check config.ts->apiCall ", options);
            return;
        }
        if (config_1.config.env == 0) {
            console.log("Option Data ", options);
        }
        let mInstance = this;
        request(options)
            .then(function success(res) {
            mInstance._callback.onSuccess(res);
        }).catch(function error(e) {
            mInstance._callback.onFailed(e);
        });
        return;
    }
    log(msg, ...args) {
        if (config_1.config.env == 0) {
            console.log(msg, args);
        }
    }
}
exports.Stoxkart = Stoxkart;
/*
* this class will register callback
* make a request return
* callback received result
*
*/
class Order {
}
exports.Order = Order;
class Result {
    constructor() { }
}
exports.Result = Result;
//# sourceMappingURL=Stoxkart.js.map