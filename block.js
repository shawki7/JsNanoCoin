const SHA256 = require('crypto-js/sha256');
const hex2ascii = require('hex2ascii');

class Block {
    constructor(data) {
        this.hash = null;
        this.height = 0;
        this.body = Buffer(JSON.stringify(data)).toString('hex');
        this.time = 0;
        this.previousBlockHash = '';
    }

    validate() {
        let self = this;
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

    getBData() {
        let blockData = hex2ascii(this.body);
        if (blockData.previousBlockHash) {
            return "genesis block";
        }
        return JSON.parse(blockData);
    }

}

module.exports.Block = Block;                  