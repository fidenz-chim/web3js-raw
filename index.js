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

"use strict";

const { Web3 } = require("web3"); // https://www.npmjs.com/package/web3
var Web3Utils = require("web3-utils");
var { LegacyTransaction } = require("@ethereumjs/tx");

var Web3EthAbi = require("web3-eth-abi");
var CryptoJS = require("crypto-js");

//Support Functions
module.exports = function (provider) {
  this.ContractInstance;
  this.web3 = new Web3(provider);

  this.setProvider = function (provider) {
    this.web3.setProvider(new this.web3.providers.HttpProvider(provider));
  };

  this.getWeb3 = async function (contractABI, contractAddress) {
    try {
      this.ContractInstance = await new this.web3.eth.Contract(
        contractABI,
        contractAddress
      );
      return this.web3;
    } catch (err) {
      console.log("Error in getWeb3", err);
      return null;
    }
  };

  this.getWeb3Base = function (provider) {
    if (!provider) {
      return this.web3;
    } else {
      this.web3.setProvider(new this.web3.providers.HttpProvider(provider));
      return this.web3;
    }
  };

  this.createContractInstance = function (contractABI, contractAddress) {
    this.ContractInstance = new this.web3.eth.Contract(
      contractABI,
      contractAddress
    );
  };

  this.encodeFunctionParams = function (abi, methodName, params) {
    var types = this.getFunctionParams(abi, methodName);
    var fullName = methodName + "(" + types.join() + ")";
    var signature = CryptoJS.SHA3(fullName, { outputLength: 256 })
      .toString(CryptoJS.enc.Hex)
      .slice(0, 8);
    var dataHex =
      signature + Web3EthAbi.encodeParameters(...types, params).substring(2);

    var payload = "0x" + dataHex;

    return payload;
  };

  this.getFunctionParams = function (abi, funcName) {
    return abi
      .filter(function (json) {
        return json.type === "function" && json.name === funcName;
      })
      .map(function (json) {
        return json.inputs.map(function (input) {
          return input.type;
        });
      });
  };

  this.encodeConstructorParams = function (abi, params) {
    return (
      abi
        .filter(function (json) {
          return (
            json.type === "constructor" && json.inputs.length === params.length
          );
        })
        .map(function (json) {
          return json.inputs.map(function (input) {
            return input.type;
          });
        })
        .map(function (types) {
          return Web3EthAbi.encodeParameters(types, params);
        })[0] || ""
    );
  };

  this.getSignedTransaction = function (txnRawData, pvtKey) {
    var tx = LegacyTransaction.fromTxData(txnRawData);
    var signedTx = tx.sign(pvtKey);
    var serializedTx = signedTx.serialize();
    var txToSend = "0x" + serializedTx.toString("hex");

    return txToSend;
  };

  this.createNewAccount = function (web3 = this.web3) {
    return new Promise(function (resolve, reject) {
      var accounts = web3.eth.accounts;
      var retObj = accounts.create();
      if (retObj === null) {
        reject({ status: 0, message: "Account create failed" });
      } else {
        resolve({ address: retObj.address, privateKey: retObj.privateKey });
      }
    });
  };
  this.prepareSignSend = async function (
    abi,
    contractAddress,
    functionName,
    senderAddress,
    privateKey,
    valueInWei = "0x00",
    params,
    gasLimit
  ) {
    try {
      var txnData = this.encodeFunctionParams(abi, functionName, params);
      var _gasLimit = await this.ContractInstance.methods[functionName](
        ...params
      ).estimateGas({ from: senderAddress, gas: gasLimit, value: valueInWei });
      var txnRawData = await this.getDefaultTxnAttributes(
        "",
        senderAddress,
        contractAddress,
        valueInWei,
        txnData,
        _gasLimit,
        ""
      );
      if (txnRawData) {
        var dataToSend = await this.web3.eth.accounts.signTransaction(
          txnRawData,
          privateKey
        );
        var txHash = await this.web3.eth.sendSignedTransaction(
          dataToSend.rawTransaction
        );
        return Promise.resolve({
          status: 1,
          functionName: functionName,
          message: txHash,
        });
      } else {
        return Promise.reject({
          status: 0,
          functionName: functionName,
          message: "Error in setting Default Txn Attributes",
        });
      }
    } catch (err) {
      return Promise.reject({
        status: 0,
        functionName: functionName,
        message: err,
      });
    }
  };

  this.invokeGetTxnReceipt = function (tx_hash, web3 = this.web3) {
    return new Promise(async (resolve, reject) => {
      try {
        var txnInfo = await web3.eth.getTransaction(tx_hash);
        if (txnInfo === null) {
          reject({ status: 0, message: "Transaction not found" });
        } else {
          resolve({ status: 1, message: txnInfo });
        }
      } catch (err) {
        reject({ status: 0, message: err });
      }
    });
  };

  this.getDefaultTxnAttributes = async function (
    nonce,
    fromAddress,
    toAddress,
    valueInWei,
    dataAsHex,
    gasLimit,
    gasPrice
  ) {
    var TxnAttributes = {
      nonce: "0x00",
      to: "0x00",
      value: "0x00",
      data: "0x00",
      gasLimit: "0x00",
      gasPrice: "0x00",
    };
    try {
      if (nonce == "") {
        nonce = await this.web3.eth.getTransactionCount(fromAddress, "latest");
      }
      TxnAttributes.nonce = nonce;

      TxnAttributes.to = toAddress;
      TxnAttributes.value = valueInWei;
      TxnAttributes.data = dataAsHex;

      if (gasLimit == "") gasLimit = 750000;
      TxnAttributes.gasLimit = Web3Utils.toHex(gasLimit);

      if (gasPrice == "") gasPrice = await this.web3.eth.getGasPrice();
      TxnAttributes.gasPrice = Web3Utils.toHex(gasPrice);

      return TxnAttributes;
    } catch (err) {
      return null;
    }
  };
};
