import { Blockchain } from './blockchain';

const runTest = () => {
    const bitcoin = new Blockchain();

    const previousBlockHash = 'previousBlockHash';
    const currentBlockData = [
        {
            amount: 10,
            sender: 'sender',
            recipient: 'recipient',
        },
        {
            amount: 20,
            sender: 'sender',
            recipient: 'recipient',
        },
    ];
};

export { runTest };
