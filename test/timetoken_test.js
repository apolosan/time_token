const { expect, assert } = require('chai');
const { ethers } = require('hardhat');

/*
  FOR CORRECT TESTING VALUES SHOULD BE:

    uint256 public constant TIME_BASE_LIQUIDITY = 900000 * D;
    uint256 public constant TIME_BASE_FEE = 1 * D; 
*/

const FACTOR = 17;
const DECIMALS = 18;
const CONSOLE_LOG = true;
const DEVELOPER_ADDRESS = "0x731591207791A93fB0Ec481186fb086E16A7d6D0";

describe("TimeToken", async () => {
  let TimeToken, owner, addr1, addr2, addrs, timeToken;
  let signer, signer1, signer2;
  let enabledBlocks = [0, 0, 0];
  let dynamicFee, dynamicFeeInTime, averageMiningRate;

  before(async () => {
    TimeToken = await ethers.getContractFactory('TimeToken');
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    signer = ethers.provider.getSigner(owner.address);
    signer1 = ethers.provider.getSigner(addr1.address);
    signer2 = ethers.provider.getSigner(addr2.address);
    timeToken = await TimeToken.deploy("TIME", "Time Token");
  });

  beforeEach(async () => {
    const t = await TimeToken.deploy("TIME", "Time Token");
    const blockNumber = await ethers.provider.getBlockNumber();
    if (CONSOLE_LOG) {
      console.log(`CURRENT BLOCK: ${blockNumber}`)
    }
  });

  it('should deploy and initialize TIME token correctly', async () => {
    const timeAddress = await timeToken.address;
    const baseFee = await timeToken.BASE_FEE();
    const timeBaseFee = await timeToken.TIME_BASE_FEE();

    if (CONSOLE_LOG) {
      console.log(`TIME Address: ${timeAddress}`);
      console.log(`TIME Base Fee: ${baseFee}`);
      console.log(`TIME Time Base Fee: ${timeBaseFee}`);
    }
    assert(timeAddress != undefined && baseFee > 0 && timeBaseFee > 0);
  });

  it('should register the first block in contract when deploying', async () => {
    const firstBlock = await timeToken.firstBlock();

    if (CONSOLE_LOG) {
      console.log(`TIME Token Contract First Block: ${firstBlock}`);
    }
    assert(firstBlock != undefined);
  });

  it('should calculate the average mining rate correctly', async () => {
    averageMiningRate = await timeToken.averageMiningRate();

    if (CONSOLE_LOG) {
      console.log(`TIME Avg. Mining Rate: ${averageMiningRate}`);
    }
    assert(averageMiningRate != undefined);
  });

  it('should obtain dynamic fee() amount correctly', async () => {
    dynamicFee = await timeToken.fee();
    
    if (CONSOLE_LOG) {
      console.log(`TIME Dynamic Fee: ${dynamicFee}`);
    }
    assert(dynamicFee > 0);
  });

  it('should obtain dynamic feeInTime() amount correctly', async () => {
    dynamicFeeInTime = await timeToken.feeInTime();

    if (CONSOLE_LOG) {
      console.log(`TIME Dynamic Fee (in TIME tokens): ${dynamicFeeInTime}`);
    }
    assert(dynamicFeeInTime > 0);
  });

  it('should register the correct addresses of the developer team', async () => {
    const address_01 = await timeToken.DEVELOPER_ADDRESS();
    //const address_02 = await timeToken.DEVELOPER_ADDRESS_2();

    if (CONSOLE_LOG) {
      console.log(`DEVELOPER TEAM - DEFINED ADDRESS 01 : ${DEVELOPER_ADDRESS}`);
      console.log(`DEVELOPER TEAM - EXPECTED ADDRESS 01: ${address_01}`);
      //console.log(`DEVELOPER TEAM - DEFINED ADDRESS 02 : ${DEVELOPER_ADDRESS_2}`);
      //console.log(`DEVELOPER TEAM - EXPECTED ADDRESS 02: ${address_02}`);
    }
    //assert(address_01 == DEVELOPER_ADDRESS_1 && address_02 == DEVELOPER_ADDRESS_2);
    assert(address_01 == DEVELOPER_ADDRESS);
  });

  it('should enable an address for mining by using dynamic fee', async () => {
    const fee = await timeToken.fee();
    const firstQuery = await timeToken.isMiningAllowed(owner.address);
    await timeToken.connect(signer).enableMining({value: fee});
    enabledBlocks[0] = await ethers.provider.getBlockNumber();
    const secondQuery = await timeToken.isMiningAllowed(owner.address);

    if (CONSOLE_LOG) {
      console.log(`Is the address ${owner.address} enabled BEFORE calling the enableMining() function? ${firstQuery}`);
      console.log(`Is the address ${owner.address} enabled AFTER calling the enableMining() function ? ${secondQuery}`);
    }
    assert(!firstQuery && secondQuery);
  });

  it('should provide balance in TIME and native cryptocurrency for contract in order to exchange', async () => {
    const timeBalance = await timeToken.balanceOf(timeToken.address);
    const balance = await ethers.provider.getBalance(timeToken.address);

    if (CONSOLE_LOG) {
      console.log(`${timeToken.address} Balance in TIME: ${timeBalance}`);
      console.log(`${timeToken.address} Balance in ETH : ${balance}`);
    }
    assert(timeBalance > 0 && balance > 0);
  });

  it('should mint the correct TIME amount for an enabled address', async () => {
    const balanceBefore = await timeToken.balanceOf(owner.address);
    await timeToken.connect(signer).mining();
    const balanceAfter = await timeToken.balanceOf(owner.address);
    const currentBlock = await ethers.provider.getBlockNumber();
    let expectedTimeAmount = currentBlock - enabledBlocks[0];
    expectedTimeAmount = ethers.utils.parseEther(expectedTimeAmount.toString());
    
    if (CONSOLE_LOG) {
      console.log(`${owner.address} Balance BEFORE calling the mining() function: ${balanceBefore}`);
      console.log(`${owner.address} Balance AFTER calling the mining() function : ${balanceAfter}`);
      console.log(`${owner.address} Expected Balance in TIME                    : ${expectedTimeAmount}`);
    }
    assert(balanceBefore == 0 && balanceAfter > 0 && balanceAfter.toString() == expectedTimeAmount.toString());
  });

  it('should update the average mining rate after calling the mining() function', async () => {
    const currentAverageMiningRate = await timeToken.averageMiningRate();

    if (CONSOLE_LOG) {
      console.log(`TIME Last Avg. Mining Rate   : ${averageMiningRate}`);
      console.log(`TIME Current Avg. Mining Rate: ${currentAverageMiningRate}`);
    }
    assert(averageMiningRate.toString() != currentAverageMiningRate.toString());
  });

  it('should adjust fee() calculation after mining TIME', async () => {
    const currentFee = await timeToken.fee();
    
    if (CONSOLE_LOG) {
      console.log(`Last Fee   : ${dynamicFee}`);
      console.log(`Current Fee: ${currentFee}`);
    }
    assert(dynamicFee.toString() != currentFee.toString());
  });

  it('should adjust feeInTime() calculation after mining TIME', async () => {
    const currentFeeInTime = await timeToken.feeInTime();
    
    if (CONSOLE_LOG) {
      console.log(`Last Fee in TIME   : ${dynamicFeeInTime}`);
      console.log(`Current Fee in TIME: ${currentFeeInTime}`);
    }
    assert(dynamicFeeInTime.toString() != currentFeeInTime.toString());
  });

  it('should transfer TIME correctly', async () => {
    await timeToken.connect(signer).mining();
    const balance = await timeToken.balanceOf(owner.address);
    const balanceBefore = await timeToken.balanceOf(addr1.address);
    await timeToken.connect(signer).transfer(addr1.address, balance);
    const balanceAfter = await timeToken.balanceOf(addr1.address);

    if (CONSOLE_LOG) {
      console.log(`${addr1.address} Balance in TIME BEFORE transfer: ${balanceBefore}`);
      console.log(`${addr1.address} Balance in TIME AFTER transfer : ${balanceAfter}`);
    }
    assert(balanceAfter > 0 && balanceBefore.toString() != balanceAfter.toString());
  });

  it('should enable an address for mining by using only TIME tokens', async () => {
    const feeInTime = await timeToken.feeInTime();
    const balance = await timeToken.balanceOf(addr1.address);
    const firstQuery = await timeToken.isMiningAllowed(addr1.address);

    await timeToken.connect(signer1).saveTime({value: balance.div(10)});

    await timeToken.connect(signer1).enableMiningWithTimeToken();
    const secondQuery = await timeToken.isMiningAllowed(addr1.address);

    if (CONSOLE_LOG) {
      console.log(`Charged Fee in TIME: ${feeInTime}`);
      console.log(`${addr1.address} Amount in TIME: ${balance}`);
      console.log(`Is the address ${addr1.address} enabled BEFORE calling the enableMiningWithTimeToken() function? ${firstQuery}`);
      console.log(`Is the address ${addr1.address} enabled AFTER calling the enableMiningWithTimeToken() function ? ${secondQuery}`);
    }
    assert(!firstQuery && secondQuery);
  });

  it('should query the rates for exchanging TIME for ETH', async () => {
    const amount = await timeToken.balanceOf(addr1.address);
    const rate = await timeToken.swapPriceTimeInverse(amount);

    if (CONSOLE_LOG) {
      console.log(`Current rate when need to exchange ${amount} TIME: ${rate}`);
    }

    assert(rate != undefined && rate > 0);
  });

  it('should query the rates for exchanging ETH for TIME', async () => {
    const amount = ethers.utils.parseEther('1');
    const rate = await timeToken.swapPriceNative(amount);

    if (CONSOLE_LOG) {
      console.log(`Current rate when need to exchange ${amount} ETH: ${rate}`);
    }

    assert(rate != undefined && rate > 0);
  });

  it('should exchange TIME for ETH correctly (spend TIME)', async () => {
    const dexBalanceBefore = await ethers.provider.getBalance(timeToken.address);
    const dexBalanceInTimeBefore = await timeToken.balanceOf(timeToken.address);
    const balanceBefore = await ethers.provider.getBalance(addr1.address);
    const balanceInTimeBefore = await timeToken.balanceOf(addr1.address);
    const rate = await timeToken.swapPriceTimeInverse(balanceInTimeBefore);
    const expectedValueNative = balanceInTimeBefore.mul(rate).div(ethers.utils.parseUnits("10", FACTOR)); 
    // const expectedValueNative = balanceInTimeBefore.mul(ethers.utils.parseUnits("10", FACTOR)).div(rate);
    await timeToken.connect(signer1).spendTime(balanceInTimeBefore);
    const dexBalanceAfter = await ethers.provider.getBalance(timeToken.address);
    const dexBalanceInTimeAfter = await timeToken.balanceOf(timeToken.address);
    const balanceAfter = await ethers.provider.getBalance(addr1.address);
    const balanceInTimeAfter = await timeToken.balanceOf(addr1.address);

    if (CONSOLE_LOG) {
      console.log(`Obtained rate (TIME/ETH) for spending ${balanceInTimeBefore} TIME: ${rate}`);
      console.log(`${timeToken.address} DEX Balance BEFORE spending TIME: ${dexBalanceBefore}`);
      console.log(`${timeToken.address} DEX Balance AFTER spending TIME : ${dexBalanceAfter}`);
      console.log(`${timeToken.address} DEX Balance in TIME BEFORE spending TIME: ${dexBalanceInTimeBefore}`);
      console.log(`${timeToken.address} DEX Balance in TIME AFTER spending TIME : ${dexBalanceInTimeAfter}`);
      console.log(`${addr1.address} Balance in TIME BEFORE spending TIME: ${balanceInTimeBefore}`);
      console.log(`${addr1.address} Balance in TIME AFTER spending TIME : ${balanceInTimeAfter}`);
      console.log(`${addr1.address} Balance BEFORE spending TIME: ${balanceBefore}`);
      console.log(`${addr1.address} Balance AFTER spending TIME : ${balanceAfter}`);
      console.log(`Expected amount to receive: ${expectedValueNative}`);
      console.log(`Amount received           : ${balanceAfter.sub(balanceBefore)}`);
    }
    assert(dexBalanceAfter.lt(dexBalanceBefore)
      && dexBalanceInTimeAfter.gt(dexBalanceInTimeBefore)
      && balanceInTimeAfter.lt(balanceInTimeBefore));
  });

  it('should exchange ETH for TIME correctly (save TIME)', async () => {
    const amount = ethers.utils.parseEther('0.1');
    const dexBalanceBefore = await ethers.provider.getBalance(timeToken.address);
    const dexBalanceInTimeBefore = await timeToken.balanceOf(timeToken.address);
    const balanceBefore = await ethers.provider.getBalance(owner.address);
    const balanceInTimeBefore = await timeToken.balanceOf(owner.address);
    const rate = await timeToken.swapPriceNative(amount);
    const expectedValueInTime = amount.mul(rate).div(ethers.utils.parseUnits("10", FACTOR)); 
    await timeToken.connect(signer).saveTime({value: amount.toString()});
    const dexBalanceAfter = await ethers.provider.getBalance(timeToken.address);
    const dexBalanceInTimeAfter = await timeToken.balanceOf(timeToken.address);
    const balanceAfter = await ethers.provider.getBalance(owner.address);
    const balanceInTimeAfter = await timeToken.balanceOf(owner.address);

    if (CONSOLE_LOG) {
      console.log(`Obtained rate (TIME/ETH) for saving ${amount} ETH: ${rate}`);
      console.log(`${timeToken.address} DEX Balance BEFORE saving TIME: ${dexBalanceBefore}`);
      console.log(`${timeToken.address} DEX Balance AFTER saving TIME : ${dexBalanceAfter}`);
      console.log(`${timeToken.address} DEX Balance in TIME BEFORE saving TIME: ${dexBalanceInTimeBefore}`);
      console.log(`${timeToken.address} DEX Balance in TIME AFTER saving TIME : ${dexBalanceInTimeAfter}`);
      console.log(`${owner.address} Balance in TIME BEFORE saving TIME: ${balanceInTimeBefore}`);
      console.log(`${owner.address} Balance in TIME AFTER saving TIME : ${balanceInTimeAfter}`);
      console.log(`${owner.address} Balance BEFORE saving TIME: ${balanceBefore}`);
      console.log(`${owner.address} Balance AFTER saving TIME : ${balanceAfter}`);      
      console.log(`Expected amount to receive: ${expectedValueInTime}`);
      console.log(`Amount received           : ${balanceInTimeAfter.sub(balanceInTimeBefore)}`);
    }
    assert(balanceAfter.lt(balanceBefore)
      && dexBalanceAfter.gt(dexBalanceBefore)
      && dexBalanceInTimeAfter.lt(dexBalanceInTimeBefore)
      && balanceInTimeAfter.gt(balanceInTimeBefore));
  });

  it('should pay the developer team correctly after a swap [TIME to ETH]', async () => {
    const balance = await ethers.provider.getBalance(owner.address);
    await timeToken.donateEth({value: balance.div(2)});
    // await signer.sendTransaction({to: timeToken.address, value: balance.div(2)});

    let amount = await timeToken.balanceOf(owner.address); amount = amount.div(5000);
    const rate = await timeToken.swapPriceTimeInverse(amount);
    // const expectedValueNative = amount.mul(ethers.utils.parseUnits("10", FACTOR)).div(rate);
    const expectedValueNative = amount.mul(rate).div(ethers.utils.parseUnits("10", FACTOR)); 

    const dexBalanceBefore = await ethers.provider.getBalance(timeToken.address);
    const dexBalanceInTimeBefore = await timeToken.balanceOf(timeToken.address);
    const balanceBefore = await timeToken.balanceOf(DEVELOPER_ADDRESS);
    await timeToken.connect(signer).spendTime(amount);
    const balanceAfter = await timeToken.balanceOf(DEVELOPER_ADDRESS);

    if (CONSOLE_LOG) {
      console.log(`${DEVELOPER_ADDRESS} Balance in TIME BEFORE the swap    : ${balanceBefore}`);
      console.log(`${DEVELOPER_ADDRESS} Balance in TIME AFTER the swap     : ${balanceAfter}`);
      console.log(`${owner.address} Amount to be exchanged in TIME         : ${amount}`);
      console.log(`${timeToken.address} DEX Balance BEFORE the swap        : ${dexBalanceBefore}`);
      console.log(`${timeToken.address} DEX Balance in TIME BEFORE the swap: ${dexBalanceInTimeBefore}`);
      console.log(`Expected exchanged value in Native                      : ${expectedValueNative}`);
    }
    assert(balanceAfter.gt(balanceBefore));
  });

  it('should pay the developer team correctly after a swap [ETH to TIME]', async () => {
    const amount = await ethers.provider.getBalance(owner.address);
    const balanceBefore = await ethers.provider.getBalance(DEVELOPER_ADDRESS);
    await timeToken.connect(signer).saveTime({value: amount.div(100)});
    const balanceAfter = await ethers.provider.getBalance(DEVELOPER_ADDRESS);

    if (CONSOLE_LOG) {
      console.log(`${DEVELOPER_ADDRESS} Balance in ETH BEFORE the swap: ${balanceBefore}`);
      console.log(`${DEVELOPER_ADDRESS} Balance in ETH AFTER the swap : ${balanceAfter}`);
    }
    assert(balanceAfter.gt(balanceBefore));
  });

  it('should burn TIME correctly', async () => {
    await timeToken.connect(signer).mining();
    const balanceBefore = await timeToken.balanceOf(owner.address);
    await timeToken.connect(signer).burn(balanceBefore);
    const balanceAfter = await timeToken.balanceOf(owner.address);

    if (CONSOLE_LOG) {
      console.log(`${owner.address} Balance BEFORE the burn(): ${balanceBefore}`);
      console.log(`${owner.address} Balance AFTER the burn() : ${balanceAfter}`);
    }
    assert(balanceBefore.toString() != balanceAfter.toString() && balanceAfter == 0);
  });

  it('should mine the correct amount of TIME after another mining() event', async () => {
    const balanceBefore = await timeToken.balanceOf(owner.address);
    await timeToken.connect(signer).mining();
    const balanceAfter = await timeToken.balanceOf(owner.address);

    if (CONSOLE_LOG) {
      console.log(`${owner.address} Balance BEFORE mining() event: ${balanceBefore}`);
      console.log(`${owner.address} Balance AFTER mining() event : ${balanceAfter}`);
    }
    assert(balanceAfter.gt(balanceBefore));
  });

  it('should exchange TIME for ETH when transferring TIME directly to the contract address', async () => {
    await timeToken.connect(signer1).mining();

    const dexBalanceBefore = await ethers.provider.getBalance(timeToken.address);
    const dexBalanceInTimeBefore = await timeToken.balanceOf(timeToken.address);
    const balanceBefore = await ethers.provider.getBalance(addr1.address);
    const balanceInTimeBefore = await timeToken.balanceOf(addr1.address);
    const rate = await timeToken.swapPriceTimeInverse(balanceInTimeBefore);
    // const expectedValueNative = balanceInTimeBefore.mul(ethers.utils.parseUnits("10", FACTOR)).div(rate);
    const expectedValueNative = balanceInTimeBefore.mul(rate).div(ethers.utils.parseUnits("10", FACTOR));
    await timeToken.connect(signer1).transfer(timeToken.address, balanceInTimeBefore);
    const balanceAfter = await ethers.provider.getBalance(addr1.address);
    const balanceInTimeAfter = await timeToken.balanceOf(addr1.address);
    const dexBalanceAfter = await ethers.provider.getBalance(timeToken.address);
    const dexBalanceInTimeAfter = await timeToken.balanceOf(timeToken.address);

    if (CONSOLE_LOG) {
      console.log(`Expected exchanged value in Native                         : ${expectedValueNative}`);
      console.log(`${addr1.address} Balance BEFORE the swap                   : ${balanceBefore}`);
      console.log(`${addr1.address} Balance AFTER the swap                    : ${balanceAfter}`);
      console.log(`${addr1.address} Balance in TIME BEFORE the swap           : ${balanceInTimeBefore}`);
      console.log(`${addr1.address} Balance in TIME AFTER the swap            : ${balanceInTimeAfter}`);
      console.log(`${timeToken.address} DEX Balance BEFORE saving TIME        : ${dexBalanceBefore}`);
      console.log(`${timeToken.address} DEX Balance AFTER saving TIME         : ${dexBalanceAfter}`);
      console.log(`${timeToken.address} DEX Balance in TIME BEFORE saving TIME: ${dexBalanceInTimeBefore}`);
      console.log(`${timeToken.address} DEX Balance in TIME AFTER saving TIME : ${dexBalanceInTimeAfter}`);
    }
    assert(balanceInTimeAfter.lt(balanceInTimeBefore)
      && dexBalanceAfter.lt(dexBalanceBefore)
      && dexBalanceInTimeAfter.gt(dexBalanceInTimeBefore)
    );
  });

  it('should exchange ETH for TIME when transferring ETH directly to the contract address', async () => {
    const dexBalanceBefore = await ethers.provider.getBalance(timeToken.address);
    const dexBalanceInTimeBefore = await timeToken.balanceOf(timeToken.address);
    let balanceBefore = await ethers.provider.getBalance(addr1.address);
    balanceBefore = balanceBefore.div(1000);
    const balanceInTimeBefore = await timeToken.balanceOf(addr1.address);
    const rate = await timeToken.swapPriceNative(balanceBefore);
    const expectedValueNative = balanceBefore.mul(rate).div(ethers.utils.parseUnits("10", FACTOR));
    await signer1.sendTransaction({to: timeToken.address, value: balanceBefore});
    const balanceAfter = await ethers.provider.getBalance(addr1.address);
    const balanceInTimeAfter = await timeToken.balanceOf(addr1.address);
    const dexBalanceAfter = await ethers.provider.getBalance(timeToken.address);
    const dexBalanceInTimeAfter = await timeToken.balanceOf(timeToken.address);

    if (CONSOLE_LOG) {
      console.log(`Expected exchanged value in Native                         : ${expectedValueNative}`);
      console.log(`${addr1.address} Balance BEFORE the swap                   : ${balanceBefore}`);
      console.log(`${addr1.address} Balance AFTER the swap                    : ${balanceAfter}`);
      console.log(`${addr1.address} Balance in TIME BEFORE the swap           : ${balanceInTimeBefore}`);
      console.log(`${addr1.address} Balance in TIME AFTER the swap            : ${balanceInTimeAfter}`);
      console.log(`${timeToken.address} DEX Balance BEFORE saving TIME        : ${dexBalanceBefore}`);
      console.log(`${timeToken.address} DEX Balance AFTER saving TIME         : ${dexBalanceAfter}`);
      console.log(`${timeToken.address} DEX Balance in TIME BEFORE saving TIME: ${dexBalanceInTimeBefore}`);
      console.log(`${timeToken.address} DEX Balance in TIME AFTER saving TIME : ${dexBalanceInTimeAfter}`);
    }
    assert(balanceInTimeAfter.gt(balanceInTimeBefore)
      && dexBalanceAfter.gt(dexBalanceBefore)
      && dexBalanceInTimeAfter.lt(dexBalanceInTimeBefore)
    );
  });

  it('should withdraw the shared amount for an address', async () => {
    const initialShareBalance = await timeToken.withdrawableShareBalance(owner.address);
    const initialBalance = await ethers.provider.getBalance(owner.address);
    await timeToken.connect(signer).withdrawShare();
    const finalShareBalance = await timeToken.withdrawableShareBalance(owner.address);
    const finalBalance = await ethers.provider.getBalance(owner.address);

    if (CONSOLE_LOG) {
      console.log(`${owner.address} Initial balance       : ${initialBalance}`);
      console.log(`${owner.address} Final balance         : ${finalBalance}`);
      console.log(`${owner.address} Initial share balance : ${initialShareBalance}`);
      console.log(`${owner.address} Final share balance   : ${finalShareBalance}`);
    }

    assert(initialShareBalance.gt(finalShareBalance) && initialBalance.lt(finalBalance));
  });

  it('should increase the withdrawable share balance after some swap operation', async () => {
    const balance = await ethers.provider.getBalance(addr1.address);
    const initialBalance = await ethers.provider.getBalance(owner.address);
    const initialShareBalance = await timeToken.withdrawableShareBalance(owner.address);
    await timeToken.connect(signer1).saveTime({value: balance.div(20)});
    const midShareBalance = await timeToken.withdrawableShareBalance(owner.address);
    await timeToken.connect(signer).withdrawShare();
    const finalShareBalance = await timeToken.withdrawableShareBalance(owner.address);
    const finalBalance = await ethers.provider.getBalance(owner.address);

    if (CONSOLE_LOG) {
      console.log(`${owner.address} Initial Share Balance  : ${initialShareBalance}`);
      console.log(`${owner.address} Mid Share Balance      : ${midShareBalance}`);
      console.log(`${owner.address} Final Share Balance    : ${finalShareBalance}`);
      console.log(`${owner.address} Initial Balance        : ${initialBalance}`);
      console.log(`${owner.address} Final Balance          : ${finalBalance}`);
    }

    assert(initialShareBalance.lt(midShareBalance));
  });

  it('must have shared balance with pool balance less than or equal to address(this).balance', async () => {
    const sharedBalance = await timeToken.sharedBalance();
    const poolBalance = await timeToken.poolBalance();
    const balance = await ethers.provider.getBalance(timeToken.address);

    if (CONSOLE_LOG) {
      console.log(`Shared Balance               : ${sharedBalance}`);
      console.log(`Pool Balance                 : ${poolBalance}`);
      console.log(`Balance                      : ${balance}`);
      console.log(`Shared Balance + Pool Balance: ${sharedBalance.add(poolBalance)}`);
    }

    assert((sharedBalance.add(poolBalance)).lte(balance));
  });

  it('should not allow for a holder to receive an already claimed share', async () => {
    await timeToken.connect(signer).mining();
    await timeToken.connect(signer1).mining();

    let donationAmount = await ethers.provider.getBalance(addr2.address);
    await timeToken.connect(signer2).donateEth({value: donationAmount.div(200)});

    const initialShareBalance01 = await timeToken.withdrawableShareBalance(owner.address);
    const initialShareBalance02 = await timeToken.withdrawableShareBalance(addr1.address);
    const timeBalanceBefore01 = await timeToken.balanceOf(owner.address);
    const timeBalanceBefore02 = await timeToken.balanceOf(addr1.address);
    await timeToken.connect(signer1).withdrawShare();
    await timeToken.connect(signer1).transfer(owner.address, timeBalanceBefore02);
    const midShareBalance01 = await timeToken.withdrawableShareBalance(owner.address);
    const midShareBalance02 = await timeToken.withdrawableShareBalance(addr1.address);
    await timeToken.connect(signer).withdrawShare();
    const timeBalanceAfter01 = await timeToken.balanceOf(owner.address);
    const timeBalanceAfter02 = await timeToken.balanceOf(addr1.address);

    donationAmount = await ethers.provider.getBalance(addr2.address);
    await timeToken.connect(signer2).donateEth({value: donationAmount.div(200)});

    const finalShareBalance01 = await timeToken.withdrawableShareBalance(owner.address);
    const finalShareBalance02 = await timeToken.withdrawableShareBalance(addr1.address);

    if (CONSOLE_LOG) {
      console.log(`OWNER Initial Share Balance 01     : ${initialShareBalance01}`);
      console.log(`ADDRESS #1 Initial Share Balance 02: ${initialShareBalance02}`);
      console.log(`OWNER Mid Share Balance 01         : ${midShareBalance01}`);
      console.log(`ADDRESS #1 Mid Share Balance 02    : ${midShareBalance02}`);
      console.log(`OWNER TIME Balance BEFORE 01       : ${timeBalanceBefore01}`);
      console.log(`OWNER TIME Balance AFTER  01       : ${timeBalanceAfter01}`);
      console.log(`ADDRESS #1 TIME Balance BEFORE 02  : ${timeBalanceBefore02}`);
      console.log(`ADDRESS #1 TIME Balance AFTER  02  : ${timeBalanceAfter02}`);
      console.log(`OWNER Final Share Balance 01       : ${finalShareBalance01}`);
      console.log(`ADDRESS #1 Final Share Balance 02  : ${finalShareBalance02}`);
    }
    assert(midShareBalance01.eq(initialShareBalance01) && finalShareBalance01 > 0);
  });
});
