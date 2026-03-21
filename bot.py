import os
import logging
import requests
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes

BOT_TOKEN    = os.environ["BOT_TOKEN"]
CONTRACT     = "0x71a8F50008b08cc736E739239faF549a34fD9C8f"
DAPP_URL     = "https://scratchnft.imperamonad.xyz"
RPC_URL      = "https://rpc.monad.xyz"
CHAIN_ID     = 143
EXPLORER     = "https://monad.socialscan.io"

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

def rpc_call(method, params):
    try:
        r = requests.post(RPC_URL, json={"jsonrpc":"2.0","id":1,"method":method,"params":params}, timeout=8)
        return r.json().get("result")
    except Exception:
        return None

def eth_call(data):
    return rpc_call("eth_call", [{"to": CONTRACT, "data": data}, "latest"])

def decode_uint(hex_str):
    if not hex_str or hex_str == "0x":
        return 0
    return int(hex_str, 16)

def get_total_supply():
    return decode_uint(eth_call("0x18160ddd"))

def get_card_price():
    return decode_uint(eth_call("0xa035b1fe")) / 1e18

def get_prize_pool():
    return decode_uint(rpc_call("eth_getBalance", [CONTRACT, "latest"])) / 1e18

def main_keyboard():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🎰 PLAY NOW", web_app=WebAppInfo(url=DAPP_URL))],
        [InlineKeyboardButton("📊 Stats", callback_data="stats"), InlineKeyboardButton("💰 Price", callback_data="price")],
        [InlineKeyboardButton("🏆 How to Win", callback_data="howtowin"), InlineKeyboardButton("📜 Contract", callback_data="contract")],
        [InlineKeyboardButton("🔗 Explorer", url=f"{EXPLORER}/address/{CONTRACT}"), InlineKeyboardButton("❓ Help", callback_data="help")],
        [InlineKeyboardButton("🌐 Website", url=DAPP_URL)],
    ])

def back_keyboard():
    return InlineKeyboardMarkup([[InlineKeyboardButton("⬅️ Back", callback_data="back")]])

WELCOME = """
✦ *SCRATCHCARD NFT* ✦
━━━━━━━━━━━━━━━━━━━━
🎰 First on-chain scratch card on *Monad*!
🌐 scratchnft.imperamonad.xyz

1️⃣ Mint a scratch card NFT
2️⃣ Scratch it on-chain
3️⃣ Win up to *20x your bet* in MON!

🏍️ USDC Rider · ⚔️ ETH Warrior · 🏎️ Monad Racer

🥉 Small Win → 2x · 🥈 Big Win → 5x · 🥇 Jackpot → 20x
━━━━━━━━━━━━━━━━━━━━
Ready to scratch? 👇
"""

async def start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(WELCOME, parse_mode="Markdown", reply_markup=main_keyboard())

async def help_cmd(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "❓ *HELP*\n\n🌐 scratchnft.imperamonad.xyz\n\nMonad Mainnet Chain ID: 143\n\n/start /stats /price /contract /help",
        parse_mode="Markdown", reply_markup=main_keyboard()
    )

async def button(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()
    if q.data == "back":
        await q.edit_message_text(WELCOME, parse_mode="Markdown", reply_markup=main_keyboard())
    elif q.data == "stats":
        supply = get_total_supply()
        price  = get_card_price()
        pool   = get_prize_pool()
        await q.edit_message_text(
            f"📊 *LIVE STATS*\n━━━━━━━━━━━━━━━━━━━━\n🃏 Cards Minted: `{supply}`\n💎 Card Price: `{price:.4f} MON`\n🏦 Prize Pool: `{pool:.4f} MON`\n━━━━━━━━━━━━━━━━━━━━",
            parse_mode="Markdown", reply_markup=main_keyboard()
        )
    elif q.data == "price":
        price = get_card_price()
        pool  = get_prize_pool()
        await q.edit_message_text(
            f"💰 *CARD PRICE*\n━━━━━━━━━━━━━━━━━━━━\n🎟️ Mint: `{price:.4f} MON`\n🥇 Jackpot: `{pool*0.2:.4f} MON`\n🥈 Big Win: `{price*5:.4f} MON`\n🥉 Small: `{price*2:.4f} MON`\n━━━━━━━━━━━━━━━━━━━━",
            parse_mode="Markdown", reply_markup=main_keyboard()
        )
    elif q.data == "howtowin":
        await q.edit_message_text(
            "🏆 *HOW TO WIN*\n━━━━━━━━━━━━━━━━━━━━\nStep 1 — Connect Wallet\nStep 2 — Mint a Card\nStep 3 — Scratch on-chain\nStep 4 — Claim prize instantly!\n━━━━━━━━━━━━━━━━━━━━\n100% on-chain and fair",
            parse_mode="Markdown", reply_markup=back_keyboard()
        )
    elif q.data == "contract":
        await q.edit_message_text(
            f"📜 *CONTRACT*\n━━━━━━━━━━━━━━━━━━━━\n`{CONTRACT}`\nMonad Chain ID: {CHAIN_ID}\n━━━━━━━━━━━━━━━━━━━━",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup([[
                InlineKeyboardButton("🔗 Explorer", url=f"{EXPLORER}/address/{CONTRACT}"),
                InlineKeyboardButton("⬅️ Back", callback_data="back")
            ]])
        )
    elif q.data == "help":
        await q.edit_message_text(
            "❓ *HELP*\n\n🌐 scratchnft.imperamonad.xyz\nMonad Mainnet Chain ID: 143\n\n/start /stats /price /contract /help",
            parse_mode="Markdown", reply_markup=main_keyboard()
        )

def main():
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start",    start))
    app.add_handler(CommandHandler("help",     help_cmd))
    app.add_handler(CallbackQueryHandler(button))
    log.info("ScratchCard Bot started - scratchnft.imperamonad.xyz")
    app.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()
