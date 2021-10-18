import sha256 from 'sha256';
import { v1 as uuid } from 'uuid';
import { runTest } from './test';

export const currentNodeUrl = process.argv[3];

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
        transactions: this.pendingTransactions,
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
        transactionId: uuid().split('-').join(''),
    };

    return newTransaction;
};

Blockchain.prototype.addTransactionToPendingTransaction = function (
    transactionObj
) {
    this.pendingTransactions.push(transactionObj);

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

Blockchain.prototype.chainIsValid = function (blockchain) {
    let validChain = true;

    for (let i = 1; i < blockchain.length; i++) {
        const currentBlock = blockchain[i];
        const prevBlock = blockchain[i - 1];
        const blockHash = this.hashBlock(
            prevBlock.hash,
            {
                transactions: currentBlock.transactions,
                index: currentBlock.index,
            },
            currentBlock.nonce
        );

        if (
            currentBlock.previousBlockHash !== prevBlock.hash ||
            blockHash.substring(0, 4) !== '0000'
        ) {
            validChain = false;
        }

        const genesisBlock = blockchain[0];
        if (
            genesisBlock.nonce !== 100 ||
            genesisBlock.previousBlockHash !== '0' ||
            genesisBlock.hash !== '0' ||
            genesisBlock.transactions.length !== 0
        ) {
            validChain = false;
        }
    }

    return validChain;
};

Blockchain.prototype.getBlock = function (blockHash) {
    let correctBlock = null;

    this.chain.forEach((block) => {
        if (block.hash === blockHash) {
            correctBlock = block;
        }
    });

    return correctBlock;
};

Blockchain.prototype.getTransaction = function (transactionId) {
    let correctTransaction = null;
    let correctBlock = null;

    this.chain.forEach((block) => {
        block.transactions.forEach((transaction) => {
            if (transaction.transactionId === transactionId) {
                correctTransaction = transaction;
                correctBlock = block;
            }
        });
    });

    return {
        transaction: correctTransaction,
        block: correctBlock,
    };
};

Blockchain.prototype.getAddressData = function (address) {
    const addressTransactions = [];

    this.chain.forEach((block) => {
        block.transactions.forEach((transaction) => {
            if (
                transaction.sender === address ||
                transaction.recipient === address
            ) {
                addressTransactions.push(transaction);
            }
        });
    });

    let balance = 0;
    addressTransactions.forEach((transaction) => {
        if (transaction.recipient === address) {
            balance += transaction.amount;
        } else if (transaction.sender === address) {
            balance -= transaction.amount;
        }
    });

    return {
        addressTransactions,
        addressBalance: balance,
    };
};

export { Blockchain };

runTest();
