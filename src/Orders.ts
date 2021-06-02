import { Order } from './core/Stoxkart';
import * as admin from 'firebase-admin';

export class Orders{
    private _ref:FirebaseFirestore.CollectionReference;
    constructor(_ref:FirebaseFirestore.CollectionReference){
        this._ref = _ref;
    }

    public async storeOrderData(o:Order){
        let docRef = this._ref.doc(o.partner as string); //document path is 'orders/document PARTNERID '
        let data = {
            exchange:o.exchange,
            group_id:o.group_id,
            order_type:o.ordertype,
            product_type:o.productType,
            side:o.side,
            sym:o.sym,
            source:o.source,
            orders:admin.firestore.FieldValue.arrayUnion(
                {
                    appOrderId:o.appOrderId,
                    qty: o.qty,
                    user_id:o.uid
                }
            )
        };
        var data1 = {};
        data1[o.orderId as string] = data;
        docRef.set(data1,{merge:true});

    }
}