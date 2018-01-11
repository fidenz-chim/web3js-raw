# web3js-raw #
Set of functions which eleminates all additional dependencies from invoking a menthod in Ethereum platform.
This uses sendRawTransaction method post transaction but encapsulate all tedeous data preparations and data sigining. Only downside is, you have to provide the private key of the account you interact with the smart contract.

## List of functions ##

* web3js-raw.setProvider - Set HTTP provider 
* createContractInstance - Create contract instance
* getTransactionData - prepare data payload of a method adding parameters
* encodeConstructorParams - prepare data payload of constructor method adding parameters
* getSignedTransaction - sign the transaction data with given private key
* createNewAccount - create a new account in network
* invokeSendRawTransaction - send the signed transaction to network
* invokeGetTxnReceipt - retreive the transaction receipt from a transaction hash
* getDefaultTxnAttributes - get the transaction message with default values (or provide custom values)
