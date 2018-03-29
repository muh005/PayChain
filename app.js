const express = require('express');
const app = express();//instantiate our node
const bodyParser = require('body_parser');
const Blockchain = require('./blockchain.js');
const _ = require('lodash');
const rp = require('require-p');
const defaultPort = 3001;

let argv = require('minimist')(process.argv.slice(2));//parse arguments
let myBlockchain = new Blockchain();//instantiate our blockchain
let bootstrapNode = {
	ip: '127.0.0.1',
	port: defaultPort;
};
let neighbors = [];

app.use(bodyParser.json());//handle bodyparser

let nodeDiscovery = async function(thisNode, neighborNode){
	if(_.isEqual(thisNode, neighborNode) || _.some(neighbors, neighborNode) || neighbors.length >= 4){
		return;//No discovery if this node is the same as the neighborNode or has enough neighbors already
	}
	let options = {
		uri: `http://${neighborNode.ip}:${neighborNode.port}/api/nodes/register`,
		method:'POST',
		body:{
			ip: thisNode.ip,
			port: thisNode.port
		},
		json: true
	};
	try{
		await rp(options);
		neighbors.push(neighborNode);
		if(neighbors.length < 4){
			res = await rp(`http://${neighborNode.ip}:${neighborNode.port}/api/nodes/neighbors`);
			neighborOfNeighbors = JSON.parse(res)['content'];
			for(let i = 0; i < neighborOfNeighbors.length; i++){
				await nodeDiscovery(thisNode, neighborOfNeighbors[i]);
			}
		}
	}catch(error){
		console.log(error);
	}
};

app.get('/api/mine',(req,res)=>{
	//Trigger mining
	myBlockchain.createBlock();
	p = new Promise((resolve)=>resolve());
	for(let i = 0; i < neighbors.length; i++){
		p = p.then(()=>rp({
			uri: `http://${neighbors[i].ip}:${neighbors[i].port}/api/nodes/resolve`,
			method: 'POST',
			json: true,
			body:{"chain": myBlockchain}
		})).then((res)=>{
			myBlockchain.resolveChain(res.content);
		});
	}
	p.then(()=>{
		res.send({
			message:'A new block is mined, and conflict is resolved',
			content: myBlockchain.lastBlock()
		});
	});
});

app.post('/api/transactions/new',(req,res)=>{
	//Start a new transaction
	let newTransaction = _.pick(req.body,['sender','receiver','value']);
	myBlockchain.lastBlock().transactions.push(newTransaction);
	res.send({
		message:'A new transaction is appended to the blockchain',
		content: newTransaction
	});
});

app.get('/api/chain',(res,req)=>{
	//Return the current chain 
	res.send({
		message: 'This is my chain',
		content: myBlockchain
	});
});

app.get('/api/nodes/neighbors',(req, res)=>{
	res.send({
		message: 'This is my neighbors',
		content: neighbors
	});
});

app.post('/api/nodes/register',(req, res)=>{
	//Register node
	let newNode = _.pick(req.body,['ip','port']);
	neighbors.push(newNode);
	console.log('new node detected');
	console.log(newNode);
	res.send({
		message: `Node ${newNode.ip}:${newNode.port} is added to my network`
	});
});

app.post('/api/nodes/resolve',(req, res)=>{
	//All nodes resolve conflict for this node
	let chain = req.body.chain;
	if(myBlockchain.resolveChain(chain)){
		res.send({
			message: 'Chain resolved, your chain is longer',
			content: myBlockchain
		});
	}else{
		res.send({
			message: 'Chain resolved, I will keep my chain',
			content: myBlockchain
		});
	}
});

let myIp = '127.0.0.1';
let myPort = argv.port || defaultPort;
app.listen(myPort,()=> console.log(`app listening on ${myPort}`));

nodeDiscovery({ip: myIp, port: myPort}, bootstrapNode).then(res => {
	console.log(`node discovery complete, neighbors: ${JSON.stringify(neighbors, null, 2)}`);
});
