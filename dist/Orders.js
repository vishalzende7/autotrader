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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Orders = void 0;
const admin = require("firebase-admin");
const config_1 = require("./config/config");
class Orders {
    constructor(_ref) {
        this._ref = _ref;
    }
    storeOrderData(o, algo) {
        let docRef = null;
        if (algo != undefined && algo == true) {
            docRef = this._ref.doc(o.partner).collection('algo').doc(o.orderId);
        }
        else
            docRef = this._ref.doc(o.partner); //document path is 'orders/document PARTNERID '
        let data = {
            exchange: o.exchange,
            group_id: o.group_id,
            order_type: o.ordertype,
            product_type: o.productType,
            side: o.side,
            sym: o.sym,
            source: o.source,
            price: o.price == undefined ? 0.00 : o.price,
            target: o.target == undefined ? 0.00 : o.target,
            stoploss: o.stopLoss == undefined ? 0.00 : o.stopLoss,
            orders: admin.firestore.FieldValue.arrayUnion({
                appOrderId: o.appOrderId,
                qty: o.qty,
                user_id: o.uid
            })
        };
        if (o.source == 'algo') {
            docRef.set(data, { merge: true });
        }
        else {
            var data1 = {};
            data1[o.orderId] = data;
            docRef.set(data1, { merge: true });
        }
    }
    getOrderData(orderId, partnerId, algo) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log("getOrderData start");
            let docRef = null;
            if (algo != undefined && algo == true)
                docRef = this._ref.doc(partnerId).collection('algo').doc(orderId);
            else
                docRef = this._ref.doc(partnerId);
            const snapshot = yield docRef.get();
            if (snapshot.exists) {
                let data = snapshot.data();
                if (data[orderId] != undefined && !algo) {
                    console.log('getOrderData->%s (%s)', partnerId, JSON.stringify(data[orderId]));
                    return data[orderId];
                }
                else if (algo) {
                    console.log('getOrderData->%s (%s)', partnerId, JSON.stringify(data));
                    return data;
                }
                else
                    return 404; // order id not found.
            }
            else {
                return 500; //Bad request, Snapshot not found.
            }
        });
    }
    removeOrderData(orderId, partnerId) {
        const docRef = this._ref.doc(partnerId);
        docRef.update(orderId, admin.firestore.FieldValue.delete());
    }
    log(msg, ...args) {
        if (config_1.config.env == 0)
            console.log(msg, args);
    }
}
exports.Orders = Orders;
//# sourceMappingURL=Orders.js.map