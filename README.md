# web3js-raw #
Set of functions which eleminates all additional dependencies from invoking a menthod in Ethereum platform.
This uses __sendRawTransaction__ method to post transactions but encapsulate all tedeous data preparations and data sigining tasks. Only downside is, having to provide the private key of the account which interacts with the smart contract. Following documentation assumes you will interact with Ropsten test net via infura.io, but module should work with any implementation of Ethereum network.

## Sample Dapp using web3js-raw ##

Refer [Fund Splitter smart contract dapp (fundsplitter_web3jsraw)](https://github.com/fidenz-chim/fundsplitter_web3jsraw.git) for fully funcational implementation of a Dapp using web3js-raw

## Prerequisite ##

* ABI of the contract
* Account with Ether balance (to deploy the contract)
* Private key of the contract
* Address of the contract (if you want to interact with already deployed contract)
or
* Byte code of the contract (if you want to deploy a new contract)

## Install ##
```
npm install web3js-raw --save
```

## Use cases ##
Instantiate the package and then a contract
```
var _web3jsraw = require('web3js-raw');
var W3JSR = new _web3jsraw();
W3JSR.setProvider('https://ropsten.infura.io/{your_infura.io_token'});
W3JSR.createContractInstance(CONTRACT_ABI,contractAddress); //Assuming the contract is already deployed to ropsten testnet
```

Define a callback function 
```
var web3jsrCallaback = function (data){
    console.log("web3jsrCallaback - ", data);
}

```
There are __THREE__ main usage scenarios to interact with a smart contract using this package,
#### Invoke a method __DOES NOT__ change the state of the contract ####
```
//.sol
    function getMemberAt(uint index) public view returns(address mem)
```

```
//.js
    W3JSR.ContractInstance.getMemberAt(index,function(error, result){
        if(!error){
            console.log("getMemberAt - ", result);
            var str= "MemberAt - ".concat(result);
            console.log(str);
        }
        else
            console.error(error);
    });
```
#### Invoke a method __DOES__ change the state of the contract ####
```
//.sol
    function addMember(address newMember) payable public
```

```
//.js
    var functionName = 'addMember';
    var types = ['address'];
    var args = ['0x00002d5cc95777ed0f1dbcac9b5a30fb1868eea4'];

    var txnData = W3JSR.encodeFunctionParams(functionName, types, args);
    var txnRawData = W3JSR.getDefaultTxnAttributes('',contractOwner,CONTRACT_ADDRESS,'0',txnData,'','')
    var serializedTx = W3JSR.getSignedTransaction(txnRawData, privateKey);

    W3JSR.invokeSendRawTransaction(functionName,serializedTx,web3jsrCallaback);
```

#### Deploy a contract ####
```
//.js
    var txnRawData = W3JSR.getDefaultTxnAttributes('',contractOwner,'','0',CONTRACT_CODE,'',10000000000);

    var args = [];
    var bytes = W3JSR.encodeConstructorParams(CONTRACT_ABI, args);
    txnRawData.data += bytes;

    var serializedTx = W3JSR.getSignedTransaction(txnRawData, privateKey);
    W3JSR.invokeSendRawTransaction("DeployContract",serializedTx,web3jsrCallaback );
```

## List of functions ##

* __setProvider__ - set HTTP provider 
  * in params
    * provider [https://ropsten.infura.io/__token__]
  * out params
    * __none__
* __createContractInstance__ - create an interface instance for an already deployed contract
  * in params
    * contractABI - ABI of the contract
    * contractAddress - current address of the contract
  * out params
    * __none__
  
* __encodeFunctionParams__ - prepare data payload of a method adding parameters
  * in params
    * functionName - Name of the function to invoke
    * types - array of parameter data types  [uint,address]
    * args - array of parameter values  [8, '0x001a18EaFA0b300247Be05ECE41DE8d78c7B0620']    
  * out params
    * value for _data_ of transaction message as hex (prefixed with 0x)

* __encodeConstructorParams__ - prepare data payload of constructor method adding parameters
  * in params
    * abi - contract ABI 
    * params - array of parameter values  [8, '0x001a18EaFA0b300247Be05ECE41DE8d78c7B0620']    
  * out params
    * value for _data_ of transaction message as hex (prefixed with 0x)

* __getSignedTransaction__ - sign the transaction data with given private key
  * in params
    * txnRawData - output from _getTransactionData_ or _encodeConstructorParams_
    * pvtKey - private key of the account with Ether  
  * out params
    * signed message as hex (prefixed with 0x)

* __createNewAccount__ - create a new account in network
  * in params
    * callback function which accept one parameter (JSON object)
  * out params
    * address - newly created account address
    * privateKey - private key of newly created account

* __invokeSendRawTransaction__ - send the signed transaction to network
  * in params
    * functionName - name of the function to invoke - only to use in callback function to identify the response
    * transactionPayload - signed data return by _getSignedTransaction_
    * callback function which accept one parameter (JSON object)
  * out params
    * __none__ / invoke callback function which accept one parameter (JSON object)

* __invokeGetTxnReceipt__ - retreive the transaction receipt from a transaction hash
  * in params
    * tx_hash - hash of the transaction to get receipt
    * callback function which accept one parameter (JSON object)
  * out params
    * __none__ / invoke callback function which accept one parameter (JSON object)

* __getDefaultTxnAttributes__ - get the transaction message with default values (or provide custom values)
  * in params
    * nonce 
    * fromAddress 
    * toAddress
    * valueInEther 
    * dataAsHex
    * gasLimit
    * gasPrice
  * out params
    * Following structure filled with necessary values
    ```
            var TxnAttributes = {
            nonce: '0x00',
            from: '0x00',
            to: '0x00',
            value: '0x00',
            data: '0x00',
            gasLimit: '0x00',
            gasPrice: '0x00'
        };```
        
