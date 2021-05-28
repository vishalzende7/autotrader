
import { Client, Clients } from './clients/client';
import { db } from './firestore/core';
import { CallBack, Order, Stoxkart } from './core/Stoxkart';
import { config } from './config/config';



class App implements CallBack {
    private firestore: db;
    private count: number = 0;
    private client: Clients = null;
    private stoxkart: Stoxkart = null;
    constructor() {
        this.firestore = new db();
        this.stoxkart = new Stoxkart(this);
    }


    public install() {
        //create direstore db structure
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

    public ProcessOrderAlgo(reqDetails: any) {

        //Not completed, review through code once

        if (this.client == null)
            return;
        if (reqDetails == null)
            return;

        this.log("Processing algo order! asynchronusly");

        const partner = reqDetails.partnerId;

        let client_arr = this.client.getClientsByGroup(partner, reqDetails.groupId);
        client_arr.forEach(element => {
            let c = this.client.getClientById(partner, element);
            if (reqDetails.qty == 0 && c.symbols[reqDetails.sym] == undefined) {
                console.log("qty is not defined for %d for client %s", reqDetails.sym, c.stxid);
            }
            else {
                let o = new Order();

                o.uid = c.stxid;
                o.exchange = reqDetails.exch;
                o.sym = Number.parseInt(reqDetails.sym);
                o.ordertype = reqDetails.oType;
                o.side = reqDetails.side;
                o.qty = Number(c.symbols[reqDetails.sym]);
                o.price = Number.parseFloat(reqDetails.price);
                o.stopLoss = Number.parseFloat(reqDetails.sl);
                o.target = Number.parseFloat(reqDetails.tgt);

                o.token = c.token;

                this.stoxkart.bracketOrder(o);
            }

        });

    }

    public ProcessManualOrder(reqDetails: any) {
        if (this.client == null)
            return;
        if (reqDetails == null)
            return;

        const partner = reqDetails.partnerId;
        this.log("Processing Manual order! asynchronusly for %s ",partner);
        console.log(reqDetails);
        let client_arr = this.client.getClientsByGroup(partner, reqDetails.groupId);
        client_arr.forEach(element => {
            let c = this.client.getClientById(partner, element);
            if (reqDetails.qty == 0 && c.symbols[reqDetails.sym] == undefined) {
                console.log("qty is not defined for %d for client %s", reqDetails.sym, c.stxid); //push to log stack *new feature yet to be created
            }
            else {
                let o = new Order();

                o.uid = c.stxid;
                o.partner = partner as String;

                o.exchange = reqDetails.exch;
                o.sym = Number.parseInt(reqDetails.sym);
                o.productType = reqDetails.pType
                o.ordertype = reqDetails.oType;
                o.side = reqDetails.side;
                o.qty = reqDetails.qty == 0 ? Number(c.symbols[reqDetails.sym]) : reqDetails.qty;
                o.price = 'MARKET' == String(reqDetails.oType).toUpperCase()? 0.0:Number.parseFloat(reqDetails.price);

                o.token = c.token;

                if(reqDetails.pType == 'BO'){
                    o.target = Number.parseFloat(reqDetails.tgt);
                    o.stopLoss = Number.parseFloat(reqDetails.sl);
                    this.stoxkart.bracketOrder(o);
                }   
                else{
                    this.stoxkart.normalOrder(o);
                }
            }

        });
        console.log("Finished order processing for %s ",partner);
    }

    public onSuccess(res: any) {
        this.log('On Success ', res);
    }

    public onFailed(e: any) {
        this.log('On error ', e);
    }

    private log(msg?: any, ...args: any[]): void {
        if (config.env == 0) {
            console.log(msg, args);
        }
    }

}

export = App;