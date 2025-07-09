const { expect, assert } = require('chai');
const { BigNumber } = require('ethers');
const { ethers } = require('hardhat');

const FACTOR = 17;
const DECIMALS = 18;
const CONSOLE_LOG = false;
const DEVELOPER_ADDRESS = '0x731591207791A93fB0Ec481186fb086E16A7d6D0';

describe("Employer", async () => {

    let Employer, TimeToken, owner, addr1, addr2, addrs, timeToken, employer;
    let signer, signer1, signer2;

    before(async () => {
        TimeToken = await ethers.getContractFactory('TimeToken');
        Employer = await ethers.getContractFactory('Employer');
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        signer = ethers.provider.getSigner(owner.address);
        signer1 = ethers.provider.getSigner(addr1.address);
        signer2 = ethers.provider.getSigner(addr2.address);
        timeToken = await TimeToken.deploy("TIME", "Time Token");
        employer = await Employer.deploy(timeToken.address);
        const fee = await timeToken.fee();
        await timeToken.connect(signer).enableMining({value: fee});
        const fee1 = await timeToken.fee();
        await timeToken.connect(signer1).enableMining({value: fee1});
        const fee2 = await timeToken.fee();
        await timeToken.connect(signer2).enableMining({value: fee2});
    });

    beforeEach(async () => {
        await timeToken.connect(signer).mining();
        await timeToken.connect(signer1).mining();
        await timeToken.connect(signer2).mining();
    });

    it('should deploy contract correctly', async () => {
        if (CONSOLE_LOG)
            console.log(`Employer address: ${employer.address}`);
        assert(employer.address != undefined && employer.address != ethers.constants.AddressZero);
    });

    it('should setup some variables and constants correctly', async () => {
        const oneYear = await employer.ONE_YEAR();
        const firstBlock = await employer.FIRST_BLOCK();
        if (CONSOLE_LOG) {
            console.log(`ONE_YEAR   : ${oneYear}`);
            console.log(`FIRST BLOCK: ${firstBlock}`);
        }
        assert(oneYear != undefined && oneYear > 0 && firstBlock != undefined && firstBlock > 0);
    });

    it('deposited values must correspond', async () => {
        const totalDepositedBefore = await employer.totalDepositedNative();
        const burnedTimeBefore = await employer.totalBurnedTime();
        const balance = (await ethers.provider.getBalance(owner.address)).div(2);
        const realDeposit = balance.sub(balance.div(50));
        const timeBalance = await timeToken.balanceOf(owner.address);
        await timeToken.connect(signer).approve(employer.address, timeBalance);
        const availableBefore = await employer.availableNative();
        await employer.connect(signer).deposit(timeBalance, false, {value: balance});
        const depositedTime = await employer.remainingTime(owner.address);
        const depositedValue = await employer.deposited(owner.address);
        const burnedTimeAfter = await employer.totalBurnedTime();
        const totalDepositedAfter = await employer.totalDepositedNative();
        const availableAfter = await employer.availableNative();
        const currentDepositedNative = await employer.currentDepositedNative();
        const balanceAfter = await ethers.provider.getBalance(employer.address);
        if (CONSOLE_LOG) {
            console.log(`Balance                       : ${balance}`);
            console.log(`Expected Deposit              : ${realDeposit}`);
            console.log(`Deposited                     : ${depositedValue}`);
            console.log(`Expected Deposit in TIME      : ${timeBalance}`);
            console.log(`Deposited TIME                : ${depositedTime}`);
            console.log(`Burned TIME Before            : ${burnedTimeBefore}`);
            console.log(`Burned TIME After             : ${burnedTimeAfter}`);
            console.log(`TOTAL Deposited Native Before : ${totalDepositedBefore}`);
            console.log(`TOTAL Deposited Native After  : ${totalDepositedAfter}`);
            console.log(`Available Before              : ${availableBefore}`);
            console.log(`Available After               : ${availableAfter}`);
            console.log(`Available Comission           : ${balanceAfter.sub(currentDepositedNative)}`);
        }
        assert((realDeposit.eq(depositedValue.add(1)) || realDeposit.eq(depositedValue.sub(1)) || realDeposit.eq(depositedValue))
            && timeBalance.eq(depositedTime)
            && !totalDepositedBefore.eq(totalDepositedAfter)
            && availableAfter.lte(balanceAfter.sub(currentDepositedNative)));
    });

    it ('should pay comissions correctly', async () => {
        const balance = (await ethers.provider.getBalance(addr1.address)).div(2);
        const comission = balance.div(80).div(3);
        const timeBalance = await timeToken.balanceOf(addr1.address);
        const availableBefore = await employer.availableNative();
        const balanceDeveloperBefore = await ethers.provider.getBalance(DEVELOPER_ADDRESS);
        await timeToken.connect(signer1).approve(employer.address, timeBalance);
        await employer.connect(signer1).deposit(timeBalance, false, {value: balance});
        const balanceDeveloperAfter = await ethers.provider.getBalance(DEVELOPER_ADDRESS);
        const availableAfter = await employer.availableNative();
        const currentDepositedNative = await employer.currentDepositedNative();
        const balanceAfter = await ethers.provider.getBalance(employer.address);
        
        if (CONSOLE_LOG) {
            console.log(`Balance DEVELOPER TEAM Before    : ${balanceDeveloperBefore}`);
            console.log(`Balance DEVELOPER TEAM After     : ${balanceDeveloperAfter}`);
            console.log(`Available Balance Before         : ${availableBefore}`);
            console.log(`Available Balance After          : ${availableAfter}`);
            console.log(`Available Comission              : ${balanceAfter.sub(currentDepositedNative)}`);
            console.log(`Comission                        : ${comission}`);
            console.log(`Bal. DEV. TEAM Before + Comission: ${balanceDeveloperBefore.add(comission)}`);
        }
        assert(balanceDeveloperAfter.gt(balanceDeveloperBefore)
            && availableAfter.gt(availableBefore)
            && balanceDeveloperAfter.gt(balanceDeveloperBefore)
            && availableAfter.lte(balanceAfter.sub(currentDepositedNative)));
    });

    it ('should update any native amount deposited into the contract as available', async () => {
        const availableBefore = await employer.availableNative();
        const balance = (await ethers.provider.getBalance(owner.address)).div(2);
        await signer.sendTransaction({to: employer.address, value: balance});
        const availableAfter = await employer.availableNative();
        if (CONSOLE_LOG) {
            console.log(`Balance                   : ${balance}`);
            console.log(`Available Before          : ${availableBefore}`);
            console.log(`Available After           : ${availableAfter}`);
            console.log(`Balance + Available Before: ${balance.add(availableBefore)}`);
        }
        assert(availableBefore.lt(availableAfter) && availableAfter.eq(balance.add(availableBefore)));
    });

    it ('should not allow a not enabled investor to anticipate TIME', async () => {
        let thrownException = false;
        const balance = (await ethers.provider.getBalance(addr2.address)).div(2);
        const timeBalance = await timeToken.balanceOf(addr2.address);
        await timeToken.connect(signer2).approve(employer.address, timeBalance);
        try {
            await employer.connect(signer2).deposit(timeBalance, true, {value: balance});
        } catch(error) {
            thrownException = true;
            if (CONSOLE_LOG) {
                console.log(error);
            }
        }
        assert(thrownException);
    });

    it ('should enable TIME anticipations correctly', async () => {
        const anticipationFee = await employer.anticipationFee();
        const isEnabledBefore = await employer.anticipationEnabled(addr2.address);
        await employer.connect(signer2).enableAnticipation({value: anticipationFee});
        const isEnabledAfter = await employer.anticipationEnabled(addr2.address);
        if (CONSOLE_LOG) {
            console.log(`Anticipation Fee : ${anticipationFee}`);
            console.log(`Is Enabled Before: ${isEnabledBefore}`);
            console.log(`Is Enabled After : ${isEnabledAfter}`);
        }
        assert(isEnabledAfter != isEnabledBefore && isEnabledAfter);
    });

    it ('values earned from anticipation enabling must be available to investors', async () => {
        const availableBefore = await employer.availableNative();
        const anticipationFee = await employer.anticipationFee();
        await employer.connect(signer).enableAnticipation({value: anticipationFee});
        const availableAfter = await employer.availableNative();
        const isEnabledAfter = await employer.anticipationEnabled(owner.address);
        if (CONSOLE_LOG) {
            console.log(`Available Before: ${availableBefore}`);
            console.log(`Available After : ${availableAfter}`);
            console.log(`It was Enabled?   ${isEnabledAfter}`);
        }
        assert(availableAfter.gt(availableBefore) && isEnabledAfter);
    });

    it ('should save some TIME for employer after enabling anticipation for an investor', async () => {
        const timeBalanceBefore = await timeToken.balanceOf(employer.address);
        const anticipationFee = await employer.anticipationFee();
        await employer.connect(signer1).enableAnticipation({value: anticipationFee});
        const timeBalanceAfter = await timeToken.balanceOf(employer.address);
        if (CONSOLE_LOG) {
            console.log(`TIME Balance Before: ${timeBalanceBefore}`);
            console.log(`TIME Balance After : ${timeBalanceAfter}`);
        }
        assert(timeBalanceAfter.gt(timeBalanceBefore));
    });

    it ('should query earnings for an investor', async () => {
        const timeBalanceBefore = await timeToken.balanceOf(owner.address);
        const timeBalanceSigner1 = await timeToken.balanceOf(addr1.address);
        const remainingTimeBefore = await employer.remainingTime(owner.address);
        const balance = (await ethers.provider.getBalance(owner.address)).div(4);
        await timeToken.connect(signer).approve(employer.address, timeBalanceBefore);
        const lastBlockDepositantBefore = await employer.lastBlock(owner.address);
        const blockNumberBefore = await ethers.provider.getBlockNumber();
        await employer.connect(signer).deposit(timeBalanceBefore, false, {value: balance});
        await timeToken.connect(signer1).approve(employer.address, timeBalanceSigner1);
        await employer.connect(signer1).deposit(timeBalanceSigner1, false, {value: balance});
        const availableNative = await employer.availableNative();
        const depositantAmount = await employer.deposited(owner.address);
        const currentDepositedNative = await employer.currentDepositedNative();
        const lastBlockDepositantAfter = await employer.lastBlock(owner.address);
        const blockNumberAfter = await ethers.provider.getBlockNumber();
        const timeBalanceAfter = await timeToken.balanceOf(owner.address);
        const currentROI = await employer.getCurrentROI();
        const expectedEarnings = await employer.queryEarnings(owner.address);
        const anticipatedEarnings = await employer.queryAnticipatedEarnings(owner.address, await employer.ONE_YEAR());
        const remainingTimeAfter = await employer.remainingTime(owner.address);
        if (CONSOLE_LOG) {
            console.log(`Block Number Before Deposit           : ${blockNumberBefore}`);
            console.log(`Block Number After Deposit            : ${blockNumberAfter}`);
            console.log(`OWNER Last Block Before               : ${lastBlockDepositantBefore}`);
            console.log(`OWNER Last Block After                : ${lastBlockDepositantAfter}`);
            console.log(`OWNER TIME Balance Before             : ${timeBalanceBefore}`);
            console.log(`OWNER TIME Balance After              : ${timeBalanceAfter}`);
            console.log(`OWNER TIME Remaining Before (Employer): ${remainingTimeBefore}`);
            console.log(`OWNER TIME Remaining After (Employer) : ${remainingTimeAfter}`);
            console.log(`Available Native                      : ${availableNative}`);
            console.log(`Deposited Native from Depositant      : ${depositantAmount}`);
            console.log(`TOTAL Deposited Native                : ${currentDepositedNative}`);
            console.log(`Current External ROI                  : ${(availableNative / currentDepositedNative).toFixed(6)}`);
            console.log(`Current Contract ROI                  : ${currentROI}`);
            console.log(`Expected Earnings                     : ${expectedEarnings}`);
            console.log(`Expected Anticipated Earnings         : ${anticipatedEarnings}`);
        }
        assert(!expectedEarnings.isZero());
    });

    it ('should withdraw earnings', async () => {
        const availableBefore = await employer.availableNative();
        const expectedEarnings = await employer.queryEarnings(owner.address);
        const balanceBefore = await ethers.provider.getBalance(owner.address);
        const totalDepositedBefore = await employer.currentDepositedNative();
        await employer.connect(signer).withdrawEarnings();
        const availableAfter = await employer.availableNative();
        const balanceAfter = await ethers.provider.getBalance(owner.address);
        const totalDepositedAfter = await employer.currentDepositedNative();
        if (CONSOLE_LOG) {
            console.log(`Expected Earnings          : ${expectedEarnings}`);
            console.log(`Realized Earnings (approx.): ${balanceAfter.sub(balanceBefore)}`);
            console.log(`Balance Before             : ${balanceBefore}`);
            console.log(`Balance After              : ${balanceAfter}`);
            console.log(`Available Before           : ${availableBefore}`);
            console.log(`Available After            : ${availableAfter}`);
            console.log(`Available After + Expected : ${availableAfter.add(expectedEarnings)}`);
            console.log(`Total Deposited Before     : ${totalDepositedBefore}`);
            console.log(`Total Deposited After      : ${totalDepositedAfter}`);
        }
        assert(balanceAfter.gt(balanceBefore)
            && totalDepositedAfter.eq(totalDepositedBefore)
            && availableAfter.lt(availableBefore));
    });

    it ('should withdraw anticipated earnings', async () => {
        const availableBefore = await employer.availableNative();
        const timeBalance = await timeToken.balanceOf(owner.address);
        await timeToken.connect(signer).approve(employer.address, timeBalance);
        const expectedEarnings = await employer.queryAnticipatedEarnings(owner.address, timeBalance);
        const balanceBefore = await ethers.provider.getBalance(owner.address);
        const totalDepositedBefore = await employer.currentDepositedNative();
        await employer.connect(signer).anticipate(timeBalance);
        await employer.connect(signer).withdrawEarnings();
        const availableAfter = await employer.availableNative();
        const balanceAfter = await ethers.provider.getBalance(owner.address);
        const totalDepositedAfter = await employer.currentDepositedNative();
        if (CONSOLE_LOG) {
            console.log(`TIME Balance               : ${timeBalance}`);
            console.log(`Expected Earnings          : ${expectedEarnings}`);
            console.log(`Realized Earnings (approx.): ${balanceAfter.sub(balanceBefore)}`);
            console.log(`Balance Before             : ${balanceBefore}`);
            console.log(`Balance After              : ${balanceAfter}`);
            console.log(`Available Before           : ${availableBefore}`);
            console.log(`Available After            : ${availableAfter}`);
            console.log(`Available After + Expected : ${availableAfter.add(expectedEarnings)}`);
            console.log(`Total Deposited Before     : ${totalDepositedBefore}`);
            console.log(`Total Deposited After      : ${totalDepositedAfter}`);
        }
        assert(balanceAfter.gt(balanceBefore) && totalDepositedAfter.eq(totalDepositedBefore));
    });

    it ('must be able to earn interest from TIME Token contract', async () => {
        const balance = (await ethers.provider.getBalance(addr2.address)).div(2);
        const employerTimeBalanceBefore = await timeToken.balanceOf(employer.address);
        const withdrawableShareBefore = await timeToken.withdrawableShareBalance(employer.address);
        await timeToken.connect(signer2).saveTime({value: balance});
        const withdrawableShareAfter = await timeToken.withdrawableShareBalance(employer.address);
        const availableBefore = await employer.availableNative();
        const timeTokenBalanceBefore = await ethers.provider.getBalance(timeToken.address);
        await employer.connect(signer).earn();
        const availableAfter = await employer.availableNative();
        const employerTimeBalanceAfter = await timeToken.balanceOf(employer.address);
        const timeTokenBalanceAfter = await ethers.provider.getBalance(timeToken.address);
        if (CONSOLE_LOG) {
            console.log(`Balance to Save             : ${balance}`);
            console.log(`Employer Available Before   : ${availableBefore}`);
            console.log(`Employer Available After    : ${availableAfter}`);
            console.log(`Employer TIME Balance Before: ${employerTimeBalanceBefore}`);
            console.log(`Employer TIME Balance After : ${employerTimeBalanceAfter}`);
            console.log(`Employer With. Share Before : ${withdrawableShareBefore}`);
            console.log(`Employer With. Share After  : ${withdrawableShareAfter}`);
            console.log(`TIME Token Contract Before  : ${timeTokenBalanceBefore}`);
            console.log(`TIME Token Contract After   : ${timeTokenBalanceAfter}`);
        }
        assert(availableAfter.gt(availableBefore));
    });

    it ('must compound investments correctly as requested, with NO anticipation', async () => {
        const availableEarningsBefore = await employer.queryEarnings(addr1.address);
        const depositedBefore = await employer.deposited(addr1.address);
        await employer.connect(signer1).compound(0, false);
        const depositedAfter = await employer.deposited(addr1.address);
        const availableEarningsAfter = await employer.queryEarnings(addr1.address);
        if (CONSOLE_LOG) {
            console.log(`ADDR1 Earnings Before: ${availableEarningsBefore}`);
            console.log(`ADDR1 Earnings After : ${availableEarningsAfter}`);
            console.log(`Deposited Before     : ${depositedBefore}`);
            console.log(`Deposited After      : ${depositedAfter}`);
        }
        assert(depositedAfter.gt(depositedBefore) && availableEarningsBefore.gt(availableEarningsAfter));
    });

    it ('must compound investments correctly as requested, WITH anticipation', async () => {
        const timeBalanceBefore = await timeToken.balanceOf(addr1.address);
        const availableEarningsBefore = await employer.queryAnticipatedEarnings(addr1.address, timeBalanceBefore);
        const depositedBefore = await employer.deposited(addr1.address);
        await timeToken.connect(signer1).approve(employer.address, timeBalanceBefore);
        await employer.connect(signer1).compound(timeBalanceBefore, true);
        const depositedAfter = await employer.deposited(addr1.address);
        const availableEarningsAfter = await employer.queryEarnings(addr1.address);
        const timeBalanceAfter = await timeToken.balanceOf(addr1.address);
        if (CONSOLE_LOG) {
            console.log(`ADDR1 TIME Before    : ${timeBalanceBefore}`);
            console.log(`ADDR1 TIME After     : ${timeBalanceAfter}`);
            console.log(`ADDR1 Earnings Before: ${availableEarningsBefore}`);
            console.log(`ADDR1 Earnings After : ${availableEarningsAfter}`);
            console.log(`Deposited Before     : ${depositedBefore}`);
            console.log(`Deposited After      : ${depositedAfter}`);
        }
        assert(depositedAfter.gt(depositedBefore) && availableEarningsBefore.gt(availableEarningsAfter));
    });

    it ('balance must be greater than or equal to availableNative and currentDepositedNative together', async () => {
        const balance = await ethers.provider.getBalance(employer.address);
        const availableNative = await employer.availableNative();
        const currentDepositedNative = await employer.currentDepositedNative();
        if (CONSOLE_LOG) {
            console.log(`Balance            : ${balance}`);
            console.log(`Available Native   : ${availableNative}`);
            console.log(`Current Deposited  : ${currentDepositedNative}`);
            console.log(`Available + Current: ${availableNative.add(currentDepositedNative)}`);
        }
        assert(balance.gte(availableNative.add(currentDepositedNative)));
    });

    it ('should allow earning anticipation without any new deposit', async () => {
        const timeBalanceBefore = await timeToken.balanceOf(owner.address);
        const oldEarnings = await employer.queryEarnings(owner.address);
        if (!oldEarnings.isZero())
            await employer.connect(signer).withdrawEarnings();
        await timeToken.connect(signer).approve(employer.address, timeBalanceBefore);
        const newEarnings = await employer.queryAnticipatedEarnings(owner.address, timeBalanceBefore);
        const balanceBefore = await ethers.provider.getBalance(owner.address);
        await employer.connect(signer).anticipate(timeBalanceBefore);
        const balanceAfter = await ethers.provider.getBalance(owner.address);
        const timeBalanceAfter = await timeToken.balanceOf(owner.address);
        if (CONSOLE_LOG) {
            console.log(`Earnings                   : ${newEarnings}`);
            console.log(`TIME Before Anticipation   : ${timeBalanceBefore}`);
            console.log(`TIME After Anticipation    : ${timeBalanceAfter}`);
            console.log(`Balance Before Anticipation: ${balanceBefore}`);
            console.log(`Balance After Anticipation : ${balanceAfter}`);
        }
        assert(balanceAfter.gt(balanceBefore) && timeBalanceBefore.gt(timeBalanceAfter));
    });

    it ('should withdraw deposit with all earnings', async () => {
        let max = ethers.BigNumber.from(-1);
        let signer_;
        let address;
        const earnings = await employer.queryEarnings(owner.address);
        const earnings1 = await employer.queryEarnings(addr1.address);
        const earnings2 = await employer.queryEarnings(addr2.address);
        if (earnings.gt(max)) {
            max = earnings;
            signer_ = signer;
            address = owner;
        }
        if (earnings1.gt(max)) {
            max = earnings1;
            signer_ = signer1;
            address = addr1;
        }
        if (earnings2.gt(max)) {
            max = earnings2;
            signer_ = signer2;
            address = addr2;
        }

        const balanceBefore =  await ethers.provider.getBalance(address.address);
        const depositedBefore = await employer.deposited(address.address);
        const availableBefore = await employer.availableNative();
        await employer.connect(signer_).withdrawDeposit();
        const availableAfter = await employer.availableNative();
        const balanceAfter =  await ethers.provider.getBalance(address.address);
        const depositedAfter = await employer.deposited(address.address);
        
        if (CONSOLE_LOG) {
            console.log(`Earnings        : ${max}`);
            console.log(`Balance Before  : ${balanceBefore}`);
            console.log(`Balance After   : ${balanceAfter}`);
            console.log(`Deposited Before: ${depositedBefore}`);
            console.log(`Deposited After : ${depositedAfter}`);
            console.log(`Available Before: ${availableBefore}`);
            console.log(`Available After : ${availableAfter}`);
        }
        assert(depositedAfter.lt(depositedBefore) && balanceAfter.gt(balanceBefore) && availableAfter.lt(availableBefore));
    });

    it ('should withdraw deposit with no earnings (emergency)', async () => {
        let max = ethers.BigNumber.from(-1);
        let signer_;
        let address;
        const deposit = await employer.deposited(owner.address);
        const deposit1 = await employer.deposited(addr1.address);
        const deposit2 = await employer.deposited(addr2.address);
        if (deposit.gt(max)) {
            max = deposit;
            signer_ = signer;
            address = owner;
        }
        if (deposit1.gt(max)) {
            max = deposit1;
            signer_ = signer1;
            address = addr1;
        }
        if (deposit2.gt(max)) {
            max = deposit2;
            signer_ = signer2;
            address = addr2;
        }

        const contractRealBalance = await ethers.provider.getBalance(employer.address);
        const contractBalance = await employer.currentDepositedNative();
        const balanceBefore =  await ethers.provider.getBalance(address.address);
        const availableBefore = await employer.availableNative();
        await employer.connect(signer_).withdrawDepositEmergency();
        const balanceAfter =  await ethers.provider.getBalance(address.address);
        const depositedAfter = await employer.deposited(address.address);
        const availableAfter = await employer.availableNative();
        
        if (CONSOLE_LOG) {
            console.log(`Contract Real Balance: ${contractRealBalance}`);
            console.log(`Contract Balance     : ${contractBalance}`);
            console.log(`Balance Before       : ${balanceBefore}`);
            console.log(`Balance After        : ${balanceAfter}`);
            console.log(`Deposited Before     : ${max}`);
            console.log(`Deposited After      : ${depositedAfter}`);
            console.log(`Available Before     : ${availableBefore}`);
            console.log(`Available After      : ${availableAfter}`);
        }
        assert(balanceAfter.gt(balanceBefore) && availableAfter.eq(availableBefore));
    });
});