import { config } from "../config/config";
import * as admin from 'firebase-admin';
const cert = require('../autotrader-main-150bc3bef908.json');

export class db {
    private _mydb:admin.firestore.Firestore;
    constructor(){
        if(config.gcDatabase == 0){
            //init localhost
            admin.initializeApp({
                projectId:config.gcProjectID
            });

        }
        else{
            //init live
            console.log("Initialising db 1 ",cert);
            admin.initializeApp({
                credential:admin.credential.cert(cert),
                databaseURL:"https://autotrader-main .firebaseio.com"
            });
        }
        this._mydb = admin.firestore();
    }

    /*
    @{path} eg. collection/document
    */
    public getDocumentRef(path:string){
        return this._mydb.doc(path);
    }

    public getCollectionReff(collection:string){
        return this._mydb.collection(collection);
    }

    public getAuth(){
        return admin.auth();    
    }
}

export abstract class Converter<T> implements admin.firestore.FirestoreDataConverter<T> {
    abstract toFirestore(params:T):admin.firestore.DocumentData;
    abstract fromFirestore(snapshot:admin.firestore.QueryDocumentSnapshot):T;
}