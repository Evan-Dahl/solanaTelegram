# Solmate

**Solmate** is a locally run Telegram bot for managing Solana wallets and tokens. It allows users to generate wallets, view balances, distribute SOL and SPL tokens, and manage their keys—all through an easy-to-use Telegram interface.

---

## Features

- 💳 **Generate Wallets**: Quickly create Solana wallets with secure private keys.
- 📝 **Manage Wallets**: View, remove, or interact with your wallets.
- 💰 **View Balances**: Check SOL and SPL token balances for all wallets.
- 💸 **Distribute Tokens**: Send SOL or SPL tokens to multiple addresses efficiently.
- 🔒 **Secure Private Keys**: Private keys are stored locally on your machine and displayed only when you require.
- ⚙️ **Custom RPC Endpoint Required**: Users must create a free [Helius API Endpoint](https://www.helius.dev) for enhanced performance and reliability.

---

## Installation

Follow these steps to set up and run `Solmate` on your local machine.

### Prerequisites

1. **Node.js** (v16 or higher recommended)
   - Download and install Node.js from the [official website](https://nodejs.org/).

     After installation, verify the version:
     ```bash
     node -v
     npm -v
     ```

2. **Telegram Bot Token**
   - Obtain a token from [BotFather](https://core.telegram.org/bots#botfather).

3. **Helius RPC Endpoint (Required)**
   - Create a free [Helius API Endpoint](https://www.helius.dev) and use it for your `MAINNET_RPC`.

### Quick Start (Windows Users)

For Windows users, a convenient `run.bat` script is included to streamline the setup and launch process.

#### Steps to Use `run.bat`:

1. **Locate `run.bat`**: Ensure it is in the root directory of your project.
2. **Run the Script**:
   ```cmd
   run.bat
   ```
3. **Follow the Instructions**: The script will check dependencies and guide you through setup.
4. **Start the Bot**: Once the script completes, the bot will launch. Open Telegram and send `/start`.

#### Notes:
- Ensure you update the `.env` file with your bot token and Helius RPC endpoint.
- Troubleshooting errors will be displayed in the command prompt.

### Manual Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/solmatehub/solmate
   cd solmate
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Get Your Bot Token**:
   - Obtain a token from [BotFather](https://core.telegram.org/bots#botfather).
4. **Set Up `.env` File**:
   Create a new `.env` file:
   ```bash
   BOT_TOKEN='your_telegram_bot_token'
   MAINNET_RPC='your_helius_rpc_endpoint'
   ```
   - Replace `your_helius_rpc_endpoint` with your Helius API URL.

5. **Run the Bot**:
   ```bash
   node bot.js
   ```
    - You should see the bot launching in the terminal.
    - Open Telegram and send `/start`.

---

## Configuration

The bot uses environment variables for sensitive information. Here's a breakdown:

| Variable        | Description                                        | Default                               |
|----------------|----------------------------------------------------|---------------------------------------|
| `BOT_TOKEN`    | Token for your Telegram bot (from BotFather)       | **Required**                          |
| `MAINNET_RPC`  | Solana RPC endpoint (Helius API required)          | **Required**                          |
| `DB_FILE`      | Path to the SQLite database for wallet storage     | `src/data/wallets.db`                 |

---

## Usage

### Bot Commands

- **/start**: Access the main menu.
- **Generate Wallets**: Create and save new Solana wallets.
- **My Wallets**: View balances, private keys, or remove wallets.
- **Distribute Tokens**: Send SOL or SPL tokens to multiple addresses.
- **Help**: Learn how to use the bot.

---

## Security

1. 🔐 **Private Keys**: Private keys are only displayed upon request and hidden after use.
2. 💾 **Database**: Wallets are saved locally in a SQLite database (`wallets.db`).
3. ⚠️ **Data Cleanup**: Regularly clear chat history containing sensitive data like `.txt` wallet files.

---

## Troubleshooting

- **Bot fails to start**:
  - Ensure `BOT_TOKEN` and `MAINNET_RPC` are set in `.env`.
  - Verify Node.js and npm are installed and up-to-date.

- **No response from bot**:
  - Check your internet connection.
  - Ensure the Telegram bot token is valid.

- **RPC endpoint errors**:
  - Verify the `MAINNET_RPC` endpoint in the `.env` file.

For additional help, open an issue in this repository.

---
