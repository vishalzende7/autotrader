import { Converter } from '../firestore/core';

export class Partner{
    private _stxID: any;
    private _id:any;
    private _name:any
    private _created:any;
    
    constructor(stxid,id,name,created){
        this._stxID = stxid;
        this._id = id;
        this._name = name;
        this._created = created;
    }

    public set stxID(v : any) {
        this._stxID = v;
    }
    
    public set id(v : any) {
        this._id = v;
    }
    
    
    public set name(v : any) {
        this._name = v;
    }

    
    public set created(v : any) {
        this._created = v;
    }
    
    
    public get stxID() : any {
        return this._stxID;
    }

    
    public get id() : any {
        return this._id
    }
    
    
    public get name() : any {
        return this._name;
    }

    
    public get created() : any {
        return this._created;
    }
    
        
}

export class PartnerConverter extends Converter<Partner> {
    constructor(){
        super();
    }
    public fromFirestore(snapshot:any){
        let data = snapshot.data();
        let p = new Partner(data.stxid,data.id,data.name,data.created);
        return p;
    }

    public toFirestore(param:Partner){
        let data = {
            name:param.name,
            id: param.id,
            stxid:param.stxID,
            created:param.created
        };      
        return data;
    }   
}

