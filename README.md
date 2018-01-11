# web3js-raw #
Set of functions which eleminates all additional dependencies from invoking a menthod in Ethereum platform.
This uses sendRawTransaction method post transaction but encapsulate all tedeous data preparations and data sigining. Only downside is, you have to provide the private key of the account you interact with the smart contract.

## Prerequisite ##

* ABI of the contract
* Byte code of the contract (if you want to deploy a new contract)
* Account with Ether balance (to deploy the contract)
* Private key of the contract 

## List of functions ##

* _setProvider_ - set HTTP provider 
* _createContractInstance_ - create contract instance
* _getTransactionData_ - prepare data payload of a method adding parameters
* _encodeConstructorParams_ - prepare data payload of constructor method adding parameters
* _getSignedTransaction_ - sign the transaction data with given private key
* _createNewAccount_ - create a new account in network
* _invokeSendRawTransaction_ - send the signed transaction to network
* _invokeGetTxnReceipt_ - retreive the transaction receipt from a transaction hash
* _getDefaultTxnAttributes_ - get the transaction message with default values (or provide custom values)

