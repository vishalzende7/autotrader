
import { Clients } from './clients/client';
import { db } from './firestore/core';
import { CallBack, Order, Result, Stoxkart } from './core/Stoxkart';
import { config } from './config/config';
import { Orders } from './Orders';
import md5 = require('md5');


class App implements CallBack {
    private firestore: db;
    private count: number = 0;
    private client: Clients = null;
    private stoxkart: Stoxkart = null;
    private orders: Orders = null;

    constructor() {
        this.firestore = new db();
        this.stoxkart = new Stoxkart(this);
        this.orders = new Orders(this.firestore.getCollectionReff('orders'));
    }

    public async initApp() {
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
            this.client = new Clients(this.firestore.getCollectionReff('tokens'));
        }
        await this.client.initClientAll();
        console.log("Finish client initilization");
    }

    public async refresh(partnerId: String = 'FIN001') {
        return await this.client.refeshToken(partnerId);
    }

    public async ProcessOrderAlgo(reqDetails: any) {

        //completed, perform testing...

        if (this.client == null)
            return 1;
        if (reqDetails == null)
            return 2;

        let order_id = reqDetails.OrderID;
        let msg = reqDetails.groupID + reqDetails.partnerID + reqDetails.sym as string;
        let hash = md5(msg);
        if (hash == order_id) {
            this.log("Processing order for %s", reqDetails.partnerID);

            try {
                //Case 1: PL and BO
                if ("PL" == (reqDetails.type as string).toUpperCase() && "BO" == (reqDetails.pt as string).toUpperCase()) {
                    return 200;
                }
                //Case 2: Squareoff and BO
                if ("SQUAREOFF" == (reqDetails.sqr as string).toUpperCase() && "BO" == (reqDetails.pt as string).toUpperCase()) {
                    //In case of MIS or NRML do nothing here
                    let partnerId = reqDetails.partnerID;
                    let orderId = order_id;
                    let data = await this.orders.getOrderData(orderId, partnerId, true);
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
                                let o = new Order();
                                o.appOrderId = e.appOrderId;
                                o.token = c.token

                                //Stoxkart BO squareoff
                                this.stoxkart.squareoffBracket(o);
                            }
                            return 200;
                        }
                        else {
                            return 500
                        }
                    }
                }

                let client_arr = this.client.getClientsByGroup(reqDetails.partnerID as String, reqDetails.groupID as String);
                for (let i = 0; i < client_arr.length; i++) {
                    let client = this.client.getClientById(reqDetails.partnerID, client_arr[i]);
                    if (reqDetails.qty == 0 && client.symbols[reqDetails.sym] == undefined) {
                        console.log("Quantity is not defined for %d for client %s", reqDetails.sym, client.stxid);
                        continue;
                    }
                    let o = new Order();
                    o.group_id = reqDetails.groupID;
                    o.uid = client.stxid;
                    o.partner = reqDetails.partnerID as String;
                    o.orderId = order_id;
                    o.source = "algo";

                    o.exchange = reqDetails.exch;
                    o.sym = reqDetails.sym;
                    o.productType = reqDetails.pt; //MIS, BO, NRML
                    o.ordertype = reqDetails.ot; //LIMIT, MARKET
                    o.side = (reqDetails.action as string).toUpperCase();
                    o.qty = reqDetails.qty == 0 ? Number(client.symbols[reqDetails.sym]) : reqDetails.qty;
                    o.price = "LIMIT" == (reqDetails.ot as string).toUpperCase() ? 0.0 : Number.parseFloat(reqDetails.price);

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
    }

    public ProcessManualOrder(reqDetails: any) {
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
                    let o = new Order();

                    o.group_id = reqDetails.groupId;
                    o.uid = c.stxid;
                    o.partner = partner as String;
                    o.orderId = reqDetails.oid;
                    o.source = "manual";

                    o.exchange = reqDetails.exch;
                    o.sym = Number.parseInt(reqDetails.sym);
                    o.productType = reqDetails.pType
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

    public async cancelBracketOrder(reqDetails: any) {
        let partnerId = reqDetails.partner_id;
        let orderId = reqDetails.order_id;
        let data = await this.orders.getOrderData(orderId, partnerId);

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
                    let o = new Order();
                    o.appOrderId = e.appOrderId;
                    o.token = c.token
                    this.stoxkart.squareoffBracket(o);
                }
            }
            this.orders.removeOrderData(orderId, partnerId);

            return 200;
        }
    }

    public async onSuccess(res: any) {
        let result: Result = res;
        let resp = result.resp;

        if (resp.type == 'success') {
            let order_data: Order = result.order_data;
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
    }

    public onFailed(e: any) {
        console.log('On error %s', JSON.stringify(e));
    }

    private log(msg?: any, ...args: any): void {
        if (config.env == 0) {
            console.log(msg, args);
        }
    }

}

export = App;