"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnerConverter = exports.Partner = void 0;
const core_1 = require("../firestore/core");
class Partner {
    constructor(stxid, id, name, created) {
        this._stxID = stxid;
        this._id = id;
        this._name = name;
        this._created = created;
    }
    set stxID(v) {
        this._stxID = v;
    }
    set id(v) {
        this._id = v;
    }
    set name(v) {
        this._name = v;
    }
    set created(v) {
        this._created = v;
    }
    get stxID() {
        return this._stxID;
    }
    get id() {
        return this._id;
    }
    get name() {
        return this._name;
    }
    get created() {
        return this._created;
    }
}
exports.Partner = Partner;
class PartnerConverter extends core_1.Converter {
    constructor() {
        super();
    }
    fromFirestore(snapshot) {
        let data = snapshot.data();
        let p = new Partner(data.stxid, data.id, data.name, data.created);
        return p;
    }
    toFirestore(param) {
        let data = {
            name: param.name,
            id: param.id,
            stxid: param.stxID,
            created: param.created
        };
        return data;
    }
}
exports.PartnerConverter = PartnerConverter;
//# sourceMappingURL=partner.js.map