"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Converter = exports.db = void 0;
const config_1 = require("../config/config");
const admin = require("firebase-admin");
class db {
    constructor() {
        if (config_1.config.gcDatabase == 0) {
            //init localhost
            admin.initializeApp({
                projectId: config_1.config.gcProjectID
            });
        }
        else {
            //init live
        }
        this._mydb = admin.firestore();
    }
    /*
    @{path} eg. collection/document
    */
    getDocumentRef(path) {
        return this._mydb.doc(path);
    }
    getCollectionReff(collection) {
        return this._mydb.collection(collection);
    }
    getAuth() {
        return admin.auth();
    }
}
exports.db = db;
class Converter {
}
exports.Converter = Converter;
//# sourceMappingURL=core.js.map