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
                orderUniqueIdentifier: String(od.partner + "_" + od.uid)
            },
            json: true
        };
        if (config_1.config.env == 0) {
            console.log("Option Data %s", JSON.stringify(option));
        }
        if (config_1.config.apiCall == 0) {
            console.log("Order is not placed, check config.ts->apiCall ", option);
            // Demonstrate success callback
            let r = new Result();
            let resp = {
                type: 'success',
                code: 's-orders-0001',
                description: 'Request sent',
                result: {
                    OrderID: Stoxkart.i,
                    OrderUniqueIdentifier: 'ID String',
                    ClientID: 'ID String'
                }
            };
            Stoxkart.i++;
            r.status = 200;
            r.type = 'SUCCESS';
            r.order_data = od;
            r.resp = resp;
            this._callback.onSuccess(r);
            return;
        }
        let mInstance = this;
        request(option)
            .then(function success(res) {
            let r = new Result();
            r.status = 200;
            r.type = 'SUCCESS';
            r.order_data = od;
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
        let mInstance = this;
        request(options)
            .then(function success(sResp) {
            mInstance.log('Order cancel request %s', sResp);
        })
            .catch(function error(e) {
            mInstance.log('Order cancel error %s', JSON.stringify(e));
        });
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
                orderUniqueIdentifier: String(od.partner + "_" + od.uid)
            },
            json: true
        };
        if (config_1.config.apiCall == 0) {
            console.log("Order is not placed, check config.ts->apiCall ", options);
            //Demonstrate success callback
            let r = new Result();
            let resp = {
                type: 'success',
                code: 's-orders-0001',
                description: 'Request sent',
                result: {
                    AppOrderID: Stoxkart.i,
                    OrderUniqueIdentifier: 'ID String',
                    ClientID: 'ID String'
                }
            };
            Stoxkart.i++;
            r.status = 200;
            r.type = 'SUCCESS';
            r.order_data = od;
            r.resp = resp;
            this._callback.onSuccess(r);
            return;
        }
        if (config_1.config.env == 0) {
            console.log("Option Data %s ", JSON.stringify(options));
        }
        let mInstance = this;
        request(options)
            .then(function success(res) {
            let r = new Result();
            r.status = 200;
            r.type = 'SUCCESS';
            r.order_data = od;
            r.resp = res;
            mInstance._callback.onSuccess(r);
            /*
            {
                type: 'success',
                code: 's-orders-0001',
                description: 'Request sent',
                result: {
                    AppOrderID: 1100021129,
                    OrderUniqueIdentifier: 'ID String',
                    ClientID: 'ID String'
                }
            }
            */
        }).catch(function error(e) {
            let r = new Result();
            r.status = e.statusCode;
            r.type = 'ERROR';
            r.resp = e;
            mInstance._callback.onFailed(r);
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
Stoxkart.i = 1; //testing puspose uncomment when needed
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