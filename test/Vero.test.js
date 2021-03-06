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
            assert.equal(symbol, 'VRO')
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

        it('has a tokenURI', async () => {
            const retrievedTokenUri = await contract.tokenURI(event.tokenId.toNumber())
            assert.equal(retrievedTokenUri, tokenUri)
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

        it('approves NFT as a VERO', async () => {
            const tokenId = event.tokenId.toNumber()
            const priorVeroStatus = await contract.getVeroStatus(tokenId)
            await contract.approveAsVero(tokenId, { from: senderAddress })
                .should.be.rejected
            result = await contract.approveAsVero(tokenId, { from: adminAddress })
            event = result.logs[0]
            const newVeroStatus = await contract.getVeroStatus(tokenId)
            assert.equal(newVeroStatus.toNumber(), 1)
            assert.notEqual(priorVeroStatus.toNumber(), 1)
            assert.equal(event.event, 'VeroStatusChanged')
            assert.equal(event.args._admin, adminAddress)
            assert.equal(event.args._tokenId, tokenId)
            assert.equal(event.args.previousStatus, priorVeroStatus.toNumber())
            assert.equal(event.args.newStatus, newVeroStatus.toNumber())
            await contract.approveAsVero(tokenId, { from: adminAddress })
                .should.be.rejected
            const totalSupply = await contract.totalSupply()
            const randomTokenIndex = faker.datatype.number({
                'min': totalSupply,
            })
            await contract.approveAsVero(randomTokenIndex, { from: adminAddress })
                .should.be.rejected
        })

        it('rejects PENDING NFT as a VERO', async () => {
            const tokenId = event.tokenId.toNumber()
            const priorVeroStatus = await contract.getVeroStatus(tokenId)
            await contract.rejectAsVero(tokenId, { from: senderAddress })
                .should.be.rejected
            result = await contract.rejectAsVero(event.tokenId.toNumber(), { from: adminAddress })
            event = result.logs[0]
            const newVeroStatus = await contract.getVeroStatus(tokenId)
            assert.equal(newVeroStatus.toNumber(), 2)
            assert.notInclude([1, 2, 3], priorVeroStatus.toNumber())
            assert.equal(event.event, 'VeroStatusChanged')
            assert.equal(event.args._admin, adminAddress)
            assert.equal(event.args._tokenId, tokenId)
            assert.equal(event.args.previousStatus, priorVeroStatus.toNumber())
            assert.equal(event.args.newStatus, newVeroStatus.toNumber())
            await contract.rejectAsVero(tokenId, { from: adminAddress })
                .should.be.rejected
            await contract.approveAsVero(tokenId, { from: adminAddress })
            await contract.rejectAsVero(tokenId, { from: adminAddress })
                .should.be.rejected
            await contract.revokeAsVero(tokenId, { from: adminAddress })
            await contract.rejectAsVero(tokenId, { from: adminAddress })
                .should.be.rejected
            const totalSupply = await contract.totalSupply()
            const randomTokenIndex = faker.datatype.number({
                'min': totalSupply,
            })
            await contract.rejectAsVero(randomTokenIndex, { from: adminAddress })
                .should.be.rejected
        })

        it('revokes APPROVED NFT as a VERO', async () => {
            const tokenId = event.tokenId.toNumber()
            await contract.revokeAsVero(tokenId, { from: adminAddress })
                .should.be.rejected
            await contract.approveAsVero(tokenId, { from: adminAddress })
            const priorVeroStatus = await contract.getVeroStatus(tokenId)
            await contract.revokeAsVero(tokenId, { from: senderAddress })
                .should.be.rejected
            result = await contract.revokeAsVero(event.tokenId.toNumber(), { from: adminAddress })
            event = result.logs[0]
            const newVeroStatus = await contract.getVeroStatus(tokenId)
            assert.equal(newVeroStatus.toNumber(), 3)
            assert.notInclude([0, 2, 3], priorVeroStatus.toNumber())
            assert.equal(event.event, 'VeroStatusChanged')
            assert.equal(event.args._admin, adminAddress)
            assert.equal(event.args._tokenId, tokenId)
            assert.equal(event.args.previousStatus, priorVeroStatus.toNumber())
            assert.equal(event.args.newStatus, newVeroStatus.toNumber())
            await contract.revokeAsVero(tokenId, { from: adminAddress })
                .should.be.rejected
            const totalSupply = await contract.totalSupply()
            const randomTokenIndex = faker.datatype.number({
                'min': totalSupply,
            })
            await contract.revokeAsVero(randomTokenIndex, { from: adminAddress })
                .should.be.rejected
        })
    })

    describe('security', async () => {
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

        it('pauses and unpauses a smart contract', async () => {
            await contract.pause({ from: senderAddress })
                .should.be.rejected
            await contract.pause({ from: adminAddress })
            await contract.pause({ from: adminAddress })
                .should.be.rejected
            await contract.createAsPending(faker.internet.url(), { from: senderAddress })
                .should.be.rejected
            await contract.unpause({ from: senderAddress })
                .should.be.rejected
            await contract.unpause({ from: adminAddress })
            await contract.unpause({ from: adminAddress })
                .should.be.rejected
            await contract.createAsPending(faker.internet.url(), { from: senderAddress })
                .should.not.be.rejected
        })

        it('works as expected after pause', async () => {
            const tokenId = event.tokenId.toNumber()
            await contract.pause({ from: adminAddress })
            await contract.changeVeroAdmin(otherAddress, { from: adminAddress })
                .should.be.rejected
            await contract.createAsPending(faker.internet.url(), { from: senderAddress })
                .should.be.rejected
            await contract.approveAsVero(tokenId, { from: adminAddress })
                .should.be.rejected
            await contract.rejectAsVero(tokenId, { from: adminAddress })
                .should.be.rejected
            await contract.revokeAsVero(tokenId, { from: adminAddress })
                .should.be.rejected
            await contract.safeTransferFrom(senderAddress, otherAddress, tokenId, { from: senderAddress })
                .should.be.rejected
            await contract.transferFrom(otherAddress, senderAddress, tokenId, { from: otherAddress })
                .should.be.rejected
            await contract.approve(otherAddress, tokenId, { from: senderAddress })
                .should.be.rejected
            await contract.setApprovalForAll(otherAddress, true, { from: senderAddress })
                .should.be.rejected
            // Clean-up after contract-level change
            await contract.unpause({ from: adminAddress })
        })

        it('works as expected after unpause', async () => {
            const tokenId = event.tokenId.toNumber()
            await contract.pause({ from: adminAddress })
            await contract.unpause({ from: adminAddress })
            await contract.changeVeroAdmin(otherAddress, { from: adminAddress })
                .should.not.be.rejected
            await contract.changeVeroAdmin(adminAddress, { from: otherAddress })
            await contract.createAsPending(faker.internet.url(), { from: senderAddress })
                .should.not.be.rejected
            await contract.rejectAsVero(tokenId, { from: adminAddress })
                .should.not.be.rejected
            await contract.approveAsVero(tokenId, { from: adminAddress })
                .should.not.be.rejected
            await contract.revokeAsVero(tokenId, { from: adminAddress })
                .should.not.be.rejected
            await contract.safeTransferFrom(senderAddress, otherAddress, tokenId, { from: senderAddress })
                .should.not.be.rejected
            await contract.transferFrom(otherAddress, senderAddress, tokenId, { from: otherAddress })
                .should.not.be.rejected
            await contract.approve(otherAddress, tokenId, { from: senderAddress })
                .should.not.be.rejected
            await contract.setApprovalForAll(otherAddress, true, { from: senderAddress })
                .should.not.be.rejected
        })
    })
})
