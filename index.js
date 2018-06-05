/*
web3js-raw
Reusable set of functions to send transactions using sendRawTransaction of web3js
 * Copyright(c) 2018-2018 Chim Himidumage
 * MIT Licensed
*/

'use strict'

var Web3 = require('web3'); // https://www.npmjs.com/package/web3
var Web3Utils = require('web3-utils');
var Web3EthAccounts = require('web3-eth-accounts');
var Tx = require('ethereumjs-tx');
var coder = require('web3/lib/solidity/coder');
var CryptoJS = require('crypto-js');

var web3 = new Web3();

//Support Functions
module.exports = function (){

    this.ContractInstance;

    this.setProvider = function (provider){
        web3.setProvider(new web3.providers.HttpProvider(provider));
    }

    this.getWeb3 = function (){
        return web3;
    }

    this.createContractInstance = function (contractABI,contractAddress){
        var _contract = web3.eth.contract(contractABI);
        this.ContractInstance = _contract.at(contractAddress);
    }

    this.encodeFunctionParams = function(methodName, types, args){
        var fullName = methodName +  '(' + types.join() + ')';

        var signature = CryptoJS.SHA3(fullName,{outputLength:256}).toString(CryptoJS.enc.Hex).slice(0, 8);
        var dataHex = signature  + coder.encodeParams(types, args);
        var payload = '0x'+dataHex;

        return payload;
    }

    this.encodeFunctionParamsEx = function(abi,methodName, types1, args){
        var types = this.getFunctionParams(abi,methodName);
        var fullName = methodName +  '(' + types.join() + ')';
        var signature = CryptoJS.SHA3(fullName,{outputLength:256}).toString(CryptoJS.enc.Hex).slice(0, 8);
        var dataHex = signature  + coder.encodeParams(...types, args);
        var payload = '0x'+dataHex;

        return payload;
    }

    this.getFunctionParams = function(abi, funcName) {
        return abi.filter(function (json) {
            return json.type === "function" && json.name === funcName;
        }).map(function (json) {
            return json.inputs.map(function (input) {
                return input.type;
            });
        });
    }


    this.encodeConstructorParams = function (abi, params) {
        return abi.filter(function (json) {
            return json.type === 'constructor' && json.inputs.length === params.length;
        }).map(function (json) {
            return json.inputs.map(function (input) {
                return input.type;
            });
        }).map(function (types) {
            return coder.encodeParams(types, params);
        })[0] || '';
    };

    this.getSignedTransaction = function(txnRawData, pvtKey){
        var tx = new Tx(txnRawData);
        tx.sign(pvtKey);
        var serializedTx = '0x'+ tx.serialize().toString('hex');

        return serializedTx;
    }

    this.createNewAccountEx =  function() {

        return new Promise(function(resolve, reject) {
        var accounts = new Web3EthAccounts();
        var retObj =  accounts.create();
        if (retObj === null) {
            reject({"status":0,"message":"Account create failed"});
        }
        else {
            console.log(retObj);
            resolve({"address":retObj.address,"privateKey":retObj.privateKey});
        }

        });
    }

    this.invokeSendRawTransactionEx = function (functionName, transactionPayload){
        return new Promise((resolve, reject) =>{
            web3.eth.sendRawTransaction(transactionPayload, function(error, txHash) {
                if(!error){
                    resolve({"status":1,"functionName":functionName,"message":txHash});
                }
                else{
                    reject({"status":0,"functionName":functionName,"message":error});
                }
            });
        });
    }

    this.invokeGetTxnReceiptEx = function (tx_hash){
        return new Promise((resolve, reject) => {
            var txnInfo = web3.eth.getTransaction(tx_hash);
            if (txnInfo === null) {
                reject({"status":0,"message":"Transaction not found"});
            }
            else {
                resolve({"status":1,"message":txnInfo});
            }
        });
    }

    this.getDefaultTxnAttributes = function (nonce,fromAddress, toAddress, valueInEther,dataAsHex, gasLimit, gasPrice){

        var TxnAttributes = {
            nonce: '0x00',
            from: '0x00',
            to: '0x00',
            value: '0x00',
            data: '0x00',
            gasLimit: '0x00',
            gasPrice: '0x00'
        };

        if (nonce == '')
            nonce = web3.toHex(web3.eth.getTransactionCount(fromAddress));
        TxnAttributes.nonce = nonce;

        TxnAttributes.from = fromAddress;
        TxnAttributes.to = toAddress;
        TxnAttributes.value = web3.toHex(Web3Utils.toWei(valueInEther, 'ether'));
        TxnAttributes.data = dataAsHex;

        if (gasLimit == '')
            gasLimit = 4500000;
        TxnAttributes.gasLimit = web3.toHex(gasLimit);

        if (gasPrice == '')
            gasPrice = web3.eth.gasPrice;
        TxnAttributes.gasPrice = web3.toHex(gasPrice);

        return TxnAttributes;
    }
}
