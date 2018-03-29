'use strict';
const crypto = require('crypto');

//define Blockchain class
class Blockchain{
	constructor(){
		this.chain = []; //store all block
		this.difficulty = 1; //level of mining difficulty
		this.chain.push(this.createBlock(1));//Create genesis block
	}

	createBlock(previousHash = undefined){
		//ToDo: Create a new Block
		//Original proof is 0, which might not be valid
		//Mine Proof to find effective proof

		var block = {
			timestamp: Date.now(),
			id: this.chain.length,
			proof: 0,
			previousBlockHash: previousHash || this.constructor.hash(this.lastBlock())
			transaction:[]
		};
		self.mineProof(block);
		this.chain.push(block);
	}
	createTransaction(sender, receiver, value){
		//ToDo: Create a new Transaction
		//Create a transaction with sender and receiver address
		//Add a transaction into our block
		var transaction = {
			sender: sender,
			receiver: receiver,
			value: value

		};
		this.lastBlock.transaction.push(transaction);
		return this.lastBlock.id;
	}
	static hash(block){
		//ToDo: Hash a Block
		//Transfer a block into base64
		var blockStr = JSON.stringify(block);
		var blockB64 = new Buffer(blockStr).toString('base64');
		var newHash = crypto.createHash('sha256');
		newHash.update(blockB64);
		return newHash.digest('hex');
	}
	static lastBlock(){
		//ToDo: Get the last Block on the chain
		return this.chain[this.chain.length - 1];
	}
	isProofValid(tentativeBlock){
		//ToDo: Check if our Proof is valid
		//Hash all blockchain
		//If all have a difficulty of 0, then this is a valid proof
		var result = this.constructor.hash(tentativeBlock);
		return result.substr(result.length - this.difficulty) == '0'.repeat(this.difficulty);
	}
	mineProof(tentativeBlock){
		while(!this.isProofValid(tentativeBlock)){
			tentativeBlock.proof += 1;//if proof is invalid, we keep mining
		}
	}
}