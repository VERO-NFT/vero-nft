const Vero = artifacts.require('./contracts/Vero.sol')

require('chai')
    .use(require('chai-as-promised'))
    .should()

contract('Vero', (accounts) => {
    let faker
    let contract
    const address0 = '0x0000000000000000000000000000000000000000'

    before(async () => {
        faker = require('faker')
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
        let tokenUri
        let result
        let event

        beforeEach(async () => {
            tokenUri = faker.internet.url()
            result = await contract.createAsPending(tokenUri)
            event = result.logs[0].args
        })

        it('creates a new NFT', async () => {
            const totalSupply = await contract.totalSupply()
            assert.equal(totalSupply.toNumber(), 1)
            assert.equal(event.tokenId.toNumber(), 1, 'id is correct')
            assert.equal(event.from, address0, 'from is correct')
            assert.equal(event.to, accounts[0], 'to is correct')
        })

        it('assures token URI for NFT is unique', async () => {
            await contract.createAsPending(tokenUri).should.be.rejected
        })

        it('creates NFT with VERO status as PENDING', async () => {
            const veroStatus = await contract.getVeroStatus(event.tokenId.toNumber())
            assert.equal(veroStatus.toNumber(), 0)
        })
    })

    describe('transferring', async () => {
        let randomAcctIndex
        let senderAddress
        let otherAddress
        let tokenUri
        let result
        let event

        beforeEach(async () => {
            randomAcctIndex = faker.datatype.number({
                'min': 0,
                'max': accounts.length - 1,
            })
            senderAddress = accounts[randomAcctIndex]
            otherAddress = accounts[(randomAcctIndex + 1) % accounts.length]
            tokenUri = faker.internet.url()
            result = await contract.createAsPending(tokenUri, { from: senderAddress })
            event = result.logs[0].args
        })

        it('transfers NFT from owner to another address', async () => {
            const tokenId = event.tokenId.toNumber()
            await contract.transferFrom(senderAddress, otherAddress, tokenId,
                { from: senderAddress }
            )
            const owner = await contract.ownerOf(tokenId)
            assert.equal(owner, otherAddress)
            assert.notEqual(owner, senderAddress)
        })

        it('transfers NFT from owner to another address through a third party', async () => {
            const thirdPartyAddress = accounts[(randomAcctIndex + 2) % accounts.length]
            const tokenId = event.tokenId.toNumber()
            await contract.approve(thirdPartyAddress, tokenId,
                { from: senderAddress }
            )
            const approved = await contract.getApproved(tokenId)
            await contract.safeTransferFrom(senderAddress, otherAddress, tokenId,
                { from: thirdPartyAddress }
            )
            const owner = await contract.ownerOf(tokenId)
            const approvedAfter = await contract.getApproved(tokenId)
            assert.equal(approved, thirdPartyAddress)
            assert.notEqual(approved, senderAddress)
            assert.notEqual(approved, otherAddress)
            assert.equal(owner, otherAddress)
            assert.notEqual(owner, senderAddress)
            assert.notEqual(owner, thirdPartyAddress)
            assert.equal(approvedAfter, address0)
            assert.notEqual(approvedAfter, thirdPartyAddress)
            assert.notEqual(approvedAfter, senderAddress)
            assert.notEqual(approvedAfter, otherAddress)
        })

        it('prevents transfer of an NFT that sender does not own', async () => {
            const tokenId = event.tokenId.toNumber()
            await contract.transferFrom(senderAddress, otherAddress, tokenId,
                { from: otherAddress }
            ).should.be.rejected
        })
    })

    describe('accounting', async () => {
        describe('individual', async () => {
            let senderAddress
            let otherAddress
            let tokenUri
            let result
            let event

            beforeEach(async () => {
                const randomAcctIndex = faker.datatype.number({
                    'min': 0,
                    'max': accounts.length - 1,
                })
                senderAddress = accounts[randomAcctIndex]
                otherAddress = accounts[(randomAcctIndex + 1) % accounts.length]
                tokenUri = faker.internet.url()
                result = await contract.createAsPending(tokenUri, { from: senderAddress })
                event = result.logs[0].args
            })

            it('has proper balances for owner after minting', async () => {
                const acct1Balance = await contract.balanceOf(senderAddress)
                const acct2Balance = await contract.balanceOf(otherAddress)
                await contract.createAsPending(faker.internet.url(), { from: senderAddress })
                const acct1Balance2 = await contract.balanceOf(senderAddress)
                const acct2Balance2 = await contract.balanceOf(otherAddress)
                assert.equal(acct1Balance.toNumber() + 1, acct1Balance2.toNumber())
                assert.equal(acct2Balance.toNumber(), acct2Balance2.toNumber())
            })

            it('has correct owner for newly minted NFT', async () => {
                const owner = await contract.ownerOf(event.tokenId.toNumber())
                assert.equal(owner, senderAddress)
                assert.notEqual(owner, otherAddress)
            })
        })

        describe('contract-wide', async () => {
            let senderAddress
            let otherAddress
            let tokenUri
            let result
            let event

            beforeEach(async () => {
                const randomAcctIndex = faker.datatype.number({
                    'min': 0,
                    'max': accounts.length - 1,
                })
                senderAddress = accounts[randomAcctIndex]
                otherAddress = accounts[(randomAcctIndex + 1) % accounts.length]
                tokenUri = faker.internet.url()
                result = await contract.createAsPending(tokenUri, { from: senderAddress })
                event = result.logs[0].args
            })

            it('has correct number of NFTs minted', async () => {
                const totalSupply = await contract.totalSupply()
                await contract.createAsPending(faker.internet.url(), { from: otherAddress })
                const totalSupply2 = await contract.totalSupply()
                assert.equal(totalSupply.toNumber() + 1, totalSupply2.toNumber())
            })
        })
    })

    describe('VERO', async () => {
        let adminAddress
        let senderAddress
        let otherAddress
        let tokenUri
        let result
        let event

        beforeEach(async () => {
            adminAddress = accounts[0]
            const randomAcctIndex = faker.datatype.number({
                'min': 1,
                'max': accounts.length - 1,
            })
            senderAddress = accounts[randomAcctIndex]
            otherAddress = accounts[((randomAcctIndex + 1) % (accounts.length - 1)) + 1]
            tokenUri = faker.internet.url()
            result = await contract.createAsPending(tokenUri, { from: senderAddress })
            event = result.logs[0].args
        })

        it('changes and retrieves the VERO admin account responsibly', async () => {
            const firstAdmin = await contract.getVeroAdmin()
            result = await contract.changeVeroAdmin(otherAddress, { from: adminAddress })
            event = result.logs[0]
            const secondAdmin = await contract.getVeroAdmin()
            assert.equal(firstAdmin, adminAddress)
            assert.notEqual(firstAdmin, otherAddress)
            assert.equal(secondAdmin, otherAddress)
            assert.notEqual(secondAdmin, adminAddress)
            assert.equal(event.event, 'VeroAdminChanged')
            assert.equal(event.args.previousAdmin, adminAddress)
            assert.equal(event.args.newAdmin, otherAddress)
            await contract.changeVeroAdmin(senderAddress, { from: adminAddress })
                .should.be.rejected
            await contract.changeVeroAdmin(address0, { from: otherAddress })
                .should.be.rejected
            await contract.changeVeroAdmin(contract.address, { from: otherAddress })
                .should.be.rejected
            // Clean-up after contract-level change
            await contract.changeVeroAdmin(adminAddress, { from: otherAddress })
        })
    })
})
