/*******************************************************************************
web3js-raw
Reusable set of functions to send transactions using sendRawTransaction of web3js
 * Copyright(c) 2018-2018 Chim Himidumage
 * MIT Licensed

2018/06/13  - Introduced promises to all Async calls
            - Updated all dependencies to latest versions
            - Used <new web3.eth.Contract> for contract instance creation
2018/06/22  - Made web3.eth.getTransaction function call Async with async & await

2018/06/24  - getWeb3 now accepts ABI, Contract address and provider. Then initialise Web3 instance for the given contract

2018/07/03  - Introduced gasEstimate function to find the exact gas requirment
            - Included gasLimit parameter to prepareSignSend, so the gasLimit can be set from the caller

2018/08/08  - Ability to get web3 instance wihtout binding to a contract (getWeb3Base)

2018/08/09  - Introduce error handling, updated try-catch on getWeb3, prepareSignSend, invokeGetTxnReceipt, getDefaultTxnAttributes
            - Removed invokeSendRawTransaction, and included the web3.eth.sendSignedTransaction inside prepareSignSend itself

2018/08/10  - Removed the Promise around sendSignedTransaction as  __prepareSignSend__ is already an async function

********************************************************************************/

'use strict'

var Web3 = require('web3'); // https://www.npmjs.com/package/web3
var Web3Utils = require('web3-utils');
var Web3EthAccounts = require('web3-eth-accounts');
var Tx = require('ethereumjs-tx');
var Web3EthAbi = require('web3-eth-abi');
var CryptoJS = require('crypto-js');

var web3 = new Web3();

//Support Functions
module.exports = function (){
    this.ContractInstance;

    this.setProvider = function (provider){
        web3.setProvider(new web3.providers.HttpProvider(provider));
    }

    this.getWeb3 = async function (contractABI,contractAddress,provider){
        try{
            web3.setProvider(new web3.providers.HttpProvider(provider));
            this.ContractInstance = await new web3.eth.Contract(contractABI,contractAddress);
            return web3;
        }
        catch (err){
            return null;
        }
    }

    this.getWeb3Base = function (provider){
        if(!provider) {
          return web3;
        }
        else {
          web3.setProvider(new web3.providers.HttpProvider(provider));
          return web3;
        }
    }

    this.createContractInstance = function (contractABI,contractAddress){
        this.ContractInstance = new web3.eth.Contract(contractABI,contractAddress);
    }

    this.encodeFunctionParams = function(abi,methodName, params){
        var types = this.getFunctionParams(abi,methodName);
        var fullName = methodName +  '(' + types.join() + ')';
        var signature = CryptoJS.SHA3(fullName,{outputLength:256}).toString(CryptoJS.enc.Hex).slice(0, 8);
        var dataHex = signature  + Web3EthAbi.encodeParameters(...types, params).substring(2);

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
            return Web3EthAbi.encodeParameters(types, params);

        })[0] || '';
    };

    this.getSignedTransaction = function(txnRawData, pvtKey){
        var tx = new Tx(txnRawData);
        tx.sign(pvtKey);
        var serializedTx = tx.serialize();
        var txToSend =  '0x' + serializedTx.toString('hex');

        return txToSend;
    }

    this.createNewAccount =  function() {
        return new Promise(function(resolve, reject) {
            var accounts = new Web3EthAccounts();
            var retObj =  accounts.create();
            if (retObj === null) {
                reject({"status":0,"message":"Account create failed"});
            }
            else {
                resolve({"address":retObj.address,"privateKey":retObj.privateKey});
            }
        });
    }
    this.prepareSignSend = async function(abi,contractAddress,functionName,senderAddress,privateKey, params, gasLimit){
        try{
            var txnData = this.encodeFunctionParams(abi, functionName,  params);
            var _gasLimit = await this.ContractInstance.methods[functionName](...params).estimateGas({'from': senderAddress, 'gas': gasLimit});
            var txnRawData = await this.getDefaultTxnAttributes('',senderAddress,contractAddress,'0',txnData,_gasLimit,'')
            if (txnRawData) {
                var dataToSend = this.getSignedTransaction(txnRawData, privateKey);
                var txHash = await web3.eth.sendSignedTransaction(dataToSend);
                return Promise.resolve({"status":1,"functionName":functionName,"message":txHash});
            }
            else{
                return Promise.reject({"status":0,"functionName":functionName,"message":"Error in setting Default Txn Attributes"});
            }
        }
        catch (err){
            return Promise.reject({"status":0,"functionName":functionName,"message":err});
        }
    }

    this.invokeGetTxnReceipt = function (tx_hash){
        return new Promise(async (resolve, reject) => {
            try{
                var txnInfo = await web3.eth.getTransaction(tx_hash);
                if (txnInfo === null) {
                    reject({"status":0,"message":"Transaction not found"});
                }
                else {
                    resolve({"status":1,"message":txnInfo});
                }
            }
            catch (err){
                reject({"status":0,"message":err});
            }
        });
    }

    this.getDefaultTxnAttributes = async function (nonce,fromAddress, toAddress, valueInEther,dataAsHex, gasLimit, gasPrice){

        var TxnAttributes = {
            nonce: '0x00',
            from: '0x00',
            to: '0x00',
            value: '0x00',
            data: '0x00',
            gasLimit: '0x00',
            gasPrice: '0x00'
        };
        try{
            if (nonce == '') {
                var _nonce =  await web3.eth.getTransactionCount(fromAddress);
                nonce =   Web3Utils.toHex(_nonce);
            }
            TxnAttributes.nonce = nonce;

            TxnAttributes.from = fromAddress;
            TxnAttributes.to = toAddress;
            TxnAttributes.value = Web3Utils.toHex(Web3Utils.toWei(valueInEther, 'ether'));
            TxnAttributes.data = dataAsHex;

            if (gasLimit == '')
                gasLimit = 750000;
            TxnAttributes.gasLimit = Web3Utils.toHex(gasLimit);

            if (gasPrice == '')
                gasPrice = await web3.eth.getGasPrice();
            TxnAttributes.gasPrice = Web3Utils.toHex(gasPrice);

            console.log("TxnAttributes",TxnAttributes);
            return TxnAttributes;
        }
        catch (err)
        {
            return null;
        }
    }
}
