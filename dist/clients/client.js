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
exports.Client = exports.ClientHeap = exports.Clients = void 0;
const config_1 = require("../config/config");
class Clients {
    constructor(reff) {
        this._ref = reff;
        this.clientdata = new Map();
        this.total_client = 0;
        let d = new Date();
        d.setHours(0, 0, 0, 0);
        this.today = d.getTime() / 1000;
        console.log(this.today);
    }
    initClientAll() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let tmPartners = yield this._ref.listDocuments(); //Retrive partners document list from database, consists reference to users collection
                this.log("Init. of clients start for " + tmPartners.length + ' Partner/s');
                for (var i = 0; i < tmPartners.length; i++) {
                    let uDocSnapshot = yield tmPartners[i].collection('users')
                        .orderBy('lastUpdate', 'asc')
                        .startAt(this.today)
                        .get(); // get all usres from "token/partner/users"
                    if (uDocSnapshot.empty) {
                        console.log('No latest document found for ' + tmPartners[i].id);
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
                this.log(this.clientdata);
            }
            catch (err) {
                console.log("%s : error while initAll at client.ts:69 ", new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }), err);
            }
        });
    }
    refeshToken(partnerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let qResult;
                if (this.clientdata.size == 0 || !this.clientdata.has(partnerId)) {
                    qResult = yield this._ref.doc(partnerId.toString()).collection('users')
                        .orderBy('lastUpdate', 'asc')
                        .startAfter(this.today)
                        .get();
                }
                else {
                    qResult = yield this._ref.doc(partnerId.toString()).collection('users')
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
                        console.log("Update received ", uDoc.stxid);
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
                                console.log('perform delete ', ele);
                                let oldGrp = mHeap.group.get(ele);
                                oldGrp.splice(oldGrp.indexOf(oClient.stxid), 1);
                                console.log(oldGrp);
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
                this.log(this.clientdata);
                return this.total_client;
            }
            catch (err) {
                console.log("%s: error while refreshtoken at client.ts:172 ", new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }), err);
                return 0;
            }
        });
    }
    getClientById(partner, client_id) {
        if (this.clientdata.has(partner)) {
            return this.clientdata.get(partner).heap.get(client_id);
        }
        return null;
    }
    getClientsByGroup(partner, group) {
        if (this.clientdata.has(partner)) {
            return this.clientdata.get(partner).group.get(group);
        }
        return [];
    }
    log(args) {
        if (config_1.config.env == 0) {
            console.log(args);
        }
    }
}
exports.Clients = Clients;
Clients.max_partner = 4;
Clients.max_client = 150;
class ClientHeap {
    constructor() {
        this.heap = new Map(); //actual client storage
        this.group = new Map(); //clinet group wise id storage
    }
}
exports.ClientHeap = ClientHeap;
class Client {
    set partner(v) {
        this._partner = v;
    }
    get partner() {
        return this._partner;
    }
    set stxid(v) {
        this._stxid = v;
    }
    set group(v) {
        this._group = v;
    }
    set token(v) {
        this._token = v;
    }
    set symbols(v) {
        this._symbols = v;
    }
    get stxid() {
        return this._stxid;
    }
    get token() {
        return this._token;
    }
    get group() {
        return this._group;
    }
    get symbols() {
        return this._symbols;
    }
}
exports.Client = Client;
//# sourceMappingURL=client.js.map