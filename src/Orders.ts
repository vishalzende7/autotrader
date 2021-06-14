import { Order } from './core/Stoxkart';
import * as admin from 'firebase-admin';
import { config } from './config/config';
export class Orders {
    private _ref: FirebaseFirestore.CollectionReference;
    constructor(_ref: FirebaseFirestore.CollectionReference) {
        this._ref = _ref;
    }

    public storeOrderData(o: Order): void;
    public storeOrderData(o: Order, algo: boolean): void;

    public storeOrderData(o: Order, algo?: boolean): void {
        let docRef = null;
        if (algo != undefined && algo == true) {
            docRef = this._ref.doc(o.partner as string).collection('algo').doc(o.orderId as string);
        }
        else
            docRef = this._ref.doc(o.partner as string); //document path is 'orders/document PARTNERID '
        let data = {
            exchange: o.exchange,
            group_id: o.group_id,
            order_type: o.ordertype,
            product_type: o.productType,
            side: o.side,
            sym: o.sym,
            source: o.source,
            price: o.price == undefined ? 0.00 : o.price as number,
            target: o.target == undefined ? 0.00 : o.target as number,
            stoploss: o.stopLoss == undefined ? 0.00 : o.stopLoss as number,
            orders: admin.firestore.FieldValue.arrayUnion(
                {
                    appOrderId: o.appOrderId,
                    qty: o.qty,
                    user_id: o.uid
                }
            )
        };
        if (o.source == 'algo') {
            docRef.set(data, { merge: true });
        }
        else {
            var data1 = {};
            data1[o.orderId as string] = data;
            docRef.set(data1, { merge: true });
        }
    }

    public async getOrderData(orderId: string, partnerId: string): Promise<any>;
    public async getOrderData(orderId: string, partnerId: string, algo?: boolean): Promise<any>;

    public async getOrderData(orderId: string, partnerId: string, algo?: boolean) {
        this.log("getOrderData start");
        let docRef = null;
        if (algo != undefined && algo == true)
            docRef = this._ref.doc(partnerId).collection('algo').doc(orderId);
        else
            docRef = this._ref.doc(partnerId);

        const snapshot = await docRef.get();
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
                return 404 // order id not found.
        }
        else {
            return 500; //Bad request, Snapshot not found.
        }
    }

    public removeOrderData(orderId: string, partnerId: string) {
        const docRef = this._ref.doc(partnerId);
        docRef.update(orderId, admin.firestore.FieldValue.delete());
    }

    private log(msg?: any, ...args: any) {
        if (config.env == 0)
            console.log(msg, args);
    }
}