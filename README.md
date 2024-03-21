# web3js-raw

Set of functions which eleminates all additional dependencies from invoking a menthod in Smart Contract deployed to Ethereum platform.
This uses **sendRawTransaction** method to post transactions but encapsulate all tedeous data preparations and data sigining tasks. Only downside is, having to provide the private key of the account which interacts with the smart contract. Following documentation assumes you will interact with Ropsten test net via infura.io, but module should work with any implementation of Ethereum network.

## Sample Dapp using web3js-raw

Refer [Fund Splitter smart contract dapp (fs_w3jsr)](https://github.com/fidenz-chim/fs_w3r2) for fully funcational implementation of a Dapp using web3js-raw

## Prerequisite

- ABI of the contract
- Account with Ether balance (to deploy the contract)
- Private key of the account
- Address of the contract (if you want to interact with already deployed contract)
  **OR**
- Byte code of the contract (if you want to deploy a new contract)

## Install

```
npm install web3js-raw --save
```

## Use cases 0.0.2beta.7 and above

### Initialise for a given contract

```
    var W3JSR = new web3jsraw(PROVIDER_NODE);
    W3JSR.getWeb3(ABI, CONTRACT_ADDRESS);

```

### Invoke a method **DOES NOT** change the state of the contract

```
    W3JSRW.ContractInstance.methods.getMemberCount().call().then(function(result){
        if(result){
            console.log(result);
        }
        else{
            retVal = {"error":"error"};
        }
    });
```

### Invoke a method **DOES** change the state of the contract

```
    var functionName = 'addMember';
    var params = [newAddress];
    W3JSRW.prepareSignSend(ABI,_CONTRACT_ADDRESS,functionName,ETHER_ACC,ETHER_PKEY,valueInWei,params,gasLimit).then((result,error) =>{
        console.log(result);
    },(error) =>{
        console.log(error);
    });

```

### Initialise multiple contracts

```
    var W3JSR_A = new web3jsraw(PROVIDER_NODE);
    var contractInstance_A = W3JSR_A.getWeb3(ABI_A, CONTRACT_ADDRESS_A);

    var W3JSR_B = new web3jsraw(PROVIDER_NODE);
    var contractInstance_B = W3JSR_B.getWeb3(ABI_B, CONTRACT_ADDRESS_B);

    //contractInstance_A & contractInstance_B are two independent objects which represent 2 contracts

```

## List of functions

- **getWeb3** - initialise and create an instance of web3js-raw interact with a contract

  - in params
    - contractABI - ABI of the contract
    - contractAddress - current address of the contract
  - out params
    - underlying [Web3](https://github.com/ethereum/web3.js/) instance

- **getWeb3Base** - initialise and create an instance of web3 (without binding to a contract)

  - in params
    - provider [https://ropsten.infura.io/__token__]
  - out params
    - underlying [Web3](https://github.com/ethereum/web3.js/) instance

- **prepareSignSend** - Prepare and sign and send transactions to network

  - in params
    - contractABI - ABI of the contract
    - contractAddress - current address of the contract
    - functionName - name of the function to invoke - only to use in callback function to identify the response
    - senderAddress - address of transaction sender (must have an ether balance)
    - privateKey - private key of transaction sender
    - valueInWei (optional) - currency value in Wei for payable functions in the contract (Default is 0x00)
    - params - data attributes of the Smart Contract function
    - gasLimit - gas limit for the transaction
  - out params
    - a Promise

- **setProvider** - set HTTP provider
  - in params
    - provider [https://ropsten.infura.io/__token__]
  - out params
    - **none**
- **createContractInstance** - create an interface instance for an already deployed contract

  - in params
    - contractABI - ABI of the contract
    - contractAddress - current address of the contract
  - out params
    - **none**

- **encodeFunctionParams** - prepare data payload of a method adding parameters

  - in params
    - functionName - Name of the function to invoke
    - types - array of parameter data types [uint,address]
    - args - array of parameter values [8, '0x001a18EaFA0b300247Be05ECE41DE8d78c7B0620']
  - out params
    - value for _data_ of transaction message as hex (prefixed with 0x)

- **encodeConstructorParams** - prepare data payload of constructor method adding parameters

  - in params
    - abi - contract ABI
    - params - array of parameter values [8, '0x001a18EaFA0b300247Be05ECE41DE8d78c7B0620']
  - out params
    - value for _data_ of transaction message as hex (prefixed with 0x)

- **getSignedTransaction** - sign the transaction data with given private key

  - in params
    - txnRawData - output from _getTransactionData_ or _encodeConstructorParams_
    - pvtKey - private key of the account with Ether
  - out params
    - signed message as hex (prefixed with 0x)

- **createNewAccount** - create a new account in network

  - in params
    - callback function which accept one parameter (JSON object)
  - out params
    - address - newly created account address
    - privateKey - private key of newly created account

- **invokeGetTxnReceipt** - retreive the transaction receipt from a transaction hash

  - in params
    - tx_hash - hash of the transaction to get receipt
    - callback function which accept one parameter (JSON object)
  - out params
    - a Promise
    - **none** / invoke callback function which accept one parameter (JSON object)

- **getDefaultTxnAttributes** - get the transaction message with default values (or provide custom values)
  - in params
    - nonce
    - fromAddress
    - toAddress
    - valueInEther
    - dataAsHex
    - gasLimit
    - gasPrice
  - out params
    - Following structure filled with necessary values
    ````
            var TxnAttributes = {
            nonce: '0x00',
            to: '0x00',
            value: '0x00',
            data: '0x00',
            gasLimit: '0x00',
            gasPrice: '0x00'
        };```
    ````
