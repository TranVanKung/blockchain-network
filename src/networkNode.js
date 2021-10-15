import express from 'express';
import bodyParser from 'body-parser';
import { v1 as uuid } from 'uuid';
import rp from 'request-promise';
import { Blockchain, currentNodeUrl } from './blockchain';

const port = process.argv[2];

const nodeAdress = uuid().split('-').join('');
const bitcoin = new Blockchain();

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/blockchain', (req, res) => {
    res.send(bitcoin);
});

app.post('/transaction', (req, res) => {
    const { amount, sender, recipient } = req.body;

    const blockIndex = bitcoin.createNewTransaction(amount, sender, recipient);

    res.json({ blockIndex });
});

app.post('/mine', (req, res) => {
    const lastBlock = bitcoin.getLastBlock();
    const previousBlockHash = lastBlock.hash;
    const currentBlockData = {
        transactions: bitcoin.pendingTransactions,
        index: lastBlock['index'] + 1,
    };
    const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
    const blockHash = bitcoin.hashBlock(
        previousBlockHash,
        currentBlockData,
        nonce
    );

    bitcoin.createNewTransaction(12.5, '00', nodeAdress);

    const newBlock = bitcoin.createNewBlock(
        nonce,
        previousBlockHash,
        blockHash
    );

    res.json({
        newBlock,
    });
});

// register a node and broadcase it to the network
app.post('/register-and-broadcast-node', function (req, res) {
    const { newNodeUrl } = req.body;

    if (!bitcoin.networkNodes.includes(newNodeUrl)) {
        bitcoin.networkNodes.push(newNodeUrl);
    }

    const registeredNodesPromises = [];

    bitcoin.networkNodes.forEach((networkNodeUrl) => {
        const requestOptions = {
            uri: networkNodeUrl + '/register-node',
            method: 'POST',
            body: {
                newNodeUrl,
            },
            json: true,
        };

        registeredNodesPromises.push(rp(requestOptions));
    });

    Promise.all(registeredNodesPromises)
        .then((data) => {
            const bulkRegisterOptions = {
                uri: newNodeUrl + '/register-nodes-bulk',
                method: 'POST',
                body: {
                    allNetworkNodes: [
                        ...bitcoin.networkNodes,
                        bitcoin.currentNodeUrl,
                    ],
                },
                json: true,
            };

            return rp(bulkRegisterOptions);
        })
        .then((data) => {
            res.json({
                message: 'New node registered with network successfully',
            });
        });
});

// register node with the network
app.post('/register-node', function (req, res) {
    const { newNodeUrl } = req.body;

    if (
        !bitcoin.networkNodes.includes(newNodeUrl) &&
        newNodeUrl !== currentNodeUrl
    ) {
        bitcoin.networkNodes.push(newNodeUrl);
    }

    res.json({
        message: 'new node registered successfully with node',
    });
});

// register multiple nodes at once
app.post('/register-nodes-bulk', function (req, res) {});

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});
