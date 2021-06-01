import * as request from 'request-promise';
import { config } from '../config/config';

export class Stoxkart {
    private restApi = {
        "session": "/user/session",
        "profile": "/user/profile",
        "balance": "/user/balance",
        "orders": "/orders",
        "bracket": "/orders/bracket",
        "trade": "/orders/trades",
        "position": "/portfolio/positions",
        "candleBO":"/orders/bracket?boEntryOrderId=",
        "prod_url":"https://tradelite.stoxkart.com/interactive"
    }

    private _callback:CallBack;

    public constructor(cb:CallBack) {
        this._callback = cb;
        
     }

    public bracketOrder(od:Order) {
        let option = {
            method:'POST',
            url:this.restApi.prod_url+this.restApi.bracket,
            headers:{
                Header:"Content-Type:application/json",
                authorization:od.token
            },
            body:{
                clientID:od.uid,
                exchangeSegment:od.exchange,
                exchangeInstrumentID:od.sym,
                orderType:od.ordertype,
                orderSide:od.side,
                disclosedQuantity:od.qty,
                orderQuantity:od.qty,
                limitPrice:od.price,
                stopLossPrice:od.stopLoss,
                trailingStoploss:0,
                squarOff:od.target,
                orderUniqueIdentifier:String(od.partner+"_"+od.uid)
            },
            json:true
        };

        if(config.env == 0){
            console.log("Option Data ",option);
        }

        if(config.apiCall == 0){
            console.log("Order is not placed, check config.ts->apiCall ",option);
            return;
        }
        
        let mInstance = this;
        request(option)
        .then(function success(res){
            let r = new Result();
            r.status = 200;
            r.type = 'SUCCESS';
            r.order_data = od;
            r.resp = res;
            mInstance._callback.onSuccess(r);
        })
        .catch(function error(e) {
            let r = new Result();
            r.status = e.statusCode;
            r.type = 'ERROR';
            r.resp = e;
            mInstance._callback.onFailed(r);
        });
    }

    public squareoffBracket(od:Order){
        let options = {
            method:"DELETE",
            url:this.restApi.prod_url+this.restApi.candleBO+od.appOrderId,
            headers:{
                authorization:od.token
            }
        };

    }

    public normalOrder(od:Order) {

        var options = {
            method:"POST",
            uri:this.restApi.prod_url+this.restApi.orders,
            headers:{
                Header:"Content-Type:applicstion/json",
                authorization:od.token
            },
            body:{
                exchangeSegment:od.exchange,
                exchangeInstrumentID:od.sym,
                productType:od.productType, // NRML,CNC,MIS,
                orderType:od.ordertype, //LIMIT, MARKET, STOPLIMIT,STOPMARKET,COVERORDER
                orderSide:od.side,
                timeInForce:"DAY",
                disclosedQuantity:od.qty,
                orderQuantity:od.qty,
                limitPrice:od.price,
                stopPrice:0,
                orderUniqueIdentifier:String(od.partner+"_"+od.uid)
            },
            json:true
        };

        if(config.apiCall == 0){
            console.log("Order is not placed, check config.ts->apiCall ",options);
            return;
        }
        if(config.env == 0){
            console.log("Option Data ",options);
        }

        let mInstance = this;
        request(options)
        .then(function success(res){
            let r = new Result();
            r.status = 200;
            r.type = 'SUCCESS';
            r.order_data = od;
            r.resp = res;
            mInstance._callback.onSuccess(r);

        }).catch(function error(e) {
            let r = new Result();
            r.status = e.statusCode;
            r.type = 'ERROR';
            r.resp = e;
            mInstance._callback.onFailed(r);

        });
        return;
    }

    private log(msg?:any, ...args:any[]):void {
        if (config.env == 0) {
            console.log(msg,args);
        }
    }
}

/*
* this class will register callback
* make a request return
* callback received result
* 
*/

export class Order{
    public uid:String;
    public token:String;
    public partner:String;
    public orderId:String; //my uinque id for sql database and manipulation (like cancel, squareoff)
    public sym:Number;
    public qty:Number;
    public side:String;
    public price:Number;
    public stopLoss:Number;
    public target:Number;
    public exchange:String;
    public ordertype:String;
    public appOrderId:String;
    public productType:String;
    public group_id:string;
}

export class Result {

    public status:Number;
    public type:String;
    public resp:String;
    public order_data:any;

    public constructor(){}
}

export interface CallBack{
    onSuccess(result:Result):void
    onFailed(result:Result):void
}