const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');

class Blockchain {

    constructor() {
        this.chain = [];
        this.initializeChain();
    }


    async initializeChain() {

        if (this.chain && this.chain.length) {
            return;
        }
        else {
            let block = new BlockClass.Block({ body: 'Genesis Block' });
            await this._addBlock(block);
        }
    }

    _addBlock(block) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            const height = parseInt(self.chain.length);

            block.height = height;
            block.time = new Date().getTime().toString().slice(0, -3);

            if (self.chain.length > 0) {
                block.previousBlockHash = self.chain[self.chain.length - 1].hash;
            }

            block.timeStamp = new Date().getTime().toString().slice(0, -3);
            block.hash = SHA256(JSON.stringify(block)).toString();

            self.chain.push(block);

            resolve(block);
        }
        );
    }

    requestMessageOwnershipVerification(address) {
        return new Promise((resolve) => {
            let message = `${address}:${new Date().getTime().toString().slice(0, -3)}:starRegistry`;
            resolve(message);
        });
    }


    async submitStar(address, message, signature, star) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            let messageSendingTime = parseInt(message.split(':')[1]);
            let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));
            if ((messageSendingTime + 5000) >= currentTime) {
                if (bitcoinMessage.verify(message, address, signature)) {
                    var newStarBlock = await self._addBlock(new BlockClass.Block({ owner: address, star: star }));
                    resolve(newStarBlock);
                } else {
                    reject('The sign is not valid');
                }
            } else {
                reject('Sorry, you must submit it before 5 minutes :)');
            }
        });


    }

    getBlockByHeight(height) {
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(p => p.height === height)[0];
            if (block) {
                resolve(block);
            } else {
                resolve(null);
            }
        });
    }

    async _isBlockValidByHeight(height) {
        let self = this.getBlockByHeight(height);
        return new Promise((resolve, reject) => {
            var currentHash = self.hash;
            self.hash = null;
            var validHash = SHA256(JSON.stringify(self)).toString()

            self.hash = currentHash;
            if (currentHash != validHash) {
                resolve(false);
            }
            else {
                resolve(true);
            }
        });
    }

    getBlockByHash(hash) {
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(p => p.hash === hash)[0];
            if (block) {
                resolve(block);
            } else {
                resolve(null);
            }
        });
    }

    getStarsByWalletAddress(address) {
        let self = this;
        let stars = [];
        return new Promise((resolve, reject) => {
            self.chain.forEach((block) => {
                let blockData = block.getBData();
                if (blockData) {
                    if (blockData.owner == address)
                        stars.push(blockData);
                }
            });

            resolve(stars);
        });
    }

    async validateChain() {
        return new Promise((resolve, reject) => {
            let errorLog = [];
            let blockChainHeight = this.chain.length;

            for (let i = 0; i < blockChainHeight; i++) {

                if (!this._isBlockValidByHeight(i)) { errorLog.push(i); }

                let blockHash = this.getBlockByHeight(i).hash;
                let previousBlockHash = this.getBlockByHeight(i + 1).previousBlockHash;
                if (blockHash !== previousBlockHash) {
                    errorLog.push(i);
                }
            }

            if (errorLog.length > 0) {
                resolve('Blocks are: ' + errorLog);
            } else {
                resolve('No errors were detected');
            }
        });

    }
}


module.exports.Blockchain = Blockchain;   