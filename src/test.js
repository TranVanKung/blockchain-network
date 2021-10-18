import { Blockchain } from './blockchain';

const runTest = () => {
    const bitcoin = new Blockchain();

    const bc1 = {
        chain: [
            {
                index: 1,
                timestamp: 1634541321162,
                transactions: [],
                nonce: 100,
                hash: '0',
                previousBlockHash: '0',
            },
            {
                index: 2,
                timestamp: 1634541324422,
                transactions: [],
                nonce: 18140,
                hash: '0000b9135b054d1131392c9eb9d03b0111d4b516824a03c35639e12858912100',
                previousBlockHash: '0',
            },
            {
                index: 3,
                timestamp: 1634541345901,
                transactions: [
                    {
                        amount: 12.5,
                        sender: '00',
                        recipient: '27b09b902fe311ec8e7c71d37022865d',
                        transactionId: '29a73b702fe311ec8e7c71d37022865d',
                    },
                    {
                        amount: 101,
                        sender: 'sender1',
                        recipient: 'recipient1',
                        transactionId: '2b6e8df02fe311ec8e7c71d37022865d',
                    },
                    {
                        amount: 101,
                        sender: 'sender2',
                        recipient: 'recipient2',
                        transactionId: '303b7f502fe311ec8e7c71d37022865d',
                    },
                    {
                        amount: 101,
                        sender: 'sender3',
                        recipient: 'recipient3',
                        transactionId: '340531802fe311ec8e7c71d37022865d',
                    },
                ],
                nonce: 207482,
                hash: '000001cfd38a5f0a3534153057d3b4f66c4c3a877e7a449eaf816247377ddc2b',
                previousBlockHash:
                    '0000b9135b054d1131392c9eb9d03b0111d4b516824a03c35639e12858912100',
            },
            {
                index: 4,
                timestamp: 1634541352191,
                transactions: [
                    {
                        amount: 12.5,
                        sender: '00',
                        recipient: '27b09b902fe311ec8e7c71d37022865d',
                        transactionId: '367017002fe311ec8e7c71d37022865d',
                    },
                ],
                nonce: 20943,
                hash: '0000e9abd82e1ac3248ba319f3a493b39d0da138e67793e892ab2701df3bf774',
                previousBlockHash:
                    '000001cfd38a5f0a3534153057d3b4f66c4c3a877e7a449eaf816247377ddc2b',
            },
        ],
        pendingTransactions: [
            {
                amount: 12.5,
                sender: '00',
                recipient: '27b09b902fe311ec8e7c71d37022865d',
                transactionId: '3a2fde202fe311ec8e7c71d37022865d',
            },
        ],
        currentNodeUrl: 'http://localhost:3001',
        networkNodes: [],
    };

    console.log(bitcoin.chainIsValid(bc1.chain));
};

export { runTest };
