const Vero = artifacts.require('./contracts/Vero.sol')

require('chai')
    .use(require('chai-as-promised'))
    .should()

contract('Vero', (accounts) => {
    let contract

    before(async () => {
        contract = await Vero.deployed()
    })

    describe('deployment', async () => {
        it('deploys successfully', async () => {
            const address = contract.address
            assert.notEqual(address, 0x0)
            assert.notEqual(address, '')
            assert.notEqual(address, null)
            assert.notEqual(address, undefined)
        })

        it('has a name', async () => {
            const name = await contract.name()
            assert.equal(name, 'VERO')
        })

        it('has a symbol', async () => {
            const symbol = await contract.symbol()
            assert.equal(symbol, 'w̥')
        })
    })

    describe('minting', async () => {
        let faker
        let tokenUri
        let result
        let event

        beforeEach(async () => {
            faker = require('faker')
            //const address = faker.finance.ethereumAddress()
            tokenUri = faker.internet.url()
            result = await contract.createAsPending(tokenUri)
            event = result.logs[0].args
        })

        it('creates a new NFT', async () => {
            const totalSupply = await contract.totalSupply()
            assert.equal(totalSupply, 1)
            assert.equal(event.tokenId.toNumber(), 1, 'id is correct')
            assert.equal(event.from, '0x0000000000000000000000000000000000000000', 'from is correct')
            assert.equal(event.to, accounts[0], 'to is correct')
        })

        it('assures token URI for NFT is unique', async () => {
            await contract.createAsPending(tokenUri).should.be.rejected;
        })

        it('creates NFT with VERO status as PENDING', async () => {
            const veroStatus = await contract.getVeroStatus(event.tokenId.toNumber())
            assert.equal(veroStatus.toNumber(), 0)
        })
    })

    describe('purchasing', async () => {
        let faker
        let tokenUri
        let result
        let event

        beforeEach(async () => {
            faker = require('faker')
            //const address = faker.finance.ethereumAddress()
            tokenUri = faker.internet.url()
            result = await contract.createAsPending(tokenUri)
            event = result.logs[0].args
        })

        it('...', async () => {
        })
    })

    describe('transferring', async () => {
        let faker
        let tokenUri
        let result
        let event

        beforeEach(async () => {
            faker = require('faker')
            //const address = faker.finance.ethereumAddress()
            tokenUri = faker.internet.url()
            result = await contract.createAsPending(tokenUri)
            event = result.logs[0].args
        })

        it('...', async () => {
        })
    })

    describe('accounting', async () => {
        let faker
        let tokenUri
        let result
        let event

        beforeEach(async () => {
            faker = require('faker')
            //const address = faker.finance.ethereumAddress()
            tokenUri = faker.internet.url()
            result = await contract.createAsPending(tokenUri)
            event = result.logs[0].args
        })

        it('...', async () => {
        })
    })
})
