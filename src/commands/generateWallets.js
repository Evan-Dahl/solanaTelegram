const { Keypair } = require('@solana/web3.js');
const { db } = require('../services/db');
const bs58 = require('bs58').default;
const { Markup } = require('telegraf');
const { handleBackToMainMenu } = require('../utils/bot/navigation');

const MAX_WALLETS = 30; // 🔹 New Limit

// 🔹 Generate Wallets (Up to MAX_WALLETS)
function generateWallets(numWallets) {
    if (numWallets > MAX_WALLETS) {
        console.warn(`⚠️ Requested ${numWallets}, but max is ${MAX_WALLETS}. Generating only ${MAX_WALLETS}.`);
        numWallets = MAX_WALLETS;
    }

    const wallets = [];
    for (let i = 0; i < numWallets; i++) {
        const keypair = Keypair.generate();
        wallets.push({
            publicKey: keypair.publicKey.toBase58(),
            privateKey: bs58.encode(keypair.secretKey),
        });
    }

    console.log(`Generated ${numWallets} wallets.`);
    return wallets;
}

// 🔹 Save Wallets to Database
function saveWalletsToDatabase(wallets, telegramUserId) {
    const insertStmt = db.prepare('INSERT INTO wallets (address, private_key, user_id) VALUES (?, ?, ?)');
    const insertMany = db.transaction((wallets) => {
        for (const wallet of wallets) {
            insertStmt.run(wallet.publicKey, wallet.privateKey, telegramUserId);
        }
    });
    insertMany(wallets);
    console.log(`Saved ${wallets.length} wallets to the database for user ${telegramUserId}.`);
}

// 🔹 Handle "Generate Wallets" Menu
function handleGenerateWallets(bot) {
    const activeListeners = new Set();

    bot.action('menu_generate_wallets', (ctx) => {
        ctx.reply(
            `Select the number of wallets to generate (Max: ${MAX_WALLETS}):`,
            Markup.inlineKeyboard([
                [
                    Markup.button.callback('1 Wallet 💳', 'generate_1'),
                    Markup.button.callback('5 Wallets 💳', 'generate_5'),
                ],
                [
                    Markup.button.callback('10 Wallets 💳', 'generate_10'),
                    Markup.button.callback('30 Wallets 💳', 'generate_30'), // 🔹 Max 30
                ],
                [
                    Markup.button.callback('Custom (Max 30) 💳', 'generate_custom'),
                    Markup.button.callback('🔙 Back to Main Menu', 'menu_main'),
                ],
            ])
        );
    });

    // 🔹 Handle Wallet Generation Logic
    bot.action(/^generate_(\d+)$/, async (ctx) => {
        let numWallets = parseInt(ctx.match[1], 10);
        const userId = ctx.from.id;

        if (numWallets > MAX_WALLETS) numWallets = MAX_WALLETS;

        try {
            const wallets = generateWallets(numWallets);
            saveWalletsToDatabase(wallets, userId);
            await ctx.reply(`🎉 ${numWallets} wallet(s) successfully generated!`);
        } catch (error) {
            console.error(`Error generating wallets for user ${userId}:`, error.message);
            await ctx.reply('❌ An error occurred while generating wallets. Please try again.');
        }
    });

    // 🔹 Handle Custom Wallet Generation
    bot.action('generate_custom', (ctx) => {
        ctx.reply(`Please enter the number of wallets to generate (1-${MAX_WALLETS}):`);

        const onTextListener = async (messageCtx) => {
            const chatId = messageCtx.chat.id;

            if (activeListeners.has(chatId)) {
                let numWallets = parseInt(messageCtx.message.text, 10);
                if (isNaN(numWallets) || numWallets < 1 || numWallets > MAX_WALLETS) {
                    await messageCtx.reply(`Invalid number. Please enter a number between 1 and ${MAX_WALLETS}.`);
                    return;
                }

                const userId = messageCtx.from.id;
                try {
                    const wallets = generateWallets(numWallets);
                    saveWalletsToDatabase(wallets, userId);
                    await messageCtx.reply(`🎉 ${numWallets} wallet(s) successfully generated!`);
                } catch (error) {
                    console.error(`Error generating custom wallets for user ${userId}:`, error.message);
                    await messageCtx.reply('❌ An error occurred while generating wallets. Please try again.');
                } finally {
                    activeListeners.delete(chatId);
                    bot.removeListener('text', onTextListener);
                }
            }
        };

        const chatId = ctx.chat.id;
        if (!activeListeners.has(chatId)) {
            bot.on('text', onTextListener);
            activeListeners.add(chatId);
        }
    });

    bot.action('menu_main', (ctx) => handleBackToMainMenu(ctx));
}

module.exports = {
    generateWallets,
    saveWalletsToDatabase,
    handleGenerateWallets,
};
