
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

    public dumpFakeData() {
        const p_num = 4;
        const c_pp = 5;

        for (let i = 0; i < p_num; i++) {

            let pDocRef = this.firestore.getDocumentRef('tokens/fin100321' + i).collection('users');
            let memUsage = 0;
            memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
            console.log("before loop %.2f MB", (Math.round(memUsage * 100) / 100))
            for (let j = 0; j < c_pp; j++) {
                memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
                console.log("In Loop before %.2f MB", (Math.round(memUsage * 100) / 100))
                let xtsid: string = 'BD' + i + j + (2 * j);
                var t_data = {
                    token: 'bbcnndhhfd77dhhfjjsjd' + j,
                    group: ['OptionTrader', 'ALGO'],
                    symbols: { 10999: 10, 10666: 100 },
                    stxid: xtsid,
                    lastUpdate: Date.now()
                };
                memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
                console.log("In Loop after %.2f MB", (Math.round(memUsage * 100) / 100))
                pDocRef.doc(xtsid).set(t_data);

            }
            memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
            console.log("after loop %.2f MB", (Math.round(memUsage * 100) / 100))
        }
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

        this.log("Processing Manual order! asynchronusly");

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
                o.productType = reqDetails.pType
                o.ordertype = reqDetails.oType;
                o.side = reqDetails.side;
                o.qty = reqDetails.qty == 0 ? Number(c.symbols[reqDetails.sym]) : reqDetails.qty;
                o.price = Number.parseFloat(reqDetails.price);

                o.token = c.token;

                this.stoxkart.normalOrder(o);
            }

        });
        console.log("Finished order processing");
    }

    public placeOrder(c: Client) {
        let o = new Order();

        return 0;
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