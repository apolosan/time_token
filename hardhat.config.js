require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-ganache");
//require('hardhat-ethernal');
require('hardhat-contract-sizer');
require("hardhat-gas-reporter");
require('dotenv').config();

const { MNEMONIC_PRODUCTION, MNEMONIC_LOCAL, MNEMONIC_MUMBAI, PRIVATE_KEY_EVMOS } = process.env;
const mnemonic_ = MNEMONIC_MUMBAI;

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  	solidity: {
			version: "0.8.0",
			settings: {
        evmVersion: "byzantium",
				optimizer: {
					enabled: true,
					runs: 2000000
				}
			}
		},
	networks: {
		development: {
      url: `http://127.0.0.1:8545`,
			mnemonic: {mnemonic: mnemonic_},
			gas: "auto",
			gasPrice: 62283819765,
      timeout: 40000
		},
		bsc_testnet: {
			url: `https://data-seed-prebsc-1-s1.binance.org:8545`,
			accounts: {mnemonic: mnemonic_},
      blockGasLimit: 12450000,
      gasPrice: "auto",
      gas: 6000000,
			network_id: 97,
      timeout: 40000
		},
		bsc_mainnet: {
			url: `https://bsc-dataseed1.defibit.io`,
			network_id: 56,
			accounts: {mnemonic: mnemonic_},
			blockGasLimit: 12450000,
			gas: 12450000,
			gasPrice: "auto", // 5000000000,
      timeout: 40000
		},
		eth_mainnet: {
			url: `https://mainnet.infura.io/v3/`,
			accounts: {mnemonic: mnemonic_},
			blockGasLimit: 5000000,
			gas: 5000000,
			gasPrice: "auto",
			network_id: 1,
      timeout: 40000
		},
    eth_kovan: {
      url: `https://kovan.infura.io/v3/`,
      accounts: {mnemonic: mnemonic_},
      blockGasLimit: 12450000,
      gas: 12450000,
      gasPrice: "auto",
      network_id: 42,
      timeout: 40000
    },
    eth_rinkeby: {
      url: `https://rinkeby.infura.io/v3/`,
      accounts: {mnemonic: mnemonic_},
      blockGasLimit: 12450000,
      gas: 12450000,
      gasPrice: "auto",
      network_id: 4,
      timeout: 40000
    },
    eth_ropsten: {
      url: `https://eth-ropsten.alchemyapi.io/v2/`,
      accounts: {mnemonic: mnemonic_},
      saveDeployments: true,
      confirmations: 0,
      blockGasLimit: 8000000,
      gasLimit: 8000000,
      gas: 8000000,
      gasPrice: 20000000000,
      network_id: 3,
      timeout: 40000
    },
		arbitrum: {
			url: `https://arb1.arbitrum.io/rpc`,
			// accounts: {mnemonic: mnemonic_},
      accounts: [`0x${PRIVATE_KEY_EVMOS}`],
			network_id: 42161,
			gas: 0,
			gasPrice: "auto",
      timeout: 40000
		},
		optimism: {
			url: `https://mainnet.optimism.io`,
			accounts: {mnemonic: mnemonic_},
			network_id: 10,
			gas: 0,
			gasPrice: "auto",
      timeout: 40000
		},
		fantom: {
			url: `https://fantom-mainnet.public.blastapi.io`,
			accounts: {mnemonic: mnemonic_},
			blockGasLimit: 8000000,
			gas: 8000000,
			gasPrice: "auto",
			network_id: 250,
      timeout: 40000
		},
    fantom_testnet: {
      url: `https://rpc.testnet.fantom.network`,
      accounts: [`0x${PRIVATE_KEY_EVMOS}`],
      blockGasLimit: 12450000,
      gas: 5000000,
      gasPrice: "auto",
      network_id: 4002,
      timeout: 40000
    },
    polygon: {
      url: `https://polygon-rpc.com`,
      accounts: {mnemonic: mnemonic_},
      blockGasLimit: 12450000,
      gas: 12450000,
      gasLimit: 12450000,
      gasPrice: "auto",
      maxFeePerGas: 300000000000,
      maxPriorityFeePerGas: 300000000000,
      network_id: 137,
      timeout: 40000,
      nonce: 3
    },
    mumbai: {
      url: `https://rpc-mumbai.maticvigil.com`,
      accounts: {mnemonic: mnemonic_},
      blockGasLimit: 6000000,
      gas: 5000000,
      gasPrice: "auto",
      network_id: 80001,
      timeout: 40000
    },
    polygon_zkevm: {
      url: `https://zkevm-rpc.com`,
      accounts: {mnemonic: mnemonic_},
      blockGasLimit: 12000000,
      gas: 12000000,
      network_id: 1101,
      timeout: 40000
    },
    avalanche: {
      url: `https://api.avax.network/ext/bc/C/rpc`,
      accounts: {mnemonic: mnemonic_},
      blockGasLimit: 10000000,
      gas: 10000000,
      gasPrice: "auto",
      network_id: 43114,
      timeout: 40000
    },
		harmony: {
			url: `https://api.harmony.one`,
			accounts: {mnemonic: mnemonic_},
			gas: 5000000,
			gasPrice: "auto",
			network_id: 1666600000,
      timeout: 40000
		},
    bitgert: {
      url: `https://mainnet-rpc.brisescan.com`,
			accounts: {mnemonic: mnemonic_},
			gas: 5000000,
			gasPrice: "auto",
			network_id: 32520,
      timeout: 40000
    },
    goerli: {
      url: `https://goerli.infura.io/v3/`,
      // accounts: {mnemonic: mnemonic_},
      accounts: [`0x${PRIVATE_KEY_EVMOS}`],
      gas: 8000000,
      gasPrice: "auto",
      network_id: 5,
      timeout: 40000
    },
    evmos: {
      url: `https://evmos-mainnet.gateway.pokt.network/v1/lb/`,
      accounts: [`0x${PRIVATE_KEY_EVMOS}`],
      gas: 8000000,
      gasPrice: 'auto',
      network_id: 9001,
      timeout: 40000
    }
	},
	etherscan: {
		apiKey: ''
	},
  bscscan: {
    apiKey: ''
  },
	ftmscan: {
		apiKey: ''
	},
  polygonscan: {
    apiKey: ''
  },
  zkevmPolygonscan: {
    apiKey: ''
  }
};
