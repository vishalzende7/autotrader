import { config } from "../config/config";


export class Clients {

    private _ref: FirebaseFirestore.CollectionReference;
    private today: number;
    static max_partner: number = 4;
    static max_client: number = 150;

    private clientdata: Map<String, ClientHeap>; //is map of all clients mapped as partner=>{map of users}
    public total_client: number;

    constructor(reff: FirebaseFirestore.CollectionReference) {
        this._ref = reff;
        this.clientdata = new Map();
        this.total_client = 0;
        let d = new Date();
        d.setHours(0, 0, 0, 0);
        this.today = d.getTime()/1000;
        console.log("date comparator ",this.today);
    }

    public async initClientAll() { //it should be called when server is started 
        try {
            let tmPartners = await this._ref.listDocuments(); //Retrive partners document list from database, consists reference to users collection
            if(config.env == 0)
                console.log("Init. of clients start for %d Partner/s", tmPartners.length);

            for (var i = 0; i < tmPartners.length; i++) {
                let uDocSnapshot = await tmPartners[i].collection('users')
                    .orderBy('lastUpdate', 'asc')
                    .startAt(this.today)
                    .get(); // get all usres from "token/partner/users"

                if (uDocSnapshot.empty) {
                    console.log("No latest document found for %s ",tmPartners[i].id);
                    continue;
                }

                var mcHeap = new ClientHeap();


                uDocSnapshot.forEach(ele => {
                    let uDoc = ele.data();

                    let tClient = new Client();
                    tClient.stxid = uDoc.stxid;
                    tClient.token = uDoc.token;
                    tClient.partner = tmPartners[i].id;
                    tClient.group = uDoc.group;
                    tClient.symbols = uDoc.symbols;

                    tClient.group.forEach(g => {
                        if (mcHeap.group.has(g)) {
                            mcHeap.group.get(g).push(tClient.stxid);
                        }
                        else {
                            mcHeap.group.set(g, [tClient.stxid]);
                        }
                    });
                    mcHeap.lastUpdate = uDoc.lastUpdate;
                    mcHeap.heap.set(uDoc.stxid, tClient);
                    this.total_client++;
                });
                this.clientdata.set(tmPartners[i].id, mcHeap);
            }
            if(config.env == 0)
                console.log("clients data init client", this.clientdata);
        }
        catch (err) {
            console.log("%s : error while initAll at client.ts:69 ", new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }), err);
        }
    }

    public async refeshToken(partnerId: String) {
        try {

            let qResult: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>;
            if (this.clientdata.size == 0 || !this.clientdata.has(partnerId)) {
                qResult = await this._ref.doc(partnerId.toString()).collection('users')
                    .orderBy('lastUpdate', 'asc')
                    .startAfter(this.today)
                    .get();


            }
            else {
                qResult = await this._ref.doc(partnerId.toString()).collection('users')
                    .orderBy('lastUpdate', 'asc')
                    .startAfter(this.clientdata.get(partnerId).lastUpdate)
                    .get();
            }

            if (qResult.empty) {
                this.log(partnerId + " is Empty.");
                return 0;
            }
            if (this.clientdata.size == 0 || !this.clientdata.has(partnerId)) {
                this.clientdata.set(partnerId, new ClientHeap());
            }
            qResult.docs.forEach(ele => {
                //check ele is present or not in memory

                let uDoc = ele.data();

                if (this.clientdata.get(partnerId).heap.has(uDoc.stxid)) {
                    //user is present
                    if(config.env == 0)
                        console.log("Update received %s", uDoc.stxid);

                    let mHeap = this.clientdata.get(partnerId);
                    let nClient = new Client();
                    let oClient = mHeap.heap.get(uDoc.stxid);

                    nClient.stxid = uDoc.stxid;
                    nClient.token = uDoc.token;
                    nClient.partner = partnerId.toString();
                    nClient.group = uDoc.group;
                    nClient.symbols = uDoc.symbols;

                    //Delete uer from Old Group
                    oClient.group.forEach(ele => {
                        if (!nClient.group.includes(ele)) {
                            this.log('perform delete ', ele);
                            let oldGrp = mHeap.group.get(ele);
                            oldGrp.splice(oldGrp.indexOf(oClient.stxid), 1);
                            this.log("list of old groups %s",JSON.stringify(oldGrp));
                        }
                    });

                    //Add Client to new group
                    nClient.group.forEach(g => {
                        if (mHeap.group.has(g)) {
                            if (!mHeap.group.get(g).includes(nClient.stxid))
                                mHeap.group.get(g).push(nClient.stxid);
                        }
                        else {
                            mHeap.group.set(g, [nClient.stxid]);
                        }
                    });

                    mHeap.lastUpdate = uDoc.lastUpdate;
                    mHeap.heap.set(nClient.stxid, nClient);

                }
                else {
                    //user is not present
                    this.total_client++;
                    let tClient = new Client();
                    tClient.stxid = uDoc.stxid;
                    tClient.token = uDoc.token;
                    tClient.partner = partnerId.toString();
                    tClient.group = uDoc.group;
                    tClient.symbols = uDoc.symbols;

                    this.clientdata.get(partnerId).heap.set(uDoc.stxid, tClient);
                    let mcHeap = this.clientdata.get(partnerId);

                    tClient.group.forEach(g => {
                        if (mcHeap.group.has(g)) {
                            mcHeap.group.get(g).push(tClient.stxid);
                        }
                        else {
                            mcHeap.group.set(g, [tClient.stxid]);
                        }
                    });

                    mcHeap.lastUpdate = uDoc.lastUpdate;
                }
            });
            
            this.log("client data in refresh token ",this.clientdata);
            return this.total_client;
        }
        catch (err) {
            console.log("%s: error while refreshtoken at client.ts:172 ",new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }), err);
            return 0;
        }
    }

    public getClientById(partner: String, client_id: String): Client {
        if (this.clientdata.has(partner)) {
            return this.clientdata.get(partner).heap.get(client_id)
        }
        return null;
    }

    public getClientsByGroup(partner: String, group: String): Array<String> {
        if (this.clientdata.has(partner)) {
            return this.clientdata.get(partner).group.get(group); //return array containing STXID or undefined, if no group exists
        }
        return [];
    }

    private log(msg?:any,...args:any) {
        if (config.env == 0) {
            console.log(msg,args);
        }
    }

}

//list datastructure for all users of a perticular client (partner)
export class ClientHeap {
    public lastUpdate: number;
    public heap: Map<String, Client>; //actual clients storage map where String is STXID and client is client datastructure
    public group: Map<String, Array<String>>; //<GroupName, Array of client's STXID>

    constructor() {
        this.heap = new Map(); //actual client storage
        this.group = new Map(); //client group wise id storage
    }
}
export class Client {
    private _stxid: string;
    private _group: Array<string>;
    private _token: string;
    private _symbols: Array<Object>;
    private _partner: string;


    public set partner(v: string) {
        this._partner = v;
    }


    public get partner(): string {
        return this._partner;
    }


    public set stxid(v: string) {
        this._stxid = v;
    }


    public set group(v: Array<string>) {
        this._group = v;
    }


    public set token(v: string) {
        this._token = v;
    }


    public set symbols(v: Array<Object>) {
        this._symbols = v;
    }


    public get stxid(): string {
        return this._stxid;
    }


    public get token(): string {
        return this._token;
    }


    public get group(): Array<string> {
        return this._group;
    }


    public get symbols(): Array<Object> {
        return this._symbols;
    }



}