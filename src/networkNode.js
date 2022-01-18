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

app.post('/transaction/broadcast', function (req, res) {
    const { amount, sender, recipient } = req.body;
    const newTransaction = bitcoin.createNewTransaction(
        amount,
        sender,
        recipient
    );
    bitcoin.addTransactionToPendingTransaction(newTransaction);

    const requestPromise = [];
    bitcoin.networkNodes.forEach((networkNodeUrl) => {
        const reqOptions = {
            uri: networkNodeUrl + '/transaction',
            method: 'POST',
            body: newTransaction,
            json: true,
        };

        requestPromise.push(rp(reqOptions));
    });

    Promise.all(requestPromise).then((data) => {
        res.json({
            message: 'Transaction created and broadcast successfully',
        });
    });
});

app.post('/transaction', (req, res) => {
    const blockIndex = bitcoin.addTransactionToPendingTransaction(req.body);
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
    const newBlock = bitcoin.createNewBlock(
        nonce,
        previousBlockHash,
        blockHash
    );

    const requestPromises = [];
    bitcoin.networkNodes.forEach((networkNodeUrl) => {
        const requestOptions = {
            uri: networkNodeUrl + '/receive-new-block',
            method: 'POST',
            body: { newBlock },
            json: true,
        };

        requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises)
        .then((data) => {
            const rewardTransaction = {
                uri: bitcoin.currentNodeUrl + '/transaction/broadcast',
                method: 'POST',
                body: {
                    amount: 12.5,
                    sender: '00',
                    recipient: nodeAdress,
                },
                json: true,
            };

            rp(rewardTransaction);
        })
        .then((data) => {
            res.json({
                message: 'New block mined successfully',
                block: newBlock,
            });
        });
});

app.post('/receive-new-block', function (req, res) {
    const { newBlock } = req.body;
    const lastBlock = bitcoin.getLastBlock();

    if (
        lastBlock.hash === newBlock.previousBlockHash &&
        lastBlock['index'] + 1 === newBlock['index']
    ) {
        bitcoin.chain.push(newBlock);
        bitcoin.pendingTransactions = [];

        res.json({
            message: 'New block receive and accepted',
            newBlock,
        });
    } else {
        res.json({
            message: 'New block rejected',
            newBlock,
        });
    }
});

// register a node and broadcast it to the network
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
        message: 'New node registered successfully with node',
    });
});

// register multiple nodes at once
app.post('/register-nodes-bulk', function (req, res) {
    const { allNetworkNodes } = req.body;
    allNetworkNodes.forEach((networkNodeUrl) => {
        if (
            !bitcoin.networkNodes.includes(networkNodeUrl) &&
            networkNodeUrl !== currentNodeUrl
        ) {
            bitcoin.networkNodes.push(networkNodeUrl);
        }
    });

    res.json({
        message: 'Bulk registration successfull',
    });
});

app.get('/consensus', function (req, res) {
    const requestPromises = [];

    bitcoin.networkNodes.forEach((networkNodeUrl) => {
        const requestOption = {
            uri: networkNodeUrl + '/blockchain',
            method: 'GET',
            json: true,
        };

        requestPromises.push(rp(requestOption));
    });

    Promise.all(requestPromises).then((blockchains) => {
        const currentChainLength = bitcoin.chain.length;
        let maxChainLength = currentChainLength;
        let newLongestChain = null;
        let newPendingTransactions = null;

        blockchains.forEach((blockchain) => {
            if (blockchain.chain.length > maxChainLength) {
                maxChainLength = blockchain.chain.length;
                newLongestChain = blockchain.chain;
                newPendingTransactions = blockchain.pendingTransactions;
            }
        });

        if (
            !newLongestChain ||
            (newLongestChain && !bitcoin.chainIsValid(newLongestChain))
        ) {
            res.json({
                message: 'Current chain has not been replaced',
                chain: bitcoin.chain,
            });
        } else if (newLongestChain && bitcoin.chainIsValid(newLongestChain)) {
            bitcoin.chain = newLongestChain;
            bitcoin.pendingTransactions = newPendingTransactions;

            res.json({
                message: 'This chain has been replaced',
                chain: bitcoin.chain,
            });
        }
    });
});

app.get('/block/:blockHash', function (req, res) {
    const { blockHash } = req.params;
    const correctBlock = bitcoin.getBlock(blockHash);
    res.json({
        block: correctBlock,
    });
});

app.get('/transaction/:transactionId', function (req, res) {
    const { transactionId } = req.params;
    const { transaction, block } = bitcoin.getTransaction(transactionId);

    res.json({
        transaction,
        block,
    });
});

app.get('/address/:address', function (req, res) {
    const { address } = req.params;

    const { addressTransactions, addressBalance } =
        bitcoin.getAddressData(address);

    res.json({
        addressData: {
            addressTransactions,
            addressBalance,
        },
    });
});

app.get('/block-explorer', function (re, res) {
    res.sendFile('./index.html', { root: __dirname });
});

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});
