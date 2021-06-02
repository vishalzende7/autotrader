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
class Orders {
    constructor(_ref) {
        this._ref = _ref;
    }
    storeOrderData(o) {
        return __awaiter(this, void 0, void 0, function* () {
            let docRef = this._ref.doc(o.partner); //document path is 'orders/document PARTNERID '
            let data = {
                exchange: o.exchange,
                group_id: o.group_id,
                order_type: o.ordertype,
                product_type: o.productType,
                side: o.side,
                sym: o.sym,
                source: o.source,
                orders: admin.firestore.FieldValue.arrayUnion({
                    appOrderId: o.appOrderId,
                    qty: o.qty,
                    user_id: o.uid
                })
            };
            var data1 = {};
            data1[o.orderId] = data;
            docRef.set(data1, { merge: true });
        });
    }
}
exports.Orders = Orders;
//# sourceMappingURL=Orders.js.map