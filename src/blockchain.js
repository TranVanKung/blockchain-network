import sha256 from 'sha256';
import { runTest } from './test';

const currentNodeUrl = process.argv[3];

function Blockchain() {
    this.chain = [];
    this.pendingTransactions = [];
    this.currentNodeUrl = currentNodeUrl;
    this.networkNodes = [];

    this.createNewBlock(100, '0', '0');
}

Blockchain.prototype.createNewBlock = function (
    nonce,
    previousBlockHash,
    hash
) {
    const newBlock = {
        index: this.chain.length + 1,
        timestamp: Date.now(),
        transaction: this.pendingTransactions,
        nonce,
        hash,
        previousBlockHash,
    };

    this.pendingTransactions = [];
    this.chain.push(newBlock);

    return newBlock;
};

Blockchain.prototype.getLastBlock = function () {
    return this.chain[this.chain.length - 1];
};

Blockchain.prototype.createNewTransaction = function (
    amount,
    sender,
    recipient
) {
    const newTransaction = {
        amount,
        sender,
        recipient,
    };

    this.pendingTransactions.push(newTransaction);

    return this.getLastBlock()['index'] + 1;
};

Blockchain.prototype.hashBlock = function (
    previousBlockHash,
    currentBlockData,
    nonce
) {
    const dataAsString =
        previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    const hash = sha256(dataAsString);

    return hash;
};

Blockchain.prototype.proofOfWork = function (
    previousBlockHash,
    currentBlockData
) {
    // 1. repeated has block until find correct hash start with '0000
    // 2. use current block data for the hash, but also the previousBlockHash
    // 3. continuously changes @nonce value until it finds the correct hash
    // 4. return to use the @nonce value that crate the correct hash
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);

    while (hash.substring(0, 4) !== '0000') {
        nonce += 1;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }

    return nonce;
};

export { Blockchain };

// runTest();
